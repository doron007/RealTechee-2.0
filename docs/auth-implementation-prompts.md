# Claude Implementation Prompts for Authentication System

This document contains detailed prompts for implementing each phase of the authentication system using Claude AI assistance.

## Phase 1: Backend Authentication Setup (Week 1-2)

### Phase 1 Prompt

```
I need to implement AWS Amplify Gen 2 authentication for my RealTechee project. Here's what I need you to do:

**Context:**
- I have an existing Amplify Gen 2 backend with 26 working APIs
- Currently using only API key authentication
- I have 59 existing users in a legacy Auth table with email/bcrypt hashes
- I need to add Cognito User Pool authentication to the backend

**Task:**
1. Create a new auth resource file at `/amplify/auth/resource.ts`
2. Configure authentication with:
   - Email login (primary)
   - Custom attributes for contactId and membershipTier
   - Appropriate password policies
   - User pool settings optimized for cost
3. Update `/amplify/backend.ts` to include the auth resource
4. Update the data authorization rules in `/amplify/data/resource.ts` to replace `allow.publicApiKey()` with proper authentication rules
5. Ensure backward compatibility during transition

**Requirements:**
- Use TypeScript configuration
- Configure custom attributes: contactId, membershipTier
- Set up user groups: public, basic, member, agent, admin
- Optimize for cost (stay within free tier initially)
- Maintain existing API functionality

**Verification Steps:**
1. Run `npx ampx sandbox` to deploy changes
2. Verify Cognito User Pool is created in AWS Console
3. Test that existing API calls still work
4. Confirm auth resource is properly configured
5. Check that custom attributes are available

Please implement this step by step, explaining each configuration choice and providing verification commands.
```

### Phase 1 Verification Checklist

- [ ] Auth resource file created with proper TypeScript types
- [ ] Backend.ts updated to include auth resource
- [ ] Data authorization rules updated (but not breaking existing functionality)
- [ ] Custom attributes configured (contactId, membershipTier)
- [ ] User groups defined (public, basic, member, agent, admin)
- [ ] Password policies configured
- [ ] Sandbox deployment successful
- [ ] Cognito User Pool visible in AWS Console
- [ ] Existing API calls still functional
- [ ] amplify_outputs.json updated with auth configuration

---

## Phase 2: User Migration (Week 2-3)

### Phase 2 Prompt

```
I need to migrate 59 existing users from my legacy Auth table to AWS Cognito without sending any email notifications. Here's the approach:

**Context:**
- I have existing users in `/data/csv/Auth.csv` with email, bcrypt hashes, and owner IDs
- I want to import these users with temporary passwords
- Users should NOT receive any email notifications
- When users try to log in and fail, they should be directed to manually reset their password

**Task:**
1. Create a user migration script that:
   - Reads data from `/data/csv/Auth.csv`
   - Creates users in Cognito with temporary passwords
   - Maps owner IDs to custom:contactId attribute
   - Sets default membership tier to 'basic'
   - Disables email notifications during import
2. Update the login page to include a prominent "Forgot Password?" link
3. Create a password reset flow that's user-friendly
4. Test the migration with a few users first

**Requirements:**
- Import all 59 users silently (no emails)
- Generate secure temporary passwords
- Map existing data to Cognito user attributes
- Provide clear password reset instructions
- Maintain data integrity during migration

**Verification Steps:**
1. Test import script with 2-3 users first
2. Verify users are created in Cognito User Pool
3. Confirm custom attributes are set correctly
4. Test that temporary passwords don't work for login
5. Test password reset flow works properly
6. Verify no emails are sent during import
7. Run full migration for all 59 users

Please create the migration script and update the login experience to handle this gracefully.
```

### Phase 2 Verification Checklist

- [ ] Migration script created and tested
- [ ] Test import successful with 2-3 users
- [ ] All 59 users imported to Cognito
- [ ] Custom attributes properly mapped (contactId, membershipTier)
- [ ] Temporary passwords set and non-functional for login
- [ ] No email notifications sent during import
- [ ] Password reset flow tested and working
- [ ] Login page updated with clear "Forgot Password" link
- [ ] User data integrity maintained
- [ ] Migration logs generated for audit trail

---

## Phase 3: Frontend Integration (Week 3-4)

### Phase 3 Prompt

```
I need to integrate AWS Amplify authentication with my React frontend. My Header component is already prepared for authentication but needs to be connected to real auth data.

**Context:**
- I have a Header component that accepts `userLoggedIn` prop and shows user menus
- Currently shows hardcoded user data ("Doron Hetz", "user@example.com")
- I need to connect this to real Cognito authentication
- The header has login/logout buttons and user profile dropdown already built

**Task:**
1. Install required dependencies (@aws-amplify/ui-react)
2. Configure Amplify in `_app.tsx` with the auth context
3. Create an AuthProvider component for app-wide authentication state
4. Update the Layout component to pass real user data to Header
5. Replace hardcoded user data with real authenticated user information
6. Implement sign-in/sign-out functionality
7. Add loading states and error handling

**Requirements:**
- Use Amplify UI React components where appropriate
- Maintain existing Header UI design
- Handle authentication state changes smoothly
- Show real user data (email, display name)
- Implement proper loading and error states
- Ensure responsive design is maintained

**Current Header Props:**
```typescript
interface HeaderProps {
  userLoggedIn?: boolean;
}
```

**Verification Steps:**
1. User can sign in successfully
2. Header shows real user data instead of hardcoded values
3. User profile dropdown works correctly
4. Sign out functionality works
5. Loading states display properly
6. Error handling works for failed authentication
7. Responsive design maintained on mobile/desktop
8. Authentication state persists across page refreshes

Please implement this integration step by step, maintaining the existing UI design while adding real authentication functionality.
```

### Phase 3 Verification Checklist

- [ ] @aws-amplify/ui-react installed and configured
- [ ] Amplify configured in _app.tsx with proper outputs
- [ ] AuthProvider component created and working
- [ ] Layout component updated to pass real user state
- [ ] Header component connected to real authentication data
- [ ] Hardcoded user data replaced with dynamic data
- [ ] Sign-in functionality working correctly
- [ ] Sign-out functionality working correctly
- [ ] Loading states implemented and functional
- [ ] Error handling implemented for auth failures
- [ ] User profile dropdown populated with real data
- [ ] Authentication state persistence working
- [ ] Responsive design maintained across devices

---

## Phase 4: Authentication Pages (Week 4-5)

### Phase 4 Prompt

```
I need to create complete authentication pages for login, profile, and settings. The Header component already has navigation links to these pages but they don't exist yet.

**Context:**
- Header component has links to "/login", "/profile", and "/settings"
- I need to create these pages with proper authentication flows
- Users should be able to reset passwords from the login page
- Profile page should show user information and allow updates
- Settings page should handle account preferences

**Task:**
1. Create `/pages/login.tsx` with:
   - Login form using Amplify UI components
   - Prominent "Forgot Password?" link
   - Error handling for failed logins
   - Redirect to previous page after successful login
2. Create `/pages/profile.tsx` with:
   - User profile information display
   - Ability to update profile data
   - Show membership tier and permissions
   - Protected route (requires authentication)
3. Create `/pages/settings.tsx` with:
   - Account settings and preferences
   - Password change functionality
   - Notification preferences
   - Protected route (requires authentication)
4. Create a ProtectedRoute component for auth guards
5. Add proper navigation and redirects

**Requirements:**
- Use consistent styling with existing site design
- Implement proper form validation
- Add loading states and error handling
- Ensure mobile responsiveness
- Follow existing UI patterns and components
- Implement proper authentication guards

**Verification Steps:**
1. Login page displays correctly and accepts credentials
2. Password reset flow works from login page
3. Successful login redirects to intended page
4. Profile page shows real user data
5. Settings page allows preference updates
6. Protected routes redirect unauthorized users
7. All pages are mobile responsive
8. Forms have proper validation and error messages
9. Navigation between auth pages works correctly

Please create these pages following the existing design patterns and ensuring a smooth user experience.
```

### Phase 4 Verification Checklist

- [ ] Login page created with proper form and validation
- [ ] Password reset link prominently displayed and functional
- [ ] Login redirects to intended page after success
- [ ] Profile page created and shows real user data
- [ ] Profile updates work correctly
- [ ] Settings page created with account preferences
- [ ] Password change functionality implemented
- [ ] ProtectedRoute component created and working
- [ ] Authentication guards properly redirect unauthorized users
- [ ] All pages follow existing design patterns
- [ ] Mobile responsiveness maintained
- [ ] Form validation and error handling working
- [ ] Navigation between auth pages smooth

---

## Phase 5: Membership Tiers & Permissions (Week 5-6)

### Phase 5 Prompt

```
I need to implement membership tiers and project-based permissions for my comment system. Users should only be able to comment on projects they're authorized to access.

**Context:**
- I have a ProjectPermissions model with email-based permissions
- I have a ProjectComments model that needs auth integration
- Users have different roles: public, basic, member, agent, admin
- Comments should only be allowed for authorized users on authorized projects

**Current Permission Logic:**
- Projects have public/private flags
- ProjectPermissions contains semicolon-separated email lists
- Some permissions are role-based ("role.eu", "public")
- Users can be project participants (agent, homeowner, etc.)

**Task:**
1. Define membership tier hierarchy and permissions
2. Create permission checking utilities:
   - `hasProjectAccess(user, project)` - can user view project
   - `canCommentOnProject(user, project)` - can user comment
   - `hasRole(user, requiredRole)` - role-based access
3. Update CommentsList component to:
   - Show/hide comment form based on permissions
   - Display appropriate messages for unauthorized users
   - Validate permissions before showing comments
4. Update AddCommentDialog to:
   - Replace hardcoded user data with authenticated user
   - Validate permissions before allowing comment submission
   - Handle authorization errors gracefully
5. Update data models to use proper authorization rules

**Membership Tiers:**
- **Public**: Anonymous users, read-only access to public projects
- **Basic**: Authenticated users, can comment on authorized projects  
- **Member**: Premium features, enhanced project access
- **Agent**: Project management, assigned project access
- **Admin**: Full system access

**Verification Steps:**
1. Anonymous users can only view public projects
2. Authenticated users can comment on authorized projects only
3. Unauthorized users see appropriate messages
4. Comment form is hidden for unauthorized users
5. Permission validation works correctly
6. Role-based access functions properly
7. Comments are created with real user data
8. Authorization errors are handled gracefully

Please implement this permission system ensuring security and good user experience.
```

### Phase 5 Verification Checklist

- [ ] Membership tier hierarchy defined and documented
- [ ] Permission utility functions created and tested
- [ ] `hasProjectAccess` function working correctly
- [ ] `canCommentOnProject` function working correctly
- [ ] `hasRole` function working correctly
- [ ] CommentsList component updated with permission checks
- [ ] Comment form shows/hides based on permissions
- [ ] Appropriate messages shown for unauthorized users
- [ ] AddCommentDialog updated with real user data
- [ ] Authorization validation working in comment submission
- [ ] Data models updated with proper authorization rules
- [ ] Anonymous users limited to public projects only
- [ ] Authenticated users can comment on authorized projects
- [ ] Authorization errors handled gracefully

---

## Phase 6: Testing & Optimization (Week 6-7)

### Phase 6 Prompt

```
I need to thoroughly test the authentication system and optimize it for production. This is the final phase before launch.

**Context:**
- All authentication features have been implemented
- I need comprehensive testing of all flows
- Performance optimization is required
- Security audit should be performed
- User experience needs validation

**Task:**
1. **Comprehensive Testing:**
   - Test all authentication flows (login, logout, password reset)
   - Test permission system with different user roles
   - Test comment system with various authorization scenarios
   - Test edge cases and error conditions
   - Test mobile and desktop responsiveness
   - Test performance with realistic user loads

2. **Security Audit:**
   - Review all authorization rules
   - Test for authentication bypass attempts
   - Validate secure password handling
   - Check for XSS and injection vulnerabilities
   - Review session management and token handling

3. **Performance Optimization:**
   - Optimize authentication response times
   - Implement caching where appropriate
   - Minimize unnecessary API calls
   - Optimize bundle size for auth components
   - Monitor and fix memory leaks

4. **User Experience Validation:**
   - Test user flows from start to finish
   - Ensure error messages are user-friendly
   - Validate loading states and transitions
   - Test accessibility compliance
   - Gather feedback from test users

5. **Production Readiness:**
   - Set up monitoring and alerting
   - Configure logging for auth events
   - Prepare rollback plan
   - Document deployment process
   - Create user training materials

**Verification Steps:**
1. All authentication flows tested and working
2. Permission system thoroughly validated
3. Security audit completed with no critical issues
4. Performance metrics meet requirements (<500ms auth response)
5. User experience validated by stakeholders
6. Monitoring and alerting configured
7. Documentation completed
8. Rollback plan tested
9. Production deployment ready

Please conduct thorough testing and prepare the system for production launch.
```

### Phase 6 Verification Checklist

#### Testing
- [ ] All authentication flows tested (login, logout, password reset)
- [ ] Permission system tested with all user roles
- [ ] Comment authorization tested with various scenarios
- [ ] Edge cases and error conditions tested
- [ ] Mobile and desktop responsiveness verified
- [ ] Performance testing completed with realistic loads

#### Security Audit
- [ ] Authorization rules reviewed and validated
- [ ] Authentication bypass attempts tested and blocked
- [ ] Password handling security verified
- [ ] XSS and injection vulnerability tests passed
- [ ] Session management and token handling secure

#### Performance Optimization
- [ ] Authentication response times optimized (<500ms)
- [ ] Caching implemented where appropriate
- [ ] Unnecessary API calls minimized
- [ ] Bundle size optimized for auth components
- [ ] Memory leaks identified and fixed

#### User Experience
- [ ] End-to-end user flows validated
- [ ] Error messages are user-friendly
- [ ] Loading states and transitions smooth
- [ ] Accessibility compliance verified
- [ ] Test user feedback incorporated

#### Production Readiness
- [ ] Monitoring and alerting configured
- [ ] Authentication event logging implemented
- [ ] Rollback plan created and tested
- [ ] Deployment process documented
- [ ] User training materials prepared
- [ ] Stakeholder sign-off obtained

---

## General Implementation Guidelines

### Before Each Phase
1. **Review the previous phase** - ensure all verification steps completed
2. **Read the current phase prompt** - understand requirements thoroughly
3. **Ask clarifying questions** - if anything is unclear
4. **Plan the implementation** - break down into smaller tasks
5. **Set up proper testing** - prepare test scenarios

### During Implementation
1. **Follow TypeScript best practices** - use proper types throughout
2. **Maintain existing code patterns** - consistency with current codebase
3. **Add proper error handling** - graceful degradation for failures
4. **Include loading states** - good user experience during operations
5. **Write clean, documented code** - for future maintainability

### After Each Phase
1. **Complete all verification steps** - don't skip any checklist items
2. **Test thoroughly** - including edge cases and error conditions
3. **Document changes** - update relevant documentation
4. **Commit changes** - with clear commit messages
5. **Prepare for next phase** - ensure clean state for next iteration

### Common Commands for Verification

```bash
# Deploy changes to sandbox
npx ampx sandbox

# Test authentication in browser
npm run dev

# Check TypeScript compilation
npm run build

# Run tests
npm test

# Check bundle size
npm run analyze

# Check for security vulnerabilities
npm audit
```

### Emergency Procedures

If any phase fails critically:
1. **Stop implementation immediately**
2. **Document the failure state**
3. **Rollback to previous working state**
4. **Analyze the root cause**
5. **Adjust plan if necessary**
6. **Re-attempt with fixes**

---

*These prompts are designed to be used sequentially with Claude AI assistance. Each phase builds on the previous one and includes comprehensive verification to ensure quality and reliability.*