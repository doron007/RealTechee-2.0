# Manual Breakpoint Verification Checklist

## Issue Analysis
User reported that table elements are getting chopped at specific breakpoints:
- **1440px**: Table getting chopped, then catches up before next break
- **1024px**: Table getting chopped again

## Current Column Optimization Applied
- **Total Width Reduced**: 1,240px → 1,050px (15% reduction)
- **Individual Column Sizes**:
  - Status: 150px → 100px
  - Address: 250px → 200px  
  - Created: 150px → 120px
  - Owner: 150px → 130px
  - Agent: 150px → 130px
  - Brokerage: 150px → 140px
  - Opportunity: 120px → 110px
  - Actions: 120px (unchanged)

## Responsive Breakpoints to Test
Based on code analysis (`ProjectsTable.tsx` lines 454-489):

### 1. Mobile (< 768px)
- **Expected**: Cards view (no table)
- **Test**: 767px - should show cards

### 2. Tablet (768px - 1023px)  
- **Expected**: Essential columns only (5 columns)
- **Visible**: Status, Address, Actions, Owner, Opportunity
- **Hidden**: Created, Agent, Brokerage
- **Test Resolutions**: 
  - **768px** (first tablet resolution)
  - **1023px** (last tablet resolution)

### 3. Small Desktop (1024px - 1439px)
- **Expected**: More columns (6 columns)  
- **Visible**: Status, Address, Actions, Created, Owner, Opportunity
- **Hidden**: Agent, Brokerage
- **Critical Test Resolutions**:
  - **1024px** ⚠️ (user reported chopping here)
  - **1366px** (common laptop)
  - **1439px** (last small desktop)

### 4. Large Desktop (≥ 1440px)
- **Expected**: All columns (8 columns)
- **Visible**: Status, Address, Created, Owner, Agent, Brokerage, Opportunity, Actions
- **Critical Test Resolutions**:
  - **1440px** ⚠️ (user reported chopping here) 
  - **1920px** (should have plenty of space)

## Manual Testing Steps

### For each critical resolution:

1. **Set browser viewport** to exact dimensions
2. **Force table view** (localStorage: 'admin-projects-view-mode' = 'table')
3. **Measure table width** using browser dev tools:
   - Right-click table → Inspect
   - Check computed width and position
   - Verify rightmost edge < viewport width
4. **Check for horizontal scrollbar** on table container
5. **Verify column count** matches expected for breakpoint
6. **Document any overflow** (pixels beyond viewport)

## Expected Column Totals by Breakpoint

### Tablet (768-1023px): ~5 columns
- Status: 100px + Address: 200px + Owner: 130px + Opportunity: 110px + Actions: 120px = **660px**
- **Safe for**: 768px viewport (108px margin)

### Small Desktop (1024-1439px): ~6 columns  
- Above + Created: 120px = **780px**
- **Safe for**: 1024px viewport (244px margin)

### Large Desktop (≥1440px): ~8 columns
- Above + Agent: 130px + Brokerage: 140px = **1,050px**
- **Safe for**: 1440px viewport (390px margin)

## Red Flags to Look For

1. **Table extends beyond viewport** (horizontal scroll appears)
2. **Columns cut off on right side** (last column partially hidden)
3. **Text truncation** in visible columns
4. **Inconsistent column visibility** across similar resolutions

## Success Criteria

✅ **1024px**: All 6 expected columns visible, no horizontal scroll, ~244px margin
✅ **1440px**: All 8 expected columns visible, no horizontal scroll, ~390px margin  
✅ **1366px**: Comfortable fit with adequate margins
✅ **Responsive behavior**: Correct column hiding/showing at breakpoints

## Test Documentation Template

```
Resolution: [width]x[height]
Expected columns: [count] 
Actual columns: [count]
Table width: [px]
Viewport width: [px] 
Margin remaining: [px]
Horizontal scroll: [yes/no]
Status: [PASS/FAIL]
Issues: [description]
```