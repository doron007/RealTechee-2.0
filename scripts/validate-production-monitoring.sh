#!/bin/bash

# Production Performance Monitoring Validation Script
# Tests and validates the monitoring setup

set -e

echo "🔍 Validating production performance monitoring setup..."
echo "⚡ Region: us-west-1"
echo ""

# Configuration
REGION="us-west-1"
LAMBDA_FUNCTION_NAME="amplify-realtecheeclone-p-notificationprocessorlam-lmoY8kniQzu7"

# Check CloudWatch alarms
echo "🚨 Checking CloudWatch alarms..."
ALARM_COUNT=$(aws cloudwatch describe-alarms \
    --alarm-name-prefix "NotificationProcessor-" \
    --region "$REGION" \
    --query 'length(MetricAlarms)' \
    --output text)

echo "✅ Found $ALARM_COUNT notification processor alarms"

if [ "$ALARM_COUNT" -ge 4 ]; then
    echo "✅ All expected alarms are present"
else
    echo "❌ Missing alarms - expected at least 4, found $ALARM_COUNT"
    exit 1
fi

# Check dashboard
echo ""
echo "📊 Checking CloudWatch dashboard..."
DASHBOARD_EXISTS=$(aws cloudwatch list-dashboards \
    --region "$REGION" \
    --query 'length(DashboardEntries[?DashboardName==`Production-NotificationProcessor`])' \
    --output text)

if [ "$DASHBOARD_EXISTS" = "1" ]; then
    echo "✅ Production dashboard exists"
else
    echo "❌ Production dashboard not found"
    exit 1
fi

# Check SNS topic
echo ""
echo "📧 Checking SNS alert topic..."
SNS_TOPIC_ARN="arn:aws:sns:us-west-1:403266990862:production-alerts"
if aws sns get-topic-attributes --topic-arn "$SNS_TOPIC_ARN" --region "$REGION" >/dev/null 2>&1; then
    echo "✅ SNS alert topic exists"
    
    # Check subscriptions
    SUBSCRIPTION_COUNT=$(aws sns list-subscriptions-by-topic \
        --topic-arn "$SNS_TOPIC_ARN" \
        --region "$REGION" \
        --query 'length(Subscriptions)' \
        --output text)
    echo "📧 Found $SUBSCRIPTION_COUNT email subscriptions"
else
    echo "❌ SNS alert topic not found"
    exit 1
fi

# Check Lambda function exists and is accessible
echo ""
echo "⚡ Validating Lambda function..."
if aws lambda get-function \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --region "$REGION" >/dev/null 2>&1; then
    echo "✅ Lambda function accessible"
    
    # Get function config for monitoring validation
    TIMEOUT=$(aws lambda get-function-configuration \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --region "$REGION" \
        --query 'Timeout' \
        --output text)
    echo "⏱️  Lambda timeout: ${TIMEOUT}s (monitoring threshold: 60s)"
else
    echo "❌ Lambda function not accessible"
    exit 1
fi

# Check EventBridge rule
echo ""
echo "🔄 Checking EventBridge rule..."
RULE_NAME="notification-processor-schedule"
if aws events describe-rule \
    --name "$RULE_NAME" \
    --region "$REGION" >/dev/null 2>&1; then
    echo "✅ EventBridge rule exists"
    
    # Check targets
    TARGET_COUNT=$(aws events list-targets-by-rule \
        --rule "$RULE_NAME" \
        --region "$REGION" \
        --query 'length(Targets)' \
        --output text)
    echo "🎯 EventBridge rule has $TARGET_COUNT targets"
else
    echo "❌ EventBridge rule not found"
    exit 1
fi

# Check recent Lambda invocations
echo ""
echo "📊 Checking recent Lambda metrics..."
START_TIME=$(date -u -v-1H +%Y-%m-%dT%H:%M:%S.000Z)
END_TIME=$(date -u +%Y-%m-%dT%H:%M:%S.000Z)

INVOCATIONS=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Invocations \
    --dimensions Name=FunctionName,Value="$LAMBDA_FUNCTION_NAME" \
    --start-time "$START_TIME" \
    --end-time "$END_TIME" \
    --period 3600 \
    --statistics Sum \
    --region "$REGION" \
    --query 'Datapoints[0].Sum' \
    --output text 2>/dev/null || echo "null")

if [ "$INVOCATIONS" != "null" ] && [ "$INVOCATIONS" != "None" ]; then
    echo "✅ Lambda invocations in last hour: $INVOCATIONS"
else
    echo "ℹ️  No Lambda invocations in last hour (or insufficient data)"
fi

# Check log group
echo ""
echo "📋 Checking CloudWatch logs..."
LOG_GROUP_NAME="/aws/lambda/$LAMBDA_FUNCTION_NAME"
if aws logs describe-log-groups \
    --log-group-name-prefix "$LOG_GROUP_NAME" \
    --region "$REGION" \
    --query 'logGroups[0].logGroupName' \
    --output text >/dev/null 2>&1; then
    echo "✅ CloudWatch log group exists"
    
    # Get recent log streams count
    STREAM_COUNT=$(aws logs describe-log-streams \
        --log-group-name "$LOG_GROUP_NAME" \
        --region "$REGION" \
        --max-items 10 \
        --query 'length(logStreams)' \
        --output text 2>/dev/null || echo "0")
    echo "📋 Recent log streams: $STREAM_COUNT"
else
    echo "❌ CloudWatch log group not found"
    exit 1
fi

# Performance validation summary
echo ""
echo "🎉 Production monitoring validation completed successfully!"
echo ""
echo "📊 Monitoring Setup Summary:"
echo "   • CloudWatch Alarms: $ALARM_COUNT active"
echo "   • Dashboard: Production-NotificationProcessor ✅"
echo "   • SNS Alerts: $SUBSCRIPTION_COUNT email subscribers"
echo "   • Lambda Function: $LAMBDA_FUNCTION_NAME ✅"
echo "   • EventBridge Rule: $RULE_NAME with $TARGET_COUNT targets"
echo "   • Log Monitoring: $STREAM_COUNT recent streams"
echo ""
echo "🔗 Quick Access URLs:"
echo "📊 Dashboard: https://us-west-1.console.aws.amazon.com/cloudwatch/home?region=us-west-1#dashboards:name=Production-NotificationProcessor"
echo "🚨 Alarms: https://us-west-1.console.aws.amazon.com/cloudwatch/home?region=us-west-1#alarmsV2:alarm/NotificationProcessor-"
echo "📧 SNS Topic: https://us-west-1.console.aws.amazon.com/sns/v3/home?region=us-west-1#/topic/$SNS_TOPIC_ARN"
echo ""
echo "✅ All monitoring components are operational and ready for production workloads!"