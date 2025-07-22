# Amplify Gen2 Modernization Guide

## 🎯 Key Improvements for Your Data Schema

### 1. **Authorization Patterns**

**❌ Current (Less Secure):**
```typescript
}).authorization((allow) => allow.publicApiKey());
```

**✅ Modern (Secure):**
```typescript
}).authorization((allow) => [
  allow.authenticated().to(['read']),  // Authenticated users can read
  allow.owner(),                       // Record owners can manage
  allow.group('admin')                 // Admin group has full access
]);
```

### 2. **Field Type Improvements**

**❌ Current Issues:**
```typescript
phone: a.float(),           // ❌ Phone numbers as floats lose formatting
license: a.float(),         // ❌ License numbers are usually alphanumeric
zip: a.float(),            // ❌ Zip codes like "01234" become 1234
bedrooms: a.float(),       // ❌ You can't have 2.5 bedrooms
```

**✅ Modern Types:**
```typescript
phone: a.string(),         // ✅ Preserves formatting: "+1 (555) 123-4567"
license: a.string(),       // ✅ Handles alphanumeric: "LIC-123-ABC"
zip: a.string(),          // ✅ Preserves leading zeros: "01234"
bedrooms: a.integer(),    // ✅ Whole numbers only: 3
```

### 3. **Relationships (Gen2 Superpower)**

**❌ Current (Manual References):**
```typescript
agentContactId: a.id(),    // Manual foreign key management
homeownerContactId: a.id(),
addressId: a.id(),
```

**✅ Modern (Automatic Relationships):**
```typescript
// Define the foreign key
agentContactId: a.id(),
// Define the relationship
agent: a.belongsTo('Contacts', 'agentContactId'),

// Now you can query like this in your frontend:
// const project = await client.models.Projects.get({id}, {
//   selectionSet: ['*', 'agent.*', 'homeowner.*', 'quotes.*']
// });
```

### 4. **Authorization Modes**

**❌ Current:**
```typescript
authorizationModes: {
  defaultAuthorizationMode: 'apiKey', // ❌ Less secure
  apiKeyAuthorizationMode: {
    expiresInDays: 30 // ❌ Too long
  }
}
```

**✅ Modern:**
```typescript
authorizationModes: {
  defaultAuthorizationMode: 'userPool', // ✅ Cognito authentication
  apiKeyAuthorizationMode: {
    expiresInDays: 7 // ✅ Shorter for security
  }
}
```

## 🔧 Implementation Strategy

### Phase 1: Fix Current Schema (Quick Win)
1. ✅ **DONE:** Fixed GraphQL version compatibility
2. Update field types (phone, license, zip to strings)
3. Change authorization from `publicApiKey()` to proper patterns

### Phase 2: Add Relationships (Medium Effort)
1. Add belongsTo/hasMany relationships between models
2. This enables powerful query capabilities in your frontend
3. Automatic data fetching and caching

### Phase 3: Security Hardening (Important for Production)
1. Implement Cognito User Pools
2. Set up proper user groups (admin, backoffice, agents)
3. Replace apiKey with userPool authentication

## 📝 Next Steps

### Option A: Gradual Migration (Recommended)
Keep your current working schema and gradually apply improvements:

1. **Start with field types** - Change floats to strings/integers where appropriate
2. **Add relationships** - One model at a time
3. **Update authorization** - Move from publicApiKey to authenticated patterns

### Option B: Fresh Modern Schema
Create a new schema with all modern patterns from the start.

## 🚀 Benefits of Modernization

### Performance
- **Relationships**: Automatic query optimization
- **Types**: Better database indexing
- **Auth**: Reduced API calls

### Security  
- **User Authentication**: Replace API keys with secure tokens
- **Granular Permissions**: Row-level security
- **Audit Trail**: Built-in user tracking

### Developer Experience
- **Type Safety**: Better TypeScript integration
- **Auto-completion**: IDE support for relationships
- **Simpler Queries**: Fetch related data in single calls

## 🎯 Your Schema at a Glance

With 26 models, you have a comprehensive data structure. Here's how to organize them:

### Core Business Models (High Security)
- Projects, Quotes, Contacts, Properties
- **Auth**: `allow.authenticated()` + `allow.owner()`

### Back-Office Models (Admin Only)
- BackOffice*, Legal, MemberSignature
- **Auth**: `allow.group('admin')`

### Public/Support Models (Mixed Access)
- ContactUs, Requests
- **Auth**: `allow.guest().to(['create'])` + `allow.authenticated()`

Would you like me to help implement any of these improvements to your current schema?