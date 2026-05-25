# Agent B Partial Blocker — IAM User for API Routes

**Date:** 2026-05-25
**Scope:** PARTIAL blocker on the API-routes-credential side-task only. Main migration (home-server deploy + DNS handoff prep) proceeds.

## What was blocked
Auto-mode classifier denied creation of IAM user `realtechee-www-server` with policy for:
- `lambda:InvokeFunction` on `amplify-d200k2wsaf8th3-pr-notificationprocessor*`
- `ses:SendEmail` / `ses:SendRawEmail` on the `realtechee.com` and `info@realtechee.com` SES identities

Classifier reason: backend was scoped "stays as-is"; this would be a new permission grant.

## Why it was needed (the gap)
Two frontend paths reach AWS APIs directly from the SSR runtime:

1. **`pages/api/trigger-notification-processor.ts:5`** — `new LambdaClient(...)` with default credential chain. On Amplify Hosting an attached IAM role made this work invisibly. On home server, no role exists → these calls throw at runtime.
2. **`services/notifications/notificationService.ts:114,121`** — reads `process.env.AWS_ACCESS_KEY_ID` directly. Falls back to empty string → fails.

## Impact analysis (why this is NOT a hard blocker for migration)
- Business is closed; zero real public traffic.
- These API routes are admin-only fallbacks (manual signal trigger, admin notification send). The primary notification flow is signal → EventBridge cron → Lambda → SES, all server-side on AWS — does NOT traverse the home server.
- Phase 1 of this project already disabled the EventBridge schedules anyway, so the lambda-side notification flow is dormant.
- Home-server site can serve every public page, every form (which writes to AppSync via API key, not Lambda), and every admin read (via Cognito → AppSync) WITHOUT these creds.
- The only thing that breaks: clicking "Resend" or "Manually trigger notification processor" in `/admin/notification-monitor` — an admin convenience.

## Resolution path (user can run when ready)
When user explicitly authorizes, run:

```bash
# 1. Create user
aws iam create-user --user-name realtechee-www-server

# 2. Attach the least-privilege policy
aws iam put-user-policy \
  --user-name realtechee-www-server \
  --policy-name realtechee-www-server-policy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "InvokeNotificationProcessor",
        "Effect": "Allow",
        "Action": "lambda:InvokeFunction",
        "Resource": "arn:aws:lambda:us-west-1:403266990862:function:amplify-d200k2wsaf8th3-pr-notificationprocessor*"
      },
      {
        "Sid": "SendSESEmail",
        "Effect": "Allow",
        "Action": ["ses:SendEmail", "ses:SendRawEmail"],
        "Resource": [
          "arn:aws:ses:us-west-1:403266990862:identity/realtechee.com",
          "arn:aws:ses:us-west-1:403266990862:identity/info@realtechee.com"
        ]
      }
    ]
  }'

# 3. Generate access key
aws iam create-access-key --user-name realtechee-www-server

# 4. SSH home server and append to .env.production.local:
#    AWS_REGION=us-west-1
#    AWS_ACCESS_KEY_ID=<from step 3>
#    AWS_SECRET_ACCESS_KEY=<from step 3>
#    NOTIFICATION_PROCESSOR_FUNCTION_NAME=amplify-d200k2wsaf8th3-pr-notificationprocessorlam-baS6VFLeXNeh

# 5. Rebuild + restart PM2
ssh doron@192.168.4.200 'cd ~/apps/realtechee/app && npm run build && pm2 restart realtechee-www'
```

The production notification-processor function name is already resolved: `amplify-d200k2wsaf8th3-pr-notificationprocessorlam-baS6VFLeXNeh`.

## Decision applied for now
Proceed with migration. Set `AWS_ACCESS_KEY_ID` to empty in `.env.production.local` so calls fail predictably (HTTP 500 on those admin endpoints) rather than triggering AWS SDK retry-storms. Site as a whole works.
