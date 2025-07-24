# Deploy to Production Environment

Deploy current changes to production with comprehensive safety checks, data migration, and environment switching.

## Process:
1. **Pre-deployment Safety**: 
   - Backup development and production data 
   - Run full test suite and type-check
   - Validate git status and branch protection
   
2. **Environment Preparation**:
   - Switch to production amplify_outputs.json configuration
   - Validate production secrets and connectivity
   - Confirm isolated backend configuration
   
3. **Data Migration**:
   - Identify business configuration data (BackOfficeRequestStatuses, staff, roles)
   - Migrate non-transactional data from dev to production
   - Validate data integrity and business logic preservation
   
4. **Production Deployment**:
   - Merge main → prod-v2 branch with safety checks
   - Deploy to RealTechee-Gen2 app (d200k2wsaf8th3)
   - Monitor deployment progress and health checks
   
5. **Post-deployment Verification**:
   - Validate production functionality
   - Confirm data migration success
   - Switch back to development configuration for continued work

## Safety Features:
- **Comprehensive Backups**: Both source and target environments
- **Data Validation**: Business logic preservation checks
- **Automatic Rollback**: On deployment or data migration failures
- **Environment Isolation**: Complete separation from development
- **Approval Gates**: Interactive confirmations for destructive operations

## Data Migration Scope:
- ✅ **BackOfficeRequestStatuses**: Status configurations and business rules
- ✅ **Staff/Roles**: User management and permission configurations  
- ✅ **Reference Data**: Dropdown options, lookup tables, system configurations
- ❌ **Transaction Data**: Requests, projects, properties (preserve production data)

## Usage:
Type `/deploy-production` in Claude Code to execute this comprehensive deployment workflow.

---

**Target Environment**: Production (d200k2wsaf8th3.amplifyapp.com)  
**Backend**: Isolated production (RealTechee-Gen2 app)  
**Git Flow**: main → prod-v2 branch  
**Configuration**: Switches to amplify_outputs.prod.json  
**Safety Level**: Maximum (backups, validation, rollback capability)