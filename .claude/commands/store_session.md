---
title: "Store Session Progress"
description: "Save current session status and learnings to project documentation"
---

Save current session status and learnings, updating CLAUDE.md, PLANNING.md, and TASKS.md. 

**Requirements:**
- Consolidate information without losing context or key information
- Reduce token size with shortcuts or symbols that AI agents can understand
- Update completion status of current tasks
- Add any new discovered issues to the issue tracking section
- Update session summary with achievements and next priorities
- Maintain backward compatibility for future AI agents
- Consolidate and compress "CURRENT SESSION SUMMARY" section CLAUDE.md without losing context or important information from perspective of new session that need to continue from where last session finished. Older or less relevant information for new session, can be consider to be migrated to one of the *.md in the 01-10 folders in /docs

**Files to update:**
- CLAUDE.md: Current session summary and achievements
- TASKS.md: Task completion status and new priorities  
- PLANNING.md: Any architectural or strategic updates

**Format:** Use efficient documentation that preserves context while optimizing for AI agent understanding. Tables columns should be ascii aligned (add padding and consider symbols are wider than charaters).