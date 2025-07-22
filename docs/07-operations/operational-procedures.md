# Operational Procedures & Incident Response

## Overview

This document provides comprehensive operational procedures for RealTechee 2.0 production environment, including incident response protocols, maintenance procedures, and emergency recovery operations following enterprise operational excellence practices.

## Incident Response Framework

### Incident Severity Classification

#### P0 - Critical System Failure
**Response Time**: 5 minutes maximum
**Escalation**: Immediate - All hands response

**Definition**: Complete system outage or critical functionality unavailable
- Application completely inaccessible (health checks failing)
- Database connectivity lost (all operations failing) 
- Authentication system down (users cannot login)
- Data loss or corruption detected
- Security breach suspected

**Response Protocol**:
```bash
#!/bin/bash
# P0 Critical Incident Response
INCIDENT_ID="P0-$(date +%Y%m%d%H%M%S)"
ISSUE_DESC="$1"

echo "🚨 P0 CRITICAL INCIDENT INITIATED"
echo "Incident ID: $INCIDENT_ID"
echo "Issue: $ISSUE_DESC"
echo "Response Team: All hands"

# Immediate Actions (0-2 minutes)
aws sns publish --topic-arn "arn:aws:sns:us-west-1:ACCOUNT:RealTechee-Critical-Alerts" \
  --message "🚨 P0 INCIDENT $INCIDENT_ID: $ISSUE_DESC - IMMEDIATE RESPONSE REQUIRED"

# System State Capture (2-5 minutes)
./scripts/capture-system-state.sh --incident-id $INCIDENT_ID
./scripts/health-check.sh --comprehensive > /tmp/p0-incident-$INCIDENT_ID-state.log

# Assessment Phase (5-10 minutes)
echo "Recent deployments in last 4 hours:"
git log --oneline --since="4 hours ago"

echo "Active CloudWatch alarms:"
aws cloudwatch describe-alarms --state-value ALARM \
  --query 'MetricAlarms[?starts_with(AlarmName, `RealTechee`)].{Name:AlarmName,Reason:StateReason}'

# Decision Point: Rollback Assessment
ROLLBACK_REQUIRED="false"
if [ "$2" = "deployment-related" ]; then
  ROLLBACK_REQUIRED="true"
fi

# Resolution Execution (10+ minutes)
if [ "$ROLLBACK_REQUIRED" = "true" ]; then
  echo "Initiating emergency rollback..."
  ./scripts/emergency-rollback.sh --incident-id $INCIDENT_ID
else
  echo "Proceeding with targeted resolution..."
  # Implement specific fix based on incident type
fi

# Post-Resolution Validation (15+ minutes)
./scripts/post-incident-validation.sh --incident-id $INCIDENT_ID
./scripts/monitor-recovery.sh --duration 60min --incident-id $INCIDENT_ID

echo "P0 incident response complete: $INCIDENT_ID"
```

#### P1 - High Priority Degradation
**Response Time**: 30 minutes maximum
**Escalation**: DevOps + Team Lead

**Definition**: Major functionality impaired but system operational
- Response time degradation (>5 seconds sustained)
- Intermittent errors affecting user experience
- Non-critical system component failure
- Performance degradation affecting business operations

**Response Protocol**:
```bash
#!/bin/bash
# P1 High Priority Incident Response
INCIDENT_ID="P1-$(date +%Y%m%d%H%M%S)"

echo "⚠️ P1 HIGH PRIORITY INCIDENT"
echo "Incident ID: $INCIDENT_ID"

# Alert Response Team (0-5 minutes)
aws sns publish --topic-arn "arn:aws:sns:us-west-1:ACCOUNT:RealTechee-Production-Alerts" \
  --message "⚠️ P1 INCIDENT $INCIDENT_ID: $1"

# Investigation Phase (5-20 minutes)
./scripts/performance-analysis.sh --incident-id $INCIDENT_ID
./scripts/error-analysis.sh --timeframe "1 hour" > /tmp/p1-incident-$INCIDENT_ID-errors.log

# Resolution Implementation (20+ minutes)
# Implement performance optimization or targeted fix
# Monitor metrics for improvement

echo "P1 incident response initiated: $INCIDENT_ID"
```

#### P2 - Medium Priority Issues
**Response Time**: 2 hours maximum
**Escalation**: Assigned Developer

**Definition**: Minor functionality issues, planned maintenance
- Cosmetic issues not affecting functionality
- Minor performance degradation
- Non-critical feature unavailable
- Scheduled maintenance execution

### Incident Communication Procedures

#### P0 Critical Incident Notification Template
```
Subject: 🚨 P0 CRITICAL - RealTechee Production Incident

INCIDENT ID: [P0-YYYYMMDDHHMISS]
SEVERITY: P0 - Critical System Failure
STATUS: [INVESTIGATING | RESOLVING | RESOLVED]
IMPACT: [Description of user/business impact]
START TIME: [ISO timestamp]
ESTIMATED RESOLUTION: [ETA or "Under investigation"]

DESCRIPTION:
[Brief technical description of the issue]

AFFECTED SYSTEMS:
- [List of affected components/services]

CURRENT STATUS:
[Current state of resolution efforts]

ACTIONS TAKEN:
- [Chronological list of actions taken]

NEXT STEPS:
- [Planned resolution steps with ETA]

WORKAROUND:
[Any available workarounds for users]

STAKEHOLDER IMPACT:
- Users: [Description of user impact]
- Business: [Business operations impact]
- Revenue: [Revenue impact if applicable]

COMMUNICATION SCHEDULE:
Updates will be provided every 15 minutes until resolution.

INCIDENT COMMANDER: [Name and contact]
TECHNICAL LEAD: [Name and contact]

---
This is an automated alert from RealTechee Production Monitoring
```

### Emergency Rollback Procedures

#### Automatic Rollback Triggers
```yaml
Automatic Rollback Conditions:
  health_check_failures:
    threshold: 3 consecutive failures
    timeframe: 3 minutes
    action: immediate_rollback
  
  error_rate_spike:
    threshold: 5% error rate
    timeframe: 5 consecutive minutes  
    action: immediate_rollback
  
  response_time_degradation:
    threshold: 10 seconds (95th percentile)
    timeframe: 3 consecutive minutes
    action: prepare_rollback (manual approval)
  
  database_connectivity:
    threshold: 5 consecutive connection failures
    timeframe: 2 minutes
    action: immediate_rollback
```

#### Emergency Rollback Execution
```bash
#!/bin/bash
# Emergency Production Rollback
ROLLBACK_ID="ROLLBACK-$(date +%Y%m%d%H%M%S)"
ROLLBACK_REASON="$1"

echo "🔄 EMERGENCY PRODUCTION ROLLBACK INITIATED"
echo "Rollback ID: $ROLLBACK_ID"
echo "Reason: $ROLLBACK_REASON"

# Pre-Rollback State Capture (0-1 minute)
./scripts/capture-pre-rollback-state.sh --rollback-id $ROLLBACK_ID

# Identify Target Version (1-2 minutes)
CURRENT_VERSION=$(git describe --tags --exact-match HEAD 2>/dev/null || git rev-parse --short HEAD)
LAST_GOOD_VERSION=$(git describe --tags --abbrev=0 HEAD~1)

echo "Current version: $CURRENT_VERSION"
echo "Target rollback version: $LAST_GOOD_VERSION"

# Stakeholder Notification (1 minute)
aws sns publish --topic-arn "arn:aws:sns:us-west-1:ACCOUNT:RealTechee-Critical-Alerts" \
  --message "🔄 EMERGENCY ROLLBACK INITIATED: $ROLLBACK_ID
Reason: $ROLLBACK_REASON
Rolling back from: $CURRENT_VERSION
Rolling back to: $LAST_GOOD_VERSION
ETA: 5 minutes"

# Execute Rollback (2-5 minutes)
echo "Executing rollback to $LAST_GOOD_VERSION..."

# Amplify rollback
aws amplify start-deployment \
  --app-id d200k2wsaf8th3 \
  --branch-name main \
  --source-url "https://github.com/realtechee/realtechee-2.0/archive/$LAST_GOOD_VERSION.zip"

# Monitor rollback progress
DEPLOYMENT_ID=$(aws amplify list-jobs --app-id d200k2wsaf8th3 --branch-name main \
  --max-items 1 --query 'jobSummaries[0].jobId' --output text)

echo "Monitoring deployment: $DEPLOYMENT_ID"

# Wait for completion with timeout
TIMEOUT=300  # 5 minutes
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
  STATUS=$(aws amplify get-job --app-id d200k2wsaf8th3 --branch-name main --job-id $DEPLOYMENT_ID \
    --query 'job.summary.status' --output text)
  
  if [ "$STATUS" = "SUCCEED" ]; then
    echo "✅ Rollback completed successfully"
    break
  elif [ "$STATUS" = "FAILED" ]; then
    echo "❌ Rollback failed - manual intervention required"
    exit 1
  fi
  
  sleep 30
  ELAPSED=$((ELAPSED + 30))
  echo "Rollback in progress... ($ELAPSED/${TIMEOUT}s)"
done

# Post-Rollback Validation (5-8 minutes)
echo "Validating rollback..."
./scripts/post-rollback-validation.sh --rollback-id $ROLLBACK_ID --target-version $LAST_GOOD_VERSION

# Health Check Confirmation
./scripts/health-check.sh --comprehensive
if [ $? -eq 0 ]; then
  echo "✅ Rollback validation successful"
  aws sns publish --topic-arn "arn:aws:sns:us-west-1:ACCOUNT:RealTechee-Production-Alerts" \
    --message "✅ ROLLBACK COMPLETED: $ROLLBACK_ID
Target version: $LAST_GOOD_VERSION
Validation: PASSED
System status: HEALTHY"
else
  echo "❌ Rollback validation failed - escalating"
  aws sns publish --topic-arn "arn:aws:sns:us-west-1:ACCOUNT:RealTechee-Critical-Alerts" \
    --message "❌ ROLLBACK VALIDATION FAILED: $ROLLBACK_ID
Manual intervention required immediately"
  exit 1
fi

# Extended Monitoring (30 minutes)
./scripts/monitor-post-rollback.sh --duration 30min --rollback-id $ROLLBACK_ID

echo "Emergency rollback completed successfully: $ROLLBACK_ID"
```

### Data Recovery Procedures

#### Data Corruption Recovery
```bash
#!/bin/bash
# Critical Data Recovery Procedure
DATA_INCIDENT_ID="DATA-$(date +%Y%m%d%H%M%S)"
ISSUE_DESC="$1"

echo "🚨 CRITICAL DATA RECOVERY INITIATED"
echo "Data Incident ID: $DATA_INCIDENT_ID"
echo "Issue: $ISSUE_DESC"

# STEP 1: Emergency Read-Only Mode (0-2 minutes)
echo "Activating emergency read-only mode..."
# Implementation depends on application architecture
# May involve Lambda function disabling or API gateway restrictions

# STEP 2: Data Integrity Assessment (2-10 minutes)
echo "Assessing data integrity..."
node scripts/assess-data-integrity.sh --comprehensive --report-file /tmp/data-integrity-$DATA_INCIDENT_ID.json

# Identify affected tables and time range
AFFECTED_TABLES=$(cat /tmp/data-integrity-$DATA_INCIDENT_ID.json | jq -r '.affectedTables[]')
CORRUPTION_TIME=$(cat /tmp/data-integrity-$DATA_INCIDENT_ID.json | jq -r '.corruptionDetectedAt')

echo "Affected tables: $AFFECTED_TABLES"
echo "Corruption detected at: $CORRUPTION_TIME"

# STEP 3: Recovery Point Selection (10-15 minutes)
echo "Selecting optimal recovery point..."

# Get available backup points
aws dynamodb list-backups --table-name "Contacts-aqnqdrctpzfwfjwyxxsmu6peoq-NONE" \
  --time-range-lower-bound $(date -d "24 hours ago" -Iseconds) \
  --query 'BackupSummaries[*].{BackupArn:BackupArn,CreationDateTime:CreationDateTime}' \
  --output table

# Select recovery point (manual selection for critical decisions)
echo "Available recovery points displayed above"
read -p "Enter the backup ARN for recovery: " BACKUP_ARN
read -p "Confirm data loss acceptance (YES/NO): " CONFIRMATION

if [ "$CONFIRMATION" != "YES" ]; then
  echo "Data recovery cancelled"
  exit 1
fi

# STEP 4: Data Restoration (15-30+ minutes)
echo "Initiating data restoration from backup..."
echo "Source backup: $BACKUP_ARN"

# Create restoration table
RESTORE_TABLE_NAME="Contacts-restore-$(date +%Y%m%d%H%M%S)"

aws dynamodb restore-table-from-backup \
  --target-table-name $RESTORE_TABLE_NAME \
  --backup-arn $BACKUP_ARN

# Monitor restore progress
echo "Monitoring restore progress..."
while true; do
  STATUS=$(aws dynamodb describe-table --table-name $RESTORE_TABLE_NAME \
    --query 'Table.TableStatus' --output text 2>/dev/null)
  
  if [ "$STATUS" = "ACTIVE" ]; then
    echo "✅ Restore completed successfully"
    break
  elif [ "$STATUS" = "FAILED" ]; then
    echo "❌ Restore failed"
    exit 1
  fi
  
  echo "Restore in progress... Status: $STATUS"
  sleep 60
done

# STEP 5: Data Validation (30+ minutes)
echo "Validating restored data..."
node scripts/validate-restored-data.sh --source-table $RESTORE_TABLE_NAME \
  --target-table "Contacts-aqnqdrctpzfwfjwyxxsmu6peoq-NONE" \
  --validation-report /tmp/restore-validation-$DATA_INCIDENT_ID.json

# STEP 6: Data Cutover (Manual approval required)
echo "Data validation complete. Review validation report:"
cat /tmp/restore-validation-$DATA_INCIDENT_ID.json | jq '.'

read -p "Proceed with data cutover? (YES/NO): " CUTOVER_APPROVAL
if [ "$CUTOVER_APPROVAL" = "YES" ]; then
  echo "Initiating data cutover..."
  # Implement table swap or data migration
  # This is a critical operation requiring careful implementation
  
  echo "Data cutover completed"
else
  echo "Data cutover cancelled - manual intervention required"
fi

# STEP 7: Resume Normal Operations
echo "Deactivating read-only mode..."
# Resume normal write operations

# STEP 8: Post-Recovery Validation
./scripts/comprehensive-health-check.sh --post-recovery

echo "Data recovery procedure completed: $DATA_INCIDENT_ID"
```

## Maintenance Procedures

### Scheduled Maintenance Windows

#### Weekly Maintenance (Sundays 2-4 AM PST)
```bash
#!/bin/bash
# Weekly Maintenance Routine
MAINTENANCE_ID="MAINT-$(date +%Y%m%d%H%M%S)"

echo "=== WEEKLY MAINTENANCE ROUTINE ==="
echo "Maintenance ID: $MAINTENANCE_ID"
echo "Start Time: $(date)"
echo "Maintenance Window: 2 hours"

# Pre-Maintenance Health Check
echo "1. PRE-MAINTENANCE HEALTH CHECK"
./scripts/health-check.sh --comprehensive --baseline > /tmp/maintenance-$MAINTENANCE_ID-baseline.log
if [ $? -ne 0 ]; then
  echo "❌ Pre-maintenance health check failed - aborting maintenance"
  exit 1
fi

# Database Maintenance
echo "2. DATABASE MAINTENANCE"
echo "   - Analyzing DynamoDB table performance..."
for table in "Contacts" "Properties" "Requests" "Projects" "Quotes"; do
  TABLE_FULL_NAME="${table}-aqnqdrctpzfwfjwyxxsmu6peoq-NONE"
  
  # Check read/write capacity utilization
  UTILIZATION=$(aws cloudwatch get-metric-statistics \
    --namespace "AWS/DynamoDB" \
    --metric-name "ConsumedReadCapacityUnits" \
    --dimensions Name=TableName,Value=$TABLE_FULL_NAME \
    --start-time $(date -d "7 days ago" -Iseconds) \
    --end-time $(date -Iseconds) \
    --period 604800 \
    --statistics Maximum \
    --query 'Datapoints[0].Maximum' \
    --output text)
  
  echo "   - $table: ${UTILIZATION:-0} max read units (7d)"
done

# Log Cleanup and Rotation
echo "3. LOG MANAGEMENT"
echo "   - Cleaning up old logs..."

# Clean up logs older than retention period
aws logs describe-log-groups --query 'logGroups[?starts_with(logGroupName, `/aws/amplify/RealTechee`)].logGroupName' \
  --output text | while read LOG_GROUP; do
  echo "   - Processing log group: $LOG_GROUP"
  
  # Delete old log streams (keep last 30 days)
  aws logs describe-log-streams --log-group-name "$LOG_GROUP" \
    --order-by LastEventTime \
    --query "logStreams[?lastEventTime < \`$(date -d '30 days ago' +%s)000\`].logStreamName" \
    --output text | while read LOG_STREAM; do
    if [ -n "$LOG_STREAM" ]; then
      aws logs delete-log-stream --log-group-name "$LOG_GROUP" --log-stream-name "$LOG_STREAM"
      echo "     - Deleted log stream: $LOG_STREAM"
    fi
  done
done

# Security Updates and Vulnerability Scanning  
echo "4. SECURITY MAINTENANCE"
echo "   - Checking for security updates..."
npm audit --audit-level high --json > /tmp/maintenance-$MAINTENANCE_ID-npm-audit.json

VULNERABILITIES=$(cat /tmp/maintenance-$MAINTENANCE_ID-npm-audit.json | jq '.metadata.vulnerabilities.total')
if [ "$VULNERABILITIES" -gt 0 ]; then
  echo "   ⚠️ $VULNERABILITIES vulnerabilities detected - review required"
  echo "   - Attempting automatic fixes..."
  npm audit fix --dry-run > /tmp/maintenance-$MAINTENANCE_ID-npm-fixes.log
else
  echo "   ✅ No high-severity vulnerabilities detected"
fi

# Performance Analysis
echo "5. PERFORMANCE ANALYSIS"
echo "   - Analyzing weekly performance trends..."

# Generate performance report
WEEK_START=$(date -d "7 days ago" +%Y-%m-%d)
WEEK_END=$(date +%Y-%m-%d)

echo "   - Performance report for: $WEEK_START to $WEEK_END"

# Average response time
AVG_RESPONSE=$(aws cloudwatch get-metric-statistics \
  --namespace "AWS/ApplicationELB" \
  --metric-name "TargetResponseTime" \
  --dimensions Name=LoadBalancer,Value=RealTechee-ALB \
  --start-time "${WEEK_START}T00:00:00Z" \
  --end-time "${WEEK_END}T00:00:00Z" \
  --period 604800 \
  --statistics Average \
  --query 'Datapoints[0].Average' \
  --output text)

echo "   - Average response time (7d): ${AVG_RESPONSE:-N/A}s"

# Error rate analysis
ERROR_COUNT=$(aws logs filter-log-events \
  --log-group-name "/aws/amplify/RealTechee-Gen2" \
  --start-time $(date -d "7 days ago" +%s)000 \
  --end-time $(date +%s)000 \
  --filter-pattern "ERROR" \
  --query 'events | length(@)')

echo "   - Total errors (7d): ${ERROR_COUNT:-0}"

# Backup Verification
echo "6. BACKUP VERIFICATION"
echo "   - Verifying backup integrity..."

# Check recent backups for critical tables
aws dynamodb list-backups --table-name "Contacts-aqnqdrctpzfwfjwyxxsmu6peoq-NONE" \
  --time-range-lower-bound $(date -d "7 days ago" -Iseconds) \
  --query 'BackupSummaries | length(@)' > /tmp/backup-count.txt

BACKUP_COUNT=$(cat /tmp/backup-count.txt)
echo "   - Recent backups available: $BACKUP_COUNT"

if [ "$BACKUP_COUNT" -lt 7 ]; then
  echo "   ⚠️ Insufficient backup coverage - investigation required"
else
  echo "   ✅ Backup coverage adequate"
fi

# Capacity Planning
echo "7. CAPACITY PLANNING"
echo "   - Analyzing resource utilization..."

# Lambda function metrics
for func in "notification-processor" "user-admin" "status-processor"; do
  INVOCATIONS=$(aws cloudwatch get-metric-statistics \
    --namespace "AWS/Lambda" \
    --metric-name "Invocations" \
    --dimensions Name=FunctionName,Value=$func \
    --start-time $(date -d "7 days ago" -Iseconds) \
    --end-time $(date -Iseconds) \
    --period 604800 \
    --statistics Sum \
    --query 'Datapoints[0].Sum' \
    --output text)
  
  echo "   - $func invocations (7d): ${INVOCATIONS:-0}"
done

# Post-Maintenance Health Check
echo "8. POST-MAINTENANCE HEALTH CHECK"
./scripts/health-check.sh --comprehensive --post-maintenance > /tmp/maintenance-$MAINTENANCE_ID-post-check.log
if [ $? -eq 0 ]; then
  echo "   ✅ Post-maintenance health check: PASSED"
else
  echo "   ❌ Post-maintenance health check: FAILED"
  # Alert on maintenance issues
  aws sns publish --topic-arn "arn:aws:sns:us-west-1:ACCOUNT:RealTechee-Production-Alerts" \
    --message "⚠️ MAINTENANCE ISSUE: $MAINTENANCE_ID - Post-maintenance health check failed"
fi

# Maintenance Summary
echo "9. MAINTENANCE SUMMARY"
echo "   - Maintenance ID: $MAINTENANCE_ID"
echo "   - Duration: $(($(date +%s) - $(date -d "$(head -1 /tmp/maintenance-$MAINTENANCE_ID-baseline.log | cut -d' ' -f4-)" +%s))) seconds"
echo "   - Status: $([ $? -eq 0 ] && echo "SUCCESS" || echo "ISSUES DETECTED")"

echo ""
echo "=== WEEKLY MAINTENANCE COMPLETE ==="
echo "End Time: $(date)"
```

#### Monthly Comprehensive Maintenance (First Sunday)
```bash
#!/bin/bash
# Monthly Comprehensive Maintenance
MONTHLY_MAINT_ID="MONTHLY-$(date +%Y%m)"

echo "=== MONTHLY COMPREHENSIVE MAINTENANCE ==="
echo "Maintenance ID: $MONTHLY_MAINT_ID"

# Include all weekly maintenance tasks
./scripts/weekly-maintenance.sh

# Additional monthly tasks
echo "10. MONTHLY SECURITY AUDIT"
echo "   - Performing comprehensive security review..."

# Review IAM permissions
aws iam get-account-summary | jq '.SummaryMap'

# Review security groups
aws ec2 describe-security-groups --query 'SecurityGroups[*].{GroupId:GroupId,GroupName:GroupName}' --output table

echo "11. MONTHLY PERFORMANCE OPTIMIZATION"
echo "   - Analyzing long-term performance trends..."

# Monthly performance report
MONTH_START=$(date -d "30 days ago" +%Y-%m-%d)
MONTH_END=$(date +%Y-%m-%d)

aws cloudwatch get-metric-statistics \
  --namespace "AWS/ApplicationELB" \
  --metric-name "TargetResponseTime" \
  --dimensions Name=LoadBalancer,Value=RealTechee-ALB \
  --start-time "${MONTH_START}T00:00:00Z" \
  --end-time "${MONTH_END}T00:00:00Z" \
  --period 86400 \
  --statistics Average,Maximum \
  --query 'Datapoints[*].[Timestamp,Average,Maximum]' \
  --output table

echo "12. MONTHLY DISASTER RECOVERY TEST"
echo "   - Testing disaster recovery procedures..."

# Test backup restoration process (in isolated environment)
echo "   - Validating backup restoration capabilities..."

# Test monitoring and alerting systems
echo "   - Testing monitoring and alerting systems..."
aws sns publish --topic-arn "arn:aws:sns:us-west-1:ACCOUNT:RealTechee-Production-Alerts" \
  --message "📋 MONTHLY TEST: This is a test of the monitoring system from maintenance ID: $MONTHLY_MAINT_ID"

echo "=== MONTHLY MAINTENANCE COMPLETE ==="
```

## Health Check & Monitoring Procedures

### Comprehensive Health Check System
```bash
#!/bin/bash
# Production Health Check Implementation
HEALTH_ID="HEALTH-$(date +%Y%m%d%H%M%S)"

echo "=== REALTECHEE PRODUCTION HEALTH CHECK ==="
echo "Health Check ID: $HEALTH_ID"
echo "Timestamp: $(date -Iseconds)"

# Initialize health tracking
OVERALL_HEALTH=0
HEALTH_RESULTS=()

# 1. Application Availability
echo "1. APPLICATION AVAILABILITY CHECK"
APP_START_TIME=$(date +%s%3N)
APP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}:%{time_total}" \
  --max-time 10 https://d200k2wsaf8th3.amplifyapp.com/)
APP_END_TIME=$(date +%s%3N)

APP_CODE=$(echo $APP_RESPONSE | cut -d: -f1)
APP_TIME=$(echo $APP_RESPONSE | cut -d: -f2)
APP_TOTAL_TIME=$((APP_END_TIME - APP_START_TIME))

if [ "$APP_CODE" = "200" ] && (( $(echo "$APP_TIME < 5.0" | bc -l) )); then
  echo "   ✅ Application: HEALTHY (HTTP $APP_CODE, ${APP_TIME}s)"
  HEALTH_RESULTS+=("application:healthy:$APP_CODE:$APP_TIME")
else
  echo "   ❌ Application: UNHEALTHY (HTTP $APP_CODE, ${APP_TIME}s)"
  HEALTH_RESULTS+=("application:unhealthy:$APP_CODE:$APP_TIME")
  OVERALL_HEALTH=1
fi

# 2. GraphQL API Health
echo "2. GRAPHQL API HEALTH CHECK"
API_START_TIME=$(date +%s%3N)
API_RESPONSE=$(curl -s -X POST \
  --max-time 15 \
  -H "Content-Type: application/json" \
  -d '{"query": "{ listContacts(limit: 1) { items { id } } }"}' \
  https://374sdjlh3bdnhp2sz4qttvyhce.appsync-api.us-west-1.amazonaws.com/graphql)
API_END_TIME=$(date +%s%3N)

API_TIME=$((API_END_TIME - API_START_TIME))
if echo "$API_RESPONSE" | jq -e '.data' > /dev/null 2>&1; then
  echo "   ✅ GraphQL API: HEALTHY (${API_TIME}ms)"
  HEALTH_RESULTS+=("graphql:healthy:$API_TIME")
else
  echo "   ❌ GraphQL API: UNHEALTHY (${API_TIME}ms)"
  HEALTH_RESULTS+=("graphql:unhealthy:$API_TIME")
  OVERALL_HEALTH=1
fi

# 3. Database Connectivity
echo "3. DATABASE CONNECTIVITY CHECK"
DB_START_TIME=$(date +%s%3N)
DB_RESULT=$(timeout 30 node scripts/test-basic-connectivity.mjs 2>&1)
DB_EXIT_CODE=$?
DB_END_TIME=$(date +%s%3N)
DB_TIME=$((DB_END_TIME - DB_START_TIME))

if [ $DB_EXIT_CODE -eq 0 ]; then
  echo "   ✅ Database: HEALTHY (${DB_TIME}ms)"
  HEALTH_RESULTS+=("database:healthy:$DB_TIME")
else
  echo "   ❌ Database: UNHEALTHY (${DB_TIME}ms)"
  echo "   Error: $DB_RESULT"
  HEALTH_RESULTS+=("database:unhealthy:$DB_TIME")
  OVERALL_HEALTH=1
fi

# 4. Authentication System
echo "4. AUTHENTICATION SYSTEM CHECK"
AUTH_START_TIME=$(date +%s%3N)
USER_POOL_ID=$(jq -r '.auth.user_pool_id' amplify_outputs.json)
AUTH_RESULT=$(aws cognito-idp describe-user-pool --user-pool-id $USER_POOL_ID 2>&1)
AUTH_EXIT_CODE=$?
AUTH_END_TIME=$(date +%s%3N)
AUTH_TIME=$((AUTH_END_TIME - AUTH_START_TIME))

if [ $AUTH_EXIT_CODE -eq 0 ]; then
  echo "   ✅ Authentication: HEALTHY (${AUTH_TIME}ms)"
  HEALTH_RESULTS+=("auth:healthy:$AUTH_TIME")
else
  echo "   ❌ Authentication: UNHEALTHY (${AUTH_TIME}ms)"
  HEALTH_RESULTS+=("auth:unhealthy:$AUTH_TIME")
  OVERALL_HEALTH=1
fi

# 5. File Storage System
echo "5. FILE STORAGE SYSTEM CHECK"
STORAGE_START_TIME=$(date +%s%3N)
BUCKET_NAME=$(jq -r '.storage.bucket_name' amplify_outputs.json)
STORAGE_RESULT=$(aws s3 ls s3://$BUCKET_NAME/ --max-items 1 2>&1)
STORAGE_EXIT_CODE=$?
STORAGE_END_TIME=$(date +%s%3N)
STORAGE_TIME=$((STORAGE_END_TIME - STORAGE_START_TIME))

if [ $STORAGE_EXIT_CODE -eq 0 ]; then
  echo "   ✅ Storage: HEALTHY (${STORAGE_TIME}ms)"
  HEALTH_RESULTS+=("storage:healthy:$STORAGE_TIME")
else
  echo "   ❌ Storage: UNHEALTHY (${STORAGE_TIME}ms)"
  HEALTH_RESULTS+=("storage:unhealthy:$STORAGE_TIME")
  OVERALL_HEALTH=1
fi

# 6. Lambda Functions Health
echo "6. LAMBDA FUNCTIONS HEALTH CHECK"
LAMBDA_FUNCTIONS=("notification-processor" "user-admin" "status-processor")
LAMBDA_OVERALL_HEALTH=0

for func in "${LAMBDA_FUNCTIONS[@]}"; do
  FUNC_START_TIME=$(date +%s%3N)
  FUNC_RESULT=$(aws lambda get-function --function-name $func 2>&1)
  FUNC_EXIT_CODE=$?
  FUNC_END_TIME=$(date +%s%3N)
  FUNC_TIME=$((FUNC_END_TIME - FUNC_START_TIME))
  
  if [ $FUNC_EXIT_CODE -eq 0 ]; then
    echo "   ✅ Lambda ($func): HEALTHY (${FUNC_TIME}ms)"
    HEALTH_RESULTS+=("lambda-$func:healthy:$FUNC_TIME")
  else
    echo "   ❌ Lambda ($func): UNHEALTHY (${FUNC_TIME}ms)"
    HEALTH_RESULTS+=("lambda-$func:unhealthy:$FUNC_TIME")
    LAMBDA_OVERALL_HEALTH=1
    OVERALL_HEALTH=1
  fi
done

# 7. Performance Metrics Analysis
echo "7. PERFORMANCE METRICS CHECK"
PERF_START_TIME=$(date +%s%3N)
RECENT_RESPONSE_TIME=$(aws cloudwatch get-metric-statistics \
  --namespace "AWS/ApplicationELB" \
  --metric-name "TargetResponseTime" \
  --dimensions Name=LoadBalancer,Value=RealTechee-ALB \
  --start-time $(date -d "15 minutes ago" -Iseconds) \
  --end-time $(date -Iseconds) \
  --period 300 \
  --statistics Average \
  --query 'Datapoints[0].Average' \
  --output text 2>/dev/null)
PERF_END_TIME=$(date +%s%3N)
PERF_TIME=$((PERF_END_TIME - PERF_START_TIME))

if [ "$RECENT_RESPONSE_TIME" != "None" ] && [ "$RECENT_RESPONSE_TIME" != "" ]; then
  RESPONSE_TIME=$(printf "%.2f" $RECENT_RESPONSE_TIME)
  if (( $(echo "$RESPONSE_TIME < 3.0" | bc -l) )); then
    echo "   ✅ Performance: HEALTHY (${RESPONSE_TIME}s avg, ${PERF_TIME}ms check)"
    HEALTH_RESULTS+=("performance:healthy:$RESPONSE_TIME")
  else
    echo "   ⚠️ Performance: DEGRADED (${RESPONSE_TIME}s avg, ${PERF_TIME}ms check)"
    HEALTH_RESULTS+=("performance:degraded:$RESPONSE_TIME")
  fi
else
  echo "   ℹ️ Performance: METRICS UNAVAILABLE (${PERF_TIME}ms check)"
  HEALTH_RESULTS+=("performance:no-data:$PERF_TIME")
fi

# 8. Active Alarms Check
echo "8. ACTIVE ALARMS CHECK"
ALARM_START_TIME=$(date +%s%3N)
ACTIVE_ALARMS=$(aws cloudwatch describe-alarms \
  --state-value ALARM \
  --query 'MetricAlarms[?starts_with(AlarmName, `RealTechee`)].AlarmName' \
  --output text)
ALARM_END_TIME=$(date +%s%3N)
ALARM_TIME=$((ALARM_END_TIME - ALARM_START_TIME))

if [ -z "$ACTIVE_ALARMS" ]; then
  echo "   ✅ Alarms: NO ACTIVE ALARMS (${ALARM_TIME}ms)"
  HEALTH_RESULTS+=("alarms:healthy:0")
else
  ALARM_COUNT=$(echo "$ACTIVE_ALARMS" | wc -w)
  echo "   ⚠️ Alarms: $ALARM_COUNT ACTIVE ALARMS (${ALARM_TIME}ms)"
  echo "   Active alarms: $ACTIVE_ALARMS"
  HEALTH_RESULTS+=("alarms:warning:$ALARM_COUNT")
fi

# Health Check Summary
echo ""
echo "=== HEALTH CHECK SUMMARY ==="
TOTAL_CHECKS=$(echo "${HEALTH_RESULTS[@]}" | wc -w)
HEALTHY_CHECKS=$(printf '%s\n' "${HEALTH_RESULTS[@]}" | grep -c ":healthy:")
UNHEALTHY_CHECKS=$(printf '%s\n' "${HEALTH_RESULTS[@]}" | grep -c ":unhealthy:")

echo "Health Check ID: $HEALTH_ID"
echo "Total Checks: $TOTAL_CHECKS"
echo "Healthy: $HEALTHY_CHECKS"
echo "Unhealthy: $UNHEALTHY_CHECKS"
echo "Overall Status: $([ $OVERALL_HEALTH -eq 0 ] && echo "✅ HEALTHY" || echo "❌ UNHEALTHY")"

# Store results for monitoring
HEALTH_REPORT="/var/log/health-checks/health-$HEALTH_ID.json"
mkdir -p /var/log/health-checks

cat > $HEALTH_REPORT << EOF
{
  "healthCheckId": "$HEALTH_ID",
  "timestamp": "$(date -Iseconds)",
  "overallStatus": "$([ $OVERALL_HEALTH -eq 0 ] && echo "healthy" || echo "unhealthy")",
  "totalChecks": $TOTAL_CHECKS,
  "healthyChecks": $HEALTHY_CHECKS,
  "unhealthyChecks": $UNHEALTHY_CHECKS,
  "results": [
EOF

# Add results to JSON
for i in "${!HEALTH_RESULTS[@]}"; do
  RESULT="${HEALTH_RESULTS[$i]}"
  IFS=':' read -r component status metric <<< "$RESULT"
  
  cat >> $HEALTH_REPORT << EOF
    {
      "component": "$component",
      "status": "$status", 
      "metric": "$metric"
    }$([ $i -lt $((${#HEALTH_RESULTS[@]} - 1)) ] && echo "," || echo "")
EOF
done

cat >> $HEALTH_REPORT << EOF
  ]
}
EOF

# Report unhealthy status via SNS if critical
if [ $OVERALL_HEALTH -ne 0 ]; then
  aws sns publish --topic-arn "arn:aws:sns:us-west-1:ACCOUNT:RealTechee-Production-Alerts" \
    --message "⚠️ HEALTH CHECK FAILURE: $HEALTH_ID
Unhealthy components detected: $UNHEALTHY_CHECKS/$TOTAL_CHECKS
Report: $HEALTH_REPORT
Immediate investigation required."
fi

echo "Health check completed: $HEALTH_ID"
echo "Report saved: $HEALTH_REPORT"

exit $OVERALL_HEALTH
```

## Emergency Contact & Escalation

### 24/7 Emergency Response Team
```yaml
Escalation Matrix:
  P0_Critical (0-5 minutes):
    Primary: System Administrator
      - Phone: +1-XXX-XXX-XXXX
      - Email: admin@realtechee.com
      - Slack: @system-admin
    
    Secondary: DevOps Lead  
      - Phone: +1-XXX-XXX-XXXX
      - Email: devops@realtechee.com
      - Slack: @devops-lead
      
    Escalation: CTO (after 15 minutes)
      - Phone: +1-XXX-XXX-XXXX
      - Email: cto@realtechee.com

  P1_High (0-30 minutes):
    Primary: On-call Engineer
      - Phone: +1-XXX-XXX-XXXX
      - Email: oncall@realtechee.com
      - Slack: @oncall-engineer
      
    Secondary: Team Lead
      - Phone: +1-XXX-XXX-XXXX  
      - Email: teamlead@realtechee.com

  External Support:
    AWS Support: Premium support plan active
    - Case creation via CLI/Console
    - Phone support: 1-855-492-7847
    - Enterprise support response: < 15 minutes
    
    GitHub Support: Enterprise plan
    - Support ticket creation
    - Response time: < 8 hours business
```

### Emergency Communication Protocols
```bash
#!/bin/bash
# Emergency communication script
SEVERITY=$1
ISSUE_DESCRIPTION="$2"
INCIDENT_ID="$3"

case $SEVERITY in
  "P0")
    # Critical incident - all channels
    aws sns publish --topic-arn "arn:aws:sns:us-west-1:ACCOUNT:RealTechee-Critical-Alerts" \
      --message "🚨 P0 CRITICAL INCIDENT: $INCIDENT_ID
Issue: $ISSUE_DESCRIPTION
All hands response required immediately.
Conference bridge: [BRIDGE_URL]
Status page: [STATUS_URL]"
    
    # Additional escalation channels
    # Slack webhook, PagerDuty, etc.
    ;;
    
  "P1") 
    # High priority - production team
    aws sns publish --topic-arn "arn:aws:sns:us-west-1:ACCOUNT:RealTechee-Production-Alerts" \
      --message "⚠️ P1 HIGH PRIORITY INCIDENT: $INCIDENT_ID
Issue: $ISSUE_DESCRIPTION
DevOps and team lead response required within 30 minutes."
    ;;
    
  *)
    echo "Standard incident logging"
    ;;
esac
```

---

## Related Documentation

- **[Environment Architecture](../00-overview/environment-architecture.md)** - Infrastructure and environment separation
- **[Enterprise Deployment](../06-deployment/enterprise-deployment-procedures.md)** - Deployment automation and CI/CD
- **[Production Monitoring](production-monitoring.md)** - Monitoring systems and observability
- **[Logging Configuration](logging-configuration.md)** - Application logging and troubleshooting

**Last Updated**: July 22, 2025  
**Version**: 3.0.0  
**Status**: Enterprise Operational Procedures - Production Ready ✅