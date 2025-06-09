# Amplify Gen 2 Production Migration Strategy

## ⚠️ **Critical Understanding: YOU Handle Data Migration**

Amplify Gen 2 **does NOT automatically migrate data** when you make schema changes. You must plan and execute migrations manually to prevent data loss.

## 🔄 **SDLC Workflow with Amplify Gen 2**

### Development → Staging → Production Pipeline

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   SANDBOX       │    │    STAGING      │    │   PRODUCTION    │
│   (doron)       │────│   (staging)     │────│    (main)       │
│                 │    │                 │    │                 │
│ • Schema tests  │    │ • Integration   │    │ • Live data     │
│ • Rapid changes │    │ • Data migration│    │ • Zero downtime │
│ • No real data  │    │ • Testing       │    │ • Rollback plan │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 **Schema Change Categories**

### ✅ **SAFE CHANGES** (Auto-handled by AWS)
- **Adding optional fields**: `newField: a.string()`
- **Adding new models**: `const NewModel = a.model({...})`
- **Adding indexes**: New `secondaryKey` definitions
- **Updating authorization rules**: Changes to `allow` rules

### ⚠️ **BREAKING CHANGES** (YOU must handle)
- **Renaming fields**: `name → fullName` 
- **Changing field types**: `a.string() → a.integer()`
- **Making fields required**: `a.string() → a.string().required()`
- **Removing fields**: Deleting existing fields
- **Renaming models**: `User → Customer`

### 🔥 **DANGEROUS CHANGES** (Risk data loss)
- **Dropping models**: Removing entire tables
- **Complex type changes**: Object structure modifications
- **Constraint changes**: Primary key modifications

## 🛠 **Migration Strategies**

### **Strategy 1: Additive Migrations (Recommended)**

```typescript
// BEFORE (amplify/data/resource.ts)
const Contact = a.model({
  name: a.string().required(),
  email: a.string()
}).authorization((allow) => allow.publicApiKey());

// AFTER - Add new field alongside old one
const Contact = a.model({
  name: a.string().required(),        // Keep old field
  firstName: a.string(),              // Add new field
  lastName: a.string(),               // Add new field
  email: a.string()
}).authorization((allow) => allow.publicApiKey());
```

**Migration Process:**
1. Deploy new schema with both old + new fields
2. Run data migration script to populate new fields
3. Update frontend to use new fields
4. Deploy removal of old fields (separate deployment)

### **Strategy 2: Blue-Green Migration**

```typescript
// Create new model alongside old one
const ContactV2 = a.model({
  firstName: a.string().required(),
  lastName: a.string().required(),
  email: a.string()
}).authorization((allow) => allow.publicApiKey());

const Contact = a.model({  // Keep old model temporarily
  name: a.string().required(),
  email: a.string()
}).authorization((allow) => allow.publicApiKey());
```

### **Strategy 3: Version Field Migration**

```typescript
const Contact = a.model({
  name: a.string(),
  firstName: a.string(),      // New structure
  lastName: a.string(),       // New structure
  email: a.string(),
  schemaVersion: a.integer().default(1)  // Track migration state
}).authorization((allow) => allow.publicApiKey());
```

## 📝 **Production Deployment Checklist**

### **Pre-Deployment**
- [ ] **Backup production data** (DynamoDB backup/export)
- [ ] **Test migration in staging** with production-like data
- [ ] **Verify rollback procedure** works
- [ ] **Monitor script ready** for post-deployment validation
- [ ] **Communication plan** for downtime (if any)

### **Deployment Steps**
1. **Deploy non-breaking changes first**
   ```bash
   # Deploy additive changes only
   npx ampx pipeline deploy --branch main
   ```

2. **Run data migration scripts**
   ```bash
   # Custom script to migrate existing data
   node scripts/migrate-contacts-to-v2.js
   ```

3. **Deploy frontend updates**
   ```bash
   # Frontend uses new fields
   git push origin main
   ```

4. **Clean up old fields** (separate deployment)
   ```bash
   # Remove deprecated fields
   npx ampx pipeline deploy --branch main
   ```

### **Post-Deployment**
- [ ] **Validate data integrity**
- [ ] **Test critical user flows**
- [ ] **Monitor error rates**
- [ ] **Verify performance metrics**

## 🔧 **Data Migration Script Template**

```typescript
// scripts/migrate-production-data.ts
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

const client = generateClient<Schema>();

async function migrateContacts() {
  console.log('🔄 Starting contact migration...');
  
  // 1. Fetch all existing contacts
  const { data: contacts } = await client.models.Contact.list({
    limit: 1000  // Handle pagination for large datasets
  });
  
  // 2. Migrate each contact
  for (const contact of contacts) {
    if (contact.name && !contact.firstName) {
      const nameParts = contact.name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');
      
      // 3. Update with new structure
      await client.models.Contact.update({
        id: contact.id,
        firstName,
        lastName,
        schemaVersion: 2
      });
      
      console.log(`✅ Migrated: ${contact.name} → ${firstName} ${lastName}`);
    }
  }
  
  console.log('🎉 Migration completed!');
}

// Run migration
migrateContacts().catch(console.error);
```

## 🚨 **Rollback Procedures**

### **Emergency Rollback Steps**
1. **Revert to previous branch deployment**
   ```bash
   git checkout main~1  # Previous commit
   npx ampx pipeline deploy --branch main
   ```

2. **Restore from DynamoDB backup**
   ```bash
   aws dynamodb restore-table-from-backup \
     --backup-arn arn:aws:dynamodb:us-west-1:...:backup/table/backup-id \
     --target-table-name Contact-new-table-id-NONE
   ```

3. **Update DNS/traffic routing** if needed

## 🏗 **Environment Setup for Safe Migrations**

### **Recommended Branch Strategy**
```
main (development)
├── staging (pre-production testing)
└── production (live environment)
```

### **Amplify App Configuration**
- **Sandbox**: `doron` (your current setup)
- **Staging**: Connected to `staging` branch
- **Production**: Connected to `production` branch

Each environment has separate:
- DynamoDB tables
- API endpoints  
- Frontend deployments
- Access credentials

## 📊 **Monitoring & Validation**

### **Key Metrics to Monitor**
- API error rates
- Database query performance
- Frontend loading times
- User session errors
- Data consistency checks

### **Validation Scripts**
```typescript
// scripts/validate-migration.ts
async function validateMigration() {
  // Check data integrity
  const contacts = await client.models.Contact.list();
  const invalidContacts = contacts.data.filter(c => 
    !c.firstName || !c.lastName
  );
  
  if (invalidContacts.length > 0) {
    console.error('❌ Migration incomplete:', invalidContacts.length);
    return false;
  }
  
  console.log('✅ All contacts migrated successfully');
  return true;
}
```

## 🎯 **Best Practices Summary**

1. **Always test migrations in staging first**
2. **Use additive changes when possible**
3. **Keep old and new fields during transition**
4. **Plan for rollback scenarios**
5. **Monitor everything during deployment**
6. **Communicate changes to your team**
7. **Document all migration procedures**

## 🚀 **Next Steps for Your Project**

Since you have a working sandbox, your next steps should be:

1. **Set up staging environment**
2. **Create production environment** 
3. **Import CSV data into sandbox** for testing
4. **Plan migration strategy** for any schema changes
5. **Create monitoring dashboards**
