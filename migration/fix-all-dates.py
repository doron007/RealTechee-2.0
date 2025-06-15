#!/usr/bin/env python3
"""
Comprehensive Date Format Fixer for All RealTechee Sandbox Tables
Scans all sandbox tables for invalid date formats and converts them to proper ISO 8601 format
with Pacific timezone handling.
"""

import boto3
import json
import re
from datetime import datetime
from dateutil import parser
import pytz
from decimal import Decimal
import time

class ComprehensiveDateFixer:
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb', region_name='us-west-1')
        self.pacific_tz = pytz.timezone('US/Pacific')
        self.sandbox_postfix = 'ukgxireroncqrdrirvf222rkai-NONE'
        
        # All possible date fields across all models
        self.date_fields = [
            'createdDate', 'updatedDate', 'assignedDate', 'requestDate', 
            'visitReviewDate', 'proposalDate', 'contractDate', 'escrowDate',
            'estimatedClosingDate', 'closingDate', 'revSharePayDate', 
            'underwritingDate', 'escrowPaymentDate', 'boosterCompletionDate',
            'invoiceDate', 'quoteSentDate', 'quoteOpenedDate', 'quoteSignedDate',
            'contractingStartDate', 'contractSentDate', 'archivedDate',
            'operationManagerApprovedDate', 'sentDate', 'openedDate', 
            'signedDate', 'underwritingApprovedDate', 'contractSignedDate', 
            'convertedDate', 'expiredDate', 'rejectedDate', 
            'requestedVisitDateTime', 'visitDate', 'moveToQuotingDate'
        ]
        
        # Get all sandbox table names
        self.get_sandbox_tables()
        
    def get_sandbox_tables(self):
        """Get all sandbox table names"""
        try:
            dynamodb_client = boto3.client('dynamodb', region_name='us-west-1')
            response = dynamodb_client.list_tables()
            
            all_tables = response.get('TableNames', [])
            
            # Filter for sandbox tables
            self.table_names = [table for table in all_tables if self.sandbox_postfix in table]
            
            print(f"Found {len(self.table_names)} sandbox tables to process")
                
        except Exception as e:
            print(f"Error listing tables: {e}")
            self.table_names = []
    
    def is_invalid_date_format(self, value):
        """Check if a value is an invalid date format"""
        if not isinstance(value, str):
            return False
            
        # Check for common invalid patterns
        invalid_patterns = [
            r'^\d{1,2}/\d{1,2}/\d{2,4}$',  # MM/DD/YY or MM/DD/YYYY
            r'^\d{1,2}-\d{1,2}-\d{2,4}$',  # MM-DD-YY or MM-DD-YYYY
            r'^\d{4}-\d{1,2}-\d{1,2}$',    # YYYY-M-D (without proper padding)
            r'^\d{4}-\d{1,2}-\d{1,2} \d{1,2}:\d{2}:\d{2}$',  # YYYY-M-D H:M:S
        ]
        
        for pattern in invalid_patterns:
            if re.match(pattern, value.strip()):
                return True
                
        # Check if it's already a valid ISO format
        try:
            # If it parses as ISO and contains 'T', it's probably already good
            if 'T' in value and (value.endswith('Z') or '+' in value[-6:] or '-' in value[-6:]):
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
                
            elif re.match(r'^\d{1,2}-\d{1,2}-\d{2,4}$', date_string):  # MM-DD-YY or MM-DD-YYYY
                parts = date_string.split('-')
                year = int(parts[2])
                if len(parts[2]) == 2:
                    if year <= 30:
                        year += 2000
                    else:
                        year += 1900
                dt = datetime(year, int(parts[0]), int(parts[1]))
                
            else:
                # Try to parse with dateutil
                dt = parser.parse(date_string)
            
            # Localize to Pacific timezone if no timezone info
            if dt.tzinfo is None:
                dt = self.pacific_tz.localize(dt)
            else:
                dt = dt.astimezone(self.pacific_tz)
            
            # Convert to UTC for storage (DynamoDB best practice)
            dt_utc = dt.astimezone(pytz.UTC)
            
            return dt_utc.isoformat()
            
        except Exception as e:
            print(f"    ❌ Failed to parse date '{date_string}': {e}")
            return None
    
    def scan_table_for_date_issues(self, table_name):
        """Scan a table for date format issues"""
        print(f"\n🔍 Scanning table: {table_name.replace('-' + self.sandbox_postfix, '')}")
        
        try:
            table = self.dynamodb.Table(table_name)
            
            invalid_items = []
            total_items = 0
            
            # Scan the table in batches
            last_evaluated_key = None
            
            while True:
                if last_evaluated_key:
                    response = table.scan(ExclusiveStartKey=last_evaluated_key)
                else:
                    response = table.scan()
                
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
                            'table': table_name,
                            'issues': item_issues
                        })
                
                # Check if there are more items to scan
                last_evaluated_key = response.get('LastEvaluatedKey')
                if not last_evaluated_key:
                    break
                    
                # Add small delay to avoid throttling
                time.sleep(0.1)
            
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
            print(f"      ❌ Failed to update item {item_id}: {e}")
            return False
    
    def fix_all_dates(self):
        """Scan all tables and fix date format issues"""
        print("🚀 Starting comprehensive date format fix for all sandbox tables...")
        print("="*70)
        
        total_tables_processed = 0
        total_items_fixed = 0
        total_errors = 0
        all_issues = []
        
        # First pass: Scan all tables for issues
        for table_name in self.table_names:
            invalid_items = self.scan_table_for_date_issues(table_name)
            all_issues.extend(invalid_items)
            total_tables_processed += 1
        
        print(f"\n" + "="*70)
        print(f"📈 SCAN COMPLETE:")
        print(f"  Tables processed: {total_tables_processed}")
        print(f"  Total items needing fixes: {len(all_issues)}")
        
        if not all_issues:
            print(f"  ✅ No date format issues found across all tables!")
            return 0, 0
        
        # Show summary of what will be fixed
        print(f"\n📋 ISSUES SUMMARY:")
        table_summary = {}
        for issue in all_issues:
            table_simple = issue['table'].replace('-' + self.sandbox_postfix, '')
            if table_simple not in table_summary:
                table_summary[table_simple] = 0
            table_summary[table_simple] += 1
        
        for table, count in sorted(table_summary.items()):
            print(f"  {table}: {count} items")
        
        # Ask for confirmation
        print(f"\n❓ Found {len(all_issues)} items with date format issues.")
        print("   Examples of conversions:")
        for i, issue in enumerate(all_issues[:3]):  # Show first 3 examples
            print(f"     {i+1}. {issue['table'].replace('-' + self.sandbox_postfix, '')} item {issue['id'][:8]}:")
            for field, fix_data in issue['issues'].items():
                print(f"        {field}: '{fix_data['original']}' → '{fix_data['converted']}'")
        
        if len(all_issues) > 3:
            print(f"     ... and {len(all_issues) - 3} more items")
        
        print(f"\n🔧 Ready to apply fixes to {len(all_issues)} items across {len(table_summary)} tables.")
        confirm = input("   Proceed with fixes? (y/n): ").lower().strip()
        
        if confirm != 'y':
            print("✋ Fixes cancelled by user.")
            return 0, 0
        
        # Second pass: Apply fixes
        print(f"\n🔧 APPLYING FIXES...")
        print("="*70)
        
        for i, issue in enumerate(all_issues, 1):
            item_id = issue['id']
            table_name = issue['table']
            date_fixes = issue['issues']
            
            table_simple = table_name.replace('-' + self.sandbox_postfix, '')
            print(f"  [{i}/{len(all_issues)}] Fixing {table_simple} item {item_id[:8]}...")
            
            if self.fix_item_dates(table_name, item_id, date_fixes):
                total_items_fixed += 1
                print(f"    ✅ Success ({len(date_fixes)} fields updated)")
            else:
                total_errors += 1
                print(f"    ❌ Failed")
            
            # Add small delay to avoid throttling
            if i % 10 == 0:
                time.sleep(0.5)
        
        print(f"\n" + "="*70)
        print(f"🎉 DATE FORMAT FIX COMPLETE!")
        print(f"  ✅ Items fixed: {total_items_fixed}")
        print(f"  ❌ Errors: {total_errors}")
        print(f"  📊 Success rate: {(total_items_fixed/(total_items_fixed+total_errors)*100):.1f}%")
        
        return total_items_fixed, total_errors

if __name__ == "__main__":
    fixer = ComprehensiveDateFixer()
    fixer.fix_all_dates()