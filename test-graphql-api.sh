#!/bin/bash

# GraphQL API Testing Script for RealTechee 2.0
# AppSync Endpoint and API Key from amplify_outputs.json

ENDPOINT="https://6dll3lrn2fhxdilg4b54pjoaeu.appsync-api.us-west-1.amazonaws.com/graphql"
API_KEY="da2-lrosef5ukff73bwl4zagpdbfre"

echo "Testing GraphQL API directly..."
echo "Endpoint: $ENDPOINT"
echo "=========================================="

# Test 1: Get project milestones for project "68"
echo "1. Testing ProjectMilestones for projectId='68':"
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "query": "query ListProjectMilestones { listProjectMilestones(filter: { projectId: { eq: \"68\" } }) { items { id projectId name description order isComplete } } }"
  }' \
  "$ENDPOINT" | jq '.'

echo -e "\n=========================================="

# Test 2: Get project payment terms for project "68"
echo "2. Testing ProjectPaymentTerms for projectID='68':"
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "query": "query ListProjectPaymentTerms { listProjectPaymentTerms(filter: { projectID: { eq: \"68\" } }) { items { id projectID paymentName paymentAmount order paid } } }"
  }' \
  "$ENDPOINT" | jq '.'

echo -e "\n=========================================="

# Test 3: Get project comments for project "68"
echo "3. Testing ProjectComments for projectId='68':"
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "query": "query ListProjectComments { listProjectComments(filter: { projectId: { eq: \"68\" } }) { items { id projectId nickname comment files createdDate } } }"
  }' \
  "$ENDPOINT" | jq '.'

echo -e "\n=========================================="

# Test 4: Get all milestones (first 20) to see what data exists
echo "4. Testing all ProjectMilestones (first 20 records):"
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "query": "query ListProjectMilestones { listProjectMilestones(limit: 20) { items { id projectId name } } }"
  }' \
  "$ENDPOINT" | jq '.'

echo -e "\n=========================================="

# Test 5: Get all payment terms (first 20) to see what data exists
echo "5. Testing all ProjectPaymentTerms (first 20 records):"
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "query": "query ListProjectPaymentTerms { listProjectPaymentTerms(limit: 20) { items { id projectID paymentName } } }"
  }' \
  "$ENDPOINT" | jq '.'

echo -e "\n=========================================="

# Test 6: Get all comments (first 20) to see what data exists
echo "6. Testing all ProjectComments (first 20 records):"
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "query": "query ListProjectComments { listProjectComments(limit: 20) { items { id projectId nickname } } }"
  }' \
  "$ENDPOINT" | jq '.'

echo -e "\n=========================================="
echo "Testing complete!"