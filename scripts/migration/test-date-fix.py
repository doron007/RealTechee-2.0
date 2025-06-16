#!/usr/bin/env python3
"""
Date Format Test & Fix for RealTechee Sandbox
Tests date fixing on Affiliates table first, then applies to all tables if successful.
"""

import boto3
import json
import re
from datetime import datetime
from dateutil import parser
import pytz
from decimal import Decimal

class DateFormatTester:
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
            for table in self.table_names:
                print(f"  - {table}")
                
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
    
    def test_affiliates_table(self):
        """Test date fixing on Affiliates table only"""
        table_name = f"Affiliates-{self.sandbox_postfix}"
        print(f"🧪 Testing date fixes on {table_name}...")
        
        try:
            table = self.dynamodb.Table(table_name)
            
            # Scan first 10 items for testing
            response = table.scan(Limit=10)
            items = response.get('Items', [])
            
            print(f"  📊 Testing {len(items)} items from Affiliates table")
            
            issues_found = []
            
            for item in items:
                item_issues = {}
                item_id = item.get('id', 'unknown')
                
                # Check each possible date field
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
                                print(f"    🔧 {item_id}.{field}: '{value}' → '{converted}'")
                
                if item_issues:
                    issues_found.append({
                        'id': item_id,
                        'table': table_name,
                        'issues': item_issues
                    })
            
            print(f"  📈 Found {len(issues_found)} items with date issues")
            
            if not issues_found:
                print("  ✅ No date issues found in Affiliates table!")
                return True, []
            
            # Ask user confirmation before making changes
            print(f"\n❓ Found {len(issues_found)} items with date format issues.")
            print("   Would you like to fix these issues? (y/n): ", end="")
            
            # For now, let's just return the findings without user input
            return True, issues_found
            
        except Exception as e:
            print(f"  ❌ Error testing Affiliates table: {e}")
            return False, []
    
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
    
    def apply_fixes(self, issues_found):
        """Apply the fixes found during testing"""
        print(f"\n🔧 Applying fixes to {len(issues_found)} items...")
        
        fixed_count = 0
        error_count = 0
        
        for item in issues_found:
            item_id = item['id']
            table_name = item['table']
            date_fixes = item['issues']
            
            print(f"  📝 Fixing {item_id}...")
            
            if self.fix_item_dates(table_name, item_id, date_fixes):
                fixed_count += 1
                print(f"    ✅ Success")
            else:
                error_count += 1
                print(f"    ❌ Failed")
        
        return fixed_count, error_count

if __name__ == "__main__":
    tester = DateFormatTester()
    
    # Test on Affiliates table first
    success, issues = tester.test_affiliates_table()
    
    if success and issues:
        print(f"\n🎯 Test completed successfully!")
        print(f"Found {len(issues)} items that need date format fixes.")
        print("\nNext steps:")
        print("1. Review the conversion examples above")
        print("2. If conversions look correct, run the full fix")
        print("3. Test that GraphQL queries still work correctly")
        
        # Optionally apply fixes automatically (you can enable this)
        apply_fixes = input("\n❓ Apply these fixes now? (y/n): ").lower().strip() == 'y'
        
        if apply_fixes:
            fixed, errors = tester.apply_fixes(issues)
            print(f"\n✅ Applied fixes: {fixed} successful, {errors} errors")
        else:
            print("✋ Fixes not applied. Run the script again when ready.")
    
    elif success and not issues:
        print("\n✅ No date format issues found in Affiliates table!")
        print("Your date fields are already properly formatted.")
    
    else:
        print("\n❌ Test failed. Check the error messages above.")