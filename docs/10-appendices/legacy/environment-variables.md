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

## Environment Variable Contract (Final)

> **Note**: Environment contract verification (`verify:env-contract`) has been removed from Amplify builds as of August 2025. The modern dynamic mapping approach via `.env.staging`/`.env.production` eliminates the need for pre-build validation.

### Frontend (Exposed: `NEXT_PUBLIC_*`)

| Variable | Required (Prod) | Purpose | Notes |
|----------|-----------------|---------|-------|
| `NEXT_PUBLIC_ENVIRONMENT` | Yes | Logical environment identity | One of `sandbox|staging|production` |
| `NEXT_PUBLIC_BACKEND_SUFFIX` | Yes | DynamoDB table suffix | Drives `ModelName-<suffix>-NONE` naming |
| `NEXT_PUBLIC_GRAPHQL_URL` | Yes | AppSync GraphQL endpoint | From Amplify outputs |
| `NEXT_PUBLIC_USER_POOL_ID` | Yes | Cognito User Pool ID | Non-secret identifier |
| `NEXT_PUBLIC_USER_POOL_CLIENT_ID` | Yes | Cognito App Client | Public client id |
| `NEXT_PUBLIC_S3_PUBLIC_BASE_URL` | Yes | Public asset base URL | Used for uploaded file references |
| `NEXT_PUBLIC_AWS_REGION` | Yes | Region | Mirrors `AWS_REGION` |
| `NEXT_PUBLIC_LOG_LEVEL` | No | Client log verbosity | Default `INFO` if omitted |

### Backend / Build (Not exposed)

| Variable | Required (Prod) | Purpose | Notes |
|----------|-----------------|---------|-------|
| `AWS_REGION` | Yes | AWS region for SDK clients | Must match Amplify deployment region |
| `TABLE_SUFFIX` | Yes (Lambdas) | Alias of backend suffix for functions | Derived from `NEXT_PUBLIC_BACKEND_SUFFIX` in pipeline when possible |
| `EXPECTED_PROD_SUFFIX` | Optional | Drift detection anchor | Build warns if mismatch |
| `EXPECTED_STAGING_SUFFIX` | Optional | Drift detection anchor | Same as above |
| `STRICT_SUFFIX_ENFORCEMENT` | Optional | Enable hard failure on legacy literals | **DEPRECATED**: Removed from Amplify builds |

### Parameter Store (Secrets)

| Parameter | Purpose | Scope |
|-----------|---------|-------|
| `/amplify/sendgrid/api-key` | SendGrid API key | Email notifications |
| `/amplify/twilio/account-sid` | Twilio Account SID | SMS notifications |
| `/amplify/twilio/auth-token` | Twilio Auth Token | SMS notifications |
| (others...) | Additional service credentials | Add via SSM; never `NEXT_PUBLIC_` |

### Lambda Runtime Resolution
Lambdas read `TABLE_SUFFIX` (or fall back to `NEXT_PUBLIC_BACKEND_SUFFIX` if injected) to construct table names via a centralized helper. No function code contains hardcoded historic suffix values.

### Drift Detection
If `EXPECTED_PROD_SUFFIX` or `EXPECTED_STAGING_SUFFIX` is set and does not match the active suffix, the verifier script emits a warning (or fails when `STRICT_SUFFIX_ENFORCEMENT=true`). This guards against unintended backend swaps.

## AWS Amplify Configuration

Environment variables are automatically loaded based on git branch (and table suffix is now dynamic — see `ENVIRONMENT_CONFIG_DYNAMIC_PLAN.md` for the refactor rationale):

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

## Verification & Guard Scripts

| Script | Purpose | Typical Usage |
|--------|---------|---------------|
| `npm run verify:env-contract` | Validates required vars + drift + legacy literal scan | CI pre-build step |
| `npm run verify:rendered-configs` | Ensures rendered config artifacts contain only active suffix | After config render |
| `npm run verify:migration-guards` | Asserts migration scripts fail safely without env | PR safety gate |
| `npm run verify:active-suffix` | Confirms current suffix appears in active DynamoDB tables | Periodic / CI (with AWS creds) |

### Regex Guard (Planned Test)
A Phase 6 test will scan runtime sources for patterns like `-[a-z0-9]{24}-NONE` and fail if an unknown suffix literal appears (excluding allowlisted current suffix). This prevents regression to hardcoded table names.

## Adding New Variables
1. Decide if the value is secret. If yes, put it in Parameter Store (NOT `NEXT_PUBLIC_*`).
2. If needed client-side, prefix with `NEXT_PUBLIC_` and document in the table above.
3. Update `scripts/verify-env-contract.js` to mark required in production if critical.
4. Add to `.env.*` files (development placeholders) and Amplify environment configuration.

## Rotation Procedure (Backend Suffix)
1. Set a new `NEXT_PUBLIC_BACKEND_SUFFIX` (and derived `TABLE_SUFFIX`) in a non-production environment.
2. Deploy; ensure `verify:active-suffix` fails (expected) until new tables are provisioned/migrated.
3. Migrate data / provision tables; rerun `verify:active-suffix` (should pass).
4. Update `EXPECTED_*_SUFFIX` variables post-rotation and commit the change.

## FAQ
**Q: Why keep `TABLE_SUFFIX` separate from `NEXT_PUBLIC_BACKEND_SUFFIX`?**  
To allow future divergence (e.g., masked public suffix) while today they remain identical for simplicity.

**Q: Can I hardcode a suffix in a one-off script?**  
Prefer exporting a variable; guard scripts may start flagging direct literals.

**Q: What breaks if I forget a required var?**  
`verify:env-contract` will fail build; at runtime Lambdas throw early if `TABLE_SUFFIX` missing.
