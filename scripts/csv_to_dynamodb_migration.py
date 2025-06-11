#!/usr/bin/env python3
"""
CSV to DynamoDB Migration Script

This script migrates CSV data from /data/csv/final to DynamoDB in a controlled,
deterministic manner. It handles dependencies between tables and ensures
referential integrity.

Dependencies:
- Contacts.csv (ID as primary key)
- Properties.csv (ID as primary key)
- Other CSVs reference these via contactId, homeownerContactId, addressId, etc.

Author: RealTechee Team1
"""

import os
import csv
import json
from typing import Dict, List, Any, Optional
from pathlib import Path
import logging
from datetime import datetime
import time

# DynamoDB imports - only imported when needed for actual migration
try:
    import boto3
    from botocore.exceptions import ClientError
    DYNAMODB_AVAILABLE = True
except ImportError:
    DYNAMODB_AVAILABLE = False
    print("Warning: boto3 not installed. DynamoDB operations will be simulated.")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('csv_migration.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class CSVMigrationManager:
    """Manages the migration of CSV files to DynamoDB with proper dependency handling"""
    
    def __init__(self, csv_directory: str, aws_region: str = 'us-west-1'):
        self.csv_directory = Path(csv_directory)
        self.migration_order = self._get_migration_order()
        self.migration_stats = {}
        self.aws_region = aws_region
        self.dynamodb_client = None
        self.dynamodb_resource = None
        self.dry_run = True  # Safety: Default to dry run mode
        
    def _get_migration_order(self) -> List[str]:
        """
        Returns the ordered list of CSV files for migration based on dependencies.
        
        Dependency order:
        1. Reference/lookup tables (BackOffice* tables)
        2. Core entities (Contacts, Properties)
        3. Dependent entities (Projects, Quotes, Requests)
        4. Junction/linking tables
        """
        csv_files_with_paths = []
        
        # Phase 1: BackOffice lookup tables (no dependencies)
        phase1_files = [
            "BackOfficeAssignTo.csv",
            "BackOfficeBookingStatuses.csv", 
            "BackOfficeBrokerage.csv",
            "BackOfficeNotifications.csv",
            "BackOfficeProducts.csv",
            "BackOfficeProjectStatuses.csv",
            "BackOfficeQuoteStatuses.csv",
            "BackOfficeRequestStatuses.csv",
            "BackOfficeRoleTypes.csv"
        ]
        
        # Phase 2: Core entities (primary keys for other tables)
        phase2_files = [
            "Contacts.csv",        # Primary: ID -> Referenced by: agentContactId, homeownerContactId, etc.
            "Properties.csv"       # Primary: ID -> Referenced by: addressId
        ]
        
        # Phase 3: Independent entities
        phase3_files = [
            "Auth.csv",
            "Affiliates.csv",
            "Legal.csv",
            "ContactUs.csv"
        ]
        
        # Phase 4: Dependent entities (reference Contacts and Properties)
        phase4_files = [
            "Requests.csv",        # References: contactId, addressId
            "Projects.csv",        # References: agentContactId, homeownerContactId, addressId
            "Quotes.csv"          # References: agentContactId, homeownerContactId, addressId, requestId, projectId
        ]
        
        # Phase 5: Child/detail entities (reference main entities)
        phase5_files = [
            "QuoteItems.csv",           # References: Quote ID
            "ProjectComments.csv",      # References: Project ID
            "ProjectMilestones.csv",    # References: Project ID
            "ProjectPaymentTerms.csv",  # References: Project ID
            "ProjectPermissions.csv",   # References: Project ID
            "MemberSignature.csv",      # References: various IDs
            "eSignatureDocuments.csv",  # References: various IDs
            "PendingAppoitments.csv"    # References: various IDs (note: typo in original)
        ]
        
        # Combine all phases and build full paths
        all_phases = [phase1_files, phase2_files, phase3_files, phase4_files, phase5_files]
        
        for phase_files in all_phases:
            for filename in phase_files:
                full_path = self.csv_directory / filename
                if full_path.exists():
                    csv_files_with_paths.append(str(full_path))
                else:
                    logger.warning(f"CSV file not found: {full_path}")
        
        logger.info(f"Migration order determined: {len(csv_files_with_paths)} files")
        return csv_files_with_paths
    
    def get_csv_file_info(self, csv_file_path: str) -> Dict[str, Any]:
        """
        Analyzes a CSV file and returns metadata about its structure.
        
        Args:
            csv_file_path: Path to the CSV file
            
        Returns:
            Dict containing file metadata including columns, row count, etc.
        """
        file_info = {
            'filepath': csv_file_path,
            'filename': os.path.basename(csv_file_path),
            'columns': [],
            'row_count': 0,
            'primary_key': None,
            'foreign_keys': [],
            'sample_data': {}
        }
        
        try:
            with open(csv_file_path, 'r', encoding='utf-8') as file:
                # Read CSV and analyze structure
                csv_reader = csv.reader(file)
                headers = next(csv_reader, [])
                file_info['columns'] = headers
                
                # Identify primary key (usually 'ID' or 'id')
                if 'ID' in headers:
                    file_info['primary_key'] = 'ID'
                elif 'id' in headers:
                    file_info['primary_key'] = 'id'
                
                # Identify potential foreign keys
                foreign_key_patterns = [
                    'contactId', 'agentContactId', 'homeownerContactId', 'homeowner2ContactId', 'homeowner3ContactId',
                    'addressId', 'propertyId', 'projectId', 'requestId', 'quoteId', 'assignedTo', 'owner', 'Owner'
                ]
                
                for column in headers:
                    if column in foreign_key_patterns or column.endswith('Id') or column.endswith('ID'):
                        file_info['foreign_keys'].append(column)
                
                # Count rows and get sample data
                file.seek(0)  # Reset to beginning
                csv_reader = csv.DictReader(file)
                rows = list(csv_reader)
                file_info['row_count'] = len(rows)
                
                # Get sample of first few rows
                if rows:
                    file_info['sample_data'] = rows[:3]  # First 3 rows as sample
                    
        except Exception as e:
            logger.error(f"Error analyzing CSV file {csv_file_path}: {e}")
            file_info['error'] = str(e)
        
        return file_info
    
    def validate_csv_structure(self, csv_file_path: str) -> Dict[str, Any]:
        """
        Validates CSV file structure and data integrity.
        
        Args:
            csv_file_path: Path to the CSV file
            
        Returns:
            Dict containing validation results
        """
        validation_result = {
            'is_valid': True,
            'errors': [],
            'warnings': [],
            'file_info': None
        }
        
        try:
            file_info = self.get_csv_file_info(csv_file_path)
            validation_result['file_info'] = file_info
            
            # Check if file has data
            if file_info['row_count'] == 0:
                validation_result['warnings'].append("CSV file is empty")
            
            # Check for primary key
            if not file_info['primary_key']:
                validation_result['warnings'].append("No primary key column found (ID or id)")
            
            # Validate data types and formats (basic validation)
            if 'sample_data' in file_info and file_info['sample_data']:
                # Check for consistent data structure
                first_row = file_info['sample_data'][0]
                for row in file_info['sample_data'][1:]:
                    if len(row) != len(first_row):
                        validation_result['errors'].append("Inconsistent number of columns across rows")
                        validation_result['is_valid'] = False
                        break
            
        except Exception as e:
            validation_result['is_valid'] = False
            validation_result['errors'].append(f"Validation failed: {e}")
        
        return validation_result
    
    def _get_table_name_from_filename(self, filename: str) -> str:
        """Convert CSV filename to DynamoDB table name"""
        # Remove .csv extension and replace special characters
        table_name = filename.replace('.csv', '').replace('_', '-').replace(' ', '-')
        return f"RealTechee-{table_name}"
    
    def _get_dynamodb_type_from_value(self, value: str) -> Dict[str, Any]:
        """Convert CSV string value to DynamoDB attribute format"""
        if not value or value.strip() == '':
            return {'NULL': True}
        
        # Try to detect number
        try:
            if '.' in value:
                float(value)
                return {'N': value}
            else:
                int(value)
                return {'N': value}
        except ValueError:
            pass
        
        # Check for boolean
        if value.lower() in ['true', 'false']:
            return {'BOOL': value.lower() == 'true'}
        
        # Check for JSON/array (starts with [ or {)
        if value.strip().startswith(('[', '{')):
            try:
                json.loads(value)
                return {'S': value}  # Store as string, parse in application
            except json.JSONDecodeError:
                pass
        
        # Default to string
        return {'S': value}
    
    def initialize_dynamodb_connection(self):
        """Initialize DynamoDB connection. Only called when needed."""
        if not DYNAMODB_AVAILABLE:
            raise RuntimeError("boto3 not available. Cannot connect to DynamoDB.")
        
        try:
            self.dynamodb_client = boto3.client('dynamodb', region_name=self.aws_region)
            self.dynamodb_resource = boto3.resource('dynamodb', region_name=self.aws_region)
            logger.info(f"DynamoDB connection initialized for region: {self.aws_region}")
        except Exception as e:
            logger.error(f"Failed to initialize DynamoDB connection: {e}")
            raise
    
    def set_migration_mode(self, dry_run: bool = True):
        """Set migration mode - dry run (safe) or actual migration"""
        self.dry_run = dry_run
        mode = "DRY RUN" if dry_run else "ACTUAL MIGRATION"
        logger.warning(f"Migration mode set to: {mode}")
    
    def _create_dynamodb_table(self, table_name: str, file_info: Dict[str, Any]) -> bool:
        """Create DynamoDB table based on CSV structure"""
        if self.dry_run:
            logger.info(f"DRY RUN: Would create table '{table_name}' with primary key '{file_info['primary_key']}'")
            return True
        
        if not self.dynamodb_client:
            self.initialize_dynamodb_connection()
        
        try:
            # Check if table already exists
            existing_tables = self.dynamodb_client.list_tables()['TableNames']
            if table_name in existing_tables:
                logger.info(f"Table '{table_name}' already exists")
                return True
            
            # Define table schema
            table_schema = {
                'TableName': table_name,
                'KeySchema': [
                    {
                        'AttributeName': file_info['primary_key'],
                        'KeyType': 'HASH'
                    }
                ],
                'AttributeDefinitions': [
                    {
                        'AttributeName': file_info['primary_key'],
                        'AttributeType': 'S'  # Assuming string primary keys
                    }
                ],
                'BillingMode': 'PAY_PER_REQUEST'  # On-demand billing
            }
            
            logger.info(f"Creating DynamoDB table: {table_name}")
            response = self.dynamodb_client.create_table(**table_schema)
            
            # Wait for table to be created
            waiter = self.dynamodb_client.get_waiter('table_exists')
            waiter.wait(TableName=table_name)
            
            logger.info(f"Table '{table_name}' created successfully")
            return True
            
        except ClientError as e:
            logger.error(f"Failed to create table '{table_name}': {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error creating table '{table_name}': {e}")
            return False
    
    def _read_csv_records(self, csv_file_path: str) -> List[Dict[str, str]]:
        """Read all records from CSV file"""
        records = []
        try:
            with open(csv_file_path, 'r', encoding='utf-8') as file:
                csv_reader = csv.DictReader(file)
                for row in csv_reader:
                    # Clean up empty string values
                    cleaned_row = {}
                    for key, value in row.items():
                        if value is not None:
                            cleaned_row[key] = str(value).strip()
                        else:
                            cleaned_row[key] = ''
                    records.append(cleaned_row)
        except Exception as e:
            logger.error(f"Error reading CSV file {csv_file_path}: {e}")
            raise
        
        return records
    
    def _insert_records_to_dynamodb(self, table_name: str, records: List[Dict[str, str]], batch_size: int = 25) -> Dict[str, int]:
        """Insert records to DynamoDB table in batches"""
        if self.dry_run:
            logger.info(f"DRY RUN: Would insert {len(records)} records to table '{table_name}'")
            return {'processed': len(records), 'failed': 0}
        
        if not self.dynamodb_resource:
            self.initialize_dynamodb_connection()
        
        table = self.dynamodb_resource.Table(table_name)
        processed = 0
        failed = 0
        
        # Process records in batches
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            
            try:
                with table.batch_writer() as batch_writer:
                    for record in batch:
                        # Convert record to DynamoDB format
                        dynamodb_item = {}
                        for key, value in record.items():
                            if value:  # Only include non-empty values
                                dynamodb_item[key] = value
                        
                        if dynamodb_item:  # Only insert if there's data
                            batch_writer.put_item(Item=dynamodb_item)
                            processed += 1
                        else:
                            logger.warning(f"Skipping empty record in {table_name}")
                
                logger.info(f"Processed batch {i//batch_size + 1}: {len(batch)} records")
                
                # Small delay to avoid throttling
                time.sleep(0.1)
                
            except Exception as e:
                logger.error(f"Error inserting batch to {table_name}: {e}")
                failed += len(batch)
        
        return {'processed': processed, 'failed': failed}
    
    def migrate_csv_to_dynamodb(self, csv_file_path: str) -> Dict[str, Any]:
        """
        Migrates a single CSV file to DynamoDB.
        Now includes actual DynamoDB operations with safety controls.
        """
        filename = os.path.basename(csv_file_path)
        logger.info(f"Starting migration for: {filename} (Mode: {'DRY RUN' if self.dry_run else 'ACTUAL'})")
        
        migration_result = {
            'filename': filename,
            'status': 'pending',
            'records_processed': 0,
            'records_failed': 0,
            'errors': [],
            'start_time': datetime.now().isoformat(),
            'end_time': None,
            'duration_seconds': 0,
            'dry_run': self.dry_run
        }
        
        start_time = time.time()
        
        try:
            # 1. Validate CSV structure
            validation = self.validate_csv_structure(csv_file_path)
            if not validation['is_valid']:
                migration_result['status'] = 'failed'
                migration_result['errors'] = validation['errors']
                return migration_result
            
            file_info = validation['file_info']
            
            # 2. Create DynamoDB table if not exists
            table_name = self._get_table_name_from_filename(filename)
            if not self._create_dynamodb_table(table_name, file_info):
                migration_result['status'] = 'failed'
                migration_result['errors'].append(f"Failed to create table: {table_name}")
                return migration_result
            
            # 3. Read CSV records
            records = self._read_csv_records(csv_file_path)
            
            # 4. Insert records to DynamoDB
            insert_result = self._insert_records_to_dynamodb(table_name, records)
            
            migration_result['records_processed'] = insert_result['processed']
            migration_result['records_failed'] = insert_result['failed']
            migration_result['status'] = 'completed' if insert_result['failed'] == 0 else 'completed_with_errors'
            
            logger.info(f"Migration completed for {filename}: {insert_result['processed']} processed, {insert_result['failed']} failed")
            
        except Exception as e:
            migration_result['status'] = 'failed'
            migration_result['errors'].append(str(e))
            logger.error(f"Migration failed for {filename}: {e}")
        
        finally:
            end_time = time.time()
            migration_result['end_time'] = datetime.now().isoformat()
            migration_result['duration_seconds'] = round(end_time - start_time, 2)
        
        return migration_result
    
    def confirm_migration_execution(self) -> bool:
        """Interactive confirmation for actual migration execution"""
        if self.dry_run:
            return True  # No confirmation needed for dry run
        
        print("\n" + "="*60)
        print("⚠️  ACTUAL DYNAMODB MIGRATION CONFIRMATION ⚠️")
        print("="*60)
        print(f"You are about to migrate {len(self.migration_order)} CSV files to DynamoDB")
        print(f"AWS Region: {self.aws_region}")
        print(f"Total estimated records: {sum(self.get_csv_file_info(f)['row_count'] for f in self.migration_order)}")
        print("\nThis will:")
        print("- Create DynamoDB tables if they don't exist")
        print("- Insert data into production DynamoDB tables")
        print("- Potentially incur AWS costs")
        print("\nFiles to be migrated:")
        for i, file_path in enumerate(self.migration_order, 1):
            filename = os.path.basename(file_path)
            row_count = self.get_csv_file_info(file_path)['row_count']
            print(f"  {i:2d}. {filename} ({row_count} records)")
        
        print("\n" + "="*60)
        response = input("Type 'CONFIRM MIGRATION' to proceed with actual migration: ")
        
        if response.strip() == 'CONFIRM MIGRATION':
            print("✅ Migration confirmed. Proceeding...")
            return True
        else:
            print("❌ Migration cancelled.")
            return False
    
    def run_full_migration(self) -> Dict[str, Any]:
        """
        Runs the complete migration process for all CSV files in the correct order.
        
        Returns:
            Dict containing overall migration results
        """
        logger.info("Starting full CSV to DynamoDB migration")
        
        overall_result = {
            'status': 'in_progress',
            'total_files': len(self.migration_order),
            'completed_files': 0,
            'failed_files': 0,
            'file_results': [],
            'start_time': datetime.now().isoformat(),
            'end_time': None,
            'total_records_processed': 0
        }
        
        try:
            for csv_file_path in self.migration_order:
                logger.info(f"Processing file {overall_result['completed_files'] + 1} of {overall_result['total_files']}")
                
                # Migrate individual file
                file_result = self.migrate_csv_to_dynamodb(csv_file_path)
                overall_result['file_results'].append(file_result)
                
                if file_result['status'] == 'completed':
                    overall_result['completed_files'] += 1
                    overall_result['total_records_processed'] += file_result['records_processed']
                else:
                    overall_result['failed_files'] += 1
                    logger.error(f"Failed to migrate {file_result['filename']}")
                
                # Optional: Add delay between migrations to avoid rate limiting
                # time.sleep(1)
            
            overall_result['status'] = 'completed' if overall_result['failed_files'] == 0 else 'completed_with_errors'
            
        except Exception as e:
            overall_result['status'] = 'failed'
            overall_result['error'] = str(e)
            logger.error(f"Full migration failed: {e}")
        
        finally:
            overall_result['end_time'] = datetime.now().isoformat()
        
        return overall_result
    
    def generate_migration_report(self, results: Dict[str, Any]) -> str:
        """
        Generates a detailed migration report.
        
        Args:
            results: Migration results from run_full_migration()
            
        Returns:
            Formatted report string
        """
        report = []
        report.append("=" * 60)
        report.append("CSV TO DYNAMODB MIGRATION REPORT")
        report.append("=" * 60)
        report.append(f"Status: {results['status']}")
        report.append(f"Total Files: {results['total_files']}")
        report.append(f"Completed Files: {results['completed_files']}")
        report.append(f"Failed Files: {results['failed_files']}")
        report.append(f"Total Records Processed: {results['total_records_processed']}")
        report.append(f"Start Time: {results['start_time']}")
        report.append(f"End Time: {results['end_time']}")
        report.append("")
        
        report.append("FILE DETAILS:")
        report.append("-" * 40)
        
        for file_result in results['file_results']:
            report.append(f"File: {file_result['filename']}")
            report.append(f"  Status: {file_result['status']}")
            report.append(f"  Records Processed: {file_result['records_processed']}")
            if file_result['errors']:
                report.append(f"  Errors: {', '.join(file_result['errors'])}")
            report.append("")
        
        return "\n".join(report)
    
    def generate_amplify_schema_definitions(self) -> Dict[str, str]:
        """
        Generate Amplify Gen2 schema definitions for each CSV file.
        This helps create the API and model files needed for Amplify.
        """
        schema_definitions = {}
        
        for csv_file_path in self.migration_order:
            file_info = self.get_csv_file_info(csv_file_path)
            filename = file_info['filename']
            table_name = filename.replace('.csv', '')
            
            # Generate TypeScript model definition
            model_def = self._generate_typescript_model(file_info, table_name)
            schema_definitions[f"{table_name}.ts"] = model_def
            
            # Generate Amplify schema definition  
            amplify_def = self._generate_amplify_schema(file_info, table_name)
            schema_definitions[f"{table_name}_schema.ts"] = amplify_def
        
        return schema_definitions
    
    def _generate_typescript_model(self, file_info: Dict[str, Any], table_name: str) -> str:
        """Generate TypeScript interface for the model"""
        model_lines = [
            f"// Generated TypeScript model for {table_name}",
            f"// Source: {file_info['filename']} ({file_info['row_count']} records)",
            "",
            f"export interface {table_name} {{",
        ]
        
        # Add fields based on CSV columns
        for column in file_info['columns']:
            # Determine TypeScript type
            ts_type = self._get_typescript_type_from_column(column, file_info.get('sample_data', []))
            optional = "?" if column not in [file_info['primary_key']] else ""
            model_lines.append(f"  {column}{optional}: {ts_type};")
        
        model_lines.extend([
            "}",
            "",
            f"export interface Create{table_name}Input {{",
        ])
        
        # Create input interface (all fields optional except primary key)
        for column in file_info['columns']:
            ts_type = self._get_typescript_type_from_column(column, file_info.get('sample_data', []))
            optional = "?" if column != file_info['primary_key'] else ""
            model_lines.append(f"  {column}{optional}: {ts_type};")
        
        model_lines.extend([
            "}",
            "",
            f"export interface Update{table_name}Input {{",
            f"  {file_info['primary_key']}: string;",
        ])
        
        # Update input interface (all fields optional except primary key)
        for column in file_info['columns']:
            if column != file_info['primary_key']:
                ts_type = self._get_typescript_type_from_column(column, file_info.get('sample_data', []))
                model_lines.append(f"  {column}?: {ts_type};")
        
        model_lines.append("}")
        
        return "\n".join(model_lines)
    
    def _generate_amplify_schema(self, file_info: Dict[str, Any], table_name: str) -> str:
        """Generate Amplify Gen2 schema definition"""
        schema_lines = [
            f"// Generated Amplify schema for {table_name}",
            f"// Source: {file_info['filename']} ({file_info['row_count']} records)",
            "",
            "import { type ClientSchema, a, defineData } from '@aws-amplify/backend';",
            "",
            f"const {table_name.lower()}Schema = a.schema({{",
            f"  {table_name}: a",
            "    .model({",
        ]
        
        # Add model fields
        for column in file_info['columns']:
            amplify_type = self._get_amplify_type_from_column(column, file_info.get('sample_data', []))
            required = ".required()" if column == file_info['primary_key'] else ""
            schema_lines.append(f"      {column}: a.{amplify_type}{required},")
        
        schema_lines.extend([
            "    })",
            "    .authorization((allow) => [allow.publicApiKey()]),",
            "});",
            "",
            f"export type {table_name}Schema = ClientSchema<typeof {table_name.lower()}Schema>;",
            "",
            f"export const {table_name.lower()}Data = defineData({{",
            f"  schema: {table_name.lower()}Schema,",
            "  authorizationModes: {",
            "    defaultAuthorizationMode: 'apiKey',",
            "    apiKeyAuthorizationMode: {",
            "      expiresInDays: 30,",
            "    },",
            "  },",
            "});",
        ])
        
        return "\n".join(schema_lines)
    
    def _get_typescript_type_from_column(self, column: str, sample_data: List[Dict]) -> str:
        """Determine TypeScript type from column name and sample data"""
        column_lower = column.lower()
        
        # Check sample data if available
        if sample_data:
            for row in sample_data[:3]:  # Check first 3 rows
                value = row.get(column, '')
                if value and value.strip():
                    # Try to infer type from value
                    if value.lower() in ['true', 'false']:
                        return 'boolean'
                    try:
                        float(value)
                        return 'number'
                    except ValueError:
                        pass
                    # Check for date patterns
                    if 'date' in column_lower or 'time' in column_lower:
                        return 'string'  # ISO date string
                    break
        
        # Infer from column name
        if column_lower.endswith('id') or column == 'ID':
            return 'string'
        elif 'date' in column_lower or 'time' in column_lower:
            return 'string'  # ISO date string
        elif 'count' in column_lower or 'number' in column_lower or 'amount' in column_lower:
            return 'number'
        elif 'is' in column_lower or 'has' in column_lower or 'approved' in column_lower:
            return 'boolean'
        elif 'email' in column_lower or 'phone' in column_lower or 'url' in column_lower:
            return 'string'
        else:
            return 'string'  # Default to string
    
    def _get_amplify_type_from_column(self, column: str, sample_data: List[Dict]) -> str:
        """Determine Amplify schema type from column name and sample data"""
        ts_type = self._get_typescript_type_from_column(column, sample_data)
        
        # Map TypeScript types to Amplify types
        type_mapping = {
            'string': 'string()',
            'number': 'float()',
            'boolean': 'boolean()',
        }
        
        # Special cases for Amplify
        column_lower = column.lower()
        if column_lower.endswith('id') or column == 'ID':
            return 'id()'
        elif 'date' in column_lower or 'time' in column_lower:
            return 'datetime()'
        elif 'email' in column_lower:
            return 'email()'
        elif 'url' in column_lower or 'link' in column_lower:
            return 'url()'
        
        return type_mapping.get(ts_type, 'string()')
    
    def create_amplify_files(self, output_directory: str = None) -> Dict[str, str]:
        """
        Create actual Amplify schema and model files
        """
        if output_directory is None:
            output_directory = str(Path(__file__).parent.parent / "amplify" / "data" / "generated")
        
        output_path = Path(output_directory)
        output_path.mkdir(parents=True, exist_ok=True)
        
        schema_definitions = self.generate_amplify_schema_definitions()
        created_files = {}
        
        for filename, content in schema_definitions.items():
            file_path = output_path / filename
            
            if self.dry_run:
                logger.info(f"DRY RUN: Would create file: {file_path}")
                created_files[str(file_path)] = "dry_run"
            else:
                with open(file_path, 'w') as f:
                    f.write(content)
                logger.info(f"Created Amplify file: {file_path}")
                created_files[str(file_path)] = "created"
        
        return created_files
    
    def generate_migration_summary(self) -> Dict[str, Any]:
        """Generate a comprehensive migration summary with recommendations"""
        summary = {
            'total_files': len(self.migration_order),
            'total_records': 0,
            'migration_phases': [],
            'table_relationships': {},
            'estimated_aws_costs': {},
            'recommendations': []
        }
        
        # Calculate totals and analyze each phase
        phase_info = [
            ("Phase 1: BackOffice Lookup Tables", 9),
            ("Phase 2: Core Entities", 2), 
            ("Phase 3: Independent Entities", 4),
            ("Phase 4: Dependent Entities", 3),
            ("Phase 5: Child/Detail Entities", 8)
        ]
        
        phase_start = 0
        for phase_name, phase_count in phase_info:
            phase_files = self.migration_order[phase_start:phase_start + phase_count]
            phase_records = sum(self.get_csv_file_info(f)['row_count'] for f in phase_files)
            
            summary['migration_phases'].append({
                'name': phase_name,
                'files': [os.path.basename(f) for f in phase_files],
                'record_count': phase_records
            })
            summary['total_records'] += phase_records
            phase_start += phase_count
        
        # Analyze relationships (updated with correct one-to-many relationships)
        core_tables = ['Contacts', 'Properties']
        for file_path in self.migration_order:
            file_info = self.get_csv_file_info(file_path)
            table_name = file_info['filename'].replace('.csv', '')
            
            relationships = []
            for fk in file_info['foreign_keys']:
                fk_lower = fk.lower()
                if 'contactid' in fk_lower or fk in ['agentContactId', 'homeownerContactId', 'homeowner2ContactId', 'homeowner3ContactId', 'postedByContactId']:
                    relationships.append('Contacts')
                elif 'addressid' in fk_lower or 'propertyid' in fk_lower:
                    relationships.append('Properties')
                elif 'projectid' in fk_lower:
                    # Special handling for projectId relationships based on table context
                    if table_name == 'QuoteItems':
                        relationships.append('Quotes')  # QuoteItems.projectID references Quotes, not Projects
                    elif table_name in ['ProjectComments', 'ProjectMilestones', 'ProjectPaymentTerms', 'ProjectPermissions']:
                        relationships.append('Projects')  # These tables reference Projects via projectId
                elif 'requestid' in fk_lower:
                    relationships.append('Requests')
                elif 'quoteid' in fk_lower:
                    relationships.append('Quotes')
            
            if relationships:
                summary['table_relationships'][table_name] = list(set(relationships))
        
        # Estimate AWS costs (rough estimates)
        total_records = summary['total_records']
        estimated_storage_gb = total_records * 0.001  # Rough estimate: 1KB per record
        
        summary['estimated_aws_costs'] = {
            'dynamodb_storage_monthly': round(estimated_storage_gb * 0.25, 2),  # $0.25/GB
            'dynamodb_on_demand_writes': round(total_records * 0.00000125, 2),  # $1.25 per million writes
            'note': 'These are rough estimates. Actual costs depend on usage patterns.'
        }
        
        # Generate recommendations
        if total_records > 10000:
            summary['recommendations'].append("Consider using DynamoDB batch operations for large datasets")
        
        if len([t for t in summary['table_relationships'].values() if t]) > 10:
            summary['recommendations'].append("Consider implementing DynamoDB Global Secondary Indexes for complex queries")
        
        summary['recommendations'].extend([
            "Start with on-demand billing for unpredictable workloads",
            "Implement proper error handling and retry logic in your application",
            "Consider using DynamoDB Streams for real-time data processing",
            "Set up CloudWatch monitoring for DynamoDB metrics"
        ])
        
        return summary


class DynamoDBFieldRenamer:
    """
    Generic field renamer for DynamoDB tables with debugging support.
    Safely renames fields with dry-run mode and detailed logging.
    """
    
    def __init__(self, table_name: str, region: str = 'us-west-1'):
        self.table_name = table_name
        self.region = region
        self.dynamodb = None
        self.table = None
        self.stats = {
            'total_scanned': 0,
            'items_with_old_field': 0,
            'items_updated': 0,
            'errors': 0,
            'error_details': []
        }
    
    def initialize_connection(self):
        """Initialize DynamoDB connection"""
        if not DYNAMODB_AVAILABLE:
            raise RuntimeError("boto3 not available. Cannot connect to DynamoDB.")
        
        try:
            self.dynamodb = boto3.resource('dynamodb', region_name=self.region)
            self.table = self.dynamodb.Table(self.table_name)
            logger.info(f"Connected to DynamoDB table: {self.table_name}")
        except Exception as e:
            logger.error(f"Failed to connect to table {self.table_name}: {e}")
            raise
    
    def analyze_field_rename(self, old_field: str, new_field: str) -> Dict[str, Any]:
        """Analyze the field rename operation"""
        if not self.dynamodb:
            self.initialize_connection()
        
        logger.info(f"🔍 Analyzing field rename: {old_field} → {new_field}")
        
        analysis = {
            'table_name': self.table_name,
            'old_field': old_field,
            'new_field': new_field,
            'total_items': 0,
            'items_with_old_field': 0,
            'items_with_new_field': 0,
            'items_with_both_fields': 0,
            'sample_values': []
        }
        
        try:
            # Scan the table
            response = self.table.scan()
            items = response['Items']
            
            # Handle pagination
            while 'LastEvaluatedKey' in response:
                response = self.table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
                items.extend(response['Items'])
            
            analysis['total_items'] = len(items)
            
            for item in items:
                has_old = old_field in item
                has_new = new_field in item
                
                if has_old:
                    analysis['items_with_old_field'] += 1
                    if len(analysis['sample_values']) < 5:
                        analysis['sample_values'].append({
                            'id': item.get('ID', item.get('id', 'UNKNOWN')),
                            'old_value': str(item[old_field])
                        })
                
                if has_new:
                    analysis['items_with_new_field'] += 1
                
                if has_old and has_new:
                    analysis['items_with_both_fields'] += 1
            
            logger.info(f"📈 Analysis Results:")
            logger.info(f"   Total items: {analysis['total_items']}")
            logger.info(f"   Items with '{old_field}': {analysis['items_with_old_field']}")
            logger.info(f"   Items with '{new_field}': {analysis['items_with_new_field']}")
            logger.info(f"   Items with both fields: {analysis['items_with_both_fields']}")
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing table: {e}")
            raise
    
    def rename_field(self, old_field: str, new_field: str, dry_run: bool = True) -> Dict[str, Any]:
        """Rename field with dry-run support"""
        if not self.dynamodb:
            self.initialize_connection()
        
        mode = "DRY RUN" if dry_run else "LIVE OPERATION"
        logger.info(f"🚀 Starting field rename ({mode}): {old_field} → {new_field}")
        
        self.stats = {
            'total_scanned': 0,
            'items_with_old_field': 0,
            'items_updated': 0,
            'errors': 0,
            'error_details': [],
            'dry_run': dry_run
        }
        
        try:
            # Scan all items
            response = self.table.scan()
            items = response['Items']
            
            while 'LastEvaluatedKey' in response:
                response = self.table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
                items.extend(response['Items'])
            
            self.stats['total_scanned'] = len(items)
            logger.info(f"📊 Found {len(items)} items to process")
            
            # Process each item
            for item in items:
                if old_field in item:
                    self.stats['items_with_old_field'] += 1
                    
                    if dry_run:
                        item_id = item.get('ID', item.get('id', 'UNKNOWN'))
                        old_value = item[old_field]
                        logger.info(f"   [DRY RUN] Would rename '{old_field}' → '{new_field}' for item {item_id}")
                        self.stats['items_updated'] += 1
                    else:
                        success = self._update_item_field(item, old_field, new_field)
                        if success:
                            self.stats['items_updated'] += 1
            
            logger.info(f"✅ Operation completed ({mode})")
            logger.info(f"   Items processed: {self.stats['items_updated']}")
            logger.info(f"   Errors: {self.stats['errors']}")
            
            return self.stats
            
        except Exception as e:
            logger.error(f"Error during field rename: {e}")
            self.stats['errors'] += 1
            self.stats['error_details'].append(str(e))
            raise
    
    def _update_item_field(self, item: Dict[str, Any], old_field: str, new_field: str) -> bool:
        """Update a single item"""
        try:
            item_id = item.get('ID', item.get('id'))
            if not item_id:
                logger.error(f"No ID field found in item")
                return False
            
            old_value = item[old_field]
            
            # Update: add new field and remove old field in one operation
            self.table.update_item(
                Key={'ID': item_id},
                UpdateExpression='SET #new_field = :value REMOVE #old_field',
                ExpressionAttributeNames={
                    '#new_field': new_field,
                    '#old_field': old_field
                },
                ExpressionAttributeValues={
                    ':value': old_value
                }
            )
            
            logger.info(f"   ✅ Updated item {item_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating item {item.get('ID', 'UNKNOWN')}: {e}")
            self.stats['errors'] += 1
            self.stats['error_details'].append(f"Item {item.get('ID', 'UNKNOWN')}: {str(e)}")
            return False
    
    def verify_rename(self, old_field: str, new_field: str, sample_size: int = 10) -> Dict[str, Any]:
        """Verify the rename operation"""
        if not self.dynamodb:
            self.initialize_connection()
        
        logger.info(f"🔍 Verifying field rename: {old_field} → {new_field}")
        
        verification = {
            'items_checked': 0,
            'items_with_old_field': 0,
            'items_with_new_field': 0,
            'verification_passed': False
        }
        
        try:
            response = self.table.scan(Limit=sample_size)
            items = response['Items']
            
            verification['items_checked'] = len(items)
            
            for item in items:
                if old_field in item:
                    verification['items_with_old_field'] += 1
                if new_field in item:
                    verification['items_with_new_field'] += 1
            
            verification['verification_passed'] = (
                verification['items_with_old_field'] == 0 and
                verification['items_with_new_field'] > 0
            )
            
            logger.info(f"📊 Verification Results:")
            logger.info(f"   Items checked: {verification['items_checked']}")
            logger.info(f"   Items with old field: {verification['items_with_old_field']}")
            logger.info(f"   Items with new field: {verification['items_with_new_field']}")
            logger.info(f"   Verification passed: {verification['verification_passed']}")
            
            return verification
            
        except Exception as e:
            logger.error(f"Error during verification: {e}")
            raise


class DynamoDBFieldDeleter:
    """Smart field deletion tool for DynamoDB tables"""
    
    def __init__(self, table_name: str, aws_region: str = 'us-west-1'):
        self.table_name = table_name
        self.aws_region = aws_region
        self.dynamodb = None
        self.table = None
        self.stats = {
            'items_updated': 0,
            'errors': 0,
            'error_details': []
        }
    
    def initialize_connection(self):
        """Initialize DynamoDB connection"""
        if not DYNAMODB_AVAILABLE:
            raise Exception("boto3 not available - install with: pip install boto3")
        
        self.dynamodb = boto3.resource('dynamodb', region_name=self.aws_region)
        self.table = self.dynamodb.Table(self.table_name)
        
        # Verify table exists
        try:
            self.table.load()
            logger.info(f"✅ Connected to DynamoDB table: {self.table_name}")
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                raise Exception(f"Table {self.table_name} not found in region {self.aws_region}")
            else:
                raise
    
    def scan_all_fields(self) -> Dict[str, Any]:
        """Scan table and return all unique fields with sample data"""
        if not self.dynamodb:
            self.initialize_connection()
        
        logger.info(f"🔍 Scanning table {self.table_name} for all fields...")
        
        field_analysis = {}
        total_items = 0
        
        try:
            # Scan the table
            response = self.table.scan()
            items = response['Items']
            
            # Handle pagination
            while 'LastEvaluatedKey' in response:
                response = self.table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
                items.extend(response['Items'])
            
            total_items = len(items)
            
            # Collect all unique fields
            for item in items:
                for field_name, field_value in item.items():
                    if field_name not in field_analysis:
                        field_analysis[field_name] = {
                            'count': 0,
                            'sample_values': [],
                            'data_types': set()
                        }
                    
                    field_analysis[field_name]['count'] += 1
                    
                    # Store sample values (max 3 per field)
                    if len(field_analysis[field_name]['sample_values']) < 3:
                        sample_value = str(field_value)
                        if len(sample_value) > 50:
                            sample_value = sample_value[:47] + "..."
                        field_analysis[field_name]['sample_values'].append(sample_value)
                    
                    # Track data types
                    field_analysis[field_name]['data_types'].add(type(field_value).__name__)
            
            logger.info(f"📊 Scan Results:")
            logger.info(f"   Total items: {total_items}")
            logger.info(f"   Unique fields found: {len(field_analysis)}")
            
            return {
                'total_items': total_items,
                'fields': field_analysis
            }
            
        except Exception as e:
            logger.error(f"Error scanning table: {e}")
            raise
    
    def analyze_field_deletion(self, field_name: str) -> Dict[str, Any]:
        """Analyze the impact of deleting a specific field"""
        if not self.dynamodb:
            self.initialize_connection()
        
        logger.info(f"🔍 Analyzing field deletion: {field_name}")
        
        analysis = {
            'table_name': self.table_name,
            'field_name': field_name,
            'total_items': 0,
            'items_with_field': 0,
            'sample_values': []
        }
        
        try:
            # Scan the table
            response = self.table.scan()
            items = response['Items']
            
            # Handle pagination
            while 'LastEvaluatedKey' in response:
                response = self.table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
                items.extend(response['Items'])
            
            analysis['total_items'] = len(items)
            
            for item in items:
                if field_name in item:
                    analysis['items_with_field'] += 1
                    if len(analysis['sample_values']) < 5:
                        analysis['sample_values'].append({
                            'id': item.get('ID', item.get('id', 'UNKNOWN')),
                            'value': str(item[field_name])
                        })
            
            logger.info(f"📈 Deletion Analysis Results:")
            logger.info(f"   Total items: {analysis['total_items']}")
            logger.info(f"   Items with '{field_name}': {analysis['items_with_field']}")
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing field deletion: {e}")
            raise
    
    def delete_field(self, field_name: str, dry_run: bool = True) -> Dict[str, Any]:
        """Delete a field from all items in the table"""
        if not self.dynamodb:
            self.initialize_connection()
        
        mode = "DRY RUN" if dry_run else "LIVE OPERATION"
        logger.info(f"🗑️ Field deletion {mode}: {field_name}")
        
        # Reset stats
        self.stats = {
            'items_updated': 0,
            'errors': 0,
            'error_details': []
        }
        
        try:
            # Scan for items with the field
            response = self.table.scan()
            items = response['Items']
            
            # Handle pagination
            while 'LastEvaluatedKey' in response:
                response = self.table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
                items.extend(response['Items'])
            
            items_with_field = [item for item in items if field_name in item]
            logger.info(f"Found {len(items_with_field)} items with field '{field_name}'")
            
            # Process each item
            for item in items_with_field:
                if dry_run:
                    logger.info(f"   [DRY RUN] Would delete '{field_name}' from item {item.get('ID', item.get('id', 'UNKNOWN'))}")
                    self.stats['items_updated'] += 1
                else:
                    success = self._delete_item_field(item, field_name)
                    if success:
                        self.stats['items_updated'] += 1
            
            logger.info(f"✅ Operation completed ({mode})")
            logger.info(f"   Items processed: {self.stats['items_updated']}")
            logger.info(f"   Errors: {self.stats['errors']}")
            
            return self.stats
            
        except Exception as e:
            logger.error(f"Error during field deletion: {e}")
            self.stats['errors'] += 1
            self.stats['error_details'].append(str(e))
            raise
    
    def _delete_item_field(self, item: Dict[str, Any], field_name: str) -> bool:
        """Delete a field from a single item"""
        try:
            item_id = item.get('ID', item.get('id'))
            if not item_id:
                logger.error(f"No ID field found in item")
                return False
            
            # Delete field from item
            self.table.update_item(
                Key={'ID': item_id},
                UpdateExpression='REMOVE #field_name',
                ExpressionAttributeNames={
                    '#field_name': field_name
                }
            )
            
            logger.info(f"   ✅ Deleted '{field_name}' from item {item_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting field from item {item.get('ID', 'UNKNOWN')}: {e}")
            self.stats['errors'] += 1
            self.stats['error_details'].append(f"Item {item.get('ID', 'UNKNOWN')}: {str(e)}")
            return False
    
    def verify_deletion(self, field_name: str, sample_size: int = 10) -> Dict[str, Any]:
        """Verify the field deletion operation"""
        if not self.dynamodb:
            self.initialize_connection()
        
        logger.info(f"🔍 Verifying field deletion: {field_name}")
        
        verification = {
            'items_checked': 0,
            'items_with_field': 0,
            'verification_passed': False
        }
        
        try:
            response = self.table.scan(Limit=sample_size)
            items = response['Items']
            
            verification['items_checked'] = len(items)
            
            for item in items:
                if field_name in item:
                    verification['items_with_field'] += 1
            
            verification['verification_passed'] = (verification['items_with_field'] == 0)
            
            logger.info(f"📊 Verification Results:")
            logger.info(f"   Items checked: {verification['items_checked']}")
            logger.info(f"   Items with field: {verification['items_with_field']}")
            logger.info(f"   Verification passed: {verification['verification_passed']}")
            
            return verification
            
        except Exception as e:
            logger.error(f"Error during verification: {e}")
            raise


def main():
    """Main execution function with controlled migration options"""
    
    # Set up paths
    project_root = Path(__file__).parent.parent
    csv_directory = project_root / "data" / "csv" / "final"
    
    logger.info(f"Starting CSV migration from: {csv_directory}")
    
    # Initialize migration manager
    migration_manager = CSVMigrationManager(str(csv_directory))
    
    # Display migration order
    logger.info("Migration order:")
    total_records = 0
    for i, file_path in enumerate(migration_manager.migration_order, 1):
        filename = os.path.basename(file_path)
        file_info = migration_manager.get_csv_file_info(file_path)
        total_records += file_info['row_count']
        logger.info(f"  {i:2d}. {filename} ({file_info['row_count']} records)")
    
    logger.info(f"\nTotal files: {len(migration_manager.migration_order)}")
    logger.info(f"Total records: {total_records}")
    
    # Migration mode selection
    print("\n" + "="*60)
    print("CSV TO DYNAMODB MIGRATION OPTIONS")
    print("="*60)
    print("1. ANALYSIS ONLY - Scan and validate CSV files (SAFE)")
    print("2. DRY RUN - Simulate migration without actual DynamoDB operations (SAFE)")
    print("3. GENERATE AMPLIFY SCHEMAS - Create TypeScript models and Amplify schemas (SAFE)")
    print("4. MIGRATION SUMMARY - Generate comprehensive migration plan with cost estimates")
    print("5. ACTUAL MIGRATION - Migrate data to DynamoDB (REQUIRES CONFIRMATION)")
    print("6. FIELD RENAME TOOL - Rename DynamoDB table fields safely (INTERACTIVE)")
    print("7. SMART FIELD DELETION TOOL - Delete DynamoDB table fields safely (INTERACTIVE)")
    print("="*60)
    
    while True:
        try:
            choice = input("Select option (1-7): ").strip()
            if choice in ['1', '2', '3', '4', '5', '6', '7']:
                break
            print("Invalid choice. Please enter 1, 2, 3, 4, 5, 6, or 7.")
        except KeyboardInterrupt:
            print("\nOperation cancelled.")
            return
    
    if choice == '1':
        # Analysis mode
        logger.info("ANALYSIS MODE - Scanning and validating CSV files")
        logger.info("=" * 60)
        
        analysis_results = []
        for csv_file_path in migration_manager.migration_order:
            file_info = migration_manager.get_csv_file_info(csv_file_path)
            validation = migration_manager.validate_csv_structure(csv_file_path)
            
            analysis_results.append({
                'filename': file_info['filename'],
                'rows': file_info['row_count'],
                'columns': len(file_info['columns']),
                'primary_key': file_info['primary_key'],
                'foreign_keys': file_info['foreign_keys'],
                'valid': validation['is_valid'],
                'warnings': validation['warnings'],
                'errors': validation['errors']
            })
            
            logger.info(f"File: {file_info['filename']}")
            logger.info(f"  Rows: {file_info['row_count']}")
            logger.info(f"  Columns: {len(file_info['columns'])}")
            logger.info(f"  Primary Key: {file_info['primary_key']}")
            logger.info(f"  Foreign Keys: {file_info['foreign_keys']}")
            logger.info(f"  Valid: {validation['is_valid']}")
            if validation['warnings']:
                logger.info(f"  Warnings: {validation['warnings']}")
            if validation['errors']:
                logger.info(f"  Errors: {validation['errors']}")
            logger.info("")
        
        # Save analysis report
        analysis_report_file = project_root / "csv_analysis_report.json"
        with open(analysis_report_file, 'w') as f:
            json.dump(analysis_results, f, indent=2)
        logger.info(f"Analysis report saved to: {analysis_report_file}")
    
    elif choice == '2':
        # Dry run mode
        logger.info("DRY RUN MODE - Simulating migration without actual DynamoDB operations")
        migration_manager.set_migration_mode(dry_run=True)
        
        results = migration_manager.run_full_migration()
        
        # Generate and save report
        report = migration_manager.generate_migration_report(results)
        logger.info("\n" + report)
        
        # Save report to file
        report_file = project_root / "csv_migration_dry_run_report.txt"
        with open(report_file, 'w') as f:
            f.write(report)
        logger.info(f"Dry run report saved to: {report_file}")
    
    elif choice == '3':
        # Generate Amplify schemas
        logger.info("AMPLIFY SCHEMA GENERATION MODE")
        logger.info("=" * 60)
        
        # Generate TypeScript models and Amplify schemas
        schema_definitions = migration_manager.generate_amplify_schema_definitions()
        
        logger.info(f"Generated {len(schema_definitions)} schema files:")
        for filename in schema_definitions.keys():
            logger.info(f"  - {filename}")
        
        # Save schemas to files
        amplify_files = migration_manager.create_amplify_files()
        
        logger.info(f"\nAmplify schema files created in: amplify/data/generated/")
        logger.info("Next steps:")
        logger.info("1. Review the generated TypeScript models")
        logger.info("2. Integrate with your Amplify Gen2 backend")
        logger.info("3. Update your frontend to use the new data models")
    
    elif choice == '4':
        # Migration summary
        logger.info("MIGRATION SUMMARY GENERATION")
        logger.info("=" * 60)
        
        summary = migration_manager.generate_migration_summary()
        
        print(f"\n📊 MIGRATION SUMMARY")
        print(f"Total Files: {summary['total_files']}")
        print(f"Total Records: {summary['total_records']:,}")
        
        print(f"\n📁 MIGRATION PHASES:")
        for phase in summary['migration_phases']:
            print(f"  {phase['name']}: {phase['record_count']:,} records ({len(phase['files'])} files)")
        
        print(f"\n🔗 TABLE RELATIONSHIPS:")
        for table, relationships in summary['table_relationships'].items():
            if relationships:
                print(f"  {table} → {', '.join(relationships)}")
        
        print(f"\n💰 ESTIMATED AWS COSTS:")
        costs = summary['estimated_aws_costs']
        print(f"  Monthly Storage: ${costs['dynamodb_storage_monthly']}")
        print(f"  One-time Migration: ${costs['dynamodb_on_demand_writes']}")
        print(f"  Note: {costs['note']}")
        
        print(f"\n💡 RECOMMENDATIONS:")
        for i, rec in enumerate(summary['recommendations'], 1):
            print(f"  {i}. {rec}")
        
        # Save summary to file
        summary_file = project_root / "csv_migration_summary.json"
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2)
        logger.info(f"\nDetailed summary saved to: {summary_file}")
    
    elif choice == '5':
        # Actual migration mode
        logger.warning("ACTUAL MIGRATION MODE SELECTED")
        
        # Check if DynamoDB is available
        if not DYNAMODB_AVAILABLE:
            logger.error("Cannot perform actual migration: boto3 not installed")
            logger.info("Install boto3 with: pip install boto3")
            logger.info("Migration cancelled.")
            return
        
        # Set migration mode to actual
        migration_manager.set_migration_mode(dry_run=False)
        
        # Require explicit confirmation
        if not migration_manager.confirm_migration_execution():
            logger.info("Migration cancelled by user")
            return
        
        # Run actual migration
        logger.info("Starting ACTUAL migration to DynamoDB...")
        results = migration_manager.run_full_migration()
        
        # Generate and save report
        report = migration_manager.generate_migration_report(results)
        logger.info("\n" + report)
        
        # Save report to file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = project_root / f"csv_migration_actual_report_{timestamp}.txt"
        with open(report_file, 'w') as f:
            f.write(report)
        logger.info(f"Migration report saved to: {report_file}")
        
        # Save detailed results as JSON
        results_file = project_root / f"csv_migration_results_{timestamp}.json"
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2)
        logger.info(f"Detailed results saved to: {results_file}")
    
    elif choice == '6':
        # Field rename tool
        logger.info("FIELD RENAME TOOL")
        logger.info("=" * 60)
        
        if not DYNAMODB_AVAILABLE:
            logger.error("Cannot perform field rename: boto3 not installed")
            logger.info("Install boto3 with: pip install boto3")
            return
        
        # Interactive field rename
        print("\n🔧 DynamoDB Field Rename Tool")
        print("This tool safely renames fields in DynamoDB tables")
        print("Example: Rename '12LegalDocumentId' to 'legalDocumentId' in Legal table")
        print("-" * 60)
        
        try:
            table_name = input("Enter table name (e.g., 'RealTechee-Legal'): ").strip()
            if not table_name:
                print("❌ Table name is required")
                return
            
            old_field = input("Enter current field name (e.g., '12LegalDocumentId'): ").strip()
            if not old_field:
                print("❌ Current field name is required")
                return
            
            new_field = input("Enter new field name (e.g., 'legalDocumentId'): ").strip()
            if not new_field:
                print("❌ New field name is required")
                return
            
            print(f"\n📋 Field Rename Configuration:")
            print(f"   Table: {table_name}")
            print(f"   Rename: {old_field} → {new_field}")
            
            # Initialize renamer
            renamer = DynamoDBFieldRenamer(table_name)
            
            # Step 1: Analyze
            print(f"\n1️⃣ Analyzing table...")
            analysis = renamer.analyze_field_rename(old_field, new_field)
            
            if analysis['items_with_old_field'] == 0:
                print(f"✅ No items found with field '{old_field}' - nothing to rename")
                return
            
            print(f"\n📊 Found {analysis['items_with_old_field']} items with field '{old_field}'")
            
            # Step 2: Dry run
            print(f"\n2️⃣ Performing dry run...")
            dry_result = renamer.rename_field(old_field, new_field, dry_run=True)
            
            # Step 3: Confirmation for live run
            print(f"\n⚠️  Ready to rename {dry_result['items_updated']} items")
            confirm = input("Type 'RENAME' to proceed with live operation: ").strip()
            
            if confirm == 'RENAME':
                print(f"\n3️⃣ Performing live rename operation...")
                live_result = renamer.rename_field(old_field, new_field, dry_run=False)
                
                print(f"\n4️⃣ Verifying rename...")
                verification = renamer.verify_rename(old_field, new_field)
                
                if verification['verification_passed']:
                    print(f"✅ Field rename completed successfully!")
                    print(f"   Items updated: {live_result['items_updated']}")
                    print(f"   Errors: {live_result['errors']}")
                else:
                    print(f"⚠️  Verification failed - please check manually")
                
                # Save results
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                results_file = project_root / f"field_rename_{table_name}_{timestamp}.json"
                with open(results_file, 'w') as f:
                    json.dump({
                        'table_name': table_name,
                        'old_field': old_field,
                        'new_field': new_field,
                        'analysis': analysis,
                        'dry_run': dry_result,
                        'live_run': live_result,
                        'verification': verification
                    }, f, indent=2)
                logger.info(f"Rename results saved to: {results_file}")
            else:
                print("❌ Live operation cancelled")
                
        except KeyboardInterrupt:
            print("\n❌ Operation cancelled by user")
        except Exception as e:
            logger.error(f"Field rename failed: {e}")
    
    elif choice == '7':
        # Smart field deletion tool
        logger.info("SMART FIELD DELETION TOOL")
        logger.info("=" * 60)
        
        if not DYNAMODB_AVAILABLE:
            logger.error("Cannot perform field deletion: boto3 not installed")
            logger.info("Install boto3 with: pip install boto3")
            return
        
        # Interactive field deletion
        print("\n🗑️ Smart DynamoDB Field Deletion Tool")
        print("This tool scans a table and lets you select fields to delete by number")
        print("Perfect for handling duplicate fields and unwanted columns")
        print("-" * 60)
        
        try:
            table_name = input("Enter table name (e.g., 'RealTechee-Projects'): ").strip()
            if not table_name:
                print("❌ Table name is required")
                return
            
            print(f"\n📋 Smart Field Deletion for table: {table_name}")
            
            # Initialize deleter
            deleter = DynamoDBFieldDeleter(table_name)
            
            # Step 1: Scan all fields
            print(f"\n1️⃣ Scanning table for all fields...")
            field_scan = deleter.scan_all_fields()
            
            if not field_scan['fields']:
                print(f"❌ No fields found in table '{table_name}'")
                return
            
            # Step 2: Display numbered field list (sorted alphabetically)
            print(f"\n📊 Found {len(field_scan['fields'])} unique fields in {field_scan['total_items']} items:")
            print("=" * 80)
            
            field_list = sorted(field_scan['fields'].keys())  # Sort alphabetically for easy searching
            for i, field_name in enumerate(field_list, 1):
                field_info = field_scan['fields'][field_name]
                count = field_info['count']
                data_types = ', '.join(sorted(field_info['data_types']))
                sample_values = field_info['sample_values'][:2]  # Show first 2 samples
                
                print(f"{i:2d}. {field_name}")
                print(f"    ├─ Count: {count}/{field_scan['total_items']} items")
                print(f"    ├─ Types: {data_types}")
                if sample_values:
                    print(f"    └─ Samples: {', '.join(repr(v) for v in sample_values)}")
                else:
                    print(f"    └─ Samples: (empty)")
                print()
            
            # Step 3: Field selection
            print("=" * 80)
            field_choice = input("Enter field number to delete (or 'cancel' to exit): ").strip()
            
            if field_choice.lower() == 'cancel':
                print("❌ Operation cancelled")
                return
            
            try:
                field_index = int(field_choice) - 1
                if field_index < 0 or field_index >= len(field_list):
                    print(f"❌ Invalid field number. Please enter 1-{len(field_list)}")
                    return
            except ValueError:
                print("❌ Invalid input. Please enter a number or 'cancel'")
                return
            
            selected_field = field_list[field_index]
            field_info = field_scan['fields'][selected_field]
            
            print(f"\n🎯 Selected field: '{selected_field}'")
            print(f"   Items affected: {field_info['count']}/{field_scan['total_items']}")
            print(f"   Data types: {', '.join(sorted(field_info['data_types']))}")
            
            # Safety check for critical fields
            critical_fields = ['ID', 'id', 'createdAt', 'updatedAt', 'owner']
            if selected_field in critical_fields:
                print(f"\n⚠️  WARNING: '{selected_field}' appears to be a critical system field!")
                confirm_critical = input("Type 'DELETE CRITICAL FIELD' to proceed anyway: ").strip()
                if confirm_critical != 'DELETE CRITICAL FIELD':
                    print("❌ Operation cancelled for safety")
                    return
            
            # Step 4: Analyze deletion impact
            print(f"\n2️⃣ Analyzing deletion impact...")
            analysis = deleter.analyze_field_deletion(selected_field)
            
            if analysis['items_with_field'] == 0:
                print(f"✅ No items found with field '{selected_field}' - nothing to delete")
                return
            
            print(f"\n📊 Found {analysis['items_with_field']} items with field '{selected_field}'")
            if analysis['sample_values']:
                print("Sample values that will be deleted:")
                for sample in analysis['sample_values'][:3]:
                    print(f"   {sample['id']}: {repr(sample['value'])}")
            
            # Step 5: Dry run
            print(f"\n3️⃣ Performing dry run...")
            dry_result = deleter.delete_field(selected_field, dry_run=True)
            
            # Step 6: Confirmation for live run
            print(f"\n⚠️  Ready to DELETE field '{selected_field}' from {dry_result['items_updated']} items")
            print(f"⚠️  This action cannot be undone!")
            confirm = input("Type 'DELETE' to proceed with live operation: ").strip()
            
            if confirm == 'DELETE':
                print(f"\n4️⃣ Performing live deletion operation...")
                live_result = deleter.delete_field(selected_field, dry_run=False)
                
                print(f"\n5️⃣ Verifying deletion...")
                verification = deleter.verify_deletion(selected_field)
                
                if verification['verification_passed']:
                    print(f"✅ Field deletion completed successfully!")
                    print(f"   Items updated: {live_result['items_updated']}")
                    print(f"   Errors: {live_result['errors']}")
                else:
                    print(f"⚠️  Verification failed - please check manually")
                    print(f"   Items still with field: {verification['items_with_field']}")
                
                # Save results
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                results_file = project_root / f"field_deletion_{table_name}_{timestamp}.json"
                with open(results_file, 'w') as f:
                    json.dump({
                        'table_name': table_name,
                        'deleted_field': selected_field,
                        'field_scan': {
                            'total_fields': len(field_scan['fields']),
                            'total_items': field_scan['total_items'],
                            'selected_field_info': field_info
                        },
                        'analysis': analysis,
                        'dry_run': dry_result,
                        'live_run': live_result,
                        'verification': verification
                    }, f, indent=2)
                logger.info(f"Deletion results saved to: {results_file}")
            else:
                print("❌ Live operation cancelled")
                
        except KeyboardInterrupt:
            print("\n❌ Operation cancelled by user")
        except Exception as e:
            logger.error(f"Field deletion failed: {e}")


if __name__ == "__main__":
    main()
