#!/usr/bin/env python3
"""
DynamoDB Table Renaming Script
Renames tables to remove hyphens/underscores for CloudFormation compatibility
"""

import boto3
import json
import time
from datetime import datetime

class DynamoDBTableRenamer:
    def __init__(self, region='us-west-1'):
        self.dynamodb = boto3.client('dynamodb', region_name=region)
        self.region = region
        
    def get_table_info(self, table_name):
        """Get complete table information for recreation"""
        try:
            response = self.dynamodb.describe_table(TableName=table_name)
            return response['Table']
        except Exception as e:
            print(f"❌ Error describing table {table_name}: {e}")
            return None
    
    def scan_all_items(self, table_name):
        """Scan all items from the source table"""
        items = []
        try:
            paginator = self.dynamodb.get_paginator('scan')
            for page in paginator.paginate(TableName=table_name):
                items.extend(page.get('Items', []))
            return items
        except Exception as e:
            print(f"❌ Error scanning table {table_name}: {e}")
            return []
    
    def create_new_table(self, old_table_info, new_table_name):
        """Create new table with clean name"""
        try:
            # Extract necessary parameters
            create_params = {
                'TableName': new_table_name,
                'KeySchema': old_table_info['KeySchema'],
                'AttributeDefinitions': old_table_info['AttributeDefinitions'],
                'BillingMode': old_table_info.get('BillingMode', 'PAY_PER_REQUEST')
            }
            
            # Add provisioned throughput if needed
            if 'ProvisionedThroughput' in old_table_info:
                # Ensure minimum values for RCU and WCU
                rcu = max(1, old_table_info['ProvisionedThroughput']['ReadCapacityUnits'])
                wcu = max(1, old_table_info['ProvisionedThroughput']['WriteCapacityUnits'])
                create_params['ProvisionedThroughput'] = {
                    'ReadCapacityUnits': rcu,
                    'WriteCapacityUnits': wcu
                }
                create_params['BillingMode'] = 'PROVISIONED'
            
            # Add GSIs if they exist
            if 'GlobalSecondaryIndexes' in old_table_info:
                create_params['GlobalSecondaryIndexes'] = []
                for gsi in old_table_info['GlobalSecondaryIndexes']:
                    gsi_params = {
                        'IndexName': gsi['IndexName'],
                        'KeySchema': gsi['KeySchema'],
                        'Projection': gsi['Projection']
                    }
                    if 'ProvisionedThroughput' in gsi:
                        gsi_params['ProvisionedThroughput'] = {
                            'ReadCapacityUnits': gsi['ProvisionedThroughput']['ReadCapacityUnits'],
                            'WriteCapacityUnits': gsi['ProvisionedThroughput']['WriteCapacityUnits']
                        }
                    create_params['GlobalSecondaryIndexes'].append(gsi_params)
            
            response = self.dynamodb.create_table(**create_params)
            print(f"✅ Created new table: {new_table_name}")
            return True
            
        except Exception as e:
            print(f"❌ Error creating table {new_table_name}: {e}")
            return False
    
    def wait_for_table_active(self, table_name, max_wait=300):
        """Wait for table to become active"""
        print(f"⏳ Waiting for table {table_name} to become active...")
        start_time = time.time()
        
        while time.time() - start_time < max_wait:
            try:
                response = self.dynamodb.describe_table(TableName=table_name)
                status = response['Table']['TableStatus']
                if status == 'ACTIVE':
                    print(f"✅ Table {table_name} is now active")
                    return True
                print(f"   Status: {status}")
                time.sleep(10)
            except Exception as e:
                print(f"❌ Error checking table status: {e}")
                return False
        
        print(f"❌ Timeout waiting for table {table_name}")
        return False
    
    def batch_write_items(self, table_name, items, batch_size=25):
        """Write items to new table in batches"""
        total_items = len(items)
        if total_items == 0:
            print(f"ℹ️  No items to migrate for {table_name}")
            return True
            
        print(f"📦 Migrating {total_items} items to {table_name}")
        
        for i in range(0, total_items, batch_size):
            batch = items[i:i + batch_size]
            request_items = {
                table_name: [{'PutRequest': {'Item': item}} for item in batch]
            }
            
            try:
                response = self.dynamodb.batch_write_item(RequestItems=request_items)
                
                # Handle unprocessed items
                while response.get('UnprocessedItems'):
                    print(f"🔄 Retrying unprocessed items...")
                    time.sleep(1)
                    response = self.dynamodb.batch_write_item(
                        RequestItems=response['UnprocessedItems']
                    )
                
                print(f"   ✅ Migrated batch {i//batch_size + 1}/{(total_items + batch_size - 1)//batch_size}")
                
            except Exception as e:
                print(f"❌ Error writing batch: {e}")
                return False
        
        print(f"✅ Successfully migrated all {total_items} items")
        return True
    
    def rename_table(self, old_table_name, new_table_name, delete_old=False):
        """Complete table rename process"""
        print(f"\n🔄 Renaming: {old_table_name} → {new_table_name}")
        
        # Step 1: Get old table info
        old_table_info = self.get_table_info(old_table_name)
        if not old_table_info:
            return False
        
        # Step 2: Scan all data
        print("📖 Scanning existing data...")
        items = self.scan_all_items(old_table_name)
        print(f"   Found {len(items)} items")
        
        # Step 3: Create new table
        if not self.create_new_table(old_table_info, new_table_name):
            return False
        
        # Step 4: Wait for new table to be active
        if not self.wait_for_table_active(new_table_name):
            return False
        
        # Step 5: Migrate data
        if not self.batch_write_items(new_table_name, items):
            return False
        
        # Step 6: Verify migration
        print("🔍 Verifying migration...")
        new_items = self.scan_all_items(new_table_name)
        if len(new_items) == len(items):
            print("✅ Migration verified successfully")
            
            # Step 7: Optionally delete old table
            if delete_old:
                self.delete_table(old_table_name)
            else:
                print(f"⚠️  Old table {old_table_name} kept (use --delete-old to remove)")
            
            return True
        else:
            print(f"❌ Migration verification failed: {len(items)} → {len(new_items)}")
            return False

    def delete_table(self, table_name):
        """Delete the old table"""
        try:
            self.dynamodb.delete_table(TableName=table_name)
            print(f"🗑️  Deleted old table: {table_name}")
        except Exception as e:
            print(f"❌ Error deleting table {table_name}: {e}")

def main():
    renamer = DynamoDBTableRenamer()
    
    # Define the rename mappings
    rename_mappings = {
        'RealTechee-BackOffice-AssignTo': 'RealTecheeBackOfficeAssignTo',
        'RealTechee-BackOffice-BookingStatuses': 'RealTecheeBackOfficeBookingStatuses',
        'RealTechee-BackOffice-Brokerage': 'RealTecheeBackOfficeBrokerage',
        'RealTechee-BackOffice-Notifications': 'RealTecheeBackOfficeNotifications',
        'RealTechee-BackOffice-Products': 'RealTecheeBackOfficeProducts',
        'RealTechee-BackOffice-ProjectStatuses': 'RealTecheeBackOfficeProjectStatuses',
        'RealTechee-BackOffice-QuoteStatuses': 'RealTecheeBackOfficeQuoteStatuses',
        'RealTechee-BackOffice-RequestStatuses': 'RealTecheeBackOfficeRequestStatuses',
        'RealTechee-BackOffice-RoleTypes': 'RealTecheeBackOfficeRoleTypes'
    }
    
    print("🚀 DynamoDB Table Renaming Process")
    print("=" * 50)
    
    # Dry run first
    print("\n📋 Planned renames:")
    for old_name, new_name in rename_mappings.items():
        print(f"   {old_name} → {new_name}")
    
    confirm = input("\n❓ Proceed with table renames? (yes/no): ").strip().lower()
    if confirm != 'yes':
        print("❌ Operation cancelled")
        return
    
    # Execute renames
    successful_renames = []
    failed_renames = []
    
    for old_name, new_name in rename_mappings.items():
        if renamer.rename_table(old_name, new_name, delete_old=False):
            successful_renames.append((old_name, new_name))
        else:
            failed_renames.append((old_name, new_name))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 RENAME SUMMARY")
    print("=" * 50)
    
    if successful_renames:
        print(f"✅ Successfully renamed {len(successful_renames)} tables:")
        for old, new in successful_renames:
            print(f"   {old} → {new}")
    
    if failed_renames:
        print(f"\n❌ Failed to rename {len(failed_renames)} tables:")
        for old, new in failed_renames:
            print(f"   {old} → {new}")
    
    if successful_renames and not failed_renames:
        print("\n🎉 All tables renamed successfully!")
        print("\n📝 Next steps:")
        print("1. Update your Amplify schema to use new table names")
        print("2. Deploy your Amplify sandbox")
        print("3. Delete old tables if everything works correctly")

if __name__ == "__main__":
    main()
