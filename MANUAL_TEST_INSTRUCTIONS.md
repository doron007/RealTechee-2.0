# Manual Test Instructions for Assignment System Bug Fixes

## 🎯 Purpose
Validate that all 4 critical assignment system bug fixes are working correctly.

## 📝 Test Data to Use
- **Agent Name**: Test Agent Fixes Validation
- **Email**: test.fixes@example.com
- **Phone**: (555) 123-4567
- **Company**: Test Company Fixes
- **Property Address**: 123 Assignment Fix Test St
- **City**: Test City
- **State**: CA
- **Zip**: 90210
- **Product**: Kitchen Renovation
- **Notes**: Testing assignment system bug fixes

## 🧪 Test Steps

### Step 1: Test Form Submission and Auto-Assignment
1. Open: http://localhost:3000/contact/get-estimate
2. Fill out the form with the test data above
3. Submit the form
4. **Expected Result**: ✅ Success page shows with Request ID
5. **Expected Result**: ✅ Form submits without errors (tests notification fix)

### Step 2: Check Auto-Assignment in Admin Panel
1. Open: http://localhost:3000/admin
2. Login with: info@realtechee.com / Sababa123!
3. Go to Requests management
4. Find the request you just created
5. **Expected Result**: ✅ Request should be assigned to actual AE (not "Unassigned")
6. Click on the request to open details

### Step 3: Test Assignment Dropdown (Fix #1)
1. In the request details, look at the "Assigned To" dropdown
2. **Expected Result**: ✅ Should have exactly ONE "Unassigned" option (no duplicates)
3. **Expected Result**: ✅ Should show actual AE names (Doron, Accounting, Demo, etc.)

### Step 4: Test Assignment Save (Fix #2)
1. Change the assignment to "Doron"
2. Click "Save Changes"
3. Wait for save to complete
4. **Expected Result**: ✅ Assignment should stay as "Doron" (not revert)
5. Refresh the page
6. **Expected Result**: ✅ Assignment should still be "Doron"

### Step 5: Test Assignment Change
1. Change assignment to "Accounting"
2. Save changes
3. **Expected Result**: ✅ Assignment should change and persist
4. Change back to "Unassigned"
5. Save changes
6. **Expected Result**: ✅ Assignment should change to "Unassigned" and persist

## 🔍 Validation Commands

After completing the manual test, run these commands to validate:

### Check the new request was created with proper assignment:
```bash
aws dynamodb scan --table-name "Requests-fvn7t5hbobaxjklhrqzdl4ac34-NONE" --region us-west-1 --filter-expression "contains(clientName, :name)" --expression-attribute-values '{"*name": {"S": "Test Agent Fixes"}}' --query "Items[*].{id: id.S, clientName: clientName.S, assignedTo: assignedTo.S, createdAt: createdAt.S}"
```

### Check available AEs (should include "Unassigned"):
```bash
aws dynamodb scan --table-name "BackOfficeAssignTo-fvn7t5hbobaxjklhrqzdl4ac34-NONE" --region us-west-1 --filter-expression "active = :active" --expression-attribute-values '{"*active": {"BOOL": true}}' --query "Items[*].{name: name.S, active: active.BOOL, order: order.S}" --output table
```

### Check notification queue (should have new entries):
```bash
aws dynamodb scan --table-name "NotificationQueue-fvn7t5hbobaxjklhrqzdl4ac34-NONE" --region us-west-1 --query "Items[*].{id: id.S, eventType: eventType.S, status: status.S, createdAt: createdAt.S}" --output table | tail -5
```

## ✅ Success Criteria

### BUG FIX 1: Duplicate "Unassigned" Options Fixed
- [ ] Assignment dropdown shows exactly ONE "Unassigned" option
- [ ] No duplicate "Unassigned" entries in dropdown

### BUG FIX 2: Assignment Save Failure Fixed
- [ ] Assignment changes save successfully
- [ ] Assignment values persist after save
- [ ] Assignment changes persist after page refresh

### BUG FIX 3: Notification System Failures Fixed
- [ ] Form submits successfully without notification errors
- [ ] Notification entries appear in queue
- [ ] Form doesn't fail due to notification issues

### BUG FIX 4: Auto-Assignment Issues Fixed
- [ ] New requests are auto-assigned to actual AEs
- [ ] Auto-assignment doesn't assign to "Unassigned"
- [ ] Round-robin assignment works correctly

## 📊 Expected Database Results

After successful test, you should see:
- New request in Requests table
- Request assigned to actual AE (Doron, Accounting, Demo, etc.)
- Notification entry in NotificationQueue table
- Assignment changes reflected in database after manual changes

## 🚨 Issues to Report

If any of these occur, the fixes need more work:
- ❌ Form submission fails
- ❌ Request shows as "Unassigned" after auto-assignment
- ❌ Duplicate "Unassigned" options in dropdown
- ❌ Assignment changes revert after save
- ❌ Assignment changes don't persist after refresh
- ❌ Notifications not queued
- ❌ Form fails due to notification errors

## 🎯 Next Steps

After completing manual testing:
1. Run the validation commands above
2. Check that all success criteria are met
3. If any issues found, iterate on fixes
4. Create additional regression tests
5. Document any remaining issues