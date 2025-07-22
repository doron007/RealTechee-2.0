# Production Monitoring & Observability

## Overview

This document provides comprehensive production monitoring and observability procedures for RealTechee 2.0. The monitoring system utilizes AWS CloudWatch for metrics collection, SNS for alerting, custom monitoring scripts for health validation, and enterprise-grade observability patterns.

## Monitoring Architecture

### CloudWatch Dashboard Configuration

#### Primary Production Dashboard
**Dashboard Name**: `RealTechee-Production-Monitoring`
**Location**: AWS CloudWatch Console (us-west-1)
**Update Frequency**: Real-time (1-minute intervals)
**Retention**: 15 months (extended retention for compliance)

#### Key Performance Indicators (KPIs)
```json
{
  "application_performance": {
    "availability": {
      "target": "99.9%",
      "measurement": "HTTP 200 responses / total requests",
      "alert_threshold": "< 99.5%"
    },
    "response_time": {
      "target": "< 3 seconds (95th percentile)",
      "measurement": "End-to-end page load time",
      "alert_threshold": "> 5 seconds"
    },
    "error_rate": {
      "target": "< 1%",
      "measurement": "5XX errors / total requests",
      "alert_threshold": "> 5%"
    },
    "throughput": {
      "target": "1000+ requests/hour",
      "measurement": "Requests per minute average",
      "alert_threshold": "< 100 requests/hour (off-hours)"
    }
  },
  "infrastructure_performance": {
    "database_latency": {
      "target": "< 100ms average",
      "measurement": "DynamoDB response time",
      "alert_threshold": "> 500ms"
    },
    "lambda_performance": {
      "target": "< 5 seconds duration",
      "measurement": "Average function execution time",
      "alert_threshold": "> 30 seconds"
    },
    "storage_performance": {
      "target": "< 2 seconds file access",
      "measurement": "S3 GET/PUT response time",
      "alert_threshold": "> 10 seconds"
    }
  }
}
```

### Dashboard Widget Configuration

#### Widget 1: Application Health Overview
```json
{
  "type": "metric",
  "properties": {
    "metrics": [
      ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", "RealTechee-ALB"],
      [".", "HTTPCode_Target_2XX_Count", ".", "."],
      [".", "HTTPCode_Target_4XX_Count", ".", "."], 
      [".", "HTTPCode_Target_5XX_Count", ".", "."],
      [".", "RequestCount", ".", "."]
    ],
    "view": "timeSeries",
    "stacked": false,
    "region": "us-west-1",
    "title": "Application Response Metrics",
    "period": 300,
    "stat": "Average"
  }
}
```

#### Widget 2: Database Performance Monitoring
```json
{
  "type": "metric",
  "properties": {
    "metrics": [
      ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "Contacts-aqnqdrctpzfwfjwyxxsmu6peoq-NONE"],
      [".", "ConsumedWriteCapacityUnits", ".", "."],
      [".", "SuccessfulRequestLatency", "TableName", "Requests-aqnqdrctpzfwfjwyxxsmu6peoq-NONE", "Operation", "Query"],
      [".", ".", "TableName", "Projects-aqnqdrctpzfwfjwyxxsmu6peoq-NONE", "Operation", "Scan"],
      [".", ".", "TableName", "Quotes-aqnqdrctpzfwfjwyxxsmu6peoq-NONE", "Operation", "GetItem"]
    ],
    "view": "timeSeries",
    "stacked": false,
    "region": "us-west-1", 
    "title": "DynamoDB Performance Metrics",
    "period": 300,
    "yAxis": {
      "left": {
        "min": 0,
        "max": 1000
      }
    }
  }
}
```

#### Widget 3: Lambda Function Health
```json
{
  "type": "metric",
  "properties": {
    "metrics": [
      ["AWS/Lambda", "Duration", "FunctionName", "notification-processor"],
      [".", "Errors", ".", "."],
      [".", "Invocations", ".", "."],
      [".", "Duration", "FunctionName", "user-admin"],
      [".", "Errors", ".", "."],
      [".", "Duration", "FunctionName", "status-processor"],
      [".", "Throttles", ".", "."]
    ],
    "view": "timeSeries",
    "stacked": false,
    "region": "us-west-1",
    "title": "Lambda Function Performance",
    "period": 300,
    "stat": "Average"
  }
}
```

#### Widget 4: Business Metrics Dashboard
```json
{
  "type": "metric", 
  "properties": {
    "metrics": [
      ["RealTechee/Business", "RequestsSubmitted", { "stat": "Sum" }],
      [".", "QuotesGenerated", { "stat": "Sum" }],
      [".", "ProjectsCompleted", { "stat": "Sum" }],
      [".", "UserLogins", { "stat": "Sum" }],
      [".", "ActiveSessions", { "stat": "Average" }]
    ],
    "view": "timeSeries",
    "stacked": false,
    "region": "us-west-1",
    "title": "Business Performance Metrics",
    "period": 3600,
    "annotations": {
      "horizontal": [
        {
          "label": "Target Requests/Day",
          "value": 100
        }
      ]
    }
  }
}
```

## Alert Configuration & Escalation

### SNS Topic Architecture
```yaml
Production Alerts:
  Topic: RealTechee-Production-Alerts
  ARN: arn:aws:sns:us-west-1:ACCOUNT:RealTechee-Production-Alerts
  Subscriptions:
    - Email: info@realtechee.com (Primary)
    - Email: ops-team@realtechee.com (Operations)
    - SMS: +1-XXX-XXX-XXXX (Emergency only)
  
Alert Categories:
  Critical:
    Topic: RealTechee-Critical-Alerts
    Response: Immediate (< 5 minutes)
    Escalation: Auto-escalate after 10 minutes
    
  Warning:
    Topic: RealTechee-Warning-Alerts  
    Response: Monitor (< 30 minutes)
    Escalation: Manual escalation only
    
  Information:
    Topic: RealTechee-Info-Alerts
    Response: Log only
    Escalation: None
```

### Critical Alert Definitions

#### P0 - Critical System Down
```yaml
high_error_rate:
  description: "Error rate exceeds 5% for 2 consecutive periods"
  threshold: "HTTPCode_Target_5XX_Count > 10 in 5 minutes"
  evaluation_periods: 2
  datapoints_to_alarm: 2
  actions:
    - SNS: RealTechee-Critical-Alerts
    - Lambda: trigger-auto-rollback (if deployment-related)
    - PagerDuty: P0 incident creation
```

```yaml
application_unavailable:
  description: "Application health check failures"
  threshold: "Health check failures > 3 consecutive"
  evaluation_periods: 3
  datapoints_to_alarm: 3
  actions:
    - SNS: RealTechee-Critical-Alerts
    - Lambda: initiate-incident-response
    - CloudWatch: create-support-case
```

```yaml
database_connectivity_failure:
  description: "DynamoDB connectivity or throttling issues"
  threshold: "DynamoDB errors > 10 in 5 minutes"
  evaluation_periods: 1
  datapoints_to_alarm: 1
  actions:
    - SNS: RealTechee-Critical-Alerts
    - Lambda: activate-read-only-mode
    - CloudWatch: escalate-to-aws-support
```

#### P1 - Performance Degradation
```yaml
elevated_response_time:
  description: "95th percentile response time exceeds 3 seconds"
  threshold: "TargetResponseTime > 3.0 seconds"
  evaluation_periods: 3
  datapoints_to_alarm: 2
  actions:
    - SNS: RealTechee-Warning-Alerts
    - Lambda: initiate-performance-investigation
```

```yaml
database_latency_high:
  description: "DynamoDB latency exceeds normal thresholds"
  threshold: "SuccessfulRequestLatency > 100ms average"
  evaluation_periods: 3
  datapoints_to_alarm: 2  
  actions:
    - SNS: RealTechee-Warning-Alerts
    - CloudWatch: capacity-scaling-evaluation
```

### CloudWatch Alarms Implementation

#### Critical Alarm: Application Error Rate
```bash
#!/bin/bash
# Create critical error rate alarm

aws cloudwatch put-metric-alarm \
  --alarm-name "RealTechee-Critical-Error-Rate" \
  --alarm-description "Application error rate exceeds 5%" \
  --metric-name "HTTPCode_Target_5XX_Count" \
  --namespace "AWS/ApplicationELB" \
  --statistic "Sum" \
  --dimensions Name=LoadBalancer,Value=RealTechee-ALB \
  --period 300 \
  --evaluation-periods 2 \
  --datapoints-to-alarm 2 \
  --threshold 10 \
  --comparison-operator "GreaterThanThreshold" \
  --alarm-actions "arn:aws:sns:us-west-1:ACCOUNT:RealTechee-Critical-Alerts" \
  --ok-actions "arn:aws:sns:us-west-1:ACCOUNT:RealTechee-Info-Alerts" \
  --treat-missing-data "notBreaching" \
  --tags Key=Environment,Value=Production Key=AlertLevel,Value=Critical
```

#### Warning Alarm: Response Time Degradation
```bash
#!/bin/bash
# Create response time warning alarm

aws cloudwatch put-metric-alarm \
  --alarm-name "RealTechee-Response-Time-Warning" \
  --alarm-description "Response time exceeds 3 seconds (95th percentile)" \
  --metric-name "TargetResponseTime" \
  --namespace "AWS/ApplicationELB" \
  --statistic "Average" \
  --dimensions Name=LoadBalancer,Value=RealTechee-ALB \
  --period 300 \
  --evaluation-periods 3 \
  --datapoints-to-alarm 2 \
  --threshold 3.0 \
  --comparison-operator "GreaterThanThreshold" \
  --alarm-actions "arn:aws:sns:us-west-1:ACCOUNT:RealTechee-Warning-Alerts" \
  --ok-actions "arn:aws:sns:us-west-1:ACCOUNT:RealTechee-Info-Alerts"
```

## Health Check Implementation

### Comprehensive Health Check System
```bash
#!/bin/bash
# Enterprise health check implementation
# Location: /scripts/comprehensive-health-check.sh

HEALTH_CHECK_ID="HC-$(date +%Y%m%d%H%M%S)"
echo "=== RealTechee Comprehensive Health Check ==="
echo "Check ID: $HEALTH_CHECK_ID"
echo "Timestamp: $(date -Iseconds)"

# Health check results tracking
HEALTH_STATUS=0
HEALTH_REPORT="/tmp/health-check-$HEALTH_CHECK_ID.json"

# Initialize health report
cat > $HEALTH_REPORT << EOF
{
  "healthCheckId": "$HEALTH_CHECK_ID",
  "timestamp": "$(date -Iseconds)",
  "environment": "production",
  "checks": {}
}
EOF

# 1. Application Availability Check
echo "1. Checking application availability..."
APP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}:%{time_total}" https://d200k2wsaf8th3.amplifyapp.com/)
APP_CODE=$(echo $APP_RESPONSE | cut -d: -f1)
APP_TIME=$(echo $APP_RESPONSE | cut -d: -f2)

if [ "$APP_CODE" = "200" ]; then
  echo "   ✅ Application: HEALTHY (HTTP $APP_CODE, ${APP_TIME}s)"
  jq '.checks.application = {"status": "healthy", "httpCode": '$APP_CODE', "responseTime": '$APP_TIME'}' $HEALTH_REPORT > tmp.$$ && mv tmp.$$ $HEALTH_REPORT
else
  echo "   ❌ Application: UNHEALTHY (HTTP $APP_CODE)"
  HEALTH_STATUS=1
  jq '.checks.application = {"status": "unhealthy", "httpCode": '$APP_CODE', "error": "Invalid HTTP response"}' $HEALTH_REPORT > tmp.$$ && mv tmp.$$ $HEALTH_REPORT
fi

# 2. GraphQL API Health Check
echo "2. Checking GraphQL API health..."
API_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{ listContacts(limit: 1) { items { id } } }"}' \
  https://374sdjlh3bdnhp2sz4qttvyhce.appsync-api.us-west-1.amazonaws.com/graphql)

if echo "$API_RESPONSE" | jq -e '.data' > /dev/null 2>&1; then
  echo "   ✅ GraphQL API: HEALTHY"
  jq '.checks.graphqlApi = {"status": "healthy", "response": "valid"}' $HEALTH_REPORT > tmp.$$ && mv tmp.$$ $HEALTH_REPORT
else
  echo "   ❌ GraphQL API: UNHEALTHY"
  HEALTH_STATUS=1
  jq '.checks.graphqlApi = {"status": "unhealthy", "error": "Invalid GraphQL response"}' $HEALTH_REPORT > tmp.$$ && mv tmp.$$ $HEALTH_REPORT
fi

# 3. Database Connectivity Check
echo "3. Checking database connectivity..." 
DB_CHECK=$(node scripts/test-basic-connectivity.mjs 2>&1)
if [ $? -eq 0 ]; then
  echo "   ✅ Database: HEALTHY"
  jq '.checks.database = {"status": "healthy", "details": "All tables accessible"}' $HEALTH_REPORT > tmp.$$ && mv tmp.$$ $HEALTH_REPORT
else
  echo "   ❌ Database: UNHEALTHY"
  HEALTH_STATUS=1
  jq --arg error "$DB_CHECK" '.checks.database = {"status": "unhealthy", "error": $error}' $HEALTH_REPORT > tmp.$$ && mv tmp.$$ $HEALTH_REPORT
fi

# 4. Authentication System Check
echo "4. Checking authentication system..."
USER_POOL_ID=$(jq -r '.auth.user_pool_id' amplify_outputs.json)
AUTH_CHECK=$(aws cognito-idp describe-user-pool --user-pool-id $USER_POOL_ID 2>&1)
if [ $? -eq 0 ]; then
  echo "   ✅ Authentication: HEALTHY"
  jq '.checks.authentication = {"status": "healthy", "userPoolId": "'$USER_POOL_ID'"}' $HEALTH_REPORT > tmp.$$ && mv tmp.$$ $HEALTH_REPORT
else
  echo "   ❌ Authentication: UNHEALTHY"
  HEALTH_STATUS=1
  jq '.checks.authentication = {"status": "unhealthy", "error": "User pool access failed"}' $HEALTH_REPORT > tmp.$$ && mv tmp.$$ $HEALTH_REPORT
fi

# 5. File Storage Check
echo "5. Checking file storage..."
BUCKET_NAME=$(jq -r '.storage.bucket_name' amplify_outputs.json)
STORAGE_CHECK=$(aws s3 ls s3://$BUCKET_NAME/ 2>&1)
if [ $? -eq 0 ]; then
  echo "   ✅ Storage: HEALTHY"
  jq '.checks.storage = {"status": "healthy", "bucketName": "'$BUCKET_NAME'"}' $HEALTH_REPORT > tmp.$$ && mv tmp.$$ $HEALTH_REPORT
else
  echo "   ❌ Storage: UNHEALTHY"  
  HEALTH_STATUS=1
  jq '.checks.storage = {"status": "unhealthy", "error": "S3 bucket access failed"}' $HEALTH_REPORT > tmp.$$ && mv tmp.$$ $HEALTH_REPORT
fi

# 6. Lambda Function Health Check
echo "6. Checking Lambda function health..."
FUNCTIONS=("notification-processor" "user-admin" "status-processor")
LAMBDA_STATUS=0

for func in "${FUNCTIONS[@]}"; do
  FUNC_STATUS=$(aws lambda get-function --function-name $func 2>&1)
  if [ $? -eq 0 ]; then
    echo "   ✅ Lambda ($func): HEALTHY"
  else
    echo "   ❌ Lambda ($func): UNHEALTHY"
    LAMBDA_STATUS=1
    HEALTH_STATUS=1
  fi
done

if [ $LAMBDA_STATUS -eq 0 ]; then
  jq '.checks.lambdaFunctions = {"status": "healthy", "functions": ["notification-processor", "user-admin", "status-processor"]}' $HEALTH_REPORT > tmp.$$ && mv tmp.$$ $HEALTH_REPORT
else
  jq '.checks.lambdaFunctions = {"status": "degraded", "error": "Some functions unavailable"}' $HEALTH_REPORT > tmp.$$ && mv tmp.$$ $HEALTH_REPORT
fi

# 7. Performance Metrics Check
echo "7. Checking performance metrics..."
PERF_CHECK=$(aws cloudwatch get-metric-statistics \
  --namespace "AWS/ApplicationELB" \
  --metric-name "TargetResponseTime" \
  --dimensions Name=LoadBalancer,Value=RealTechee-ALB \
  --start-time $(date -d "15 minutes ago" -Iseconds) \
  --end-time $(date -Iseconds) \
  --period 300 \
  --statistics Average \
  --query 'Datapoints[0].Average' \
  --output text 2>/dev/null)

if [ "$PERF_CHECK" != "None" ] && [ "$PERF_CHECK" != "" ]; then
  RESPONSE_TIME=$(printf "%.2f" $PERF_CHECK)
  if (( $(echo "$RESPONSE_TIME < 3.0" | bc -l) )); then
    echo "   ✅ Performance: HEALTHY (${RESPONSE_TIME}s avg response)"
    jq '.checks.performance = {"status": "healthy", "avgResponseTime": '$RESPONSE_TIME'}' $HEALTH_REPORT > tmp.$$ && mv tmp.$$ $HEALTH_REPORT
  else
    echo "   ⚠️  Performance: DEGRADED (${RESPONSE_TIME}s avg response)"
    jq '.checks.performance = {"status": "degraded", "avgResponseTime": '$RESPONSE_TIME'}' $HEALTH_REPORT > tmp.$$ && mv tmp.$$ $HEALTH_REPORT
  fi
else
  echo "   ℹ️  Performance: NO DATA AVAILABLE"
  jq '.checks.performance = {"status": "unknown", "error": "Insufficient metrics data"}' $HEALTH_REPORT > tmp.$$ && mv tmp.$$ $HEALTH_REPORT
fi

# Final health status determination
if [ $HEALTH_STATUS -eq 0 ]; then
  OVERALL_STATUS="healthy"
  echo ""
  echo "🎉 OVERALL HEALTH: HEALTHY"
  echo "All systems operational"
else
  OVERALL_STATUS="unhealthy"
  echo ""
  echo "🚨 OVERALL HEALTH: UNHEALTHY"
  echo "Critical issues detected - immediate attention required"
fi

# Update final report
jq '.overallStatus = "'$OVERALL_STATUS'"' $HEALTH_REPORT > tmp.$$ && mv tmp.$$ $HEALTH_REPORT

# Store health check results
cp $HEALTH_REPORT /var/log/health-checks/$(date +%Y%m%d)-health-checks.log 2>/dev/null || true

echo "Health check completed: $HEALTH_CHECK_ID"
echo "Report available at: $HEALTH_REPORT"

exit $HEALTH_STATUS
```

### Automated Health Check Scheduling
```bash
#!/bin/bash
# Setup automated health checks via cron
# Location: /scripts/setup-health-monitoring.sh

# Add to crontab for regular health monitoring
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/ec2-user/scripts/comprehensive-health-check.sh >> /var/log/health-checks.log 2>&1") | crontab -

# Weekly comprehensive health report
(crontab -l 2>/dev/null; echo "0 6 * * 1 /home/ec2-user/scripts/generate-weekly-health-report.sh") | crontab -

echo "✅ Automated health monitoring configured"
```

## Performance Monitoring & Analytics

### Custom Business Metrics Collection
```javascript
// Custom metrics implementation for business KPIs
// Location: utils/metricsCollector.js

const AWS = require('aws-sdk');
const cloudWatch = new AWS.CloudWatch({ region: 'us-west-1' });

class BusinessMetricsCollector {
  constructor() {
    this.namespace = 'RealTechee/Business';
    this.environment = process.env.NODE_ENV || 'development';
  }

  async trackRequestSubmission(requestData) {
    if (this.environment === 'production') {
      const metrics = [
        {
          MetricName: 'RequestsSubmitted',
          Value: 1,
          Unit: 'Count',
          Dimensions: [
            { Name: 'LeadSource', Value: requestData.leadSource || 'Unknown' },
            { Name: 'Environment', Value: 'Production' }
          ]
        }
      ];

      await this.publishMetrics(metrics);
    }
  }

  async trackQuoteGeneration(quoteData) {
    if (this.environment === 'production') {
      const metrics = [
        {
          MetricName: 'QuotesGenerated', 
          Value: 1,
          Unit: 'Count',
          Dimensions: [
            { Name: 'QuoteValue', Value: this.categorizeQuoteValue(quoteData.amount) },
            { Name: 'Environment', Value: 'Production' }
          ]
        },
        {
          MetricName: 'AverageQuoteValue',
          Value: quoteData.amount || 0,
          Unit: 'None',
          Dimensions: [
            { Name: 'Environment', Value: 'Production' }
          ]
        }
      ];

      await this.publishMetrics(metrics);
    }
  }

  async trackUserActivity(userId, action) {
    if (this.environment === 'production') {
      const metrics = [
        {
          MetricName: 'UserActions',
          Value: 1,
          Unit: 'Count',
          Dimensions: [
            { Name: 'Action', Value: action },
            { Name: 'Environment', Value: 'Production' }
          ]
        }
      ];

      await this.publishMetrics(metrics);
    }
  }

  async publishMetrics(metricData) {
    try {
      const params = {
        Namespace: this.namespace,
        MetricData: metricData.map(metric => ({
          ...metric,
          Timestamp: new Date()
        }))
      };

      await cloudWatch.putMetricData(params).promise();
    } catch (error) {
      console.error('Failed to publish metrics:', error);
      // Don't throw - metrics failures shouldn't break application flow
    }
  }

  categorizeQuoteValue(amount) {
    if (amount < 5000) return 'Small';
    if (amount < 25000) return 'Medium';  
    if (amount < 100000) return 'Large';
    return 'Enterprise';
  }
}

module.exports = BusinessMetricsCollector;
```

### Performance Monitoring Implementation
```javascript
// Performance monitoring for Core Web Vitals
// Location: utils/performanceMonitor.js

class PerformanceMonitor {
  constructor() {
    this.enabled = process.env.NODE_ENV === 'production';
    this.cloudWatch = new AWS.CloudWatch({ region: 'us-west-1' });
  }

  collectCoreWebVitals() {
    if (!this.enabled || typeof window === 'undefined') return;

    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.reportMetric('LargestContentfulPaint', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        this.reportMetric('FirstInputDelay', entry.processingStart - entry.startTime);
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      this.reportMetric('CumulativeLayoutShift', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });

    // Page Load Performance
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      this.reportMetric('PageLoadTime', navigation.loadEventEnd - navigation.loadEventStart);
      this.reportMetric('DOMContentLoaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
      this.reportMetric('TimeToFirstByte', navigation.responseStart - navigation.requestStart);
    });
  }

  async reportMetric(metricName, value) {
    if (!this.enabled) return;

    try {
      const params = {
        Namespace: 'RealTechee/Performance',
        MetricData: [{
          MetricName: metricName,
          Value: value,
          Unit: 'Milliseconds',
          Timestamp: new Date(),
          Dimensions: [
            { Name: 'Environment', Value: 'Production' },
            { Name: 'Page', Value: window.location.pathname }
          ]
        }]
      };

      // Use sendBeacon for reliability
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/metrics', JSON.stringify(params));
      } else {
        // Fallback to CloudWatch direct
        await this.cloudWatch.putMetricData(params).promise();
      }
    } catch (error) {
      console.error('Performance metric reporting failed:', error);
    }
  }
}

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  const monitor = new PerformanceMonitor();
  monitor.collectCoreWebVitals();
}
```

## Log Management & Analysis

### Centralized Logging Strategy
```javascript
// Enhanced logging configuration
// Location: utils/productionLogger.js

const winston = require('winston');
const AWS = require('aws-sdk');

class ProductionLogger {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.logLevel = this.environment === 'production' ? 'info' : 'debug';
    
    this.logger = winston.createLogger({
      level: this.logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: {
        service: 'realtechee',
        environment: this.environment,
        version: process.env.npm_package_version || '1.0.0'
      },
      transports: this.createTransports()
    });
  }

  createTransports() {
    const transports = [];

    // Console transport for all environments
    transports.push(new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }));

    // CloudWatch Logs transport for production
    if (this.environment === 'production') {
      const CloudWatchTransport = require('winston-cloudwatch');
      
      transports.push(new CloudWatchTransport({
        logGroupName: '/aws/amplify/RealTechee-Gen2',
        logStreamName: `application-${new Date().toISOString().split('T')[0]}`,
        awsRegion: 'us-west-1',
        jsonMessage: true,
        retentionInDays: 30
      }));
    }

    return transports;
  }

  // Business event logging
  logBusinessEvent(event, data = {}) {
    this.logger.info('Business Event', {
      event,
      data,
      timestamp: new Date().toISOString(),
      category: 'business'
    });
  }

  // Security event logging
  logSecurityEvent(event, data = {}) {
    this.logger.warn('Security Event', {
      event,
      data,
      timestamp: new Date().toISOString(),
      category: 'security'
    });
  }

  // Performance event logging
  logPerformanceEvent(event, metrics = {}) {
    this.logger.info('Performance Event', {
      event,
      metrics,
      timestamp: new Date().toISOString(),
      category: 'performance'
    });
  }

  // Error logging with context
  logError(error, context = {}) {
    this.logger.error('Application Error', {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context,
      timestamp: new Date().toISOString(),
      category: 'error'
    });
  }
}

module.exports = new ProductionLogger();
```

### Log Retention & Compliance
```yaml
Log Retention Policy:
  Application Logs:
    retention: 30 days
    location: /aws/amplify/RealTechee-Gen2/application
    format: JSON structured logging
    
  Error Logs:
    retention: 90 days
    location: /aws/amplify/RealTechee-Gen2/errors
    format: JSON with stack traces
    
  Access Logs:
    retention: 14 days
    location: /aws/amplify/RealTechee-Gen2/access
    format: Common Log Format
    
  Audit Logs:
    retention: 1 year
    location: /aws/amplify/RealTechee-Gen2/audit
    format: JSON structured with metadata
    compliance: SOX, GDPR requirements
    
  Business Event Logs:
    retention: 6 months
    location: /aws/amplify/RealTechee-Gen2/business
    format: JSON structured metrics
    purpose: Analytics and reporting
```

## Operational Procedures & Runbooks

### Daily Operations Checklist
```bash
#!/bin/bash
# Daily operations routine
# Location: /scripts/daily-operations-check.sh

echo "=== RealTechee Daily Operations Check ==="
echo "Date: $(date +%Y-%m-%d)"
echo "Operator: $(whoami)"

# 1. System Health Status
echo "1. SYSTEM HEALTH CHECK"
./scripts/comprehensive-health-check.sh --summary

# 2. Performance Review
echo "2. PERFORMANCE METRICS REVIEW"
YESTERDAY=$(date -d "yesterday" +%Y-%m-%d)

# Get average response time for yesterday
AVG_RESPONSE=$(aws cloudwatch get-metric-statistics \
  --namespace "AWS/ApplicationELB" \
  --metric-name "TargetResponseTime" \
  --dimensions Name=LoadBalancer,Value=RealTechee-ALB \
  --start-time "${YESTERDAY}T00:00:00Z" \
  --end-time "${YESTERDAY}T23:59:59Z" \
  --period 86400 \
  --statistics Average \
  --query 'Datapoints[0].Average' \
  --output text)

echo "   Average Response Time (24h): ${AVG_RESPONSE}s"

# 3. Error Rate Analysis  
echo "3. ERROR RATE ANALYSIS"
ERROR_COUNT=$(aws logs filter-log-events \
  --log-group-name "/aws/amplify/RealTechee-Gen2" \
  --start-time $(date -d "24 hours ago" +%s)000 \
  --filter-pattern "ERROR" \
  --query 'events | length(@)')

echo "   Total Errors (24h): $ERROR_COUNT"

# 4. Business Metrics Summary
echo "4. BUSINESS METRICS"
# New requests submitted yesterday
REQUEST_COUNT=$(aws cloudwatch get-metric-statistics \
  --namespace "RealTechee/Business" \
  --metric-name "RequestsSubmitted" \
  --start-time "${YESTERDAY}T00:00:00Z" \
  --end-time "${YESTERDAY}T23:59:59Z" \
  --period 86400 \
  --statistics Sum \
  --query 'Datapoints[0].Sum' \
  --output text)

echo "   New Requests (24h): ${REQUEST_COUNT:-0}"

# 5. Capacity Utilization
echo "5. CAPACITY UTILIZATION"
# DynamoDB read/write capacity usage
echo "   DynamoDB Capacity: Checking..."
aws cloudwatch get-metric-statistics \
  --namespace "AWS/DynamoDB" \
  --metric-name "ConsumedReadCapacityUnits" \
  --dimensions Name=TableName,Value=Requests-aqnqdrctpzfwfjwyxxsmu6peoq-NONE \
  --start-time "${YESTERDAY}T00:00:00Z" \
  --end-time "${YESTERDAY}T23:59:59Z" \
  --period 86400 \
  --statistics Maximum \
  --query 'Datapoints[0].Maximum' \
  --output text

# 6. Alert Review
echo "6. ALERT REVIEW"
# Check for any active alarms
ACTIVE_ALARMS=$(aws cloudwatch describe-alarms \
  --state-value ALARM \
  --query 'MetricAlarms[?starts_with(AlarmName, `RealTechee`)].AlarmName' \
  --output text)

if [ -n "$ACTIVE_ALARMS" ]; then
  echo "   ⚠️  Active Alarms: $ACTIVE_ALARMS"
else
  echo "   ✅ No Active Alarms"
fi

echo ""
echo "=== Daily Operations Check Complete ==="
echo "Report generated: $(date)"
```

### Weekly Performance Analysis
```bash
#!/bin/bash
# Weekly performance and capacity analysis
# Location: /scripts/weekly-performance-analysis.sh

WEEK_START=$(date -d "7 days ago" +%Y-%m-%d)
WEEK_END=$(date +%Y-%m-%d)

echo "=== RealTechee Weekly Performance Analysis ==="
echo "Period: $WEEK_START to $WEEK_END"

# Performance Trends
echo "## PERFORMANCE TRENDS"

# Weekly response time analysis
aws cloudwatch get-metric-statistics \
  --namespace "AWS/ApplicationELB" \
  --metric-name "TargetResponseTime" \
  --dimensions Name=LoadBalancer,Value=RealTechee-ALB \
  --start-time "${WEEK_START}T00:00:00Z" \
  --end-time "${WEEK_END}T00:00:00Z" \
  --period 86400 \
  --statistics Average,Maximum \
  --query 'Datapoints[*].[Timestamp,Average,Maximum]' \
  --output table

# Business Growth Analysis
echo "## BUSINESS GROWTH METRICS"

# Weekly request volume
WEEKLY_REQUESTS=$(aws cloudwatch get-metric-statistics \
  --namespace "RealTechee/Business" \
  --metric-name "RequestsSubmitted" \
  --start-time "${WEEK_START}T00:00:00Z" \
  --end-time "${WEEK_END}T00:00:00Z" \
  --period 604800 \
  --statistics Sum \
  --query 'Datapoints[0].Sum' \
  --output text)

echo "Total Requests This Week: ${WEEKLY_REQUESTS:-0}"

# Capacity Planning
echo "## CAPACITY PLANNING"

# DynamoDB capacity analysis
echo "DynamoDB Capacity Utilization:"
for table in "Contacts" "Properties" "Requests" "Projects" "Quotes"; do
  MAX_READ=$(aws cloudwatch get-metric-statistics \
    --namespace "AWS/DynamoDB" \
    --metric-name "ConsumedReadCapacityUnits" \
    --dimensions Name=TableName,Value=${table}-aqnqdrctpzfwfjwyxxsmu6peoq-NONE \
    --start-time "${WEEK_START}T00:00:00Z" \
    --end-time "${WEEK_END}T00:00:00Z" \
    --period 604800 \
    --statistics Maximum \
    --query 'Datapoints[0].Maximum' \
    --output text)
  
  echo "  $table: ${MAX_READ:-0} max read units"
done

echo "=== Weekly Analysis Complete ==="
```

---

## Related Documentation

- **[Environment Architecture](../00-overview/environment-architecture.md)** - Infrastructure and environment separation
- **[Enterprise Deployment](../06-deployment/enterprise-deployment-procedures.md)** - Deployment procedures and CI/CD
- **[Operational Procedures](operational-procedures.md)** - Incident response and maintenance runbooks
- **[Logging Configuration](logging-configuration.md)** - Application logging standards and practices

**Last Updated**: July 22, 2025  
**Version**: 3.0.0  
**Status**: Enterprise Production Monitoring Active ✅