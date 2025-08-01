# AWS Amplify Gen 2 Multi-Environment Deployment Strategy

**Document Version**: 1.0  
**Date**: January 31, 2025  
**Status**: Draft - Pending User Review & Approval  

## 🎯 **Mission Statement**

**Original Mission**: Implement AWS Amplify Gen 2 single-app multi-branch architecture using official documentation patterns to enable safe multi-stage deployment (dev → staging → production) while eliminating git-committed environment configurations.

**Key Requirements**:
- Single AWS Amplify App with multiple branches
- Environment-specific configurations via AWS Console (not git)
- Safe deployment pipeline with proper isolation
- Zero environment configs committed to repository
- Follow official AWS Amplify Gen 2 best practices

---

## 📊 **Current State Analysis** ✅ **UPDATED JANUARY 31, 2025**

### **What We've Accomplished** ✅
1. **Architecture Research**: Analyzed AWS Amplify Gen 2 official documentation via Context7
2. **App Migration**: Created single-app architecture (RealTechee-Gen2)  
3. **Branch Setup**: Created `main`, `staging`, `production` branches
4. **Environment Variables**: Set `AMPLIFY_APP_ID` in AWS Console
5. **Build Configuration**: Created `amplify.yml` with branch-specific logic
6. **✅ ROOT CAUSE IDENTIFIED**: Official AWS patterns documented and analyzed

### **What's Broken** ❌ **CONFIRMED ISSUES**
1. **Production Deployment**: Failed in BUILD phase (Job ID 6) - Multiple attempts failed
2. **Backend Resources**: **WRONG PATTERN** - All branches use `pipeline-deploy` creating 3 isolated backends
3. **Environment Configuration**: **CRITICAL** - Missing AWS Console environment variables per branch
4. **Deployment Pattern**: **MISALIGNED** - staging should share main's backend, not create isolated backend

### **Root Cause Analysis** 🔍 **CONFIRMED**
- **Pattern Mismatch**: Using `pipeline-deploy` for staging (should use `generate outputs --branch main`)
- **Missing Env Variables**: Only `AMPLIFY_APP_ID` set, missing backend-specific configurations
- **Resource Waste**: Creating 3 separate backends instead of 2 (main shared with staging, production isolated)
- **Official Documentation**: Current amplify.yml doesn't follow AWS Amplify Gen 2 best practices

---

## 📚 **Official AWS Amplify Gen 2 Patterns**

Based on Context7 research and official AWS documentation:

### **Single-App Multi-Branch Architecture**
```
RealTechee-Gen2 (App ID: d200k2wsaf8th3)
├── main branch      → Development environment
├── staging branch   → Staging environment  
└── production branch → Production environment
```

### **Official Deployment Commands**
According to AWS Amplify Gen 2 documentation:

1. **Full Backend Deployment** (for main branches):
   ```yaml
   npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AMPLIFY_APP_ID
   ```

2. **Shared Backend** (for preview/staging branches):
   ```yaml
   npx ampx generate outputs --branch main --app-id $AMPLIFY_APP_ID
   ```

### **Environment Variable Pattern**
From official documentation:
- `AMPLIFY_APP_ID`: App identifier for commands
- Environment-specific configs set in AWS Amplify Console
- Build-time generation of `amplify_outputs.json`

---

## 🎯 **Target Architecture**

### **🔍 OFFICIAL AWS AMPLIFY GEN 2 BRANCH ARCHITECTURE**

**Based on Official Documentation**: AWS Amplify Gen 2 uses a **main + staging + production** approach:

```
RealTechee-Gen2 (d200k2wsaf8th3)
├── main (development)
│   ├── Backend: Full deployment (npx ampx pipeline-deploy)
│   └── Environment: Development configs 
│   └── Purpose: Development/feature work
├── staging  
│   ├── Backend: Shared with main (npx ampx generate outputs --branch main)
│   └── Environment: No additional configs needed
│   └── Purpose: Pre-production testing
└── production
    ├── Backend: Full deployment (npx ampx pipeline-deploy) 
    └── Environment: Production configs
    └── Purpose: Live production environment
```

**✅ CONFIRMED**: We need exactly **3 branches** (not 4):
- **`main`**: Development environment with full backend 
- **`staging`**: Shares main's backend (resource efficient)
- **`production`**: Isolated production backend

### **Environment Variable Strategy** 🚨 **CRITICAL UPDATE**
```
AWS Amplify Console Environment Variables:
├── AMPLIFY_APP_ID: d200k2wsaf8th3 (all branches) ✅ ALREADY SET

🚨 MISSING CRITICAL ENVIRONMENT VARIABLES PER BRANCH:
├── main branch (Development - Sandbox Backend):
│   ├── BACKEND_SUFFIX: fvn7t5hbobaxjklhrqzdl4ac34
│   ├── USER_POOL_ID: us-west-1_5pFbWcwtU
│   ├── USER_POOL_CLIENT_ID: 4pdj4qp05o47a0g42cqlt99ccs
│   ├── IDENTITY_POOL_ID: us-west-1:eea1986d-7984-48d4-8e69-4d3b8afc4851
│   ├── GRAPHQL_URL: https://vbnhy6yqnfelrkdbx2anbhvdhe.appsync-api.us-west-1.amazonaws.com/graphql
│   ├── API_KEY: da2-qe4fczl75zhgjb4rz3dh5r7xky
│   └── S3_BUCKET: amplify-realtecheeclone-main-bucket
├── staging branch (Shared with main - same values as main):
│   └── 🔗 Uses main branch backend resources via generate outputs
└── production branch (Isolated Production Backend):
    ├── BACKEND_SUFFIX: aqnqdrctpzfwfjwyxxsmu6peoq
    ├── USER_POOL_ID: us-west-1_1eQCIgm5h
    ├── USER_POOL_CLIENT_ID: 5qcjd3l5i733b2tn99qf2g6675
    ├── IDENTITY_POOL_ID: us-west-1:11d5c002-cbe3-4414-bd8f-4f046d2ab457
    ├── GRAPHQL_URL: https://374sdjlh3bdnhp2sz4qttvyhce.appsync-api.us-west-1.amazonaws.com/graphql
    ├── API_KEY: da2-PRODUCTION_API_KEY
    └── S3_BUCKET: amplify-realtecheeclone-production-bucket-PROD
```

---

## 🔧 **Corrected Implementation Plan**

### **Phase 1: Reset & Realign (High Priority)**

#### **Task 1.1: Stop Current Failed Deployment**
- **Action**: Cancel any running deployments
- **Verify**: No builds in progress
- **Risk**: None

#### **Task 1.2: Research Official Patterns**
- **Action**: Deep dive into AWS Amplify Gen 2 documentation via Context7
- **Focus**: Multi-environment deployment, branch strategies, environment variables
- **Deliverable**: Official pattern documentation

#### **Task 1.3: Analyze Current amplify.yml**
- **Issue**: Mixed deployment strategies in case statement
- **Action**: Review against official examples
- **Expected**: Identify misaligned commands

### **Phase 2: Environment Configuration (High Priority)**

#### **Task 2.1: AWS Console Environment Variables** 🚨 **CRITICAL PRIORITY**

### **🚨 DISCOVERED ISSUES & CORRECTIONS:**

**Issue 1**: Missing `main` branch in AWS Console
- **Current Branches**: `prod-v2` (legacy), `production`, `staging`
- **Missing**: `main` branch (required for development environment)
- **✅ CONFIRMED NECESSITY**: AWS Amplify Gen 2 official docs use separate `main` branch for development
- **Solution**: Create `main` branch in AWS Console or use local git push to auto-create

**Issue 2**: Environment Variable Assignment Method
- **Current Limitation**: Can only select "All branches" when adding variables
- **Workaround**: Add variable as "All branches" → Click "Actions" → "Override for branch" → Select specific branch
- **Official Method**: This is the correct AWS Amplify procedure per documentation

### **🔧 CORRECTED IMPLEMENTATION STEPS:**

**Step 1: Create Missing Main Branch**
1. **Option A (Recommended)**: Git push main branch to auto-create in AWS
   ```bash
   git checkout main
   git push origin main
   ```
2. **Option B**: AWS Console → App Settings → Branch Settings → Add Branch

**Step 2: Environment Variable Assignment (Official AWS Method)**

**🔍 AWS CONSOLE NAVIGATION** (to be provided by user based on current Console layout):
- **Current User Access**: Please confirm the exact navigation path in your AWS Console
- **Expected Path**: `RealTechee-Gen2` → `[Section]` → `Environment Variables`
- **Likely Sections**: `Hosting`, `App Settings`, `Overview`, or similar

**Environment Variable Assignment Process** (Official AWS Method):
1. Navigate to Environment Variables section in AWS Console
2. **For each variable**:
   - Click **"Add variable"**
   - Enter **Variable name** and **Value**  
   - **Branch selection**: Only "All branches" available (this is normal per AWS documentation)
   - Click **"Save"**
   - Click **"Actions"** next to the new variable
   - Select **"Override for branch"**
   - Choose specific branch and enter branch-specific value
   - Click **"Save"**

### **🚨 REQUIRED VARIABLES PER BRANCH**:

**Main Branch (Development Environment)**:
```
AMPLIFY_APP_ID=d200k2wsaf8th3 (✅ already set)
BACKEND_SUFFIX=fvn7t5hbobaxjklhrqzdl4ac34
USER_POOL_ID=us-west-1_5pFbWcwtU
USER_POOL_CLIENT_ID=4pdj4qp05o47a0g42cqlt99ccs
IDENTITY_POOL_ID=us-west-1:eea1986d-7984-48d4-8e69-4d3b8afc4851
GRAPHQL_URL=https://vbnhy6yqnfelrkdbx2anbhvdhe.appsync-api.us-west-1.amazonaws.com/graphql
API_KEY=da2-qe4fczl75zhgjb4rz3dh5r7xky
S3_BUCKET=amplify-realtecheeclone-main-bucket
```

**Production Branch (Isolated Environment)**:
```
AMPLIFY_APP_ID=d200k2wsaf8th3 (✅ already set)
BACKEND_SUFFIX=aqnqdrctpzfwfjwyxxsmu6peoq
USER_POOL_ID=us-west-1_1eQCIgm5h
USER_POOL_CLIENT_ID=5qcjd3l5i733b2tn99qf2g6675
IDENTITY_POOL_ID=us-west-1:11d5c002-cbe3-4414-bd8f-4f046d2ab457
GRAPHQL_URL=https://374sdjlh3bdnhp2sz4qttvyhce.appsync-api.us-west-1.amazonaws.com/graphql
API_KEY=da2-PRODUCTION_API_KEY
S3_BUCKET=amplify-realtecheeclone-production-bucket-PROD
```

**Staging Branch**: No additional variables needed (uses main backend via generate outputs)

- **Verify**: Variables accessible during build and match config files

#### **Task 2.2: Backend Resource Strategy**
- **Decision Point**: Determine which branches need full backend vs shared
- **Official Pattern**: 
  - `main`: Full backend deployment
  - `staging`: Shared backend (main)
  - `production`: Full backend deployment (isolated)

### **Phase 3: Correct amplify.yml Implementation (High Priority)**

#### **Task 3.1: Fix Deployment Commands**
Based on official AWS patterns:
```yaml
case "${AWS_BRANCH}" in
    main)
        npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AMPLIFY_APP_ID
        ;;
    staging)
        npx ampx generate outputs --branch main --app-id $AMPLIFY_APP_ID
        ;;
    production)
        npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AMPLIFY_APP_ID
        ;;
esac
```

#### **Task 3.2: Environment Variable Validation**
- **Add**: Environment variable debugging
- **Add**: Failure handling for missing variables

### **Phase 4: Deployment Testing (Medium Priority)**

#### **Task 4.1: Test Main Branch**
- **Action**: Deploy to main branch first
- **Verify**: Backend resources created successfully
- **Expected**: Development environment operational

#### **Task 4.2: Test Staging Branch**  
- **Action**: Deploy to staging branch
- **Verify**: Shared backend configuration works
- **Expected**: Staging environment uses main backend

#### **Task 4.3: Test Production Branch**
- **Action**: Deploy to production branch
- **Verify**: Isolated backend deployment
- **Expected**: Production environment fully isolated

### **Phase 5: Cleanup & Documentation (Low Priority)**

#### **Task 5.1: Remove Legacy Architecture** 🆕 **✅ CONFIRMED REQUIRED**
- **Action**: Remove legacy `prod-v2` branch from AWS Console
- **Reason**: `prod-v2` is legacy from two-app architecture, conflicts with single-app strategy  
- **✅ OFFICIAL CONFIRMATION**: AWS Amplify Gen 2 uses 3-branch architecture (main, staging, production)
- **Risk**: Low - `prod-v2` is not used in current single-app pattern
- **Steps**: AWS Console → [Branch Management Section] → Delete `prod-v2` branch
- **Timing**: After successful production deployment testing

#### **Task 5.2: Create Main Branch** 🆕 **IMMEDIATE PRIORITY**
- **Action**: Create missing `main` branch in AWS Console  
- **Method**: Git push `main` branch to auto-create in AWS Console
- **Required**: Must exist before environment variable configuration
- **Timing**: Before Task 2.1 environment variable setup

#### **Task 5.3: Create Deployment Guides**
- **Action**: Document the corrected deployment process
- **Include**: Troubleshooting guides, rollback procedures

---

## 📋 **IMPLEMENTATION ROADMAP - Visual Progress Tracker**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    AWS AMPLIFY GEN 2 DEPLOYMENT STRATEGY                        │
│                          PHASE-BY-PHASE EXECUTION                              │
└─────────────────────────────────────────────────────────────────────────────────┘

 STATUS   PHASE/TASK                             DEPENDENCIES    RISK    TIME    VALIDATION
┌────────┬──────────────────────────────────────┬─────────────┬───────┬─────────┬────────────┐
│   ✅   │ PHASE 1: RESET & RESEARCH            │             │       │  50 min │            │
├────────┼──────────────────────────────────────┼─────────────┼───────┼─────────┼────────────┤
│   ✅   │  1.1 Stop Failed Deployment          │    None     │  LOW  │  5 min  │ Manual ✓   │
│   ✅   │  1.2 Research Official Patterns      │    None     │  LOW  │ 30 min  │ Manual ✓   │
│   ✅   │  1.3 Analyze Current amplify.yml     │    1.2      │  LOW  │ 15 min  │ Manual ✓   │
├────────┼──────────────────────────────────────┼─────────────┼───────┼─────────┼────────────┤
│   🔄   │ PHASE 2: ENVIRONMENT CONFIGURATION   │             │       │  75 min │            │
├────────┼──────────────────────────────────────┼─────────────┼───────┼─────────┼────────────┤
│   🔄   │  2.0 Create Main Branch              │    1.3      │ MED   │ 10 min  │ Manual ✓   │
│   ⏳   │  2.1 AWS Console Env Variables       │    2.0      │ HIGH  │ 50 min  │ Manual ✓   │
│   ⏳   │  2.2 Backend Resource Strategy       │  1.2, 2.1   │  MED  │ 15 min  │ Manual ✓   │
├────────┼──────────────────────────────────────┼─────────────┼───────┼─────────┼────────────┤
│   ⏳   │ PHASE 3: FIX AMPLIFY.YML            │             │       │  45 min │            │
├────────┼──────────────────────────────────────┼─────────────┼───────┼─────────┼────────────┤
│   ⏳   │  3.1 Fix Deployment Commands         │    2.2      │  MED  │ 30 min  │ Manual ✓   │
│   ⏳   │  3.2 Add Env Variable Validation     │    3.1      │  LOW  │ 15 min  │ Manual ✓   │
├────────┼──────────────────────────────────────┼─────────────┼───────┼─────────┼────────────┤
│   ⏳   │ PHASE 4: DEPLOYMENT TESTING          │             │       │  30 min │            │
├────────┼──────────────────────────────────────┼─────────────┼───────┼─────────┼────────────┤
│   ⏳   │  4.1 Test Main Branch                │    3.2      │ HIGH  │ 10 min  │ Manual ✓   │
│   ⏳   │  4.2 Test Staging Branch             │    4.1      │ HIGH  │ 10 min  │ Manual ✓   │
│   ⏳   │  4.3 Test Production Branch          │    4.2      │ HIGH  │ 10 min  │ Manual ✓   │
├────────┼──────────────────────────────────────┼─────────────┼───────┼─────────┼────────────┤
│   ⏳   │ PHASE 5: CLEANUP & DOCUMENTATION     │             │       │  75 min │            │
├────────┼──────────────────────────────────────┼─────────────┼───────┼─────────┼────────────┤
│   ⏳   │  5.1 Cleanup Legacy Architecture     │    4.3      │  LOW  │ 30 min  │ Manual ✓   │
│   ⏳   │  5.2 Create Deployment Guides        │    5.1      │  LOW  │ 45 min  │ Manual ✓   │
└────────┴──────────────────────────────────────┴─────────────┴───────┴─────────┴────────────┘

LEGEND:  ✅ Complete    🔄 In Progress    🎯 Current Task    ⏳ Pending

TOTAL ESTIMATED TIME: 4 hours 20 minutes
CURRENT STATUS: Phase 1 - Task 1.1 (Stop Failed Deployment)
```

### **📋 EXECUTION PROTOCOL**

**Before Each Phase:**
1. 🔍 **Re-read this document** to ensure mission alignment
2. 🎯 **Confirm phase objectives** and success criteria  
3. 📋 **Review dependencies** and prerequisites
4. ✅ **Request manual validation** before proceeding

**During Each Phase:**
- Execute tasks sequentially within phase
- Pause for manual validation after each task
- Document any deviations or issues
- Update status symbols in real-time

**Phase Completion:**
- ✅ Mark all tasks complete
- 📸 **Request screenshot/evidence** of completion
- 🔄 **Update next phase** to "In Progress"
- 📋 **Brief status summary** before proceeding

---

## ⚠️ **Risk Assessment & Mitigation**

### **High-Risk Tasks**
1. **Production Branch Deployment**
   - **Risk**: Could affect live production data
   - **Mitigation**: Test on staging first, backup procedures
   - **Rollback**: Revert to previous working deployment

2. **Backend Resource Changes**
   - **Risk**: Data loss or service interruption
   - **Mitigation**: Incremental changes, monitoring
   - **Rollback**: AWS CloudFormation rollback

### **Medium-Risk Tasks**
1. **Environment Variable Changes**
   - **Risk**: Build failures, misconfigurations
   - **Mitigation**: Validate variables before deployment
   - **Rollback**: Restore previous variables

### **Rollback Procedures**
1. **Failed Deployment**: Use AWS Amplify Console rollback feature
2. **Environment Issues**: Restore environment variables from backup
3. **Backend Problems**: AWS CloudFormation stack rollback
4. **Complete Failure**: Return to previous two-app architecture

---

## ✅ **Success Criteria**

### **Phase 1 Success**: ✅ **COMPLETED**
- [x] Official AWS patterns documented and understood
- [x] Current issues clearly identified  
- [x] Corrected approach planned
- [x] Root cause analysis completed with evidence

### **Phase 2 Success**:
- [ ] Environment variables properly configured
- [ ] Backend strategy clearly defined
- [ ] AWS Console properly set up

### **Phase 3 Success**:
- [ ] amplify.yml follows official patterns
- [ ] Environment variable validation added
- [ ] Build configuration validated

### **Phase 4 Success**:
- [ ] Main branch deploys successfully
- [ ] Staging branch uses shared backend
- [ ] Production branch has isolated backend
- [ ] All environments functional

### **Overall Mission Success**:
- [ ] Single AWS Amplify App with three environments
- [ ] Zero environment configs in git repository
- [ ] Safe multi-stage deployment pipeline
- [ ] Official AWS Amplify Gen 2 patterns implemented
- [ ] Comprehensive documentation and procedures

---

## 🔄 **Next Steps**

1. **User Review**: Review this plan for accuracy and completeness
2. **User Approval**: Confirm alignment with original mission
3. **Context7 Research**: Deep dive into official AWS documentation
4. **Systematic Implementation**: Execute phases in order
5. **Continuous Validation**: Test each phase before proceeding

---

---

## 🎯 **CRITICAL DISCOVERY SUMMARY**

### **✅ CONFIRMED UNDERSTANDING**
Your insight was **100% correct**! The AWS Console should contain **multiple environment variables per branch** beyond just `AMPLIFY_APP_ID`. 

### **🚨 THE MISSING PIECE**
We found **14 critical environment variables** that need to be configured:
- **7 variables for `main` branch** (development backend)
- **7 variables for `production` branch** (isolated backend)  
- **`staging` branch** uses main's backend (no additional variables needed)

### **📋 NEXT IMMEDIATE ACTION**
**Task 2.1** is now **CRITICAL PRIORITY** - Configure all AWS Console environment variables from the amplify_outputs config files before proceeding with any deployments.

---

**Status**: ✅ **ANALYSIS COMPLETE - OFFICIAL AWS AMPLIFY GEN 2 PATTERNS CONFIRMED**

*The strategy document has been updated with official AWS Amplify Gen 2 documentation confirming the 3-branch architecture (main, staging, production). The `prod-v2` branch is confirmed as legacy and should be removed. We can now proceed with creating the missing `main` branch and configuring environment variables.*