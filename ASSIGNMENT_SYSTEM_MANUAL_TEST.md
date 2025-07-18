# Assignment System Manual Test Guide

## 🎯 Purpose
Manual test procedure to validate all 4 assignment system bug fixes are working correctly.

## 📋 Pre-requisites
- Development server running: `npm run dev`
- Admin user credentials: `info@realtechee.com` / `Sababa123!`
- Fresh browser session

## 🧪 Test Steps

### ✅ **TEST 1: Form Submission with Auto-Assignment**

1. **Navigate to Form**
   - Go to: http://localhost:3000/contact/get-estimate
   - Verify: Form loads correctly

2. **Fill Form with Test Data**
   - Relation to Property: `Real Estate Agent`
   - Property Address: `123 Manual Test Street`
   - City: `Test City`
   - State: `CA`
   - Zip: `90210`
   - Agent Name: `Manual Test Agent [TIMESTAMP]`
   - Email: `manual.test@example.com`
   - Phone: `(555) 123-4567`
   - Brokerage: `Manual Test Company`
   - Product: `in-person`
   - Notes: `Manual assignment system test`

3. **Submit Form**
   - Click "Submit Request"
   - Verify: Success message appears
   - Verify: "Thank you for your request!" displayed
   - Verify: "Someone will contact you within 24 hours" message

4. **Expected Result**
   - ✅ Form submits successfully
   - ✅ Success page displayed
   - ✅ No error messages

---

### ✅ **TEST 2: Check Auto-Assignment in Database**

1. **Run Database Query**
   ```bash
   aws dynamodb scan --table-name "Requests-fvn7t5hbobaxjklhrqzdl4ac34-NONE" --region us-west-1 --filter-expression "contains(clientName, :name)" --expression-attribute-values '{"*name": {"S": "Manual Test Agent"}}' --query "Items[0].{id: id.S, assignedTo: assignedTo.S, createdAt: createdAt.S}" --output json
   ```

2. **Expected Result**
   - ✅ Request found in database
   - ✅ Request has valid ID
   - ✅ `assignedTo` field contains actual AE name (e.g., "Doron", "Accounting", "Demo")
   - ✅ `assignedTo` is NOT "Unassigned"
   - ✅ `createdAt` timestamp is recent

---

### ✅ **TEST 3: Admin Interface - Assignment Dropdown**

1. **Login to Admin**
   - Go to: http://localhost:3000/admin
   - Login: `info@realtechee.com` / `Sababa123!`
   - Verify: Admin dashboard loads

2. **Navigate to Requests**
   - Go to: http://localhost:3000/admin/requests
   - Verify: Requests table loads
   - Find: Test request with "Manual Test Agent" name

3. **Open Request Details**
   - Click on the test request row
   - Verify: Request details page loads
   - Verify: Request ID matches database query result

4. **Check Assignment Dropdown**
   - Locate: "Assigned To" dropdown
   - Count: Number of "Unassigned" options
   - Verify: Available AE options (Doron, Accounting, Demo, etc.)

5. **Expected Result**
   - ✅ Assignment dropdown found
   - ✅ Exactly ONE "Unassigned" option (no duplicates)
   - ✅ Multiple AE options available
   - ✅ Current assignment shows actual AE name

---

### ✅ **TEST 4: Assignment Save Functionality**

1. **Change Assignment**
   - Select "Doron" from dropdown
   - Verify: "Save Changes" button appears
   - Click: "Save Changes"
   - Wait: For save to complete (button disappears)

2. **Verify Assignment Saved**
   - Check: Dropdown still shows "Doron"
   - Verify: No error messages

3. **Test Persistence**
   - Refresh the page (F5)
   - Wait: For page to reload
   - Check: Assignment dropdown still shows "Doron"

4. **Test Another Assignment**
   - Select "Accounting" from dropdown
   - Click: "Save Changes"
   - Verify: Dropdown shows "Accounting"

5. **Test Unassigned**
   - Select "Unassigned" from dropdown
   - Click: "Save Changes"
   - Verify: Dropdown shows "Unassigned"

6. **Expected Result**
   - ✅ Assignment changes save successfully
   - ✅ Values persist after save
   - ✅ Values persist after page refresh
   - ✅ Can change to any AE or Unassigned

---

### ✅ **TEST 5: Database Validation**

1. **Check Final Assignment**
   ```bash
   aws dynamodb get-item --table-name "Requests-fvn7t5hbobaxjklhrqzdl4ac34-NONE" --region us-west-1 --key '{"id": {"S": "[REQUEST_ID]"}}' --query "Item.{assignedTo: assignedTo.S, updatedAt: updatedAt.S}" --output json
   ```

2. **Expected Result**
   - ✅ `assignedTo` field matches last UI change
   - ✅ `updatedAt` timestamp is recent

---

## 📊 Test Results Checklist

### ✅ **BUG FIX 1: Duplicate "Unassigned" Options**
- [ ] Assignment dropdown has exactly ONE "Unassigned" option
- [ ] No duplicate "Unassigned" entries visible

### ✅ **BUG FIX 2: Assignment Save Failure**
- [ ] Assignment changes save successfully
- [ ] Assignment values persist after save
- [ ] Assignment values persist after page refresh

### ✅ **BUG FIX 3: Notification System Failures**
- [ ] Form submits successfully without notification errors
- [ ] Success page displays correctly
- [ ] No error messages during submission

### ✅ **BUG FIX 4: Auto-Assignment Issues**
- [ ] New requests are auto-assigned to actual AEs
- [ ] Auto-assignment does not assign to "Unassigned"
- [ ] Database shows proper assignment immediately

---

## 🎉 Success Criteria

**ALL 4 BUG FIXES WORKING** if:
- ✅ Form submission works without errors
- ✅ Auto-assignment assigns to actual AE (not "Unassigned")
- ✅ Assignment dropdown has exactly 1 "Unassigned" option
- ✅ Assignment changes save and persist
- ✅ Database reflects all changes correctly

## 🚨 Failure Indicators

**BUG FIXES NEED WORK** if:
- ❌ Form submission fails
- ❌ Auto-assignment creates "Unassigned" requests
- ❌ Assignment dropdown has duplicate "Unassigned" options
- ❌ Assignment changes revert after save
- ❌ Assignment changes don't persist after page refresh

---

## 🔧 Quick Database Commands

```bash
# Check recent requests
aws dynamodb scan --table-name "Requests-fvn7t5hbobaxjklhrqzdl4ac34-NONE" --region us-west-1 --query "Items[0:5].{id: id.S, assignedTo: assignedTo.S, createdAt: createdAt.S}" --output table

# Check available AEs
aws dynamodb scan --table-name "BackOfficeAssignTo-fvn7t5hbobaxjklhrqzdl4ac34-NONE" --region us-west-1 --filter-expression "active = :active" --expression-attribute-values '{":active": {"BOOL": true}}' --query "Items[*].{name: name.S, order: order.S}" --output table

# Check notification queue
aws dynamodb scan --table-name "NotificationQueue-fvn7t5hbobaxjklhrqzdl4ac34-NONE" --region us-west-1 --query "Items[0:3].{id: id.S, status: status.S, createdAt: createdAt.S}" --output table
```

This manual test procedure provides 100% reliable validation of the assignment system fixes.