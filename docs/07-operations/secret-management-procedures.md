# Secret Management Procedures

## Overview

This document provides comprehensive procedures for managing sensitive configuration data, API keys, and credentials across RealTechee 2.0 environments. The secret management system utilizes AWS Systems Manager Parameter Store with enterprise-grade encryption, access control, and operational procedures.

## Secret Management Architecture

### Storage Strategy

**AWS Systems Manager Parameter Store Integration:**
```yaml
Secret Storage Hierarchy:
/amplify/
├── TWILIO_ACCOUNT_SID (SecureString) - Twilio API authentication
├── TWILIO_AUTH_TOKEN (SecureString) - Twilio API authorization token  
├── TWILIO_FROM_PHONE (String) - Default SMS sender number
├── SENDGRID_API_KEY (SecureString) - Email service authentication
├── FROM_EMAIL (String) - Default email sender address
├── DEBUG_EMAIL (String) - Development/testing email recipient
└── DEBUG_NOTIFICATIONS (String) - Notification debugging flag
```

**Environment-Specific Resource References:**
```yaml
Development Environment:
/amplify/resource_reference/realtecheeclone/doron-sandbox-648934873b/
├── AMPLIFY_DATA_GRAPHQL_ENDPOINT
├── AMPLIFY_DATA_MODEL_INTROSPECTION_SCHEMA_BUCKET_NAME
├── AMPLIFY_DATA_DEFAULT_NAME
├── AMPLIFY_DATA_MODEL_INTROSPECTION_SCHEMA_KEY
└── REAL_TECHEE_USER_UPLOADS_BUCKET_NAME

Production Environment:
/amplify/resource_reference/realtecheeclone/production-sandbox-70796fa803/
├── AMPLIFY_DATA_GRAPHQL_ENDPOINT
├── AMPLIFY_DATA_MODEL_INTROSPECTION_SCHEMA_BUCKET_NAME
├── AMPLIFY_DATA_DEFAULT_NAME
├── AMPLIFY_DATA_MODEL_INTROSPECTION_SCHEMA_KEY
└── REAL_TECHEE_USER_UPLOADS_BUCKET_NAME
```

### Security Classification

**Secret Classification Matrix:**
| Classification | Examples | Storage Type | Access Level | Rotation Policy |
|----------------|----------|--------------|--------------|-----------------|
| **Critical** | TWILIO_AUTH_TOKEN, SENDGRID_API_KEY | SecureString | Restricted | 90 days |
| **Sensitive** | TWILIO_ACCOUNT_SID | SecureString | Controlled | 90 days |
| **Configuration** | FROM_EMAIL, DEBUG_EMAIL | String | Standard | As needed |
| **Resource References** | GraphQL endpoints, bucket names | String | Automated | Environment lifecycle |

## Secret Access & Retrieval

### Programmatic Access

**AWS CLI Secret Retrieval:**
```bash
# Retrieve secure string (decrypted)
aws ssm get-parameter --region us-west-1 \
  --name "/amplify/TWILIO_AUTH_TOKEN" \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text

# Retrieve standard parameter
aws ssm get-parameter --region us-west-1 \
  --name "/amplify/FROM_EMAIL" \
  --query 'Parameter.Value' \
  --output text

# Bulk parameter retrieval
aws ssm get-parameters-by-path --region us-west-1 \
  --path "/amplify/" \
  --recursive \
  --with-decryption
```

**Lambda Function Integration:**
```javascript
// AWS Lambda secret retrieval pattern
const AWS = require('aws-sdk');
const ssm = new AWS.SSM({ region: 'us-west-1' });

const getSecret = async (parameterName) => {
  try {
    const parameter = await ssm.getParameter({
      Name: parameterName,
      WithDecryption: true
    }).promise();
    
    return parameter.Parameter.Value;
  } catch (error) {
    console.error(`Failed to retrieve parameter ${parameterName}:`, error);
    throw error;
  }
};

// Usage examples
const twilioAuthToken = await getSecret('/amplify/TWILIO_AUTH_TOKEN');
const sendGridApiKey = await getSecret('/amplify/SENDGRID_API_KEY');
const fromEmail = await getSecret('/amplify/FROM_EMAIL');
```

**Batch Secret Retrieval:**
```javascript
// Efficient batch secret loading for Lambda initialization
const getSecrets = async (parameterNames) => {
  try {
    const params = {
      Names: parameterNames,
      WithDecryption: true
    };
    
    const result = await ssm.getParameters(params).promise();
    
    // Convert to key-value map
    const secrets = {};
    result.Parameters.forEach(param => {
      const key = param.Name.replace('/amplify/', '');
      secrets[key] = param.Value;
    });
    
    // Log any missing parameters
    if (result.InvalidParameters.length > 0) {
      console.warn('Missing parameters:', result.InvalidParameters);
    }
    
    return secrets;
  } catch (error) {
    console.error('Batch secret retrieval failed:', error);
    throw error;
  }
};

// Production usage
const requiredSecrets = [
  '/amplify/TWILIO_ACCOUNT_SID',
  '/amplify/TWILIO_AUTH_TOKEN', 
  '/amplify/SENDGRID_API_KEY',
  '/amplify/FROM_EMAIL'
];

const secrets = await getSecrets(requiredSecrets);
```

### Deployment Integration

**Secret Validation in Deployment Pipeline:**
```bash
#!/bin/bash
# Enhanced secret validation for production deployments

validate_secrets() {
  echo "🔑 Validating production secrets"
  
  REQUIRED_SECRETS=(
    "/amplify/TWILIO_ACCOUNT_SID"
    "/amplify/TWILIO_AUTH_TOKEN"
    "/amplify/SENDGRID_API_KEY"
    "/amplify/FROM_EMAIL"
    "/amplify/DEBUG_EMAIL"
    "/amplify/TWILIO_FROM_PHONE"
  )
  
  local validation_failed=false
  
  for secret in "${REQUIRED_SECRETS[@]}"; do
    echo "Checking secret: $secret"
    
    if aws ssm get-parameter --region us-west-1 --name "$secret" >/dev/null 2>&1; then
      echo "✅ $secret accessible"
    else
      echo "❌ $secret missing or inaccessible"
      validation_failed=true
    fi
  done
  
  if [ "$validation_failed" = true ]; then
    echo "❌ Secret validation failed - deployment blocked"
    exit 1
  fi
  
  echo "✅ All production secrets validated"
}

# Integration with deployment script
# ./scripts/deploy-with-protection.sh automatically calls validate_secrets() for production deployments
```

## Secret Lifecycle Management

### Secret Creation & Updates

**Creating New Secrets:**
```bash
# Create secure string parameter
aws ssm put-parameter --region us-west-1 \
  --name "/amplify/NEW_SECRET_KEY" \
  --value "secret-value-here" \
  --type "SecureString" \
  --description "Description of the secret purpose" \
  --tags "Key=Environment,Value=Production" "Key=Service,Value=RealTechee"

# Create standard parameter
aws ssm put-parameter --region us-west-1 \
  --name "/amplify/NEW_CONFIG_VALUE" \
  --value "configuration-value" \
  --type "String" \
  --description "Configuration parameter description"
```

**Updating Existing Secrets:**
```bash
# Update secret value (creates new version)
aws ssm put-parameter --region us-west-1 \
  --name "/amplify/TWILIO_AUTH_TOKEN" \
  --value "new-token-value" \
  --type "SecureString" \
  --overwrite \
  --description "Updated Twilio authentication token"

# Verify update
aws ssm get-parameter-history --region us-west-1 \
  --name "/amplify/TWILIO_AUTH_TOKEN" \
  --query 'Parameters[0:3].[Version,LastModifiedDate,Value]' \
  --output table
```

### Secret Rotation Procedures

**Automated Rotation Script:**
```bash
#!/bin/bash
# Secret rotation procedure for production environments

rotate_twilio_credentials() {
  echo "🔄 Rotating Twilio credentials"
  
  # Step 1: Generate new credentials in Twilio console
  echo "1. Generate new credentials in Twilio console"
  echo "2. Test new credentials in development environment"
  read -p "Press enter when new credentials are ready and tested..."
  
  # Step 2: Update secrets in Parameter Store
  echo "Updating TWILIO_ACCOUNT_SID..."
  read -sp "Enter new Twilio Account SID: " NEW_ACCOUNT_SID
  echo
  
  aws ssm put-parameter --region us-west-1 \
    --name "/amplify/TWILIO_ACCOUNT_SID" \
    --value "$NEW_ACCOUNT_SID" \
    --type "SecureString" \
    --overwrite
  
  echo "Updating TWILIO_AUTH_TOKEN..."
  read -sp "Enter new Twilio Auth Token: " NEW_AUTH_TOKEN
  echo
  
  aws ssm put-parameter --region us-west-1 \
    --name "/amplify/TWILIO_AUTH_TOKEN" \
    --value "$NEW_AUTH_TOKEN" \
    --type "SecureString" \
    --overwrite
  
  # Step 3: Trigger application restart (if needed)
  echo "✅ Twilio credentials rotated successfully"
  echo "Note: Lambda functions will pick up new credentials on next execution"
}

rotate_sendgrid_credentials() {
  echo "🔄 Rotating SendGrid API key"
  
  # Step 1: Generate new API key in SendGrid console
  echo "1. Generate new API key in SendGrid console"
  echo "2. Test new API key in development environment"
  read -p "Press enter when new API key is ready and tested..."
  
  # Step 2: Update secret
  echo "Updating SENDGRID_API_KEY..."
  read -sp "Enter new SendGrid API key: " NEW_API_KEY
  echo
  
  aws ssm put-parameter --region us-west-1 \
    --name "/amplify/SENDGRID_API_KEY" \
    --value "$NEW_API_KEY" \
    --type "SecureString" \
    --overwrite
  
  echo "✅ SendGrid API key rotated successfully"
}

# Rotation schedule (recommended)
# Twilio: Every 90 days
# SendGrid: Every 90 days
# Email configurations: As needed
```

**Rotation Calendar:**
```yaml
Secret Rotation Schedule:
├── TWILIO_ACCOUNT_SID: Every 90 days (Quarterly)
├── TWILIO_AUTH_TOKEN: Every 90 days (Quarterly)  
├── SENDGRID_API_KEY: Every 90 days (Quarterly)
├── Configuration Values: As needed (no fixed schedule)
└── Resource References: Automatic (environment lifecycle)
```

## Access Control & Permissions

### IAM Policies

**Lambda Execution Role Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath"
      ],
      "Resource": [
        "arn:aws:ssm:us-west-1:*:parameter/amplify/TWILIO_*",
        "arn:aws:ssm:us-west-1:*:parameter/amplify/SENDGRID_*",
        "arn:aws:ssm:us-west-1:*:parameter/amplify/FROM_EMAIL",
        "arn:aws:ssm:us-west-1:*:parameter/amplify/DEBUG_*"
      ]
    },
    {
      "Effect": "Allow", 
      "Action": [
        "kms:Decrypt"
      ],
      "Resource": [
        "arn:aws:kms:us-west-1:*:key/alias/aws/ssm"
      ]
    }
  ]
}
```

**Administrative Access Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssm:PutParameter",
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath",
        "ssm:DeleteParameter",
        "ssm:GetParameterHistory",
        "ssm:AddTagsToResource",
        "ssm:RemoveTagsFromResource"
      ],
      "Resource": [
        "arn:aws:ssm:us-west-1:*:parameter/amplify/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt",
        "kms:Encrypt",
        "kms:ReEncrypt*",
        "kms:GenerateDataKey*",
        "kms:DescribeKey"
      ],
      "Resource": [
        "arn:aws:kms:us-west-1:*:key/alias/aws/ssm"
      ]
    }
  ]
}
```

### Least Privilege Access

**Environment-Specific Access:**
```yaml
Development Environment:
  Users: Developers, QA testers
  Permissions: Read access to configuration parameters
  Restrictions: No access to production secrets
  
Production Environment:  
  Users: DevOps, System administrators
  Permissions: Full CRUD on production parameters
  Restrictions: MFA required, audit logging enabled
  
Automation (CI/CD):
  Users: GitHub Actions, deployment scripts
  Permissions: Read access for validation, no write access
  Restrictions: Time-limited tokens, specific resource scope
```

## Monitoring & Auditing

### Access Logging

**CloudTrail Parameter Store Events:**
```bash
# Query parameter access logs
aws logs filter-log-events --region us-west-1 \
  --log-group-name "CloudTrail/ParameterStore" \
  --start-time $(date -d "1 day ago" +%s)000 \
  --filter-pattern '{ $.eventName = "GetParameter*" && $.requestParameters.name = "/amplify/*" }'

# Monitor parameter modifications
aws logs filter-log-events --region us-west-1 \
  --log-group-name "CloudTrail/ParameterStore" \
  --start-time $(date -d "1 day ago" +%s)000 \
  --filter-pattern '{ $.eventName = "PutParameter" && $.requestParameters.name = "/amplify/*" }'
```

**Custom Monitoring Dashboard:**
```yaml
CloudWatch Dashboard Widgets:
├── Parameter Access Frequency (by parameter name)
├── Failed Access Attempts (security monitoring)
├── Parameter Modification Events (change tracking)  
├── KMS Key Usage (encryption monitoring)
└── IAM Role Usage (access pattern analysis)
```

### Alerting Configuration

**CloudWatch Alarms for Secret Management:**
```bash
# Alert on failed parameter access
aws cloudwatch put-metric-alarm --region us-west-1 \
  --alarm-name "SSM-Parameter-Access-Failures" \
  --alarm-description "Alert on failed SSM parameter access attempts" \
  --metric-name "ErrorCount" \
  --namespace "AWS/SSM" \
  --statistic "Sum" \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 3 \
  --comparison-operator "GreaterThanThreshold" \
  --alarm-actions "arn:aws:sns:us-west-1:*:RealTechee-Security-Alerts"

# Alert on unusual parameter modification activity
aws cloudwatch put-metric-alarm --region us-west-1 \
  --alarm-name "SSM-Parameter-Unusual-Modifications" \
  --alarm-description "Alert on unusual parameter modification patterns" \
  --metric-name "ParameterModifications" \
  --namespace "Custom/SSM" \
  --statistic "Sum" \
  --period 3600 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator "GreaterThanThreshold"
```

## Emergency Procedures

### Secret Compromise Response

**Immediate Response Procedure:**
```bash
#!/bin/bash
# Emergency secret compromise response

emergency_secret_rotation() {
  local COMPROMISED_SECRET="$1"
  local INCIDENT_ID="SEC-$(date +%Y%m%d%H%M%S)"
  
  echo "🚨 EMERGENCY: Secret compromise detected"
  echo "Secret: $COMPROMISED_SECRET"
  echo "Incident ID: $INCIDENT_ID"
  
  # Step 1: Immediate revocation
  echo "1. Revoking compromised secret in external service..."
  case $COMPROMISED_SECRET in
    "TWILIO_AUTH_TOKEN")
      echo "Revoke token in Twilio console immediately"
      ;;
    "SENDGRID_API_KEY")
      echo "Revoke API key in SendGrid console immediately"
      ;;
  esac
  
  # Step 2: Generate replacement
  echo "2. Generate replacement secret in external service..."
  read -p "Press enter when new secret is generated and ready..."
  
  # Step 3: Update Parameter Store
  echo "3. Updating Parameter Store..."
  read -sp "Enter new secret value: " NEW_SECRET_VALUE
  echo
  
  aws ssm put-parameter --region us-west-1 \
    --name "/amplify/$COMPROMISED_SECRET" \
    --value "$NEW_SECRET_VALUE" \
    --type "SecureString" \
    --overwrite \
    --description "Emergency rotation - Incident $INCIDENT_ID"
  
  # Step 4: Verify deployment pipeline
  echo "4. Validating updated secret accessibility..."
  if aws ssm get-parameter --region us-west-1 --name "/amplify/$COMPROMISED_SECRET" --with-decryption >/dev/null 2>&1; then
    echo "✅ Secret updated successfully"
  else
    echo "❌ Secret update failed - escalate immediately"
    exit 1
  fi
  
  # Step 5: Document incident
  echo "5. Document incident in security log..."
  echo "$(date): Emergency rotation of $COMPROMISED_SECRET - Incident $INCIDENT_ID" >> /var/log/security-incidents.log
  
  echo "✅ Emergency secret rotation completed - Incident $INCIDENT_ID"
}

# Usage: emergency_secret_rotation "TWILIO_AUTH_TOKEN"
```

### Recovery Procedures

**Secret Recovery from Backup:**
```bash
# Recover parameter from history (if accidentally modified)
restore_parameter_from_history() {
  local PARAMETER_NAME="$1"
  local RESTORE_VERSION="$2"
  
  echo "Restoring $PARAMETER_NAME to version $RESTORE_VERSION"
  
  # Get historical value
  HISTORICAL_VALUE=$(aws ssm get-parameter-history --region us-west-1 \
    --name "$PARAMETER_NAME" \
    --query "Parameters[?Version==\`$RESTORE_VERSION\`].Value" \
    --output text)
  
  if [ -n "$HISTORICAL_VALUE" ]; then
    # Restore parameter
    aws ssm put-parameter --region us-west-1 \
      --name "$PARAMETER_NAME" \
      --value "$HISTORICAL_VALUE" \
      --type "SecureString" \
      --overwrite \
      --description "Restored from version $RESTORE_VERSION"
    
    echo "✅ Parameter restored successfully"
  else
    echo "❌ Historical version not found"
    exit 1
  fi
}
```

## Troubleshooting

### Common Issues

**Issue: Secret Not Found**
```bash
# Diagnostic: Check parameter existence
aws ssm get-parameter --region us-west-1 --name "/amplify/SECRET_NAME" 2>&1

# Solution: Verify parameter name and path
aws ssm describe-parameters --region us-west-1 \
  --parameter-filters "Key=Name,Option=BeginsWith,Values=/amplify/"
```

**Issue: Access Denied**
```bash  
# Diagnostic: Check IAM permissions
aws sts get-caller-identity
aws iam simulate-principal-policy \
  --policy-source-arn "arn:aws:iam::ACCOUNT:role/ROLE_NAME" \
  --action-names "ssm:GetParameter" \
  --resource-arns "arn:aws:ssm:us-west-1:ACCOUNT:parameter/amplify/SECRET_NAME"

# Solution: Update IAM policy or request additional permissions
```

**Issue: KMS Decryption Error**
```bash
# Diagnostic: Verify KMS key access
aws kms describe-key --region us-west-1 --key-id "alias/aws/ssm"

# Solution: Ensure KMS decrypt permissions in IAM policy
```

### Validation Scripts

**Complete Secret Health Check:**
```bash
#!/bin/bash
# Comprehensive secret management health check

secret_health_check() {
  echo "🔍 Running secret management health check"
  
  # Check all critical secrets
  CRITICAL_SECRETS=(
    "/amplify/TWILIO_ACCOUNT_SID"
    "/amplify/TWILIO_AUTH_TOKEN"
    "/amplify/SENDGRID_API_KEY"
    "/amplify/FROM_EMAIL"
  )
  
  local health_check_passed=true
  
  for secret in "${CRITICAL_SECRETS[@]}"; do
    echo "Checking $secret..."
    
    # Test parameter existence
    if aws ssm get-parameter --region us-west-1 --name "$secret" >/dev/null 2>&1; then
      echo "  ✅ Parameter exists"
      
      # Test decryption (for SecureString)
      if aws ssm get-parameter --region us-west-1 --name "$secret" --with-decryption >/dev/null 2>&1; then
        echo "  ✅ Decryption successful"
      else
        echo "  ❌ Decryption failed"
        health_check_passed=false
      fi
    else
      echo "  ❌ Parameter not found"
      health_check_passed=false
    fi
  done
  
  if [ "$health_check_passed" = true ]; then
    echo "✅ Secret management health check passed"
  else
    echo "❌ Secret management health check failed"
    exit 1
  fi
}

# Run health check
secret_health_check
```

## Best Practices

### Security Best Practices

1. **Principle of Least Privilege**: Grant minimal required permissions
2. **Regular Rotation**: Rotate secrets every 90 days or as required
3. **Audit Logging**: Monitor all parameter access and modifications
4. **Environment Separation**: Use different parameters for different environments
5. **Encryption at Rest**: Use SecureString type for sensitive values
6. **Access Patterns**: Use batch retrieval for Lambda cold start optimization

### Operational Best Practices

1. **Validation Integration**: Include secret validation in deployment pipelines
2. **Emergency Procedures**: Maintain documented emergency response procedures
3. **Backup Strategy**: Leverage Parameter Store versioning for recovery
4. **Monitoring Setup**: Configure alerts for unusual access patterns
5. **Documentation**: Keep parameter documentation current and accurate

### Development Best Practices

1. **Local Development**: Use separate parameters for local development
2. **Testing Strategy**: Mock secrets in unit tests, use real secrets in integration tests
3. **Error Handling**: Implement robust error handling for secret retrieval
4. **Caching Strategy**: Cache secrets appropriately to reduce API calls
5. **Secret Validation**: Validate secret format and accessibility before use

## Related Documentation

- **[Production Readiness Validation](../00-overview/production-readiness-validation.md)** - Production environment certification procedures
- **[Enterprise Deployment Procedures](../06-deployment/enterprise-deployment-procedures.md)** - Secret validation in deployment pipeline
- **[Production Monitoring](production-monitoring.md)** - Monitoring and alerting for secret management
- **[Operational Procedures](operational-procedures.md)** - Emergency response and incident procedures
- **[Security Architecture](../08-security/security.md)** - Overall security framework and compliance

**Last Updated**: July 22, 2025  
**Version**: 1.0.0  
**Status**: Production Ready - Enterprise Secret Management ✅