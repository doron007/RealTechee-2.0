# CloudWatch Monitoring Setup Summary

**Setup Date**: Tue Jul 22 06:27:00 PDT 2025
**Region**: us-west-1
**Status**: DRY RUN

## Resources Created

### SNS Topics
- **realtechee-production-alerts**: RealTechee Production Alerts
- **realtechee-error-notifications**: RealTechee Error Notifications

### CloudWatch Alarms
- **RealTechee-Production-HighErrorRate**: Alert when error rate exceeds 5% in production
- **RealTechee-Production-HighLatency**: Alert when response time exceeds 10 seconds
- **RealTechee-Production-DynamoDBThrottling**: Alert on DynamoDB throttling events
- **RealTechee-Production-LowTraffic**: Alert when traffic drops unexpectedly (possible outage)

### Dashboard
- **RealTechee-Production-Dashboard**: Production monitoring dashboard

### Log Groups
- **/aws/lambda/amplify-realtecheeclone-production-sandbox-70796fa803-notificationProcessor**: 30 day retention
- **/aws/lambda/amplify-realtecheeclone-production-sandbox-70796fa803-userAdmin**: 30 day retention
- **/aws/lambda/amplify-realtecheeclone-production-sandbox-70796fa803-statusProcessor**: 30 day retention

## Access Links

### CloudWatch Console
- [Dashboards](https://console.aws.amazon.com/cloudwatch/home?region=us-west-1#dashboards:)
- [Alarms](https://console.aws.amazon.com/cloudwatch/home?region=us-west-1#alarmsV2:)
- [Log Groups](https://console.aws.amazon.com/cloudwatch/home?region=us-west-1#logsV2:log-groups)

### SNS Console
- [Topics](https://console.aws.amazon.com/sns/v3/home?region=us-west-1#/topics)
- [Subscriptions](https://console.aws.amazon.com/sns/v3/home?region=us-west-1#/subscriptions)

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
```bash
aws cloudwatch describe-alarms --region us-west-1 --output table --query 'MetricAlarms[].{Name:AlarmName,State:StateValue,Reason:StateReason}'
```

### Test SNS Notifications
```bash
aws sns publish --topic-arn <TOPIC_ARN> --message "Test notification from monitoring setup" --region us-west-1
```

### View Recent Logs
```bash
aws logs describe-log-streams --log-group-name "/aws/lambda/your-function-name" --region us-west-1
```

