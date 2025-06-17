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
import re
import os
import subprocess
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from decimal import Decimal
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
import logging

class AmplifyDataMigrator:
    def __init__(self):
        try:
            self.dynamodb = boto3.resource('dynamodb', region_name='us-west-1')
            self.client = boto3.client('dynamodb', region_name='us-west-1')
            
            # Test AWS credentials
            self.client.list_tables(Limit=1)
            
        except Exception as e:
            print(f"❌ AWS Connection Error: {str(e)}")
            print("Please ensure:")
            print("1. AWS credentials are configured (aws configure)")
            print("2. You have DynamoDB permissions")
            print("3. Region us-west-1 is accessible")
            raise
        
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
        self.amplify_suffix = "-ukgxireroncqrdrirvf222rkai-NONE"
        
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
        
        # Data type transformations for modernized schema
        self.type_transformations = {
            # Convert to integers (from strings or floats)
            'integer_fields': [
                'numEmployees', 'order', 'floors', 'yearBuilt', 'quoteNumber',
                'openEscrowWithinDays', 'accountExecutive', 'bedrooms', 'bathrooms'
            ],
            # Convert to Decimal objects for DynamoDB (from strings or floats)
            'decimal_fields': [
                'accounting', 'order', 'paymentAmount', 'sizeSqft', 'originalValue', 'listingPrice', 'salePrice',
                'boostPrice', 'boosterEstimatedCost', 'boosterActualCost', 'addedValue',
                'revShareAmount', 'loanBalance', 'budget', 'totalCost', 'totalPrice',
                'projectedListingPrice', 'creditScore', 'quantity', 'marginPercent',
                'cost', 'price', 'statusOrder', 'bedrooms', 'bathrooms', 'openEscrowWithinDays',
                'accountExecutive'
            ],
            # Convert string booleans to actual booleans
            'boolean_fields': [
                'hash', 'sendEmailNotifications', 'sendSmsNotifications', 'active', 'live',
                'projectRemnantList', 'isPrivate', 'isComplete', 'isCategory', 'isInternal',
                'internal', 'paid', 'permissions', 'excludeFromDashboard', 'permissionPublic',
                'permissionPrivateRoles', 'permissionPrivateUsers', 'archived', 'signed',
                'operationManagerApproved', 'underwritingApproved', 'needFinance',
                'itemCompleted', 'recommendItem'
            ],
            # Ensure these stay as strings (especially important for zip codes, phone numbers)
            'string_fields': [
                'zip', 'phone', 'mobile', 'license', 'invoiceNumber', 'unitPrice', 'total',
                'bedrooms', 'bathrooms', 'floors', 'sizeSqft', 'yearBuilt'  # Some tables have these as strings
            ],
            # Fields that should be cleaned/validated as emails
            'email_fields': [
                'email', 'slaCompanyEmail', 'agentEmail', 'projectManagerEmailList',
                'homeownerEmail', 'memberEmail'
            ],
            # Fields that should be validated as URLs
            'url_fields': [
                'redfinLink', 'zillowLink', 'pdfGeneratorUrl', 'quotePdfUrl', 'quoteUrl',
                'linkProjects1Title2', 'link04ProjectsTitle', 'contractUrl', 'linkSla2Name',
                'initialsPublicUrl', 'signaturePublicUrl',
                'signedPdfGeneratorUrl', 'signedQuotePdfPublicUrl'
            ],
            # Fields that contain Wix URLs and need conversion
            'wix_url_fields': {
                # Single Wix URL fields
                'single_wix_urls': [
                    'initialsWixUrl', 'signatureWixUrl', 'image', 'statusImage', 
                    'postedByProfileImage', 'addToGallery'
                ],
                # Array/Gallery Wix URL fields (JSON strings containing multiple URLs)
                'array_wix_urls': [
                    'gallery', 'images', 'documents', 'files', 'uploadedMedia', 
                    'uploadedVideos', 'uploadedDocuments'
                ],
                # Document/signature fields that may contain Wix URLs
                'document_wix_fields': [
                    'document', 'signedDocument', 'signature', 'initials', 
                    'documentData', 'signedContracts'
                ],
                # Content fields that may have embedded Wix URLs
                'content_wix_fields': [
                    'body', 'content'
                ]
            }
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
            
            original_tables = [t for t in all_tables if t.startswith('RealTechee')]
            amplify_tables = [t for t in all_tables if t.endswith(self.amplify_suffix)]
            
            # Create mapping
            mapping = {}
            for orig_table in original_tables:
                # Extract base name (remove RealTechee prefix)
                if orig_table.startswith('RealTechee-'):
                    # Standard tables: RealTechee-TableName
                    base_name = orig_table.replace('RealTechee-', '')
                elif orig_table.startswith('RealTecheeBackOffice'):
                    # BackOffice tables: RealTecheeBackOfficeTableName
                    base_name = orig_table.replace('RealTechee', '')
                else:
                    continue  # Skip unknown patterns
                
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

    def clean_email_value(self, value: Any) -> Optional[str]:
        """Clean and validate email values."""
        if not value or not isinstance(value, str):
            return value
        
        # Handle encoded paths like "/sla-a/timber-tree-services-/chulisv05%40gmail.com"
        if '%40' in value or '@' in value:
            # Extract email using regex
            email_match = re.search(r'([a-zA-Z0-9._%+-]+[@%40][a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', value)
            if email_match:
                email = email_match.group(1).replace('%40', '@')
                # Basic email validation
                if re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
                    return email
        
        # If no valid email found, return None or original value based on strictness
        return None if value.startswith('/') else value

    def clean_url_value(self, value: Any) -> Optional[str]:
        """Clean and validate URL values."""
        if not value or not isinstance(value, str):
            return value
        
        # Basic URL validation
        if value.startswith(('http://', 'https://', 'ftp://')):
            return value
        elif value.startswith('www.'):
            return f'https://{value}'
        
        # If not a valid URL pattern, return None
        return None

    def convert_boolean_value(self, value: Any) -> bool:
        """Convert string boolean to actual boolean."""
        if isinstance(value, bool):
            return value
        elif isinstance(value, str):
            return value.lower() in ['true', '1', 'yes', 'on']
        elif isinstance(value, (int, float)):
            return bool(value)
        else:
            return False

    def convert_numeric_value(self, value: Any, target_type: str) -> Any:
        """Convert string/decimal to appropriate numeric type."""
        if value is None or value == '':
            return None
        
        try:
            if isinstance(value, Decimal):
                if target_type == 'integer':
                    return int(value)
                elif target_type == 'decimal':
                    return value  # Already a Decimal
                else:  # float
                    return float(value)
            elif isinstance(value, str):
                # Handle empty strings and non-numeric strings
                if not value.strip():
                    return None
                # Remove any non-numeric characters except decimal point and negative sign
                cleaned = re.sub(r'[^\d.-]', '', value)
                if not cleaned or cleaned in ['-', '.']:
                    return None
                
                if target_type == 'integer':
                    return int(float(cleaned))  # Convert through float to handle decimals
                elif target_type == 'decimal':
                    return Decimal(cleaned)  # Convert to Decimal for DynamoDB
                else:  # float
                    return float(cleaned)
            elif isinstance(value, (int, float)):
                if target_type == 'integer':
                    return int(value)
                elif target_type == 'decimal':
                    return Decimal(str(value))  # Convert to Decimal for DynamoDB
                else:  # float
                    return float(value)
        except (ValueError, TypeError, OverflowError):
            self.logger.warning(f"Could not convert '{value}' to {target_type}, keeping original")
            return value
        
        return value

    def is_wix_media_url(self, url: str) -> bool:
        """Check if a URL is a Wix media URL that needs conversion."""
        if not url or not isinstance(url, str):
            return False
        
        # Check for wix:image protocol
        if url.startswith('wix:image://'):
            return True
        
        # Check for JSON slug format
        if '"slug"' in url:
            return True
        
        # Check for JSON format (could be array or object)
        if (url.startswith('{') and url.endswith('}')) or (url.startswith('[') and url.endswith(']')):
            return True
        
        # Check for existing Wix static URLs
        if 'wixstatic.com' in url:
            return True
        
        return False

    def convert_wix_media_url(self, wix_url: str) -> str:
        """
        Convert Wix media URL to public URL.
        Python adaptation of the TypeScript convertWixMediaUrl function.
        """
        if not wix_url or not isinstance(wix_url, str):
            return wix_url
        
        # If it's already a standard URL, return as is
        if wix_url.startswith(('http://', 'https://')):
            return wix_url
        
        # Handle JSON array format
        if wix_url.startswith('[') or wix_url.startswith('{'):
            try:
                # Extract URI from JSON with description
                uri_match = re.search(r'"uri":"([^"]+)"', wix_url)
                if uri_match and uri_match.group(1):
                    nested_url = uri_match.group(1)
                    if nested_url.startswith('wix:image://'):
                        return self.convert_wix_media_url(nested_url)
                    elif nested_url.startswith('http'):
                        return nested_url
                
                # Check for JSON slug format
                if '"slug"' in wix_url:
                    slug_match = re.search(r'"slug":"([^"]+)"', wix_url)
                    if slug_match and slug_match.group(1):
                        slug = slug_match.group(1)
                        
                        # Check if slug needs ~mv2.jpg suffix
                        if not ('~mv2' in slug or re.search(r'\.(jpe?g|png|gif|webp|svg)$', slug, re.IGNORECASE)):
                            if re.match(r'^[a-f0-9_]+$', slug, re.IGNORECASE):
                                return f'https://static.wixstatic.com/media/{slug}~mv2.jpg'
                        
                        return f'https://static.wixstatic.com/media/{slug}'
                
            except Exception as e:
                self.logger.warning(f"Error processing JSON format Wix URL: {str(e)}")
        
        # Check if it's a Wix media URL format
        if not wix_url.startswith('wix:image://'):
            return wix_url
        
        try:
            # Remove the prefix
            without_prefix = wix_url.replace('wix:image://', '')
            
            # Remove hash parameters
            without_hash = without_prefix.split('#')[0]
            
            # Split by slash
            parts = without_hash.split('/')
            
            if len(parts) < 1:
                return wix_url
            
            # Extract media ID
            media_id = ''
            
            # For URLs in format: wix:image://v1/12345/filename.jpg
            if parts[0] == 'v1' and len(parts) >= 2:
                media_id = parts[1]
            else:
                media_id = parts[0]
            
            # SVG special handling
            if media_id.startswith('shapes_'):
                return f'https://static.wixstatic.com/shapes/{media_id.replace("shapes_", "")}.svg'
            
            # Standard media format
            if re.match(r'mv2$', media_id, re.IGNORECASE) and '~' not in media_id:
                media_id = f'{media_id}~mv2.jpg'
            elif re.match(r'^[a-f0-9_]+mv2$', media_id, re.IGNORECASE) and '~' not in media_id:
                media_id = f'{media_id}~mv2.jpg'
            elif not ('~mv2' in media_id or re.search(r'\.(jpe?g|png|gif|webp|svg)$', media_id, re.IGNORECASE)):
                media_id = f'{media_id}~mv2.jpg'
            
            return f'https://static.wixstatic.com/media/{media_id}'
            
        except Exception as e:
            self.logger.error(f"Error converting Wix media URL {wix_url}: {str(e)}")
            return wix_url

    def convert_wix_url_field(self, value: Any, field_type: str) -> str:
        """
        Convert Wix URLs in different field types.
        
        Args:
            value: The field value that may contain Wix URLs
            field_type: Type of field ('single', 'array', 'document', 'content')
        
        Returns:
            Converted value with public URLs
        """
        if not value or not isinstance(value, str):
            return value
        
        try:
            if field_type == 'single':
                # Single Wix URL conversion
                if self.is_wix_media_url(value):
                    converted = self.convert_wix_media_url(value)
                    if converted != value:
                        self.logger.info(f"Converted Wix URL: {value[:50]}... → {converted[:50]}...")
                    return converted
                return value
            
            elif field_type == 'array':
                # Array/Gallery fields (JSON strings or comma-separated)
                if value.startswith('['):
                    # Complex JSON array format (like gallery with objects)
                    try:
                        import json
                        
                        # Parse the JSON array
                        gallery_items = json.loads(value)
                        
                        if isinstance(gallery_items, list):
                            converted_items = []
                            
                            for item in gallery_items:
                                if isinstance(item, dict):
                                    # Convert Wix URLs in each object
                                    converted_item = item.copy()
                                    
                                    # Convert 'src' field if it's a Wix URL
                                    if 'src' in item and self.is_wix_media_url(item['src']):
                                        converted_url = self.convert_wix_media_url(item['src'])
                                        converted_item['src'] = converted_url
                                        self.logger.info(f"Converted gallery src: {item['src'][:50]}... → {converted_url[:50]}...")
                                    
                                    # Convert 'slug' field to full URL if needed
                                    if 'slug' in item and not item['slug'].startswith('http'):
                                        slug = item['slug']
                                        # Create full URL from slug
                                        if re.match(r'^[a-f0-9_]+.*\.(jpe?g|png|gif|webp|svg)', slug, re.IGNORECASE):
                                            slug_url = f'https://static.wixstatic.com/media/{slug}'
                                            # Also update src if it matches the slug pattern
                                            if 'src' not in converted_item or not converted_item['src'].startswith('http'):
                                                converted_item['src'] = slug_url
                                                self.logger.info(f"Converted gallery slug to src: {slug} → {slug_url}")
                                    
                                    converted_items.append(converted_item)
                                else:
                                    converted_items.append(item)
                            
                            # Return the converted JSON array as string
                            return json.dumps(converted_items)
                        
                    except json.JSONDecodeError as e:
                        self.logger.warning(f"Error parsing gallery JSON: {str(e)}")
                    except Exception as e:
                        self.logger.warning(f"Error processing gallery array: {str(e)}")
                
                elif value.startswith('{'):
                    # Single object with slug
                    try:
                        if '"slug"' in value:
                            return self.convert_wix_media_url(value)
                    except Exception as e:
                        self.logger.warning(f"Error processing single object: {str(e)}")
                
                # Comma-separated URLs
                elif ',' in value and 'wix:' in value:
                    urls = [url.strip() for url in value.split(',')]
                    converted_urls = []
                    for url in urls:
                        if self.is_wix_media_url(url):
                            converted_urls.append(self.convert_wix_media_url(url))
                        else:
                            converted_urls.append(url)
                    return ','.join(converted_urls)
                
                # Single URL in array field
                elif self.is_wix_media_url(value):
                    return self.convert_wix_media_url(value)
                
                return value
            
            elif field_type == 'document':
                # Document/signature fields
                if self.is_wix_media_url(value):
                    return self.convert_wix_media_url(value)
                return value
            
            elif field_type == 'content':
                # Content fields with embedded URLs
                if 'wix:image://' in value or 'wixstatic.com' in value:
                    # Find and replace all Wix URLs in content
                    def replace_wix_url(match):
                        wix_url = match.group(0)
                        return self.convert_wix_media_url(wix_url)
                    
                    # Replace all wix:image:// URLs
                    converted = re.sub(r'wix:image://[^\s"\'<>]+', replace_wix_url, value)
                    return converted
                return value
            
        except Exception as e:
            self.logger.error(f"Error converting Wix URLs in field: {str(e)}")
            return value
        
        return value

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
        """Transform item fields according to mapping rules and type conversions."""
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
            if field == 'ID':
                new_field = 'id'
            
            # Skip None/empty values for cleaner data
            if value is None or value == '':
                transformed_item[new_field] = None
                continue
            
            # Apply type transformations based on field type
            try:
                # Boolean fields
                if new_field in self.type_transformations['boolean_fields']:
                    value = self.convert_boolean_value(value)
                
                # Integer fields
                elif new_field in self.type_transformations['integer_fields']:
                    value = self.convert_numeric_value(value, 'integer')
                
                # Decimal fields (for DynamoDB compatibility)
                elif new_field in self.type_transformations['decimal_fields']:
                    value = self.convert_numeric_value(value, 'decimal')
                
                # Email fields
                elif new_field in self.type_transformations['email_fields']:
                    cleaned_email = self.clean_email_value(value)
                    if cleaned_email is not None:
                        value = cleaned_email
                    else:
                        self.logger.warning(f"Invalid email format in {new_field}: {value}")
                        continue  # Skip invalid emails
                
                # Wix URL fields (process before regular URL validation)
                elif new_field in self.type_transformations['wix_url_fields']['single_wix_urls']:
                    value = self.convert_wix_url_field(value, 'single')
                
                elif new_field in self.type_transformations['wix_url_fields']['array_wix_urls']:
                    value = self.convert_wix_url_field(value, 'array')
                
                elif new_field in self.type_transformations['wix_url_fields']['document_wix_fields']:
                    value = self.convert_wix_url_field(value, 'document')
                
                elif new_field in self.type_transformations['wix_url_fields']['content_wix_fields']:
                    value = self.convert_wix_url_field(value, 'content')
                
                # Regular URL fields
                elif new_field in self.type_transformations['url_fields']:
                    cleaned_url = self.clean_url_value(value)
                    if cleaned_url is not None:
                        value = cleaned_url
                    else:
                        self.logger.warning(f"Invalid URL format in {new_field}: {value}")
                        continue  # Skip invalid URLs
                
                # String fields (force to string, important for zip codes with leading zeros)
                elif new_field in self.type_transformations['string_fields']:
                    value = str(value)
                
                # Handle Decimal values (legacy logic for unspecified fields)
                elif isinstance(value, Decimal):
                    if value % 1 == 0:
                        value = int(value)
                    else:
                        value = float(value)
                
                transformed_item[new_field] = value
                
            except Exception as e:
                self.logger.error(f"Error transforming field {new_field} with value {value}: {str(e)}")
                # Keep original value if transformation fails
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
            # Reset migration stats for each run
            self.migration_stats = {
                'total_tables': 0,
                'successful_tables': 0,
                'failed_tables': 0,
                'total_records': 0,
                'successful_records': 0,
                'failed_records': 0,
                'start_time': datetime.now(),
                'end_time': None
            }
            
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

    def convert_existing_wix_urls(self, dry_run: bool = True):
        """Convert Wix URLs in existing migrated data for specific array fields."""
        try:
            start_time = datetime.now()
            
            self.logger.info("=" * 60)
            self.logger.info(f"WIX URL CONVERSION {'(DRY RUN)' if dry_run else '(LIVE)'}")
            self.logger.info("=" * 60)
            
            # Target tables and fields with array Wix URLs
            conversion_targets = {
                'Projects-ukgxireroncqrdrirvf222rkai-NONE': ['gallery'],
                'ProjectComments-ukgxireroncqrdrirvf222rkai-NONE': ['files'], 
                'Quotes-ukgxireroncqrdrirvf222rkai-NONE': ['documents', 'images']
            }
            
            if not dry_run:
                confirm = input("This will update existing migrated records. Continue? (yes/no): ")
                if confirm.lower() != 'yes':
                    self.logger.info("Conversion cancelled by user")
                    return
            
            total_updated = 0
            total_conversions = 0
            
            for table_name, fields in conversion_targets.items():
                try:
                    table = self.dynamodb.Table(table_name)
                    
                    self.logger.info(f"\nProcessing table: {table_name}")
                    self.logger.info(f"Target fields: {fields}")
                    
                    # Scan table for records
                    response = table.scan()
                    items = response.get('Items', [])
                    
                    # Handle pagination
                    while 'LastEvaluatedKey' in response:
                        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
                        items.extend(response.get('Items', []))
                    
                    records_needing_update = []
                    
                    for item in items:
                        item_updates = {}
                        
                        for field in fields:
                            if field in item and item[field]:
                                # Check if field contains Wix URLs
                                field_value = item[field]
                                
                                if isinstance(field_value, str) and field_value.startswith('['):
                                    # Parse and convert gallery JSON array
                                    try:
                                        import json
                                        gallery_items = json.loads(field_value)
                                        
                                        if isinstance(gallery_items, list):
                                            converted_items = []
                                            conversion_count = 0
                                            
                                            for gallery_item in gallery_items:
                                                if isinstance(gallery_item, dict):
                                                    converted_item = gallery_item.copy()
                                                    
                                                    # Convert 'src' field
                                                    if 'src' in gallery_item and self.is_wix_media_url(gallery_item['src']):
                                                        converted_url = self.convert_wix_media_url(gallery_item['src'])
                                                        converted_item['src'] = converted_url
                                                        conversion_count += 1
                                                        self.logger.debug(f"Converting: {gallery_item['src'][:50]}... → {converted_url[:50]}...")
                                                    
                                                    # Convert 'slug' to full URL if needed
                                                    if 'slug' in gallery_item and not gallery_item['slug'].startswith('http'):
                                                        slug = gallery_item['slug']
                                                        if re.match(r'^[a-f0-9_]+.*\.(jpe?g|png|gif|webp|svg)', slug, re.IGNORECASE):
                                                            slug_url = f'https://static.wixstatic.com/media/{slug}'
                                                            if 'src' not in converted_item or not converted_item['src'].startswith('http'):
                                                                converted_item['src'] = slug_url
                                                                conversion_count += 1
                                                    
                                                    converted_items.append(converted_item)
                                                else:
                                                    converted_items.append(gallery_item)
                                            
                                            if conversion_count > 0:
                                                item_updates[field] = json.dumps(converted_items)
                                                total_conversions += conversion_count
                                    
                                    except Exception as e:
                                        self.logger.warning(f"Error processing {field} in record {item.get('id')}: {str(e)}")
                                
                                elif isinstance(field_value, str) and self.is_wix_media_url(field_value):
                                    # Single Wix URL conversion
                                    converted = self.convert_wix_media_url(field_value)
                                    if converted != field_value:
                                        item_updates[field] = converted
                                        total_conversions += 1
                        
                        if item_updates:
                            records_needing_update.append({
                                'id': item.get('id'),
                                'updates': item_updates
                            })
                    
                    self.logger.info(f"Found {len(records_needing_update)} records needing Wix URL conversion")
                    
                    # Update records (if not dry run)
                    if not dry_run and records_needing_update:
                        for record in records_needing_update:
                            try:
                                # Build update expression
                                update_expression = "SET "
                                expression_attribute_values = {}
                                
                                for field, value in record['updates'].items():
                                    update_expression += f"{field} = :{field}, "
                                    expression_attribute_values[f":{field}"] = value
                                
                                update_expression = update_expression.rstrip(', ')
                                
                                # Update the item
                                table.update_item(
                                    Key={'id': record['id']},
                                    UpdateExpression=update_expression,
                                    ExpressionAttributeValues=expression_attribute_values
                                )
                                
                                total_updated += 1
                                self.logger.info(f"Updated record {record['id']} in {table_name}")
                                
                            except Exception as e:
                                self.logger.error(f"Error updating record {record['id']}: {str(e)}")
                    
                    elif dry_run and records_needing_update:
                        self.logger.info(f"[DRY RUN] Would update {len(records_needing_update)} records")
                
                except Exception as e:
                    self.logger.error(f"Error processing table {table_name}: {str(e)}")
            
            # Summary
            end_time = datetime.now()
            duration = end_time - start_time
            
            self.logger.info("\n" + "=" * 60)
            self.logger.info("WIX URL CONVERSION SUMMARY")
            self.logger.info("=" * 60)
            self.logger.info(f"Duration: {duration}")
            self.logger.info(f"Records updated: {total_updated}")
            self.logger.info(f"URLs converted: {total_conversions}")
            
        except Exception as e:
            self.logger.error(f"Wix URL conversion failed: {str(e)}")
            raise

    def is_wix_document_url(self, url: str) -> bool:
        """Check if a URL is a Wix document URL that needs conversion."""
        if not url or not isinstance(url, str):
            return False
        
        return url.startswith('wix:document://')

    def convert_wix_document_url(self, wix_doc_url: str) -> Dict[str, str]:
        """
        Convert Wix document URL to JSON object with filename and documentPublicUrl.
        
        Example:
        Input: "wix:document://v1/2d321c_8011271dcba949cd84faf9dc8b5431f0.pdf/27543%20Berkshire%20Hills%20Pl,%20Valencia,%20CA%2091354,%20USA_signed.pdf"
        Output: {
            "filename": "27543%20Berkshire%20Hills%20Pl,%20Valencia,%20CA%2091354,%20USA_signed.pdf",
            "documentPublicUrl": "https://03839c70-7508-4e6d-b906-4df699fc5aa1.usrfiles.com/ugd/2d321c_8011271dcba949cd84faf9dc8b5431f0.pdf"
        }
        """
        if not self.is_wix_document_url(wix_doc_url):
            return {"error": "Not a valid Wix document URL"}
        
        try:
            # Fixed prefix for all document URLs
            PUBLIC_URL_PREFIX = "https://03839c70-7508-4e6d-b906-4df699fc5aa1.usrfiles.com/ugd/"
            
            # Remove the wix:document:// prefix
            without_prefix = wix_doc_url.replace('wix:document://', '')
            
            # Handle both formats: "v1/ugd/..." and "v1/..."
            if without_prefix.startswith('v1/ugd/'):
                # Format: wix:document://v1/ugd/2d321c_8011271dcba949cd84faf9dc8b5431f0.pdf/filename.pdf
                path_parts = without_prefix.replace('v1/ugd/', '').split('/')
            elif without_prefix.startswith('v1/'):
                # Format: wix:document://v1/2d321c_8011271dcba949cd84faf9dc8b5431f0.pdf/filename.pdf
                path_parts = without_prefix.replace('v1/', '').split('/')
            else:
                raise ValueError(f"Unexpected Wix document URL format: {wix_doc_url}")
            
            if len(path_parts) < 2:
                raise ValueError(f"Invalid Wix document URL structure: {wix_doc_url}")
            
            # Extract document ID and filename
            document_id = path_parts[0]  # e.g., "2d321c_8011271dcba949cd84faf9dc8b5431f0.pdf"
            filename = path_parts[1]     # e.g., "27543%20Berkshire%20Hills%20Pl,%20Valencia,%20CA%2091354,%20USA_signed.pdf"
            
            # Build public URL
            document_public_url = f"{PUBLIC_URL_PREFIX}{document_id}"
            
            return {
                "filename": filename,
                "documentPublicUrl": document_public_url
            }
            
        except Exception as e:
            self.logger.error(f"Error converting Wix document URL {wix_doc_url}: {str(e)}")
            return {"error": str(e)}

    def convert_document_field_value(self, field_value: Any) -> tuple[Any, int]:
        """Convert document field value (single URL or array of URLs) to proper format."""
        if not field_value:
            return field_value, 0
        
        conversion_count = 0
        
        try:
            if isinstance(field_value, str):
                if self.is_wix_document_url(field_value):
                    # Single Wix document URL
                    converted = self.convert_wix_document_url(field_value)
                    if "error" not in converted:
                        conversion_count = 1
                        return json.dumps(converted), conversion_count
                elif field_value.startswith('['):
                    # Array of document URLs
                    try:
                        import json
                        doc_array = json.loads(field_value)
                        
                        if isinstance(doc_array, list):
                            converted_docs = []
                            
                            for doc_item in doc_array:
                                if isinstance(doc_item, str) and self.is_wix_document_url(doc_item):
                                    converted = self.convert_wix_document_url(doc_item)
                                    if "error" not in converted:
                                        converted_docs.append(converted)
                                        conversion_count += 1
                                    else:
                                        # Keep original if conversion failed
                                        converted_docs.append(doc_item)
                                else:
                                    # Keep non-Wix URLs as is
                                    converted_docs.append(doc_item)
                            
                            if conversion_count > 0:
                                return json.dumps(converted_docs), conversion_count
                    
                    except json.JSONDecodeError:
                        # If it's not valid JSON, treat as single URL
                        if self.is_wix_document_url(field_value):
                            converted = self.convert_wix_document_url(field_value)
                            if "error" not in converted:
                                conversion_count = 1
                                return json.dumps(converted), conversion_count
            
        except Exception as e:
            self.logger.error(f"Error converting document field: {str(e)}")
        
        return field_value, conversion_count

    def convert_existing_wix_documents(self, dry_run: bool = True):
        """Convert Wix document URLs in existing migrated data to JSON objects with filename and publicUrl."""
        try:
            start_time = datetime.now()
            
            self.logger.info("=" * 60)
            self.logger.info(f"WIX DOCUMENT CONVERSION {'(DRY RUN)' if dry_run else '(LIVE)'}")
            self.logger.info("=" * 60)
            
            # Target tables and fields with document URLs
            document_conversion_targets = {
                'eSignatureDocuments-ukgxireroncqrdrirvf222rkai-NONE': ['signedDocument', 'document'],
                'Projects-ukgxireroncqrdrirvf222rkai-NONE': ['documents', 'signedContracts'],
                'Quotes-ukgxireroncqrdrirvf222rkai-NONE': ['document'],
                'Legal-ukgxireroncqrdrirvf222rkai-NONE': ['content'],  # May contain embedded document URLs
                'Requests-ukgxireroncqrdrirvf222rkai-NONE': ['uploadedDocuments']
            }
            
            if not dry_run:
                confirm = input("This will convert Wix document URLs to JSON objects. Continue? (yes/no): ")
                if confirm.lower() != 'yes':
                    self.logger.info("Document conversion cancelled by user")
                    return
            
            total_updated = 0
            total_conversions = 0
            
            for table_name, fields in document_conversion_targets.items():
                try:
                    table = self.dynamodb.Table(table_name)
                    
                    self.logger.info(f"\nProcessing table: {table_name}")
                    self.logger.info(f"Target fields: {fields}")
                    
                    # Scan table for records
                    response = table.scan()
                    items = response.get('Items', [])
                    
                    # Handle pagination
                    while 'LastEvaluatedKey' in response:
                        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
                        items.extend(response.get('Items', []))
                    
                    records_needing_update = []
                    
                    for item in items:
                        item_updates = {}
                        
                        for field in fields:
                            if field in item and item[field]:
                                converted_value, conversion_count = self.convert_document_field_value(item[field])
                                
                                if conversion_count > 0:
                                    item_updates[field] = converted_value
                                    total_conversions += conversion_count
                                    self.logger.debug(f"Converting {conversion_count} document(s) in {field} for record {item.get('id')}")
                        
                        if item_updates:
                            records_needing_update.append({
                                'id': item.get('id'),
                                'updates': item_updates
                            })
                    
                    self.logger.info(f"Found {len(records_needing_update)} records needing Wix document conversion")
                    
                    # Update records (if not dry run)
                    if not dry_run and records_needing_update:
                        for record in records_needing_update:
                            try:
                                # Build update expression
                                update_expression = "SET "
                                expression_attribute_values = {}
                                
                                for field, value in record['updates'].items():
                                    update_expression += f"{field} = :{field}, "
                                    expression_attribute_values[f":{field}"] = value
                                
                                update_expression = update_expression.rstrip(', ')
                                
                                # Update the item
                                table.update_item(
                                    Key={'id': record['id']},
                                    UpdateExpression=update_expression,
                                    ExpressionAttributeValues=expression_attribute_values
                                )
                                
                                total_updated += 1
                                self.logger.info(f"Updated record {record['id']} in {table_name}")
                                
                            except Exception as e:
                                self.logger.error(f"Error updating record {record['id']}: {str(e)}")
                    
                    elif dry_run and records_needing_update:
                        self.logger.info(f"[DRY RUN] Would update {len(records_needing_update)} records")
                        
                        # Show sample conversion for first record
                        if records_needing_update:
                            sample_record = records_needing_update[0]
                            self.logger.info(f"Sample conversion for record {sample_record['id']}:")
                            for field, value in sample_record['updates'].items():
                                self.logger.info(f"  {field}: {value[:200]}...")
                
                except Exception as e:
                    self.logger.error(f"Error processing table {table_name}: {str(e)}")
            
            # Summary
            end_time = datetime.now()
            duration = end_time - start_time
            
            self.logger.info("\n" + "=" * 60)
            self.logger.info("WIX DOCUMENT CONVERSION SUMMARY")
            self.logger.info("=" * 60)
            self.logger.info(f"Duration: {duration}")
            self.logger.info(f"Records updated: {total_updated}")
            self.logger.info(f"Documents converted: {total_conversions}")
            
        except Exception as e:
            self.logger.error(f"Wix document conversion failed: {str(e)}")
            raise

    def detect_main_table_suffix(self) -> str:
        """Auto-detect the main/production table suffix by scanning existing tables."""
        try:
            # Get all table names
            response = self.client.list_tables()
            all_tables = response['TableNames']
            
            # Look for tables that aren't sandbox (not ending with sandbox suffix)
            sandbox_suffix = "-ukgxireroncqrdrirvf222rkai-NONE"
            potential_suffixes = set()
            
            for table_name in all_tables:
                if not table_name.endswith(sandbox_suffix):
                    # Extract potential suffix pattern
                    for base_name in ['Affiliates', 'Auth', 'ContactUs', 'Contacts', 'Legal']:
                        if table_name.startswith(f'{base_name}-'):
                            suffix = table_name.replace(f'{base_name}', '')
                            potential_suffixes.add(suffix)
                            break
            
            if len(potential_suffixes) == 1:
                detected_suffix = list(potential_suffixes)[0]
                self.logger.info(f"Auto-detected main table suffix: {detected_suffix}")
                return detected_suffix
            elif len(potential_suffixes) > 1:
                self.logger.warning(f"Multiple potential suffixes found: {potential_suffixes}")
                return ""
            else:
                self.logger.warning("No main tables detected. May need to deploy first.")
                return ""
                
        except Exception as e:
            self.logger.error(f"Error detecting main table suffix: {str(e)}")
            return ""

    def get_sandbox_to_main_mapping(self, main_suffix: str) -> Dict[str, str]:
        """Get mapping of sandbox tables to main/production tables."""
        try:
            # Get all table names
            response = self.client.list_tables()
            all_tables = response['TableNames']
            
            sandbox_suffix = "-ukgxireroncqrdrirvf222rkai-NONE"
            
            # Auto-detect main suffix if requested
            if main_suffix.lower() == 'auto':
                main_suffix = self.detect_main_table_suffix()
                if not main_suffix:
                    self.logger.error("Could not auto-detect main table suffix")
                    return {}
            
            sandbox_tables = [t for t in all_tables if t.endswith(sandbox_suffix)]
            main_tables = [t for t in all_tables if t.endswith(main_suffix)]
            
            # Create mapping
            mapping = {}
            for sandbox_table in sandbox_tables:
                # Extract base name (remove sandbox suffix)
                base_name = sandbox_table.replace(sandbox_suffix, '')
                
                # Find corresponding main table
                main_table = f"{base_name}{main_suffix}"
                if main_table in main_tables:
                    mapping[sandbox_table] = main_table
                else:
                    self.logger.warning(f"Main table not found for {sandbox_table}: expected {main_table}")
            
            self.logger.info(f"Found {len(mapping)} sandbox→main table pairs")
            return mapping
            
        except Exception as e:
            self.logger.error(f"Error getting sandbox to main mapping: {str(e)}")
            return {}

    def sync_sandbox_to_main(self, main_suffix: str, dry_run: bool = True):
        """Sync data from sandbox tables to main/production tables."""
        try:
            start_time = datetime.now()
            
            self.logger.info("=" * 60)
            self.logger.info(f"SANDBOX → MAIN SYNC {'(DRY RUN)' if dry_run else '(LIVE)'}")
            self.logger.info("=" * 60)
            
            # Get table mappings
            table_mapping = self.get_sandbox_to_main_mapping(main_suffix)
            if not table_mapping:
                self.logger.error("No sandbox→main table mappings found. Exiting.")
                return
            
            # Display mapping for confirmation
            self.logger.info("\nSandbox → Main Table Mapping:")
            for sandbox, main in table_mapping.items():
                self.logger.info(f"  {sandbox} → {main}")
            
            if not dry_run:
                self.logger.warning("\n⚠️  LIVE SYNC MODE - This will copy data to production tables!")
                self.logger.warning("Make sure you have:")
                self.logger.warning("1. Deployed your Amplify backend first (npx ampx deploy)")
                self.logger.warning("2. Verified the main table schema matches sandbox")
                self.logger.warning("3. Backed up any existing main table data")
                
                confirm = input("\nProceed with live sync? (yes/no): ")
                if confirm.lower() != 'yes':
                    self.logger.info("Sync cancelled by user")
                    return
            
            total_synced_tables = 0
            total_synced_records = 0
            
            # Sync each table
            for sandbox_table, main_table in table_mapping.items():
                try:
                    sandbox = self.dynamodb.Table(sandbox_table)
                    main = self.dynamodb.Table(main_table)
                    
                    self.logger.info(f"\nSyncing: {sandbox_table} → {main_table}")
                    
                    # Get all items from sandbox table
                    response = sandbox.scan()
                    items = response.get('Items', [])
                    
                    # Handle pagination
                    while 'LastEvaluatedKey' in response:
                        response = sandbox.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
                        items.extend(response.get('Items', []))
                    
                    self.logger.info(f"Found {len(items)} records to sync")
                    
                    if not dry_run and items:
                        # Clear main table first (optional - comment out if you want to preserve existing data)
                        # self.logger.info("Clearing main table...")
                        # main_response = main.scan()
                        # main_items = main_response.get('Items', [])
                        # for item in main_items:
                        #     main.delete_item(Key={'id': item['id']})
                        
                        # Sync items in batches
                        batch_size = 25
                        synced_count = 0
                        
                        for i in range(0, len(items), batch_size):
                            batch = items[i:i + batch_size]
                            
                            # Use batch_writer for efficient writes
                            with main.batch_writer() as batch_writer:
                                for item in batch:
                                    try:
                                        # Convert Decimal objects to avoid JSON serialization issues
                                        cleaned_item = json.loads(json.dumps(item, default=str))
                                        batch_writer.put_item(Item=item)
                                        synced_count += 1
                                    except Exception as e:
                                        self.logger.error(f"Error syncing item {item.get('id')}: {str(e)}")
                            
                            self.logger.info(f"Synced {min(i + batch_size, len(items))}/{len(items)} records")
                        
                        total_synced_records += synced_count
                        self.logger.info(f"Successfully synced {synced_count}/{len(items)} records")
                    
                    elif dry_run:
                        self.logger.info(f"[DRY RUN] Would sync {len(items)} records")
                        total_synced_records += len(items)
                    
                    total_synced_tables += 1
                    
                except Exception as e:
                    self.logger.error(f"Error syncing table {sandbox_table}: {str(e)}")
            
            # Summary
            end_time = datetime.now()
            duration = end_time - start_time
            
            self.logger.info("\n" + "=" * 60)
            self.logger.info("SANDBOX → MAIN SYNC SUMMARY")
            self.logger.info("=" * 60)
            self.logger.info(f"Duration: {duration}")
            self.logger.info(f"Tables synced: {total_synced_tables}/{len(table_mapping)}")
            self.logger.info(f"Records synced: {total_synced_records}")
            
            if not dry_run:
                self.logger.info("\n✅ Sync complete! Your main/production tables now have the latest data.")
                self.logger.info("You can now deploy your frontend to production.")
            
        except Exception as e:
            self.logger.error(f"Sandbox to main sync failed: {str(e)}")
            raise

    def create_amplify_backup(self, backup_name: str = None) -> str:
        """Create a JSON backup of all Amplify sandbox tables."""
        try:
            if backup_name is None:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                backup_name = f"amplify_backup_{timestamp}"
            
            backup_dir = "backups"
            if not os.path.exists(backup_dir):
                os.makedirs(backup_dir)
            
            backup_file = os.path.join(backup_dir, f"{backup_name}.json")
            
            self.logger.info("=" * 60)
            self.logger.info(f"CREATING AMPLIFY BACKUP: {backup_name}")
            self.logger.info("=" * 60)
            
            # Get all Amplify tables
            response = self.client.list_tables()
            all_tables = response['TableNames']
            amplify_tables = [t for t in all_tables if t.endswith(self.amplify_suffix)]
            
            self.logger.info(f"Found {len(amplify_tables)} Amplify tables to backup")
            
            backup_data = {
                'backup_metadata': {
                    'created_at': datetime.now().isoformat(),
                    'amplify_suffix': self.amplify_suffix,
                    'total_tables': len(amplify_tables),
                    'tables': amplify_tables
                },
                'table_data': {}
            }
            
            total_records = 0
            
            for table_name in amplify_tables:
                try:
                    self.logger.info(f"Backing up table: {table_name}")
                    table = self.dynamodb.Table(table_name)
                    
                    # Scan entire table
                    response = table.scan()
                    items = response.get('Items', [])
                    
                    # Handle pagination
                    while 'LastEvaluatedKey' in response:
                        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
                        items.extend(response.get('Items', []))
                    
                    # Convert Decimal objects to float for JSON serialization
                    serializable_items = []
                    for item in items:
                        serializable_item = json.loads(json.dumps(item, default=str))
                        serializable_items.append(serializable_item)
                    
                    backup_data['table_data'][table_name] = {
                        'record_count': len(serializable_items),
                        'items': serializable_items
                    }
                    
                    total_records += len(serializable_items)
                    self.logger.info(f"  Backed up {len(serializable_items)} records")
                    
                except Exception as e:
                    self.logger.error(f"Error backing up table {table_name}: {str(e)}")
                    backup_data['table_data'][table_name] = {
                        'error': str(e),
                        'record_count': 0,
                        'items': []
                    }
            
            # Save backup to file
            with open(backup_file, 'w') as f:
                json.dump(backup_data, f, indent=2)
            
            backup_size = os.path.getsize(backup_file) / (1024 * 1024)  # MB
            
            self.logger.info("\n" + "=" * 60)
            self.logger.info("BACKUP COMPLETE")
            self.logger.info("=" * 60)
            self.logger.info(f"Backup file: {backup_file}")
            self.logger.info(f"Total tables: {len(amplify_tables)}")
            self.logger.info(f"Total records: {total_records}")
            self.logger.info(f"File size: {backup_size:.2f} MB")
            
            return backup_file
            
        except Exception as e:
            self.logger.error(f"Backup failed: {str(e)}")
            raise

    def list_available_backups(self) -> List[str]:
        """List all available backup files."""
        backup_dir = "backups"
        if not os.path.exists(backup_dir):
            return []
        
        backup_files = []
        for filename in os.listdir(backup_dir):
            if filename.startswith('amplify_backup_') and filename.endswith('.json'):
                backup_path = os.path.join(backup_dir, filename)
                backup_files.append({
                    'filename': filename,
                    'path': backup_path,
                    'size_mb': os.path.getsize(backup_path) / (1024 * 1024),
                    'created': datetime.fromtimestamp(os.path.getctime(backup_path))
                })
        
        # Sort by creation time (newest first)
        backup_files.sort(key=lambda x: x['created'], reverse=True)
        return backup_files

    def restore_from_backup(self, backup_file: str, dry_run: bool = True):
        """Restore Amplify tables from a JSON backup."""
        try:
            if not os.path.exists(backup_file):
                self.logger.error(f"Backup file not found: {backup_file}")
                return
            
            self.logger.info("=" * 60)
            self.logger.info(f"RESTORING FROM BACKUP {'(DRY RUN)' if dry_run else '(LIVE)'}")
            self.logger.info("=" * 60)
            self.logger.info(f"Backup file: {backup_file}")
            
            # Load backup data
            with open(backup_file, 'r') as f:
                backup_data = json.load(f)
            
            metadata = backup_data.get('backup_metadata', {})
            table_data = backup_data.get('table_data', {})
            
            self.logger.info(f"Backup created: {metadata.get('created_at')}")
            self.logger.info(f"Total tables in backup: {metadata.get('total_tables')}")
            self.logger.info(f"Backup amplify suffix: {metadata.get('amplify_suffix')}")
            
            if not dry_run:
                self.logger.warning("\n⚠️  LIVE RESTORE MODE - This will OVERWRITE existing data!")
                self.logger.warning("Make sure you understand the impact before proceeding.")
                
                confirm = input("\nProceed with live restore? (yes/no): ")
                if confirm.lower() != 'yes':
                    self.logger.info("Restore cancelled by user")
                    return
            
            # Get current Amplify tables
            response = self.client.list_tables()
            current_tables = response['TableNames']
            current_amplify_tables = [t for t in current_tables if t.endswith(self.amplify_suffix)]
            
            total_restored_tables = 0
            total_restored_records = 0
            
            for table_name, data in table_data.items():
                try:
                    if 'error' in data:
                        self.logger.warning(f"Skipping table {table_name} (had backup error): {data['error']}")
                        continue
                    
                    if table_name not in current_amplify_tables:
                        self.logger.warning(f"Target table {table_name} doesn't exist in current environment")
                        continue
                    
                    items = data.get('items', [])
                    record_count = len(items)
                    
                    self.logger.info(f"\nRestoring table: {table_name}")
                    self.logger.info(f"  Records to restore: {record_count}")
                    
                    if not dry_run and items:
                        table = self.dynamodb.Table(table_name)
                        
                        # Optional: Clear existing data first
                        clear_existing = input(f"Clear existing data in {table_name} first? (y/n): ").strip().lower()
                        if clear_existing == 'y':
                            self.logger.info(f"Clearing existing data in {table_name}...")
                            existing_response = table.scan()
                            existing_items = existing_response.get('Items', [])
                            
                            for existing_item in existing_items:
                                table.delete_item(Key={'id': existing_item['id']})
                            
                            self.logger.info(f"Cleared {len(existing_items)} existing records")
                        
                        # Restore items in batches
                        batch_size = 25
                        restored_count = 0
                        
                        for i in range(0, len(items), batch_size):
                            batch = items[i:i + batch_size]
                            
                            with table.batch_writer() as batch_writer:
                                for item in batch:
                                    try:
                                        # Convert string numbers back to proper types where needed
                                        cleaned_item = self.clean_restored_item(item)
                                        batch_writer.put_item(Item=cleaned_item)
                                        restored_count += 1
                                    except Exception as e:
                                        self.logger.error(f"Error restoring item {item.get('id')}: {str(e)}")
                            
                            self.logger.info(f"  Restored {min(i + batch_size, len(items))}/{len(items)} records")
                        
                        total_restored_records += restored_count
                        self.logger.info(f"Successfully restored {restored_count}/{record_count} records")
                    
                    elif dry_run:
                        self.logger.info(f"[DRY RUN] Would restore {record_count} records")
                        total_restored_records += record_count
                    
                    total_restored_tables += 1
                    
                except Exception as e:
                    self.logger.error(f"Error restoring table {table_name}: {str(e)}")
            
            # Summary
            self.logger.info("\n" + "=" * 60)
            self.logger.info("RESTORE SUMMARY")
            self.logger.info("=" * 60)
            self.logger.info(f"Tables restored: {total_restored_tables}")
            self.logger.info(f"Records restored: {total_restored_records}")
            
            if not dry_run:
                self.logger.info("\n✅ Restore complete! Your Amplify tables have been restored from backup.")
            
        except Exception as e:
            self.logger.error(f"Restore failed: {str(e)}")
            raise

    def clean_restored_item(self, item: dict) -> dict:
        """Clean up restored item data types for DynamoDB compatibility."""
        cleaned_item = {}
        
        for key, value in item.items():
            if isinstance(value, str):
                # Try to convert string numbers back to Decimal for fields that should be numeric
                if key in ['order', 'paymentAmount', 'sizeSqft', 'originalValue', 'listingPrice', 
                          'salePrice', 'boostPrice', 'addedValue', 'accountExecutive']:
                    try:
                        if '.' in value:
                            from decimal import Decimal
                            cleaned_item[key] = Decimal(value)
                        else:
                            cleaned_item[key] = int(value) if value.isdigit() else value
                    except (ValueError, TypeError):
                        cleaned_item[key] = value
                else:
                    cleaned_item[key] = value
            else:
                cleaned_item[key] = value
        
        return cleaned_item

    def fix_datetime_fields(self):
        """Fix DateTime fields in all Amplify tables by calling the Node.js script."""
        try:
            self.logger.info("=" * 60)
            self.logger.info("FIXING DATETIME FIELDS")
            self.logger.info("=" * 60)
            self.logger.info("This will convert all date fields to proper ISO 8601 format")
            self.logger.info("and add missing createdAt/updatedAt fields for Amplify compatibility.")
            
            # Check if the datetime fix script exists
            script_path = "scripts/fix_datetime_formats.mjs"
            if not os.path.exists(script_path):
                self.logger.error(f"DateTime fix script not found: {script_path}")
                self.logger.error("Please ensure the script exists before running this option.")
                return False
            
            self.logger.info(f"Running Node.js script: {script_path}")
            self.logger.info("This may take a few minutes for large datasets...")
            
            # Run the Node.js script
            try:
                result = subprocess.run(
                    ['node', script_path],
                    capture_output=True,
                    text=True,
                    timeout=600  # 10 minute timeout
                )
                
                if result.returncode == 0:
                    # Success - show the output
                    self.logger.info("✅ DateTime fix completed successfully!")
                    self.logger.info("\nScript output:")
                    for line in result.stdout.split('\n'):
                        if line.strip():
                            self.logger.info(f"   {line}")
                    
                    if result.stderr:
                        self.logger.warning("Script warnings:")
                        for line in result.stderr.split('\n'):
                            if line.strip():
                                self.logger.warning(f"   {line}")
                    
                    return True
                else:
                    # Error occurred
                    self.logger.error(f"❌ DateTime fix failed with exit code: {result.returncode}")
                    self.logger.error("Script stdout:")
                    for line in result.stdout.split('\n'):
                        if line.strip():
                            self.logger.error(f"   {line}")
                    self.logger.error("Script stderr:")
                    for line in result.stderr.split('\n'):
                        if line.strip():
                            self.logger.error(f"   {line}")
                    
                    return False
                    
            except subprocess.TimeoutExpired:
                self.logger.error("❌ DateTime fix script timed out after 10 minutes")
                return False
            except FileNotFoundError:
                self.logger.error("❌ Node.js not found. Please ensure Node.js is installed and in PATH")
                return False
            except Exception as e:
                self.logger.error(f"❌ Error running datetime fix script: {str(e)}")
                return False
                
        except Exception as e:
            self.logger.error(f"DateTime fix failed: {str(e)}")
            return False

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
        print("5. Convert Wix URLs in existing migrated data")
        print("6. Convert Wix documents to public URLs with filename")
        print("7. Sync data from sandbox to main/production tables")
        print("8. 🛡️  Create backup of Amplify tables")
        print("9. 🔄 Restore from backup")
        print("10. 📅 Fix DateTime fields (required after data restore)")
        print("11. Exit")
        print("="*60)
        
        choice = input("Select option (1-11): ").strip()
        
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
            print("\nConverting Wix URLs in existing migrated data...")
            print("Target fields: Projects.gallery, ProjectComments.files, Quotes.documents")
            dry_run_choice = input("Run dry-run first? (y/n): ").strip().lower()
            
            if dry_run_choice == 'y':
                migrator.convert_existing_wix_urls(dry_run=True)
            else:
                migrator.convert_existing_wix_urls(dry_run=False)
        
        elif choice == '6':
            print("\nConverting Wix documents to public URLs with filenames...")
            print("Target fields: eSignatureDocuments.signedDocument, Projects.documents, etc.")
            dry_run_choice = input("Run dry-run first? (y/n): ").strip().lower()
            
            if dry_run_choice == 'y':
                migrator.convert_existing_wix_documents(dry_run=True)
            else:
                migrator.convert_existing_wix_documents(dry_run=False)
        
        elif choice == '7':
            print("\nSyncing data from sandbox to main/production tables...")
            print("This will copy data from sandbox (*-ukgxireroncqrdrirvf222rkai-NONE) to main tables")
            
            # Get main table suffix from user
            main_suffix = input("Enter main/production table suffix (or 'auto' to detect): ").strip()
            
            dry_run_choice = input("Run dry-run first? (y/n): ").strip().lower()
            
            if dry_run_choice == 'y':
                migrator.sync_sandbox_to_main(main_suffix, dry_run=True)
            else:
                migrator.sync_sandbox_to_main(main_suffix, dry_run=False)
        
        elif choice == '8':
            print("\n🛡️  Creating backup of Amplify tables...")
            backup_name = input("Enter backup name (or press Enter for auto-generated): ").strip()
            backup_name = backup_name if backup_name else None
            
            try:
                backup_file = migrator.create_amplify_backup(backup_name)
                print(f"\n✅ Backup created successfully: {backup_file}")
                print("💡 Tip: Create backups before schema changes to avoid data loss!")
            except Exception as e:
                print(f"❌ Backup failed: {str(e)}")
        
        elif choice == '9':
            print("\n🔄 Restoring from backup...")
            
            # List available backups
            backups = migrator.list_available_backups()
            if not backups:
                print("No backup files found in ./backups/ directory")
                continue
            
            print("\nAvailable backups:")
            for i, backup in enumerate(backups, 1):
                print(f"{i}. {backup['filename']}")
                print(f"   Created: {backup['created'].strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"   Size: {backup['size_mb']:.2f} MB")
            
            try:
                backup_choice = int(input(f"\nSelect backup to restore (1-{len(backups)}): ")) - 1
                if 0 <= backup_choice < len(backups):
                    selected_backup = backups[backup_choice]
                    
                    dry_run_choice = input("Run dry-run first? (y/n): ").strip().lower()
                    
                    if dry_run_choice == 'y':
                        migrator.restore_from_backup(selected_backup['path'], dry_run=True)
                    else:
                        migrator.restore_from_backup(selected_backup['path'], dry_run=False)
                else:
                    print("Invalid backup selection")
            except (ValueError, IndexError):
                print("Invalid input. Please enter a number.")
        
        elif choice == '10':
            print("\n📅 Fixing DateTime fields...")
            print("This will convert all date fields to proper ISO 8601 format")
            print("and add missing createdAt/updatedAt fields for Amplify compatibility.")
            print("\n💡 This is typically needed after:")
            print("   - Data restore from backup")
            print("   - Initial migration from legacy tables")
            print("   - Any time projects/data don't appear correctly")
            
            confirm = input("\nProceed with DateTime field fix? (y/n): ").strip().lower()
            if confirm == 'y':
                success = migrator.fix_datetime_fields()
                if success:
                    print("\n✅ DateTime fields fixed successfully!")
                    print("💡 Your projects and data should now appear correctly.")
                else:
                    print("\n❌ DateTime fix failed. Check the logs above for details.")
            else:
                print("DateTime fix cancelled.")
        
        elif choice == '11':
            print("Exiting...")
            break
        
        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    main()
