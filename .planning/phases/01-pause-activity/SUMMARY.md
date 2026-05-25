# Phase 1 SUMMARY — Pause Internal Activity

**Executed:** 2026-05-25
**Status:** ✓ COMPLETE
**Duration:** ~2 minutes

## What was done

Disabled all 11 ENABLED EventBridge scheduled rules in us-west-1. None were deleted (fully reversible via `aws events enable-rule --name <rule>`).

| Rule | Schedule (was firing) | Now |
|---|---|---|
| `amplify-d200k2wsaf8th3-pr-notificationprocessorlamb-uHpgZylNyvr0` | cron(*/2 * * * ? *) | DISABLED |
| `amplify-d200k2wsaf8th3-pr-reputationmonitorlambdasc-Nj2AMPIpCH7X` | cron(0 0 * * ? *) | DISABLED |
| `amplify-d200k2wsaf8th3-pr-statusprocessorlambdasche-eeChCuBZf5sk` | cron(0 0 * * ? *) | DISABLED |
| `amplify-d200k2wsaf8th3-st-notificationprocessorlamb-g7xJrE8eqnVK` | cron(*/2 * * * ? *) | DISABLED |
| `amplify-d200k2wsaf8th3-st-reputationmonitorlambdasc-OvWcMdE4pQBa` | cron(0 0 * * ? *) | DISABLED |
| `amplify-d200k2wsaf8th3-st-statusprocessorlambdasche-73MxZ9Twyu9V` | cron(0 0 * * ? *) | DISABLED |
| `amplify-realtecheeclone-d-notificationprocessorlamb-PwxziD1zPVqA` | cron(*/2 * * * ? *) | DISABLED |
| `amplify-realtecheeclone-d-reputationmonitorlambdasc-PnIgaBeMDMsu` | cron(0 0 * * ? *) | DISABLED |
| `amplify-realtecheeclone-d-statusprocessorlambdasche-mliHaz0wG4Tc` | cron(0 0 * * ? *) | DISABLED |
| `notification-processor-schedule` | rate(5 minutes) | DISABLED |
| `realtechee-daily-api-key-check` | cron(0 0 * * ? *) | DISABLED |

## Verification (evidence, not assumption)

- All 11 rules show `State: DISABLED` via `aws events list-rules` post-action
- `curl -I https://www.realtechee.com/` → `HTTP/2 200` (production unaffected)
- `curl -I https://ai.realtechee.com/` → `HTTP/2 200` (n8n frontend unaffected)
- `curl -I https://n8n.realtechee.com/` → `HTTP/1.1 200 OK` (home server unaffected)

## Expected cost impact

- Eliminates ~64,800 `notification-processor` invocations/month + ~10 daily cron invocations
- Stops DDB read/write activity from these crons (was ~$0.59/mo on DynamoDB)
- Stops KMS encryption API ops these crons triggered (was ~$0.50/mo on KMS)
- **Expected new baseline:** ≤ $0.10/mo (DDB/KMS will trend to near zero over next 24h)

Actual confirmation requires 24-hour cost lag (CloudWatch + Cost Explorer settle on day boundary).

## Rollback

If anything is unexpectedly broken (no expected breakage; site is dormant):

```bash
# Re-enable a specific rule:
aws events enable-rule --name <rule-name> --region us-west-1

# Re-enable all (snapshot in rules-pre-disable.json):
for r in $(jq -r '.[].Name' .planning/phases/01-pause-activity/rules-pre-disable.json); do
  aws events enable-rule --name "$r" --region us-west-1
done
```

## Artifacts

- `rules-pre-disable.json` — pre-action snapshot (11 rules, all ENABLED)
- `SUMMARY.md` — this file

## Notes for Phase 2+

- The `amplify-realtecheeclone-d-*` rules will be **deleted** in Phase 2 (orphan stack teardown) — disable was just a safety measure.
- The `amplify-d200k2wsaf8th3-st-*` rules will be **deleted** in Phase 3 (staging teardown).
- The `amplify-d200k2wsaf8th3-pr-*` rules will remain **DISABLED** (kept for trivial reversibility if business reactivates).
- `notification-processor-schedule` and `realtechee-daily-api-key-check` are standalone — disposition TBD with user.
