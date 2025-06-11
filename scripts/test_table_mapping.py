#!/usr/bin/env python3
"""
Simple test script to check DynamoDB table mappings
"""

import boto3
import json

def get_table_mapping():
    """Get mapping of original tables to Amplify tables."""
    try:
        client = boto3.client('dynamodb', region_name='us-west-1')
        
        # Get all table names
        response = client.list_tables()
        all_tables = response['TableNames']
        
        amplify_suffix = "-equsgef6fbgdhd4pnzv3xbivmm-NONE"
        
        original_tables = [t for t in all_tables if t.startswith('RealTechee-')]
        amplify_tables = [t for t in all_tables if t.endswith(amplify_suffix)]
        
        print(f"Found {len(original_tables)} original tables:")
        for table in sorted(original_tables):
            print(f"  {table}")
        
        print(f"\nFound {len(amplify_tables)} Amplify tables:")
        for table in sorted(amplify_tables):
            print(f"  {table}")
        
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
        
        print(f"\nFound {len(mapping)} table mappings:")
        for orig, amp in sorted(mapping.items()):
            print(f"  {orig} → {amp}")
        
        return mapping
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {}

if __name__ == "__main__":
    print("DynamoDB Table Mapping Analysis")
    print("=" * 50)
    
    mappings = get_table_mapping()
    
    if mappings:
        print(f"\nSuccess! Found {len(mappings)} table pairs ready for migration.")
    else:
        print("\nNo mappings found or error occurred.")
