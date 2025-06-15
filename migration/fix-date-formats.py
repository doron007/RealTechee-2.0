#!/usr/bin/env python3
"""
Date Format Fixer for RealTechee Database
Scans all DynamoDB tables for invalid date formats and converts them to proper ISO 8601 format
with Pacific timezone handling.
"""

import boto3
import json
import re
from datetime import datetime
from dateutil import parser
import pytz
from decimal import Decimal

class DateFormatFixer:
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb', region_name='us-west-1')
        self.pacific_tz = pytz.timezone('US/Pacific')
        self.date_fields = [
            'createdDate', 'updatedDate', 'assignedDate', 'requestDate', 
            'visitReviewDate', 'proposalDate', 'contractDate', 'escrowDate',
            'estimatedClosingDate', 'closingDate', 'revSharePayDate', 
            'underwritingDate', 'escrowPaymentDate', 'boosterCompletionDate',
            'invoiceDate', 'quoteSentDate', 'quoteOpenedDate', 'quoteSignedDate',
            'contractingStartDate', 'contractSentDate', 'archivedDate',
            'operationManagerApprovedDate', 'sentDate', 'openedDate', 
            'signedDate', 'underwritingApprovedDate', 'contractingStartDate',
            'contractSentDate', 'contractSignedDate', 'convertedDate', 
            'expiredDate', 'rejectedDate', 'requestedVisitDateTime',
            'visitDate', 'moveToQuotingDate'
        ]
        
        # Get table names from Amplify outputs - they're prefixed with stack name
        with open('amplify_outputs.json', 'r') as f:
            amplify_config = json.load(f)
        
        # Extract model names from GraphQL introspection
        models = amplify_config.get('data', {}).get('model_introspection', {}).get('models', {})
        
        # DynamoDB table names follow pattern: {StackName}-{ModelName}-{RandomId}
        # We need to list actual tables and match them
        self.table_names = []
        
        try:
            # List all DynamoDB tables and filter for our stack
            dynamodb_client = boto3.client('dynamodb', region_name='us-west-1')
            response = dynamodb_client.list_tables()
            
            all_tables = response.get('TableNames', [])
            
            # Filter for tables that match our model names
            for table_name in all_tables:
                for model_name in models.keys():
                    if model_name in table_name and 'amplify-realtecheeclone-doron-sandbox' in table_name:
                        self.table_names.append(table_name)
                        break
            
        except Exception as e:
            print(f"Error listing tables: {e}")
            # Fallback - use the models directly (this might not work for scanning)
            self.table_names = list(models.keys())
        
        print(f"Found {len(self.table_names)} tables to process")
        
    def is_invalid_date_format(self, value):
        """Check if a value is an invalid date format"""
        if not isinstance(value, str):
            return False
            
        # Check for common invalid patterns
        invalid_patterns = [
            r'^\d{1,2}/\d{1,2}/\d{2,4}$',  # MM/DD/YY or MM/DD/YYYY
            r'^\d{1,2}-\d{1,2}-\d{2,4}$',  # MM-DD-YY or MM-DD-YYYY
            r'^\d{4}-\d{1,2}-\d{1,2}$',    # YYYY-M-D (without proper padding)
        ]
        
        for pattern in invalid_patterns:
            if re.match(pattern, value.strip()):
                return True
                
        # Check if it's already a valid ISO format
        try:
            # If it parses as ISO and contains 'T', it's probably already good
            if 'T' in value and value.endswith('Z'):
                parser.parse(value)
                return False
        except:
            pass
            
        return True
    
    def convert_to_iso_pacific(self, date_string):
        """Convert date string to ISO 8601 format in Pacific timezone"""
        if not date_string or not isinstance(date_string, str):
            return None
            
        date_string = date_string.strip()
        
        try:
            # Try to parse various formats
            if re.match(r'^\d{1,2}/\d{1,2}/\d{2}$', date_string):  # MM/DD/YY
                # Assume years 00-30 are 2000s, 31-99 are 1900s
                parts = date_string.split('/')
                year = int(parts[2])
                if year <= 30:
                    year += 2000
                else:
                    year += 1900
                dt = datetime(year, int(parts[0]), int(parts[1]))
                
            elif re.match(r'^\d{1,2}/\d{1,2}/\d{4}$', date_string):  # MM/DD/YYYY
                parts = date_string.split('/')
                dt = datetime(int(parts[2]), int(parts[0]), int(parts[1]))
                
            else:
                # Try to parse with dateutil
                dt = parser.parse(date_string)
            
            # Localize to Pacific timezone
            if dt.tzinfo is None:
                dt = self.pacific_tz.localize(dt)
            else:
                dt = dt.astimezone(self.pacific_tz)
            
            # Convert to UTC for storage (DynamoDB best practice)
            dt_utc = dt.astimezone(pytz.UTC)
            
            return dt_utc.isoformat()
            
        except Exception as e:
            print(f"  ❌ Failed to parse date '{date_string}': {e}")
            return None
    
    def scan_table_for_date_issues(self, table_name):
        """Scan a table for date format issues"""
        print(f"\n🔍 Scanning table: {table_name}")
        
        try:
            table = self.dynamodb.Table(table_name)
            
            invalid_items = []
            total_items = 0
            
            # Scan the table
            response = table.scan()
            
            while True:
                items = response.get('Items', [])
                total_items += len(items)
                
                for item in items:
                    item_issues = {}
                    
                    # Check each date field
                    for field in self.date_fields:
                        if field in item:
                            value = item[field]
                            if self.is_invalid_date_format(value):
                                converted = self.convert_to_iso_pacific(value)
                                if converted:
                                    item_issues[field] = {
                                        'original': value,
                                        'converted': converted
                                    }
                    
                    if item_issues:
                        invalid_items.append({
                            'id': item.get('id', 'unknown'),
                            'issues': item_issues
                        })
                
                # Check if there are more items to scan
                if 'LastEvaluatedKey' not in response:
                    break
                    
                response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            
            print(f"  📊 Scanned {total_items} items, found {len(invalid_items)} with date issues")
            return invalid_items
            
        except Exception as e:
            print(f"  ❌ Error scanning table {table_name}: {e}")
            return []
    
    def fix_item_dates(self, table_name, item_id, date_fixes):
        """Fix date formats for a specific item"""
        try:
            table = self.dynamodb.Table(table_name)
            
            # Build update expression
            update_expression = "SET "
            expression_values = {}
            expression_names = {}
            
            for field, fix_data in date_fixes.items():
                # Use expression attribute names to handle reserved words
                attr_name = f"#{field}"
                value_name = f":{field}"
                
                update_expression += f"{attr_name} = {value_name}, "
                expression_names[attr_name] = field
                expression_values[value_name] = fix_data['converted']
            
            # Remove trailing comma and space
            update_expression = update_expression.rstrip(', ')
            
            # Update the item
            table.update_item(
                Key={'id': item_id},
                UpdateExpression=update_expression,
                ExpressionAttributeNames=expression_names,
                ExpressionAttributeValues=expression_values
            )
            
            return True
            
        except Exception as e:
            print(f"    ❌ Failed to update item {item_id}: {e}")
            return False
    
    def fix_all_dates(self):
        """Scan all tables and fix date format issues"""
        print("🚀 Starting comprehensive date format fix...")
        
        total_fixed = 0
        total_errors = 0
        
        for table_name in self.table_names:
            print(f"\n" + "="*50)
            invalid_items = self.scan_table_for_date_issues(table_name)
            
            if not invalid_items:
                print(f"  ✅ No date issues found in {table_name}")
                continue
            
            print(f"  🔧 Fixing {len(invalid_items)} items in {table_name}...")
            
            for item in invalid_items:
                item_id = item['id']
                date_fixes = item['issues']
                
                print(f"    📝 Fixing item {item_id}:")
                for field, fix_data in date_fixes.items():
                    print(f"      {field}: '{fix_data['original']}' → '{fix_data['converted']}'")
                
                if self.fix_item_dates(table_name, item_id, date_fixes):
                    total_fixed += 1
                    print(f"    ✅ Fixed item {item_id}")
                else:
                    total_errors += 1
                    print(f"    ❌ Failed to fix item {item_id}")
        
        print(f"\n" + "="*50)
        print(f"🎉 Date format fix complete!")
        print(f"  ✅ Fixed: {total_fixed} items")
        print(f"  ❌ Errors: {total_errors} items")
        
        return total_fixed, total_errors

if __name__ == "__main__":
    fixer = DateFormatFixer()
    fixer.fix_all_dates()