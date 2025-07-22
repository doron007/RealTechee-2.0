# Amplify Gen 2 Development Workflow

## Daily Development Session

### 1. Start Your Environment
```bash
# Terminal 1: Start sandbox (leave running)
npx ampx sandbox --identifier doron --watch

# Terminal 2: Start Next.js (leave running)  
npm run dev
```

### 2. Making Backend Changes

**Example: Adding a new field to Property model**

```typescript
// amplify/data/resource.ts
const Property = a.model({
  id: a.id().required(),
  fullAddress: a.string(),
  address: a.string(),
  city: a.string(),
  state: a.string(),
  zip: a.string(),
  // NEW FIELD: Add property type
  propertyType: a.string(), // 🆕 New field
}).authorization((allow) => allow.publicApiKey());
```

**What happens automatically:**
1. Save file → Amplify detects change
2. Redeploys sandbox (30-60 seconds)
3. Updates `amplify_outputs.json`
4. New GraphQL schema available

### 3. Using the API in Your Frontend

```typescript
// utils/amplifyClient.ts
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import outputs from '../amplify_outputs.json';
import { Amplify } from 'aws-amplify';

Amplify.configure(outputs);
const client = generateClient<Schema>();

// Create a property
export async function createProperty(propertyData: {
  fullAddress: string;
  city: string;
  state: string;
  propertyType: string; // 🆕 Use new field
}) {
  const result = await client.models.Property.create(propertyData);
  return result;
}

// List properties  
export async function listProperties() {
  const result = await client.models.Property.list();
  return result.data;
}
```

### 4. Testing in Your Components

```typescript
// pages/test-amplify.tsx
import { useEffect, useState } from 'react';
import { createProperty, listProperties } from '../utils/amplifyClient';

export default function TestAmplify() {
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    const data = await listProperties();
    setProperties(data);
  };

  const addProperty = async () => {
    await createProperty({
      fullAddress: "123 Test St, Test City, CA 90210",
      city: "Test City",
      state: "CA",
      propertyType: "Residential" // 🆕 Using new field
    });
    loadProperties(); // Refresh list
  };

  return (
    <div>
      <button onClick={addProperty}>Add Test Property</button>
      <ul>
        {properties.map(property => (
          <li key={property.id}>
            {property.fullAddress} - {property.propertyType}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 🔍 Debugging & Monitoring

### Check Sandbox Status
```bash
# See if sandbox is running
ps aux | grep "ampx sandbox"

# Check CloudFormation stacks
aws cloudformation list-stacks --region us-west-1 | grep doron
```

### View API in AWS Console
1. Open [AWS AppSync Console](https://console.aws.amazon.com/appsync/)
2. Find your API: `amplify-realtecheeclone-doron-sandbox-*`
3. Use Queries tab to test GraphQL

### Common Commands
```bash
# Stop sandbox
npx ampx sandbox delete --identifier doron

# Restart sandbox  
npx ampx sandbox --identifier doron --watch

# Deploy without watch
npx ampx sandbox --identifier doron
```

## 📁 File Structure Impact

```
Your Project/
├── amplify/                    ← Backend definition
│   ├── data/resource.ts       ← Your models (Property, Contact, etc.)
│   └── backend.ts             ← Backend configuration
├── amplify_outputs.json       ← Generated API config (auto-updates)
├── utils/amplifyClient.ts     ← Your API client code
└── pages/components/          ← Frontend using the API
```

## 🚨 Production Migration Strategy

### Schema Change Categories
**✅ SAFE (Auto-handled):**
- Adding optional fields: `newField: a.string()`
- Adding new models
- Adding indexes/secondary keys
- Updating authorization rules

**⚠️ BREAKING (YOU handle migration):**
- Renaming fields: `name → fullName`
- Changing types: `a.string() → a.integer()`
- Making fields required
- Removing fields

**🔥 DANGEROUS (Risk data loss):**
- Dropping models
- Primary key changes
- Complex type modifications

### Migration Workflow
```bash
# 1. Deploy additive changes (safe)
npx ampx pipeline deploy --branch staging

# 2. Run data migration script
node scripts/migrate-data.ts

# 3. Update frontend code
git push origin staging

# 4. Test thoroughly in staging

# 5. Deploy to production
npx ampx pipeline deploy --branch production
```

### Environment Strategy
- **Sandbox** (`doron`): Development/testing
- **Staging**: Pre-production with migration testing
- **Production**: Live environment with real data

**📖 See `docs/amplify-production-migration-strategy.md` for complete migration guide**

## 🔄 **Testing with Production Data**

### 📂 **Latest CSV Data Location**
**Important:** The latest CSV files for import are located in:
```
/data/csv/final/*.csv
```

Available datasets:
- `Contacts.csv` - Customer and lead information
- `Properties.csv` - Property listings and details  
- `Projects.csv` - Project data and status
- `Quotes.csv` & `QuoteItems.csv` - Quote information
- `Requests.csv` - Service requests
- And 20+ other data files

### Before Major Changes - Sync Production Data to Sandbox

**Method 1: DynamoDB Direct Export/Import**
```bash
# Sync production data to sandbox for testing
./scripts/sync-prod-to-sandbox.sh
```

**Method 2: Amplify GraphQL API Sync (Recommended)**
```bash
# Install dependencies first
npm install esbuild-register

# Sync with anonymized data (recommended)
node -r esbuild-register scripts/sync-amplify-data.ts \
  --models Contact,Property,Project,Quote,Request \
  --anonymize

# Dry run to preview what would be synced
node -r esbuild-register scripts/sync-amplify-data.ts \
  --models Contact,Property \
  --dry-run
```

**Method 3: Import from Latest CSV Files**
```bash
# Import from the latest CSV data in /data/csv/final/
node scripts/import-csv-data.ts --source /data/csv/final/ --models all

# Import specific models only
node scripts/import-csv-data.ts --source /data/csv/final/ --models Contact,Property,Project
```

### When to Sync Production Data
- ✅ **Before schema changes** that might affect existing data
- ✅ **Before complex query modifications**
- ✅ **Before authorization rule changes**
- ✅ **Before deploying to staging/production**
- ❌ **Don't sync for simple frontend changes**

### Data Safety Reminders
- 🔒 **Always anonymize** sensitive data when syncing
- 🗑️ **Clear sandbox data** when testing is complete
- 📋 **Use staging environment** for final production testing
- 🔑 **Protect API keys** and credentials

## 🎯 Key Points

- **Keep sandbox running** during development (watch mode)
- **amplify_outputs.json** is your connection config (don't edit manually)
- **Backend changes** = save → auto-redeploy → test
- **Frontend changes** = save → hot-reload → immediate feedback
- **One sandbox per developer** (use unique identifier)
- **Plan migrations** before deploying breaking changes to production
