#!/bin/bash

# Production Performance Monitoring Setup Script
# Sets up CloudWatch dashboards, alarms, and SNS alerts for the notification system

set -e

echo "🚀 Setting up production performance monitoring..."
echo "⚡ Region: us-west-1"
echo "📊 Environment: Production"

# Configuration
REGION="us-west-1"
SNS_TOPIC_ARN="arn:aws:sns:us-west-1:403266990862:production-alerts"
LAMBDA_FUNCTION_NAME="amplify-realtecheeclone-p-notificationprocessorlam-lmoY8kniQzu7"
EVENTBRIDGE_RULE_NAME="notification-processor-schedule"

# Check if SNS topic exists, create if not
echo "📧 Setting up SNS alert topic..."
if ! aws sns get-topic-attributes --topic-arn "$SNS_TOPIC_ARN" --region "$REGION" >/dev/null 2>&1; then
    echo "📧 Creating SNS topic for production alerts..."
    SNS_TOPIC_ARN=$(aws sns create-topic \
        --name "production-alerts" \
        --region "$REGION" \
        --output text \
        --query 'TopicArn')
    
    # Subscribe admin email to alerts
    aws sns subscribe \
        --topic-arn "$SNS_TOPIC_ARN" \
        --protocol email \
        --notification-endpoint "info@realtechee.com" \
        --region "$REGION"
    
    echo "✅ SNS topic created: $SNS_TOPIC_ARN"
else
    echo "✅ SNS topic already exists: $SNS_TOPIC_ARN"
fi

# Create Lambda error alarm
echo "🚨 Creating Lambda error alarm..."
aws cloudwatch put-metric-alarm \
    --alarm-name "NotificationProcessor-LambdaErrors-Production" \
    --alarm-description "Lambda function errors for production notification processor" \
    --alarm-actions "$SNS_TOPIC_ARN" \
    --metric-name "Errors" \
    --namespace "AWS/Lambda" \
    --statistic "Sum" \
    --dimensions Name=FunctionName,Value="$LAMBDA_FUNCTION_NAME" \
    --period 300 \
    --evaluation-periods 1 \
    --threshold 1 \
    --comparison-operator GreaterThanOrEqualToThreshold \
    --region "$REGION"

# Create Lambda duration alarm
echo "⏱️ Creating Lambda duration alarm..."
aws cloudwatch put-metric-alarm \
    --alarm-name "NotificationProcessor-LambdaDuration-Production" \
    --alarm-description "Lambda function duration exceeds threshold" \
    --alarm-actions "$SNS_TOPIC_ARN" \
    --metric-name "Duration" \
    --namespace "AWS/Lambda" \
    --statistic "Average" \
    --dimensions Name=FunctionName,Value="$LAMBDA_FUNCTION_NAME" \
    --period 300 \
    --evaluation-periods 2 \
    --threshold 60000 \
    --comparison-operator GreaterThanThreshold \
    --region "$REGION"

# Create EventBridge failed invocations alarm
echo "⚡ Creating EventBridge failed invocations alarm..."
aws cloudwatch put-metric-alarm \
    --alarm-name "NotificationProcessor-EventBridgeFailures-Production" \
    --alarm-description "EventBridge rule failed to invoke Lambda" \
    --alarm-actions "$SNS_TOPIC_ARN" \
    --metric-name "FailedInvocations" \
    --namespace "AWS/Events" \
    --statistic "Sum" \
    --dimensions Name=RuleName,Value="$EVENTBRIDGE_RULE_NAME" \
    --period 300 \
    --evaluation-periods 1 \
    --threshold 1 \
    --comparison-operator GreaterThanOrEqualToThreshold \
    --region "$REGION"

# Create custom metric for notification processing success rate
echo "📈 Creating notification success rate alarm..."
aws cloudwatch put-metric-alarm \
    --alarm-name "NotificationProcessor-LowSuccessRate-Production" \
    --alarm-description "Notification processing success rate below 95%" \
    --alarm-actions "$SNS_TOPIC_ARN" \
    --metric-name "SuccessfulRequestCount" \
    --namespace "AWS/Lambda" \
    --statistic "Sum" \
    --dimensions Name=FunctionName,Value="$LAMBDA_FUNCTION_NAME" \
    --period 900 \
    --evaluation-periods 2 \
    --threshold 0.95 \
    --comparison-operator LessThanThreshold \
    --treat-missing-data breaching \
    --region "$REGION"

# Create CloudWatch dashboard
echo "📊 Creating CloudWatch dashboard..."
DASHBOARD_BODY='{
  "widgets": [
    {
      "type": "metric",
      "x": 0,
      "y": 0,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/Lambda", "Invocations", "FunctionName", "'$LAMBDA_FUNCTION_NAME'" ],
          [ ".", "Errors", ".", "." ],
          [ ".", "Duration", ".", "." ]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "'$REGION'",
        "title": "Lambda Function Metrics",
        "view": "timeSeries"
      }
    },
    {
      "type": "metric",
      "x": 12,
      "y": 0,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/Events", "SuccessfulInvocations", "RuleName", "'$EVENTBRIDGE_RULE_NAME'" ],
          [ ".", "FailedInvocations", ".", "." ]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "'$REGION'",
        "title": "EventBridge Rule Metrics",
        "view": "timeSeries"
      }
    },
    {
      "type": "log",
      "x": 0,
      "y": 6,
      "width": 24,
      "height": 6,
      "properties": {
        "query": "SOURCE '\''/aws/lambda/'$LAMBDA_FUNCTION_NAME''\'' | fields @timestamp, @message\n| filter @message like /📬 Found/\n| sort @timestamp desc\n| limit 20",
        "region": "'$REGION'",
        "title": "Recent Notification Processing",
        "view": "table"
      }
    },
    {
      "type": "log",
      "x": 0,
      "y": 12,
      "width": 24,
      "height": 6,
      "properties": {
        "query": "SOURCE '\''/aws/lambda/'$LAMBDA_FUNCTION_NAME''\'' | fields @timestamp, @message\n| filter @message like /❌/ or @message like /💥/\n| sort @timestamp desc\n| limit 20",
        "region": "'$REGION'",
        "title": "Recent Errors",
        "view": "table"
      }
    }
  ]
}'

aws cloudwatch put-dashboard \
    --dashboard-name "Production-NotificationProcessor" \
    --dashboard-body "$DASHBOARD_BODY" \
    --region "$REGION"

# Create custom metric for notification queue depth
echo "📊 Setting up notification queue depth monitoring..."
aws cloudwatch put-metric-alarm \
    --alarm-name "NotificationProcessor-QueueDepth-Production" \
    --alarm-description "High number of pending notifications in queue" \
    --alarm-actions "$SNS_TOPIC_ARN" \
    --metric-name "ApproximateNumberOfMessages" \
    --namespace "AWS/SQS" \
    --statistic "Average" \
    --period 300 \
    --evaluation-periods 3 \
    --threshold 10 \
    --comparison-operator GreaterThanThreshold \
    --region "$REGION" || echo "⚠️  Note: Queue depth alarm requires SQS setup (optional)"

echo ""
echo "✅ Production monitoring setup completed!"
echo ""
echo "📊 Dashboard URL: https://us-west-1.console.aws.amazon.com/cloudwatch/home?region=us-west-1#dashboards:name=Production-NotificationProcessor"
echo "🚨 Alarms created:"
echo "   • NotificationProcessor-LambdaErrors-Production"
echo "   • NotificationProcessor-LambdaDuration-Production" 
echo "   • NotificationProcessor-EventBridgeFailures-Production"
echo "   • NotificationProcessor-LowSuccessRate-Production"
echo "   • NotificationProcessor-QueueDepth-Production"
echo ""
echo "📧 SNS Topic: $SNS_TOPIC_ARN"
echo "   • Subscribe additional email addresses via AWS Console if needed"
echo ""
echo "🔍 To view logs:"
echo "   aws logs describe-log-streams --log-group-name /aws/lambda/$LAMBDA_FUNCTION_NAME --region $REGION"
echo "   aws logs get-log-events --log-group-name /aws/lambda/$LAMBDA_FUNCTION_NAME --log-stream-name [STREAM_NAME] --region $REGION"