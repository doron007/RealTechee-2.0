# Environment Variables Documentation

## Overview

This project uses a hybrid approach for environment variables in AWS Amplify Gen 2:

- **Frontend Variables**: Stored in `.env.*` files (build-time)
- **Backend Secrets**: Stored in AWS Parameter Store (runtime)

## File Structure

```
.env.development    # Local development
.env.staging        # Staging branch (shared backend)
.env.production     # Production branch (isolated backend)
```

## Required Variables

### Frontend (NEXT_PUBLIC_*)

| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXT_PUBLIC_S3_PUBLIC_BASE_URL` | S3 bucket URL for file uploads | `https://bucket.s3.region.amazonaws.com` |
| `NEXT_PUBLIC_LOG_LEVEL` | Client-side logging level | `DEBUG`, `INFO`, `WARN`, `ERROR` |
| `NEXT_PUBLIC_ENVIRONMENT` | Environment identifier | `development`, `staging`, `production` |
| `NEXT_PUBLIC_BACKEND_SUFFIX` | DynamoDB table suffix | `fvn7t5hbobaxjklhrqzdl4ac34` |

### Backend (AWS Parameter Store)

| Parameter | Purpose | 
|-----------|---------|
| `/amplify/sendgrid/api-key` | SendGrid API key for email |
| `/amplify/twilio/account-sid` | Twilio account SID for SMS |
| `/amplify/twilio/auth-token` | Twilio auth token |

## AWS Amplify Configuration

Environment variables are automatically loaded based on git branch:

- `main` branch → `.env.development`
- `staging` branch → `.env.staging` 
- `production` branch → `.env.production`

## Security Notes

- Never commit API keys to `.env` files
- Use AWS Parameter Store for sensitive values
- Only `NEXT_PUBLIC_*` variables are exposed to frontend
- Production secrets are managed via AWS Console

## Validation

Run environment validation:

```bash
./scripts/validate-production-env.js
```

## Troubleshooting

### S3 Upload Issues
Check `NEXT_PUBLIC_S3_PUBLIC_BASE_URL` matches your environment's S3 bucket.

### Build Issues
Ensure all `NEXT_PUBLIC_*` variables are defined in the appropriate `.env.*` file.

### Backend Issues
Verify Parameter Store values in AWS Console → Systems Manager → Parameter Store.
