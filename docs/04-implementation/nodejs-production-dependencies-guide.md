# Node.js Production Dependencies Guide

## Overview

This guide documents the complete approach to managing Node.js dependencies for AWS Amplify Gen 2 production builds, addressing the critical distinction between development and production dependency resolution when `NODE_ENV=production` is set.

## Background

RealTechee 2.0 uses a **three-environment architecture** with AWS Amplify Gen 2:
1. **Local Development**: `ampx sandbox` with local backend stack
2. **Staging**: AWS Amplify branch with server-built backend
3. **Production**: AWS Amplify branch with isolated backend stack

AWS Amplify builds with `NODE_ENV=production` exclude devDependencies during installation, causing build failures when packages required for compilation (TypeScript types, ESLint, build tools) are placed in devDependencies. This guide establishes the enterprise pattern for dependency classification across all three environments.

## Dependency Classification Strategy

### Production Dependencies (dependencies)
**When to use**: Packages required during the build process or runtime execution

**Categories**:
- **Runtime Dependencies**: Core application packages (React, Next.js, AWS SDK)
- **Build-Time Requirements**: Packages needed during compilation/build
- **Type Definitions**: TypeScript types for packages used in source code
- **Build Tools**: ESLint, PostCSS, Autoprefixer, Tailwind CSS
- **Compilation Tools**: TypeScript compiler helpers, build analyzers

### Development Dependencies (devDependencies)  
**When to use**: Packages only used during local development

**Categories**:
- **Testing Frameworks**: Jest, Playwright, Testing Library
- **Development Servers**: Development-only tools and utilities
- **Code Generation**: Tools that generate files but aren't needed for builds
- **IDE Support**: Editor plugins and development enhancers

## Implementation Pattern

### RealTechee 2.0 Classification Results

**Moved to Production Dependencies**:
```json
{
  "dependencies": {
    "@aws-amplify/backend-cli": "^1.8.0",
    "@next/bundle-analyzer": "^15.4.2", 
    "@types/react-window": "^1.8.8",
    "autoprefixer": "^10.4.21",
    "eslint": "8.32.0",
    "eslint-config-next": "13.1.1",
    "postcss": "^8.5.3",
    "tailwindcss": "^3.4.17",
    "tsx": "^4.19.4"
  }
}
```

**Rationale for Each Move**:

| Package | Reason for Production Classification |
|---------|-------------------------------------|
| `@aws-amplify/backend-cli` | Required for Amplify backend deployment during build |
| `@next/bundle-analyzer` | Build-time analysis tool used with `ANALYZE=true` |
| `@types/react-window` | TypeScript types for source code compilation |
| `autoprefixer` | PostCSS plugin required for CSS processing |
| `eslint` + `eslint-config-next` | Code linting during Next.js build process |
| `postcss` | CSS processing engine for Tailwind compilation |
| `tailwindcss` | CSS framework required during build compilation |
| `tsx` | TypeScript execution for build scripts |

### Decision Tree for Dependency Classification

```
Is package used during AWS Amplify build? 
                ↓ YES
        Is it a TypeScript type definition?
                ↓ YES → dependencies
        Is it a build tool (ESLint, PostCSS, etc.)?
                ↓ YES → dependencies  
        Is it a compilation requirement?
                ↓ YES → dependencies
                ↓ NO
        Only used for local development?
                ↓ YES → devDependencies
```

## Testing Strategy

### Local Production Build Simulation

#### Environment-Specific Testing Strategy

**Local Development Testing**:
```bash
#!/bin/bash
# Test local development environment
echo "=== Local Development Environment Test ==="

# Start sandbox backend
npx ampx sandbox --once

# Verify local environment
node -e "console.log('ENV:', process.env.NEXT_PUBLIC_ENVIRONMENT)"
npm run dev
```

**Staging Environment Simulation**:
```bash
#!/bin/bash
# Simulate AWS Amplify staging build locally
echo "=== Staging Environment Simulation ==="
export NODE_ENV=staging

npm run build
npm run type-check
```

**Production Environment Simulation**:
```bash
#!/bin/bash
# Simulate AWS Amplify production build locally (CRITICAL TEST)
echo "=== Production Environment Simulation ==="
export NODE_ENV=production

echo "1. Clean install (simulating AWS environment)"
rm -rf node_modules package-lock.json
npm install --only=production
npm install  # Install all deps for testing

echo "2. TypeScript compilation check"
npm run type-check

echo "3. Production build execution"
npm run build

echo "4. Build success verification"
if [ $? -eq 0 ]; then
    echo "✅ Production build successful"
else
    echo "❌ Production build failed"
    exit 1
fi
```

### AWS Amplify Build Verification

**Pre-deployment Checklist**:
```bash
# 1. Verify package.json dependencies
grep -A 10 "\"dependencies\":" package.json

# 2. Check for missing TypeScript types
npm run type-check

# 3. Verify ESLint configuration
npx eslint --print-config components/admin/common/VirtualizedDataGrid.tsx

# 4. Test build with production environment
NODE_ENV=production npm run build
```

## Common Failure Patterns & Solutions

### Pattern 1: TypeScript Declaration Missing

**Error Symptom**:
```
Type error: Could not find a declaration file for module 'react-window'
```

**Solution**:
```bash
# Move type definitions to dependencies
npm install --save @types/react-window
npm uninstall --save-dev @types/react-window
```

### Pattern 2: ESLint Not Available

**Error Symptom**:
```
ESLint must be installed in order to run during builds
```

**Solution**:
```bash
# Move ESLint to production dependencies
npm install --save eslint eslint-config-next
npm uninstall --save-dev eslint eslint-config-next
```

### Pattern 3: CSS Processing Failure

**Error Symptom**:
```
Cannot find module 'tailwindcss'
Cannot find module 'postcss'
```

**Solution**:
```bash
# Move CSS tools to production dependencies
npm install --save tailwindcss postcss autoprefixer
npm uninstall --save-dev tailwindcss postcss autoprefixer
```

## Package.json Management Best Practices

### 1. Dependency Audit Process

```bash
#!/bin/bash
# Monthly dependency audit script

echo "=== Dependency Classification Audit ==="

echo "1. Checking for build-time packages in devDependencies"
npx depcheck --ignores="@types/*" --skip-missing

echo "2. Analyzing production build requirements"
NODE_ENV=production npm ls --depth=0

echo "3. Identifying unused dependencies"
npx depcheck --unused

echo "4. Security audit"
npm audit --audit-level=moderate
```

### 2. Lock File Management

**Critical Rules**:
- **Always commit package-lock.json** with package.json changes
- **Never commit with inconsistent lock file** (npm ls should be clean)
- **Regenerate lock file** after dependency classification changes

```bash
# Proper dependency update workflow
npm install [package] --save
git add package.json package-lock.json
git commit -m "deps: add [package] for [reason]"
```

### 3. Version Pinning Strategy

**Production Dependencies**: Pin exact versions for stability
```json
{
  "dependencies": {
    "eslint": "8.32.0",  // Exact version
    "@types/react-window": "^1.8.8"  // Compatible updates
  }
}
```

## Deployment Integration

### AWS Amplify Configuration

**amplify.yml optimization**:
```yaml
frontend:
  phases:
    preBuild:
      commands:
        - npm install  # Will install all dependencies
    build:
      commands:
        - npm run build  # ESLint, TypeScript, PostCSS all available
```

### Environment Variable Dependencies

**Build-time configuration**:
```bash
# Ensure environment variables affect dependency resolution
NODE_ENV=production  # Set by AWS Amplify for production builds
NPM_CONFIG_PRODUCTION=false  # Override to install devDeps if needed
```

## Monitoring & Maintenance

### 1. Build Performance Metrics

**Key Performance Indicators**:
- Build success rate by environment
- Dependency installation time
- TypeScript compilation duration
- ESLint execution time

### 2. Dependency Health Monitoring

```bash
#!/bin/bash
# Weekly dependency health check

echo "=== Dependency Health Report ==="

echo "1. Outdated packages"
npm outdated

echo "2. Security vulnerabilities"
npm audit --json | jq '.metadata.vulnerabilities'

echo "3. Bundle size impact"
ANALYZE=true npm run build | grep "First Load JS"

echo "4. Duplicate dependencies"
npm ls --depth=0 | grep -E "WARN|ERR"
```

### 3. Automated Validation

**GitHub Actions Integration**:
```yaml
name: Dependency Validation
on: [pull_request]

jobs:
  validate-deps:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: npm ci
      - name: Production build test
        run: NODE_ENV=production npm run build
      - name: Dependency audit
        run: npm audit --audit-level=high
```

## Rollback Procedures

### Emergency Dependency Rollback

```bash
#!/bin/bash
# Emergency rollback to last known good dependency state

echo "=== Emergency Dependency Rollback ==="

echo "1. Identify last working commit"
git log --oneline package.json | head -5

echo "2. Rollback package files"
git checkout HEAD~1 -- package.json package-lock.json

echo "3. Reinstall dependencies"
npm ci

echo "4. Verify build"
npm run build

echo "5. Deploy rollback"
git add package.json package-lock.json
git commit -m "rollback: emergency dependency rollback to restore builds"
```

## Related Documentation

- **[AWS Amplify Gen 2 Complete Guide](../06-deployment/aws-amplify-gen2-complete-guide.md)** - Complete deployment procedures
- **[Environment Variable Troubleshooting](../07-operations/environment-variable-troubleshooting.md)** - Environment configuration
- **[Production Monitoring Setup](../07-operations/production-monitoring.md)** - Build monitoring procedures
- **[System Overview](../00-overview/system-overview.md)** - Architecture overview

## Appendices

### A. Complete Dependency Migration Log

**Session: August 14, 2025 - Production Build Fix**

| Commit | Package Moved | Reason |
|--------|---------------|---------|
| `9a7779e` | `@next/bundle-analyzer` | Build analysis tool |
| `e6f7a8f` | `postcss`, `autoprefixer` | CSS processing |
| `7049659` | `@types/react-window`, `eslint` | TypeScript + linting |
| `982d029` | Updated `package-lock.json` | Lock exact versions |

### B. AWS Amplify Build Log Analysis

**Before Fixes** (Failed):
```
Error: Could not find a declaration file for module 'react-window'
ESLint must be installed in order to run during builds
```

**After Fixes** (Success):
```
✓ Compiled successfully in 32.0s
Linting and checking validity of types ...
✓ Generating static pages (33/33)
```

---

**Last Updated**: August 14, 2025  
**Version**: 4.2.2  
**Status**: Production Ready - Complete Node.js Dependency Management ✅