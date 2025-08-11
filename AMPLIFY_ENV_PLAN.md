
# Amplify Gen 2 Environment & Deployment Plan (Hybrid Three-Stack Approach)

## Goal

- Maintain a robust ecosystem for a single app with three distinct backend stacks: sandbox (local), staging, and production.
- Use Amplify Hosting for staging and production only; local development uses sandbox.
- Minimize operational overhead and ensure reliable migration between environments.
- Ensure all team members and CI/CD flows use the correct backend and settings.

---

## 1. Environment Strategy

- **Three persistent backend stacks:**
  1. **Sandbox (local):** For local development. Use `npx ampx sandbox --once` and generate types/hooks from sandbox for dev.
  2. **Staging:** Managed by Amplify, for server-side validation and beta testing. Created via `ampx pipeline deploy`.
  3. **Production:** Managed by Amplify, for live production. Created via `ampx pipeline deploy`.
- **Migration script** will be used to move data and Cognito users between stacks as needed.
- **Environment variables** in Amplify Console control config for staging and production.

---

## 2. Step-by-Step Plan

### Step 1: Disconnect Local Git Main Branch from Amplify Main Branch

- Local development (main branch) is decoupled from Amplify's Main branch.
- Amplify manages only Staging and Production environments.


### Step 2: Create/Manage Staging and Production Stacks

- Use `ampx pipeline deploy` to create new stacks for staging and production.
- Each deploy creates a new stack for the respective environment.
- After deploying new stacks:
  - Clean up (delete) the current production backend stack to avoid confusion and resource waste.
  - Clean up (delete) the newly created Main stack, since Main will be disconnected and dev will use the sandbox stack.

### Step 3: Migration Script for Data and Cognito Users

- Create a migration script (e.g., `scripts/migrate-data.sh`) to migrate data from the current sandbox stack to the new staging or production stack.
- The script must update PK/FK relationships (e.g., contactId, propertyId, projectId, etc.).
- Cognito user migration: recreate the two users with password "Sababa123!" in the target environment.
- Migration can be performed from staging to a selected new stack (staging or production).

### Step 4: SDLC Workflow

- Develop locally using the sandbox stack.
- Deploy to staging for server validation and beta testing.
- Deploy to production for release.

---


## 3. Migration Details

- The migration script should:
  - Export/import all relevant data, updating PK/FK relationships as needed.
  - Migrate Cognito users, recreating the two main users with password "Sababa123!".
  - Support migration from staging to new stacks (staging or production).
  - Ensure SES (Simple Email Service) and Lambda functions are properly configured and triggered in the target environment after migration.

---

## 4. Security & Secrets Handling (This Plan Execution Only)

STRICT RULE: No credentials or sensitive material are to be committed to git for any step in this plan.

Scope of "credentials / sensitive info":
- API keys (AppSync / API Gateway), Cognito client secrets, temporary AWS access keys, SES SMTP creds, user default passwords, JWTs, signed URLs, PII exports.

Guidelines:
1. Use environment variables (local shell export, `.env.local` in root that is git‑ignored) for all secret inputs to migration scripts.
2. Provide the default password for recreated users via an env var (e.g. `MIGRATION_DEFAULT_PASSWORD`) rather than hardcoding or documenting it in scripts.
3. Do not log raw secrets; mask values (show only last 4 chars) in script output.
4. Store production/staging secrets in AWS Secrets Manager or SSM Parameter Store; scripts should fetch at runtime (read-only permissions).
5. Any temporary IAM users or access keys used for the migration must be rotated or deleted immediately after completion.
6. Redact exported data archives before archival if they contain PII or access tokens; keep them outside the repo (`/backups/migrations/` path in `.gitignore`).
7. SES & Lambda validation steps must not print full event payloads containing user PII; use sampled / sanitized payloads.
8. Never commit the Cognito user export CSV; import it then securely delete / shred locally.
9. Add or confirm patterns in `.gitignore` for: `*.env`, `*.csv`, `backups/migrations/**`, `secrets/**`.
10. If accidental commit occurs, immediately: (a) purge from git history (b) rotate exposed secret.

Recommended minimal env var set for migration run (example):
```
export SOURCE_ENV=sandbox
export TARGET_ENV=staging
export MIGRATION_DEFAULT_PASSWORD="<secure-temp>"
export COGNITO_SOURCE_USER_POOL_ID=...
export COGNITO_TARGET_USER_POOL_ID=...
export APPSYNC_SOURCE_API_URL=...
export APPSYNC_TARGET_API_URL=...
```

NOTE: Values shown elsewhere in this doc are for reference only; treat them as ephemeral and rotate if exposure risk is identified.

---


## Reference: Current Amplify Environment Variables

Below are the current Amplify environment variables for RealTechee-Gen2 (as of August 2025):

| Branch      | Variable             | Value                                                      |
|-------------|----------------------|------------------------------------------------------------|
| All branches| AMPLIFY_APP_ID       | d200kzwsaf8th3                                             |
| All branches| API_KEY              | da2-qe4fcz475hgjb4zr3dh5r7xky                              |
| All branches| BACKEND_SUFFIX       | fvn7t5hbboabxjkhzqd4ac34                                   |
| All branches| GRAPHQL_URL          | https://vbnfy6ynqefclrbkz2anbivhde.appsync-api.us-west-1.amazonaws.com/graphql |
| All branches| IDENTITY_POOL_ID     | us-west-1:eea1986d-7984-484d-8e69-4d3b8afc4851             |
| All branches| S3_BUCKET            | amplify-realteecheclone-main-bucket                        |
| All branches| USER_POOL_CLIENT_ID  | 4pdj4qp05o47a09d42qctl99ccs                                |
| All branches| USER_POOL_ID         | us-west-1_5pFbWCwtUl                                       |
| production  | API_KEY              | da2-PRODUCTION_API_KEY                                     |
| production  | BACKEND_SUFFIX       | aqnqdtczpfvfwjyxvsmu6peoq                                  |
| production  | GRAPHQL_URL          | https://374sdljh3bdmbp2s4qtvthnyc.appsync-api.us-west-1.amazonaws.com/graphql |
| production  | IDENTITY_POOL_ID     | us-west-1:11d5c002-cbe3-4414-bd8f-4f046d2ab457             |
| production  | S3_BUCKET            | amplify-realteecheclone-production-bucket-PROD             |
| production  | USER_POOL_CLIENT_ID  | 5qdj5i3f373b2tn99qf2g9675                                  |
| production  | USER_POOL_ID         | us-west-1_1eQC1gn5h                                        |

---

### Step 2: Data & User Migration (if needed)

- If your chosen dev/stage stack is missing data/users:
  - **Cognito:** Export users from old pool, import into new pool.
  - **DynamoDB:** Export tables from old stack, import into new stack.
  - **Other resources:** Copy or redeploy as needed.
- For production, plan a one-time migration when ready to launch.

### Step 3: Set Environment Variables in Amplify Console

- For each branch, set the following in Amplify Console → Hosting → Environment variables:
  - **Dev/Stage branches (main, staging, feature/*):**
    ```
    AMPLIFY_APP_ID=<staging-app-id>
    USER_POOL_ID=<staging-user-pool-id>
    GRAPHQL_URL=<staging-graphql-url>
    ... (other needed variables)
    ```
  - **Production branch:**
    ```
    AMPLIFY_APP_ID=<prod-app-id>
    USER_POOL_ID=<prod-user-pool-id>
    GRAPHQL_URL=<prod-graphql-url>
    ... (other needed variables)
    ```
- Set shared variables as "All branches" if needed.

### Step 4: Update amplify.yml

- Use a single amplify.yml referencing environment variables:
    ```yaml
    backend:
      phases:
        preBuild:
          commands:
            - echo "Using USER_POOL_ID=$USER_POOL_ID"
            - echo "Using GRAPHQL_URL=$GRAPHQL_URL"
    ```
- No need for branch-specific amplify.yml.

### Step 5: Update Code to Use Env Vars

- In your code, reference environment variables:
    ```ts
    const userPoolId = process.env.NEXT_PUBLIC_USER_POOL_ID;
    const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL;
    ```
- For client-side code, use `NEXT_PUBLIC_` prefix.

### Step 6: Local Development

- Use a `.env` file for local dev, matching the staging backend:
    ```
    NEXT_PUBLIC_USER_POOL_ID=<staging-user-pool-id>
    NEXT_PUBLIC_GRAPHQL_URL=<staging-graphql-url>
    ```
- Do NOT commit sensitive .env files.

### Step 7: CI/CD & Team Onboarding

- Document the environment strategy in README.
- Ensure all team members know which backend stack to use for dev/stage.
- CI/CD pipelines should use Amplify Console environment variables.

### Step 8: Production Launch

- When ready, migrate data from dev/stage to production backend (one-time).
- Update production branch environment variables to point to production stack.

---

## 3. Future State

| Branch      | Backend Stack      | Data Migration Needed | Users/Config Shared? |
|-------------|-------------------|----------------------|----------------------|
| dev/local   | staging           | Initial only         | Yes                  |
| main/staging| staging           | Initial only         | Yes                  |
| feature/*   | staging           | None                 | Yes                  |
| production  | production        | One-time at launch   | No                   |

---

## 4. Benefits

- Only two stacks to maintain.
- Data and users always in sync for dev/stage.
- No more broken triggers or missing templates.
- Easy onboarding for new devs.
- Fast, predictable builds.

---

## 5. Migration Checklist

- [ ] Decide on shared dev/stage stack.
- [ ] Migrate users/data if needed.
- [ ] Set environment variables in Amplify Console for each branch.
- [ ] Update amplify.yml and code to use env vars.
- [ ] Document process for team.
- [ ] Plan production migration.

---

## 6. FAQ

**Q: Do I need a separate amplify.yml for each branch?**  
A: No. Use one amplify.yml and manage settings via Amplify Console environment variables.

**Q: How do I migrate users/data?**  
A: Use AWS CLI, Cognito console, DynamoDB export/import, or custom scripts.

**Q: Can I use feature branches?**  
A: Yes, but they will use the shared dev/stage backend unless you set up ephemeral stacks.

---

## 7. Resources

- [Amplify Hosting Environment Variables](https://docs.aws.amazon.com/amplify/latest/userguide/environment-variables.html)
- [Migrating Cognito Users](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-using-import-tool.html)
- [DynamoDB Data Migration](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/S3DataExport.html)
