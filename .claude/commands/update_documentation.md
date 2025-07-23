---
title: "Update Documentation"
description: "Create or update project documentation following enterprise standards"
---

Update or create project documentation files following the established documentation structure and formatting standards observed in /docs/* architecture.

**CRITICAL: Documentation Location Requirements:**
- **NEVER create .md files in project root directory** - All documentation must be placed within /docs/ folder structure
- **ALWAYS place documentation in appropriate /docs/XX-folder/** based on content type
- **NEVER create random .md files with session names, implementation notes, or summary files in root**
- **NEVER break existing folder organization** - Follow established 00-10 structure strictly

**Documentation Standards:**
- Follow structured 00-10 folder organization (/docs/00-overview/ through /docs/10-appendices/)
- Use enterprise-grade formatting with comprehensive sections and subsections
- Include practical examples, code blocks, and implementation details
- Add proper YAML frontmatter with metadata (title, version, status)
- Use consistent markdown formatting with tables, diagrams, and structured content
- Include "Related Documentation" section linking to relevant files
- Add "Last Updated" footer with date and status

**Documentation Structure Pattern:**
```markdown
# Document Title

## Overview
Brief description and purpose

## Architecture/Implementation
Detailed technical content with examples

## Procedures/Usage
Step-by-step instructions and commands

## Configuration/Examples
Code blocks, configuration samples, practical examples

## Troubleshooting
Common issues and solutions

## Related Documentation
- **[Link Title](../folder/file.md)** - Description
- **[Link Title](../folder/file.md)** - Description

**Last Updated**: Date  
**Version**: X.Y.Z  
**Status**: Status Description ✅
```

**File Organization & Content Placement Rules:**

**MANDATORY FILE PLACEMENT:**
- **00-overview/**: System architecture, environment setup, high-level overviews, executive summaries
- **01-requirements/**: User stories, specifications, business requirements, implementation plans
- **02-design/**: UI/UX design, component patterns, styling guides, architecture decision records (ADRs)
- **03-domains/**: Business domain documentation (authentication, CRM, project-management, etc.)
- **04-implementation/**: Code patterns, technical implementation guides, API documentation
- **05-testing/**: Testing strategies, framework documentation, coverage reports, test results
- **06-deployment/**: Deployment procedures, CI/CD, release management, environment setup
- **07-operations/**: Monitoring, logging, maintenance, incident response, runbooks
- **08-security/**: Security procedures, compliance, audit requirements (if needed)
- **09-migration/**: Data migration, upgrade procedures, compatibility guides
- **10-appendices/**: Session summaries, additional resources, references, glossaries, archives

**Content Type → Location Mapping:**
- Session summaries/completion notes → **10-appendices/**
- Implementation guides → **04-implementation/**
- Architecture diagrams → **00-overview/** or **02-design/**
- Testing documentation → **05-testing/**
- Operational procedures → **07-operations/**
- User stories/requirements → **01-requirements/**

**PROHIBITED ACTIONS:**
- ❌ Creating .md files in project root (/, /src/, /components/, etc.)
- ❌ Random file names like "session-notes.md", "implementation-summary.md" in root
- ❌ Breaking existing folder hierarchy or creating new top-level folders
- ❌ Duplicating content across multiple locations

**Implementation Requirements:**
- Create comprehensive content with practical examples
- Use consistent formatting following observed patterns from system-overview.md, production-monitoring.md, and enterprise-deployment-procedures.md
- Include bash script examples, configuration samples, and code snippets
- Add proper error handling and troubleshooting sections
- Ensure documentation is actionable and enterprise-ready
- Cross-reference related documentation appropriately
- Maintain backward compatibility with existing documentation structure

**Content Enhancement:**
- Add implementation details beyond basic descriptions  
- Include real-world examples and use cases
- Provide step-by-step procedures where applicable
- Add configuration templates and code samples
- Include performance considerations and best practices
- Document known limitations and workarounds