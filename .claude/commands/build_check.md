---
title: "Production Build Check"
description: "Validate production readiness with build and type checking"
---

!npm run build && npm run type-check

Validate production readiness by:
1. Running production build to catch any build errors
2. Running TypeScript type checking for strict mode compliance
3. Ensuring all imports and dependencies are correctly resolved
4. Address all warning during build as we want clean build from errors and warning.

This should complete without errors before deploying to production or making significant changes.