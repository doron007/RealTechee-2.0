# Project Reorganization Summary (June 16, 2025)

## Files Moved to /scripts

### Shell Scripts
- cleanup_empty_dirs.sh
- cleanup_images.sh
- flatten_assets.sh
- migrate-wix-media.sh
- update-gallery-utils.sh

### Shell Scripts Moved Back to Root
- deploy-to-prod.sh (moved back to root as it's a primary workflow script)

### JavaScript/MJS Scripts
- debug-graphql.js
- test_current_sandbox.js
- fix-all-tables.mjs
- fix-dates-simple.mjs
- test-graphql-direct.mjs
- test-single-table.mjs

### Python Scripts
- test_aws_connection.py

### Migration Scripts
All scripts from the /migration folder were moved to /scripts/migration:
- fix-all-dates.py
- fix-date-formats.py
- test-date-fix.py

## Documentation Files Moved to /docs
- AMPLIFY-GEN2-MODERNIZATION.md
- CLAUDE.md
- MIGRATION-READY.md
- MIGRATION_SUCCESS_REPORT.md
- PROJECT_STRUCTURE.md
- SERVER_MEDIA_MIGRATION.md
- SERVER_MEDIA_PRESENTATION.md
- VERSION_GUIDE.md
- fix-notes.md
- instructions.md
- font_usage_summary.txt

## New Files Created
- /scripts/README.md - Documentation for the scripts directory
- /docs/README.md - Documentation for the docs directory
- /scripts/utils/check_references.sh - Utility to check for references to moved files

## Folders Removed
- /migration (after contents were moved to /scripts/migration)

## README Updates
- Updated main README.md to reflect the new project structure
- Updated document references to point to the new locations

This reorganization improves the project structure by:
1. Centralizing all utility scripts in a single directory
2. Grouping all documentation in one location
3. Reducing root directory clutter
4. Providing better organization for future development
