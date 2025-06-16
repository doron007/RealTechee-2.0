#!/usr/bin/env python3
"""
Test AWS connection and DynamoDB access
"""
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
import sys

def test_aws_connection():
    """Test AWS credentials and DynamoDB access"""
    print("Testing AWS connection...")
    
    try:
        # Try to create DynamoDB client
        dynamodb = boto3.client('dynamodb', region_name='us-west-1')
        print("✅ DynamoDB client created successfully")
        
        # Try to list tables (this will fail if no credentials)
        response = dynamodb.list_tables()
        print(f"✅ DynamoDB connection successful. Found {len(response.get('TableNames', []))} existing tables.")
        
        if response.get('TableNames'):
            print("Existing tables:")
            for table in response['TableNames'][:5]:  # Show first 5 tables
                print(f"  - {table}")
        
        return True
        
    except NoCredentialsError:
        print("❌ No AWS credentials found.")
        print("Please configure AWS credentials using one of these methods:")
        print("1. AWS CLI: aws configure")
        print("2. Environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY")
        print("3. IAM roles (if running on EC2)")
        return False
        
    except ClientError as e:
        print(f"❌ AWS ClientError: {e}")
        print("Check your AWS credentials and permissions.")
        return False
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = test_aws_connection()
    sys.exit(0 if success else 1)
