#!/bin/bash

# CloudWatch Monitoring Setup Script
# Creates dashboards, alarms, and error tracking for production

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_FILE="$PROJECT_ROOT/config/cloudwatch-monitoring.json"
REGION="us-west-1"
DRY_RUN=false

# Helper functions
echo_step() {
  echo -e "${GREEN}==>${NC} $1"
}

echo_warn() {
  echo -e "${YELLOW}⚠️  WARNING:${NC} $1"
}

echo_error() {
  echo -e "${RED}❌ ERROR:${NC} $1"
  exit 1
}

echo_info() {
  echo -e "${BLUE}ℹ️  INFO:${NC} $1"
}

echo_success() {
  echo -e "${GREEN}✅ SUCCESS:${NC} $1"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      echo_warn "DRY RUN MODE: No resources will be created"
      shift
      ;;
    --help)
      echo "Usage: $0 [--dry-run] [--help]"
      echo ""
      echo "Options:"
      echo "  --dry-run    Simulate setup without creating resources"
      echo "  --help       Show this help message"
      exit 0
      ;;
    *)
      echo_error "Unknown option: $1"
      ;;
  esac
done

# Validate configuration
validate_config() {
  echo_step "🔍 Validating monitoring configuration"
  
  if [ ! -f "$CONFIG_FILE" ]; then
    echo_error "Monitoring configuration not found: $CONFIG_FILE"
  fi
  
  # Validate JSON format
  if ! jq empty "$CONFIG_FILE" 2>/dev/null; then
    echo_error "Invalid JSON in monitoring configuration file"
  fi
  
  echo_success "Configuration validated successfully"
}

# Create SNS topics for notifications
create_sns_topics() {
  echo_step "📢 Creating SNS topics for notifications"
  
  # Get SNS configuration from JSON
  TOPICS=$(jq -r '.notifications.sns.topics[]' "$CONFIG_FILE")
  
  echo "$TOPICS" | jq -r '.name' | while read -r TOPIC_NAME; do
    if [ -z "$TOPIC_NAME" ] || [ "$TOPIC_NAME" = "null" ]; then
      continue
    fi
    
    echo_info "Creating SNS topic: $TOPIC_NAME"
    
    if [ "$DRY_RUN" = true ]; then
      echo_info "DRY RUN: Would create SNS topic $TOPIC_NAME"
      continue
    fi
    
    # Check if topic already exists
    EXISTING_TOPIC=$(aws sns list-topics --region "$REGION" --output text --query "Topics[?contains(@, '$TOPIC_NAME')]" 2>/dev/null || echo "")
    
    if [ -n "$EXISTING_TOPIC" ]; then
      echo_info "SNS topic $TOPIC_NAME already exists"
      TOPIC_ARN="$EXISTING_TOPIC"
    else
      # Create topic
      TOPIC_ARN=$(aws sns create-topic --name "$TOPIC_NAME" --region "$REGION" --output text --query 'TopicArn')
      echo_success "Created SNS topic: $TOPIC_ARN"
    fi
    
    # Get subscription configuration for this topic
    SUBSCRIPTIONS=$(echo "$TOPICS" | jq -r --arg topic "$TOPIC_NAME" 'select(.name == $topic) | .subscriptions[]?')
    
    echo "$SUBSCRIPTIONS" | jq -r '. | "\(.protocol)|\(.endpoint)"' | while IFS='|' read -r PROTOCOL ENDPOINT; do
      if [ -n "$PROTOCOL" ] && [ -n "$ENDPOINT" ]; then
        echo_info "Adding subscription: $PROTOCOL -> $ENDPOINT"
        aws sns subscribe \
          --topic-arn "$TOPIC_ARN" \
          --protocol "$PROTOCOL" \
          --notification-endpoint "$ENDPOINT" \
          --region "$REGION" >/dev/null 2>&1 || echo_warn "Subscription may already exist"
      fi
    done
  done
}

# Create CloudWatch alarms
create_cloudwatch_alarms() {
  echo_step "🚨 Creating CloudWatch alarms"
  
  # Get alarms from configuration
  jq -r '.alarms[] | @base64' "$CONFIG_FILE" | while read -r ALARM_DATA; do
    ALARM=$(echo "$ALARM_DATA" | base64 --decode)
    
    ALARM_NAME=$(echo "$ALARM" | jq -r '.name')
    ALARM_DESC=$(echo "$ALARM" | jq -r '.description')
    METRIC_NAME=$(echo "$ALARM" | jq -r '.metricName')
    NAMESPACE=$(echo "$ALARM" | jq -r '.namespace')
    THRESHOLD=$(echo "$ALARM" | jq -r '.threshold')
    COMPARISON=$(echo "$ALARM" | jq -r '.comparisonOperator')
    PERIODS=$(echo "$ALARM" | jq -r '.evaluationPeriods')
    PERIOD=$(echo "$ALARM" | jq -r '.period')
    STATISTIC=$(echo "$ALARM" | jq -r '.statistic')
    
    echo_info "Creating alarm: $ALARM_NAME"
    
    if [ "$DRY_RUN" = true ]; then
      echo_info "DRY RUN: Would create alarm $ALARM_NAME (threshold: $THRESHOLD)"
      continue
    fi
    
    # Build dimensions parameter
    DIMENSIONS=$(echo "$ALARM" | jq -r '.dimensions | to_entries[] | "Name=\(.key),Value=\(.value)"' | tr '\n' ' ')
    
    # Get alarm actions
    ALARM_ACTIONS=$(echo "$ALARM" | jq -r '.actions.alarm[]?' 2>/dev/null | tr '\n' ' ')
    
    # Create the alarm
    aws cloudwatch put-metric-alarm \
      --alarm-name "$ALARM_NAME" \
      --alarm-description "$ALARM_DESC" \
      --metric-name "$METRIC_NAME" \
      --namespace "$NAMESPACE" \
      --statistic "$STATISTIC" \
      --period "$PERIOD" \
      --threshold "$THRESHOLD" \
      --comparison-operator "$COMPARISON" \
      --evaluation-periods "$PERIODS" \
      ${DIMENSIONS:+--dimensions $DIMENSIONS} \
      ${ALARM_ACTIONS:+--alarm-actions $ALARM_ACTIONS} \
      --region "$REGION"
    
    echo_success "Created alarm: $ALARM_NAME"
  done
}

# Create CloudWatch dashboard
create_dashboard() {
  echo_step "📊 Creating CloudWatch dashboard"
  
  DASHBOARD_NAME=$(jq -r '.dashboards.production.name' "$CONFIG_FILE")
  
  echo_info "Creating dashboard: $DASHBOARD_NAME"
  
  if [ "$DRY_RUN" = true ]; then
    echo_info "DRY RUN: Would create dashboard $DASHBOARD_NAME"
    return
  fi
  
  # Create dashboard body from configuration
  DASHBOARD_BODY=$(jq -c '.dashboards.production' "$CONFIG_FILE")
  
  aws cloudwatch put-dashboard \
    --dashboard-name "$DASHBOARD_NAME" \
    --dashboard-body "$DASHBOARD_BODY" \
    --region "$REGION"
  
  echo_success "Dashboard created: $DASHBOARD_NAME"
  echo_info "View at: https://console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=$DASHBOARD_NAME"
}

# Setup log retention
setup_log_retention() {
  echo_step "📝 Setting up log retention policies"
  
  jq -r '.logGroups[] | @base64' "$CONFIG_FILE" | while read -r LOG_DATA; do
    LOG_GROUP=$(echo "$LOG_DATA" | base64 --decode)
    
    LOG_GROUP_NAME=$(echo "$LOG_GROUP" | jq -r '.name')
    RETENTION_DAYS=$(echo "$LOG_GROUP" | jq -r '.retentionDays')
    
    echo_info "Setting retention for log group: $LOG_GROUP_NAME ($RETENTION_DAYS days)"
    
    if [ "$DRY_RUN" = true ]; then
      echo_info "DRY RUN: Would set retention for $LOG_GROUP_NAME"
      continue
    fi
    
    # Set log retention
    aws logs put-retention-policy \
      --log-group-name "$LOG_GROUP_NAME" \
      --retention-in-days "$RETENTION_DAYS" \
      --region "$REGION" 2>/dev/null || echo_warn "Log group may not exist yet: $LOG_GROUP_NAME"
  done
}

# Create monitoring summary
create_monitoring_summary() {
  echo_step "📋 Creating monitoring summary"
  
  SUMMARY_FILE="$PROJECT_ROOT/docs/monitoring-setup-summary.md"
  
  cat > "$SUMMARY_FILE" << EOF
# CloudWatch Monitoring Setup Summary

**Setup Date**: $(date)
**Region**: $REGION
**Status**: $([ "$DRY_RUN" = true ] && echo "DRY RUN" || echo "DEPLOYED")

## Resources Created

### SNS Topics
$(jq -r '.notifications.sns.topics[] | "- **\(.name)**: \(.displayName)"' "$CONFIG_FILE")

### CloudWatch Alarms
$(jq -r '.alarms[] | "- **\(.name)**: \(.description)"' "$CONFIG_FILE")

### Dashboard
- **$(jq -r '.dashboards.production.name' "$CONFIG_FILE")**: Production monitoring dashboard

### Log Groups
$(jq -r '.logGroups[] | "- **\(.name)**: \(.retentionDays) day retention"' "$CONFIG_FILE")

## Access Links

### CloudWatch Console
- [Dashboards](https://console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:)
- [Alarms](https://console.aws.amazon.com/cloudwatch/home?region=$REGION#alarmsV2:)
- [Log Groups](https://console.aws.amazon.com/cloudwatch/home?region=$REGION#logsV2:log-groups)

### SNS Console
- [Topics](https://console.aws.amazon.com/sns/v3/home?region=$REGION#/topics)
- [Subscriptions](https://console.aws.amazon.com/sns/v3/home?region=$REGION#/subscriptions)

## Monitoring Strategy

### Error Detection
- **High Error Rate**: Alerts when error rate exceeds 5%
- **High Latency**: Alerts when response time > 10 seconds
- **DynamoDB Throttling**: Immediate alerts on throttling events
- **Low Traffic**: Alerts on unexpected traffic drops (possible outages)

### Notification Channels
- **Production Alerts**: info@realtechee.com
- **Error Notifications**: info@realtechee.com

### Log Retention
- **Lambda Functions**: 30 days retention
- **Error Filtering**: Automatic error detection and alerting

## Next Steps

1. **Test Alerts**: Trigger a test alarm to verify notification delivery
2. **Customize Thresholds**: Adjust alarm thresholds based on actual usage patterns
3. **Add Custom Metrics**: Implement application-specific metrics
4. **Review Dashboard**: Customize dashboard widgets based on operational needs

## Commands

### View Alarms Status
\`\`\`bash
aws cloudwatch describe-alarms --region $REGION --output table --query 'MetricAlarms[].{Name:AlarmName,State:StateValue,Reason:StateReason}'
\`\`\`

### Test SNS Notifications
\`\`\`bash
aws sns publish --topic-arn <TOPIC_ARN> --message "Test notification from monitoring setup" --region $REGION
\`\`\`

### View Recent Logs
\`\`\`bash
aws logs describe-log-streams --log-group-name "/aws/lambda/your-function-name" --region $REGION
\`\`\`

EOF

  echo_success "Monitoring summary created: $SUMMARY_FILE"
}

# Main execution
main() {
  echo_step "🛡️  CloudWatch Monitoring Setup"
  echo_info "Region: $REGION"
  echo_info "Mode: $([ "$DRY_RUN" = true ] && echo "DRY RUN" || echo "DEPLOYMENT")"
  echo ""
  
  validate_config
  create_sns_topics
  create_cloudwatch_alarms
  create_dashboard
  setup_log_retention
  create_monitoring_summary
  
  echo ""
  echo_success "Monitoring setup completed!"
  echo ""
  
  if [ "$DRY_RUN" = false ]; then
    echo "🎉 PRODUCTION MONITORING ACTIVE!"
    echo "   Dashboard: https://console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:"
    echo "   Alarms: https://console.aws.amazon.com/cloudwatch/home?region=$REGION#alarmsV2:"
    echo "   Summary: docs/monitoring-setup-summary.md"
  else
    echo "📋 DRY RUN COMPLETED!"
    echo "   Run without --dry-run to deploy monitoring resources"
  fi
}

# Execute main function
main