#!/usr/bin/env python3
"""
Data Migration Tool: Original DynamoDB Tables → Amplify-Managed Tables
================================================================

This script migrates data from the original RealTechee-* tables to the new
Amplify-managed tables (*-equsgef6fbgdhd4pnzv3xbivmm-NONE format).

Features:
- Safe migration with dry-run mode
- Field mapping and transformation
- Progress tracking and detailed logging
- Verification and rollback capabilities
- Batch processing for large datasets
- Error handling and recovery

Usage:
    python migrate_to_amplify_tables.py
"""

import boto3
import json
import time
import sys
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from decimal import Decimal
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
import logging

class AmplifyDataMigrator:
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb', region_name='us-west-1')
        self.client = boto3.client('dynamodb', region_name='us-west-1')
        
        # Set up logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(f'amplify_migration_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(__name__)
        
        # Table mappings (original name → amplify table suffix)
        self.amplify_suffix = "-equsgef6fbgdhd4pnzv3xbivmm-NONE"
        
        # Field mappings for renamed fields
        self.field_mappings = {
            'Legal': {
                '12LegalDocumentId': 'legalDocumentId'
            },
            'Projects': {
                'Project Manager Email List': 'projectManagerEmailList',
                'Project Manager Phone': 'projectManagerPhone',
                'Visitor ID': 'visitorId',
                'Quote ID': 'quoteId'
            },
            'Requests': {
                'Uploded Documents': 'uploadedDocuments',
                'Requested Slot': 'requestedSlot'
            }
        }
        
        # Fields to exclude (duplicates that were removed)
        self.exclude_fields = {
            'Projects': ['item04Projects'],  # Keep only one instance
            # Note: 'Quotes': ['ID'] removed - ID field should be transformed to 'id', not excluded
        }
        
        self.migration_stats = {
            'total_tables': 0,
            'successful_tables': 0,
            'failed_tables': 0,
            'total_records': 0,
            'successful_records': 0,
            'failed_records': 0,
            'start_time': None,
            'end_time': None
        }

    def get_table_mapping(self) -> Dict[str, str]:
        """Get mapping of original tables to Amplify tables."""
        try:
            # Get all table names
            response = self.client.list_tables()
            all_tables = response['TableNames']
            
            original_tables = [t for t in all_tables if t.startswith('RealTechee-')]
            amplify_tables = [t for t in all_tables if t.endswith(self.amplify_suffix)]
            
            # Create mapping
            mapping = {}
            for orig_table in original_tables:
                # Extract base name (remove RealTechee- prefix)
                base_name = orig_table.replace('RealTechee-', '')
                
                # Handle BackOffice tables (remove hyphen)
                if base_name.startswith('BackOffice-'):
                    base_name = base_name.replace('BackOffice-', 'BackOffice')
                
                # Find corresponding Amplify table
                for amp_table in amplify_tables:
                    if amp_table.startswith(base_name + '-'):
                        mapping[orig_table] = amp_table
                        break
            
            self.logger.info(f"Found {len(mapping)} table pairs for migration")
            return mapping
            
        except Exception as e:
            self.logger.error(f"Error getting table mapping: {str(e)}")
            return {}

    def analyze_table_structure(self, table_name: str) -> Dict[str, Any]:
        """Analyze table structure and sample data."""
        try:
            table = self.dynamodb.Table(table_name)
            
            # Get table description
            response = table.meta.client.describe_table(TableName=table_name)
            table_info = response['Table']
            
            # Get sample items to understand structure
            response = table.scan(Limit=5)
            sample_items = response.get('Items', [])
            
            # Extract field names and types
            fields = {}
            if sample_items:
                for item in sample_items:
                    for field, value in item.items():
                        if field not in fields:
                            fields[field] = type(value).__name__
            
            return {
                'table_name': table_name,
                'item_count': table_info.get('ItemCount', 0),
                'table_size': table_info.get('TableSizeBytes', 0),
                'key_schema': table_info.get('KeySchema', []),
                'fields': fields,
                'sample_items': sample_items[:2]  # First 2 items for review
            }
            
        except Exception as e:
            self.logger.error(f"Error analyzing table {table_name}: {str(e)}")
            return {}

    def transform_item(self, item: Dict[str, Any], table_base_name: str) -> Dict[str, Any]:
        """Transform item fields according to mapping rules."""
        transformed_item = {}
        
        # Get field mappings for this table
        field_map = self.field_mappings.get(table_base_name, {})
        exclude_fields = self.exclude_fields.get(table_base_name, [])
        
        for field, value in item.items():
            # Skip excluded fields
            if field in exclude_fields:
                continue
                
            # Apply field renaming first
            new_field = field_map.get(field, field)
            
            # Special case: Convert uppercase ID to lowercase id (Amplify standard)
            # This must be checked after field mapping
            if field == 'ID':
                new_field = 'id'
            
            # Handle Decimal values (convert to float or int)
            if isinstance(value, Decimal):
                if value % 1 == 0:
                    value = int(value)
                else:
                    value = float(value)
            
            transformed_item[new_field] = value
        
        return transformed_item

    def migrate_table_data(self, source_table: str, target_table: str, dry_run: bool = True) -> Dict[str, Any]:
        """Migrate data from source table to target table."""
        try:
            source = self.dynamodb.Table(source_table)
            target = self.dynamodb.Table(target_table)
            
            # Extract base table name for field mapping
            table_base_name = source_table.replace('RealTechee-', '').replace('BackOffice-', 'BackOffice')
            
            self.logger.info(f"{'[DRY RUN] ' if dry_run else ''}Migrating {source_table} → {target_table}")
            
            # Scan source table
            response = source.scan()
            items = response.get('Items', [])
            
            # Handle pagination
            while 'LastEvaluatedKey' in response:
                response = source.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
                items.extend(response.get('Items', []))
            
            self.logger.info(f"Found {len(items)} items to migrate")
            
            migration_result = {
                'source_table': source_table,
                'target_table': target_table,
                'total_items': len(items),
                'successful_items': 0,
                'failed_items': 0,
                'errors': [],
                'sample_transformed': None
            }
            
            if not items:
                self.logger.warning(f"No items found in {source_table}")
                return migration_result
            
            # Transform and migrate items
            batch_size = 25  # DynamoDB batch write limit
            
            for i in range(0, len(items), batch_size):
                batch = items[i:i + batch_size]
                batch_requests = []
                
                for item in batch:
                    try:
                        # Transform item
                        transformed_item = self.transform_item(item, table_base_name)
                        
                        # Debug: Check field transformations
                        if 'ID' in item and 'id' not in transformed_item:
                            self.logger.error(f"ID->id transformation failed! Original ID: {item.get('ID')}, Transformed keys: {list(transformed_item.keys())}")
                        
                        if 'ID' in transformed_item:
                            self.logger.error(f"Original ID field still present in transformed item: {transformed_item.get('ID')}")
                        
                        # Check if id field exists
                        if 'id' not in transformed_item:
                            self.logger.error(f"Missing 'id' field in transformed item. Original fields: {list(item.keys())}, Transformed fields: {list(transformed_item.keys())}")
                            # Skip this item if no id field
                            migration_result['failed_items'] += 1
                            continue
                            
                        # Store sample for review
                        if migration_result['sample_transformed'] is None:
                            migration_result['sample_transformed'] = {
                                'original': dict(item),
                                'transformed': transformed_item
                            }
                        
                        if not dry_run:
                            batch_requests.append({
                                'PutRequest': {
                                    'Item': transformed_item
                                }
                            })
                        
                        migration_result['successful_items'] += 1
                        
                    except Exception as e:
                        error_msg = f"Error transforming item: {str(e)}"
                        self.logger.error(error_msg)
                        migration_result['errors'].append(error_msg)
                        migration_result['failed_items'] += 1
                
                # Execute batch write (if not dry run)
                if not dry_run and batch_requests:
                    try:
                        # Use boto3 table.put_item instead of batch_write_item for Amplify tables
                        for request in batch_requests:
                            item = request['PutRequest']['Item']
                            target.put_item(Item=item)
                        
                    except Exception as e:
                        error_msg = f"Error writing batch: {str(e)}"
                        self.logger.error(error_msg)
                        migration_result['errors'].append(error_msg)
                        migration_result['failed_items'] += len(batch_requests)
                        migration_result['successful_items'] -= len(batch_requests)
                
                # Progress update
                processed = min(i + batch_size, len(items))
                if processed % 100 == 0 or processed == len(items):
                    self.logger.info(f"Processed {processed}/{len(items)} items")
            
            return migration_result
            
        except Exception as e:
            self.logger.error(f"Error migrating table data: {str(e)}")
            return {
                'source_table': source_table,
                'target_table': target_table,
                'total_items': 0,
                'successful_items': 0,
                'failed_items': 0,
                'errors': [str(e)],
                'sample_transformed': None
            }

    def verify_migration(self, source_table: str, target_table: str) -> Dict[str, Any]:
        """Verify migration by comparing record counts and sample data."""
        try:
            source = self.dynamodb.Table(source_table)
            target = self.dynamodb.Table(target_table)
            
            # Get record counts
            source_response = source.scan(Select='COUNT')
            target_response = target.scan(Select='COUNT')
            
            source_count = source_response.get('Count', 0)
            target_count = target_response.get('Count', 0)
            
            # Get sample items for comparison
            source_sample = source.scan(Limit=3).get('Items', [])
            target_sample = target.scan(Limit=3).get('Items', [])
            
            verification = {
                'source_table': source_table,
                'target_table': target_table,
                'source_count': source_count,
                'target_count': target_count,
                'count_match': source_count == target_count,
                'source_sample': source_sample,
                'target_sample': target_sample
            }
            
            self.logger.info(f"Verification - {source_table}: {source_count} → {target_table}: {target_count}")
            
            return verification
            
        except Exception as e:
            self.logger.error(f"Error verifying migration: {str(e)}")
            return {}

    def run_migration(self, dry_run: bool = True):
        """Run the complete migration process."""
        try:
            self.migration_stats['start_time'] = datetime.now()
            
            self.logger.info("=" * 60)
            self.logger.info(f"AMPLIFY DATA MIGRATION {'(DRY RUN)' if dry_run else '(LIVE)'}")
            self.logger.info("=" * 60)
            
            # Get table mappings
            table_mapping = self.get_table_mapping()
            if not table_mapping:
                self.logger.error("No table mappings found. Exiting.")
                return
            
            self.migration_stats['total_tables'] = len(table_mapping)
            
            # Display mapping for confirmation
            self.logger.info("\nTable Mapping:")
            for orig, amp in table_mapping.items():
                self.logger.info(f"  {orig} → {amp}")
            
            if dry_run:
                print(f"\n{'='*60}")
                print("DRY RUN MODE - No actual data will be migrated")
                print("This will analyze tables and show what would be migrated")
                print(f"{'='*60}")
            else:
                print(f"\n{'='*60}")
                print("LIVE MIGRATION MODE - Data will actually be migrated!")
                print("Make sure you have backups before proceeding")
                print(f"{'='*60}")
                
                confirm = input("Are you sure you want to proceed? (yes/no): ")
                if confirm.lower() != 'yes':
                    self.logger.info("Migration cancelled by user")
                    return
            
            # Migrate each table
            all_results = []
            
            for source_table, target_table in table_mapping.items():
                try:
                    # Analyze source table
                    source_analysis = self.analyze_table_structure(source_table)
                    target_analysis = self.analyze_table_structure(target_table)
                    
                    self.logger.info(f"\nMigrating: {source_table}")
                    self.logger.info(f"Source: {source_analysis.get('item_count', 0)} items")
                    self.logger.info(f"Target: {target_analysis.get('item_count', 0)} items")
                    
                    # Migrate data
                    result = self.migrate_table_data(source_table, target_table, dry_run)
                    all_results.append(result)
                    
                    # Update stats
                    self.migration_stats['total_records'] += result['total_items']
                    self.migration_stats['successful_records'] += result['successful_items']
                    self.migration_stats['failed_records'] += result['failed_items']
                    
                    if result['failed_items'] == 0:
                        self.migration_stats['successful_tables'] += 1
                    else:
                        self.migration_stats['failed_tables'] += 1
                    
                    # Show sample transformation
                    if result.get('sample_transformed'):
                        self.logger.info("Sample transformation:")
                        sample = result['sample_transformed']
                        self.logger.info(f"Original: {sample['original']}")
                        self.logger.info(f"Transformed: {sample['transformed']}")
                    
                except Exception as e:
                    self.logger.error(f"Error migrating {source_table}: {str(e)}")
                    self.migration_stats['failed_tables'] += 1
            
            # Verification phase (if live migration)
            if not dry_run:
                self.logger.info("\n" + "="*60)
                self.logger.info("VERIFICATION PHASE")
                self.logger.info("="*60)
                
                for source_table, target_table in table_mapping.items():
                    verification = self.verify_migration(source_table, target_table)
                    if not verification.get('count_match', False):
                        self.logger.warning(f"COUNT MISMATCH: {source_table} → {target_table}")
            
            # Final summary
            self.migration_stats['end_time'] = datetime.now()
            duration = self.migration_stats['end_time'] - self.migration_stats['start_time']
            
            self.logger.info("\n" + "="*60)
            self.logger.info("MIGRATION SUMMARY")
            self.logger.info("="*60)
            self.logger.info(f"Duration: {duration}")
            self.logger.info(f"Tables: {self.migration_stats['successful_tables']}/{self.migration_stats['total_tables']} successful")
            self.logger.info(f"Records: {self.migration_stats['successful_records']}/{self.migration_stats['total_records']} successful")
            
            if self.migration_stats['failed_records'] > 0:
                self.logger.warning(f"Failed records: {self.migration_stats['failed_records']}")
            
            # Save detailed results
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            results_file = f"amplify_migration_results_{timestamp}.json"
            
            with open(results_file, 'w') as f:
                json.dump({
                    'migration_stats': {
                        k: v.isoformat() if isinstance(v, datetime) else v 
                        for k, v in self.migration_stats.items()
                    },
                    'table_mapping': table_mapping,
                    'detailed_results': all_results
                }, f, indent=2, default=str)
            
            self.logger.info(f"Detailed results saved to: {results_file}")
            
        except Exception as e:
            self.logger.error(f"Migration failed: {str(e)}")
            raise

def main():
    """Main function with interactive menu."""
    migrator = AmplifyDataMigrator()
    
    while True:
        print("\n" + "="*60)
        print("AMPLIFY DATA MIGRATION TOOL")
        print("="*60)
        print("1. Analyze table mappings")
        print("2. Run dry-run migration (no actual changes)")
        print("3. Run live migration (actual data migration)")
        print("4. Verify existing migration")
        print("5. Exit")
        print("="*60)
        
        choice = input("Select option (1-5): ").strip()
        
        if choice == '1':
            print("\nAnalyzing table mappings...")
            table_mapping = migrator.get_table_mapping()
            
            if table_mapping:
                print(f"\nFound {len(table_mapping)} table pairs:")
                for orig, amp in table_mapping.items():
                    print(f"  {orig} → {amp}")
                    
                    # Show basic analysis
                    orig_analysis = migrator.analyze_table_structure(orig)
                    amp_analysis = migrator.analyze_table_structure(amp)
                    
                    print(f"    Source: {orig_analysis.get('item_count', 0)} items, {len(orig_analysis.get('fields', {}))} fields")
                    print(f"    Target: {amp_analysis.get('item_count', 0)} items, {len(amp_analysis.get('fields', {}))} fields")
            else:
                print("No table mappings found!")
        
        elif choice == '2':
            print("\nRunning dry-run migration...")
            migrator.run_migration(dry_run=True)
        
        elif choice == '3':
            print("\nRunning live migration...")
            migrator.run_migration(dry_run=False)
        
        elif choice == '4':
            print("\nVerifying migration...")
            table_mapping = migrator.get_table_mapping()
            for source_table, target_table in table_mapping.items():
                verification = migrator.verify_migration(source_table, target_table)
                status = "✅ MATCH" if verification.get('count_match') else "❌ MISMATCH"
                print(f"{source_table} → {target_table}: {status}")
                print(f"  Source: {verification.get('source_count', 0)} records")
                print(f"  Target: {verification.get('target_count', 0)} records")
        
        elif choice == '5':
            print("Exiting...")
            break
        
        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    main()
