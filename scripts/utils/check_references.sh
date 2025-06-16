#!/bin/bash

# Script to check for references to moved files
# This helps locate any hardcoded paths that need to be updated

echo "Checking for references to moved script files..."
grep -r --include="*.{json,js,ts,tsx}" "cleanup_empty_dirs.sh\|cleanup_images.sh\|deploy-to-prod.sh\|flatten_assets.sh\|migrate-wix-media.sh\|update-gallery-utils.sh\|debug-graphql.js\|test_current_sandbox.js\|fix-all-tables.mjs\|fix-dates-simple.mjs\|test-graphql-direct.mjs\|test-single-table.mjs\|test_aws_connection.py" --exclude-dir={node_modules,.next,scripts} .

echo -e "\nChecking for references to moved documentation files..."
grep -r --include="*.{json,js,ts,tsx}" "AMPLIFY-GEN2-MODERNIZATION.md\|CLAUDE.md\|MIGRATION-READY.md\|MIGRATION_SUCCESS_REPORT.md\|PROJECT_STRUCTURE.md\|SERVER_MEDIA_MIGRATION.md\|SERVER_MEDIA_PRESENTATION.md\|VERSION_GUIDE.md\|fix-notes.md\|instructions.md\|font_usage_summary.txt" --exclude-dir={node_modules,.next,docs} .

echo -e "\nDone checking references."
