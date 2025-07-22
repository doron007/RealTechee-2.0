---
title: "Backup Data"
description: "Execute data backup before schema changes"
---

!./scripts/backup-data.sh

**CRITICAL**: Always run this before making any schema changes to AWS Amplify backend.

AWS will purge data without warning when resources are recreated during schema changes. This backup script ensures data protection and recovery capability.

**When to use:**
- Before modifying amplify/backend.ts
- Before changing GraphQL schema
- Before updating DynamoDB table structures
- Before any AWS infrastructure changes