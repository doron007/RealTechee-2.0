# Documentation File Naming Standards

## Overview

This document establishes consistent file naming conventions for the RealTechee 2.0 documentation to ensure professional presentation and easy navigation.

## File Naming Convention

### Standard Format
```
{category}-{topic}-{subtopic}.md
```

### Rules
1. **Lowercase only** - All file names use lowercase letters
2. **Hyphen separators** - Use hyphens (-) to separate words, not underscores (_)
3. **Descriptive names** - Names should clearly indicate content
4. **Consistent patterns** - Similar content types follow same naming pattern
5. **No spaces** - Replace spaces with hyphens
6. **Extension** - Always use `.md` for markdown files

### Examples
```
✅ CORRECT:
- system-architecture.md
- user-authentication.md
- api-design-patterns.md
- deployment-strategy.md

❌ INCORRECT:
- System_Architecture.md
- USER-AUTHENTICATION.MD
- api design patterns.md
- DeploymentStrategy.md
```

## Category-Specific Patterns

### Overview Documents
- `README.md` (always capitalized for GitHub convention)
- `system-overview.md`
- `technology-stack.md`

### Requirements Documents
- `business-requirements.md`
- `functional-requirements.md`
- `non-functional-requirements.md`
- `compliance-requirements.md`

### Design Documents
- `system-architecture.md`
- `data-architecture.md`
- `api-design.md`
- `security-design.md`
- `integration-patterns.md`

### Domain Documents
- `README.md` (domain overview)
- `service-architecture.md`
- `data-models.md`
- `api-contracts.md`
- `business-logic.md`

### Implementation Documents
- `development-guidelines.md`
- `coding-standards.md`
- `component-library.md`
- `database-schema.md`
- `api-implementation.md`

### Testing Documents
- `testing-strategy.md`
- `unit-testing.md`
- `integration-testing.md`
- `end-to-end-testing.md`
- `performance-testing.md`

### Operations Documents
- `monitoring-strategy.md`
- `logging-configuration.md`
- `troubleshooting-guide.md`
- `maintenance-procedures.md`

### Security Documents
- `security-overview.md`
- `authentication-design.md`
- `authorization-model.md`
- `data-protection.md`
- `compliance-framework.md`

## Special Cases

### Legacy Content
Legacy documents in `10-appendices/legacy/` may retain original names for historical reference but should include a note about the naming convention change.

### Generated Files
- Build artifacts: `build-info.json`
- API documentation: `api-reference.md`
- Schema files: `graphql-schema.md`

### Configuration Files
- `.gitignore` (standard convention)
- `package.json` (standard convention)
- Documentation configs maintain their standard names

## Migration Plan

### Phase 1: Current File Renames (Immediate)
Rename existing files to follow the new convention:

```bash
# Example renames needed:
AMPLIFY_PATTERNS.md → amplify-patterns.md
PROJECT_STRUCTURE.md → project-structure.md
VERSION_GUIDE.md → version-guide.md
LOGGING.md → logging-configuration.md
LOG_LEVEL_CONTROL.md → log-level-control.md
```

### Phase 2: Update References (Immediate)
Update all internal links and references to use new file names.

### Phase 3: Future Compliance (Ongoing)
All new documentation must follow the established naming convention.

## Quality Assurance

### Pre-commit Checks
- File names follow the lowercase-hyphen pattern
- No spaces or special characters in file names
- Consistent with category patterns

### Review Process
- All new files reviewed for naming compliance
- Link validation after any rename operations
- Consistency checks across documentation

## Benefits

### Professional Presentation
- Consistent appearance across all documentation
- Easy to navigate and reference
- Professional enterprise standards

### Technical Benefits
- URL-friendly file names
- Case-insensitive file system compatibility
- Predictable naming patterns for automation

### Maintenance Benefits
- Easier to find and organize files
- Reduced confusion about file locations
- Simplified link management

This naming standard ensures the documentation maintains a professional, consistent appearance suitable for enterprise environments and portfolio demonstration.