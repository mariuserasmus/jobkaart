# Quote Templates Feature - Testing Guide

## Overview
The Quote Templates feature allows users to save and reuse common quote configurations, saving time when creating quotes for similar jobs.

## Files Created

### API Routes
1. **c:\Claude\JobKaart\jobkaart-app\app\api\quote-templates\route.ts**
   - GET: List all quote templates
   - POST: Create new template

2. **c:\Claude\JobKaart\jobkaart-app\app\api\quote-templates\[id]\route.ts**
   - GET: Get single template by ID
   - PATCH: Update template
   - DELETE: Delete template

### Components
3. **c:\Claude\JobKaart\jobkaart-app\components\features\quote-templates\QuoteTemplateList.tsx**
   - Displays grid of template cards
   - Search functionality
   - Edit/delete actions

4. **c:\Claude\JobKaart\jobkaart-app\components\features\quote-templates\QuoteTemplateForm.tsx**
   - Create/edit template form
   - Line items management
   - VAT toggle
   - Notes and terms fields

### Pages
5. **c:\Claude\JobKaart\jobkaart-app\app\(dashboard)\quote-templates\page.tsx**
   - List view of all templates

6. **c:\Claude\JobKaart\jobkaart-app\app\(dashboard)\quote-templates\new\page.tsx**
   - Create new template page

7. **c:\Claude\JobKaart\jobkaart-app\app\(dashboard)\quote-templates\[id]\edit\page.tsx**
   - Edit existing template page

### Updated Files
8. **c:\Claude\JobKaart\jobkaart-app\components\features\quotes\QuoteForm.tsx**
   - Added template dropdown
   - Added template loading functionality
   - Auto-updates template usage statistics

9. **c:\Claude\JobKaart\jobkaart-app\app\(dashboard)\components\DashboardNav.tsx**
   - Added "Templates" navigation link

10. **c:\Claude\JobKaart\jobkaart-app\types\index.ts**
    - Updated QuoteTemplate interface to match database schema

### Database Migration
11. **c:\Claude\JobKaart\jobkaart-app\supabase\migrations\00005_add_quote_template_notes_terms.sql**
    - Adds `notes` and `terms` columns to quote_templates table

---

## Setup Instructions

### 1. Run Database Migration
```bash
# Navigate to the supabase folder
cd jobkaart-app

# Apply the migration
supabase migration up
```

Or manually run the SQL:
```sql
ALTER TABLE quote_templates
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS terms TEXT;
```

### 2. Start the Development Server
```bash
cd jobkaart-app
npm run dev
```

---

## How to Test

### Test 1: Navigation
1. Log into the application
2. Check that "Templates" appears in the navigation bar between "Quotes" and "Jobs"
3. Click on "Templates"
4. Should navigate to `/quote-templates`

**Expected Result**: Templates page loads with "No templates yet" message

---

### Test 2: Create a Template
1. From the templates page, click "+ New Template" button
2. Fill in the form:
   - **Template Name**: "Standard Plumbing Repair"
   - **Description**: "Common bathroom repairs with labour and parts"
   - **Line Items**:
     - Item 1: Description: "Labour", Quantity: 2, Unit Price: 500
     - Item 2: Description: "Parts", Quantity: 1, Unit Price: 350
   - **Include VAT**: Checked
   - **Default Notes**: "Work includes inspection and testing"
   - **Default Terms**: "50% deposit required, balance on completion"
3. Click "Create Template"

**Expected Result**:
- Redirects to templates list
- Shows new template card with:
  - Name: "Standard Plumbing Repair"
  - Description visible
  - "2 line items"
  - Total: R1,977.50 (850 + 15% VAT)
  - "Used 0 times"
  - "Last used: Never"

---

### Test 3: Create Multiple Templates
Create 2 more templates with different names and line items:
- "Electrical COC Inspection"
- "Emergency Call-Out"

**Expected Result**: Grid shows 3 template cards

---

### Test 4: Search Templates
1. In the search box, type "plumbing"
2. Should filter to show only "Standard Plumbing Repair"
3. Clear search
4. Type "COC"
5. Should show only "Electrical COC Inspection"

**Expected Result**: Search filters templates by name and description

---

### Test 5: Edit a Template
1. Click "Edit" on the "Standard Plumbing Repair" template
2. Change the name to "Standard Plumbing Service"
3. Add a third line item: "Call-out fee", Quantity: 1, Unit Price: 200
4. Click "Save Changes"

**Expected Result**:
- Redirects to templates list
- Template now shows updated name
- Total updated to reflect new line item

---

### Test 6: Load Template in Quote Form
1. Navigate to Quotes page
2. Click "+ New Quote"
3. Select a customer from dropdown
4. Look for green "Load from Template" section
5. Select "Standard Plumbing Service" from the dropdown

**Expected Result**:
- Line items auto-populate with template's line items
- Notes field fills with template's default notes
- Terms field fills with template's default terms
- VAT checkbox matches template setting
- User can still edit all fields

---

### Test 7: Template Usage Tracking
1. Create a quote using the "Standard Plumbing Service" template
2. Navigate back to Templates page
3. Check the template card

**Expected Result**:
- "Used 1 times" (incremented from 0)
- "Last used: [today's date]"

---

### Test 8: Delete a Template
1. From templates list, click the trash icon on "Emergency Call-Out" template
2. Confirm deletion in the popup

**Expected Result**:
- Template card disappears from the list
- Remaining templates still visible

---

### Test 9: Mobile Responsiveness
1. Resize browser to mobile width (or use browser dev tools)
2. Check templates page
3. Check new template form
4. Check quote form with template dropdown

**Expected Result**:
- Grid switches to single column on mobile
- Forms remain usable on mobile
- All buttons and inputs accessible

---

### Test 10: Multi-Tenant Isolation (Security)
**If you have access to two different tenants:**
1. Create a template in Tenant A
2. Log out and log in as Tenant B
3. Check templates list in Tenant B

**Expected Result**:
- Tenant B should NOT see Tenant A's templates
- RLS (Row Level Security) enforces isolation

---

### Test 11: Validation - Empty Template Name
1. Click "+ New Template"
2. Leave template name empty
3. Add line items
4. Click "Create Template"

**Expected Result**:
- Error message: "Please enter a template name"
- Form does not submit

---

### Test 12: Validation - No Line Items
1. Enter template name
2. Leave the single line item empty
3. Click "Create Template"

**Expected Result**:
- Error message: "Please fill in all line item fields"
- Form does not submit

---

### Test 13: VAT Toggle
1. Create new template
2. Add line items with subtotal of R1,000
3. Check "Include VAT (15%)" - should show R1,150 total
4. Uncheck VAT - should show R1,000 total
5. Save template with VAT unchecked

**Expected Result**:
- Totals calculate correctly
- When loading this template in quote form, VAT checkbox is unchecked

---

### Test 14: Long Template Names and Descriptions
1. Create a template with a very long name (100+ characters)
2. Add a long description (500+ characters)

**Expected Result**:
- Template card shows truncated text with "line-clamp"
- Edit page shows full text
- No layout breaking

---

### Test 15: Template with No Description
1. Create a template without filling in the description field
2. Save it

**Expected Result**:
- Template saves successfully
- Card doesn't show description section
- No errors

---

## Common Issues and Solutions

### Issue 1: Templates Not Loading
**Symptoms**: Empty templates list or loading spinner never stops
**Solution**:
- Check browser console for errors
- Verify database migration ran successfully
- Check Supabase RLS policies for quote_templates table

### Issue 2: Template Not Loading in Quote Form
**Symptoms**: Template dropdown is empty or doesn't populate line items
**Solution**:
- Check browser console for API errors
- Verify GET /api/quote-templates endpoint is working
- Check that templates exist for the current tenant

### Issue 3: Delete Not Working
**Symptoms**: Template doesn't disappear after clicking delete
**Solution**:
- Check browser console for errors
- Verify DELETE endpoint has correct tenant_id check
- Refresh page to see if deletion succeeded

---

## API Endpoints Reference

### GET /api/quote-templates
- **Query Params**: `search` (optional), `limit` (default: 50)
- **Returns**: List of templates for current tenant
- **Auth**: Required (tenant_id from session)

### POST /api/quote-templates
- **Body**: `{ name, description, line_items, vat_amount, notes, terms }`
- **Returns**: Created template object
- **Validation**: Name required, at least 1 line item required

### GET /api/quote-templates/[id]
- **Returns**: Single template by ID
- **Auth**: Must belong to current tenant

### PATCH /api/quote-templates/[id]
- **Body**: Partial update (any fields)
- **Returns**: Updated template object
- **Special**: Auto-increments `times_used` when loaded in quote form

### DELETE /api/quote-templates/[id]
- **Returns**: Success confirmation
- **Auth**: Must belong to current tenant

---

## Database Schema Reference

```sql
CREATE TABLE quote_templates (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    line_items JSONB NOT NULL DEFAULT '[]',
    default_subtotal DECIMAL(10, 2),
    default_vat_amount DECIMAL(10, 2),
    default_total DECIMAL(10, 2),
    notes TEXT,
    terms TEXT,
    times_used INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Feature Checklist

- [x] Create API routes (GET, POST, PATCH, DELETE)
- [x] Create QuoteTemplateList component
- [x] Create QuoteTemplateForm component
- [x] Update QuoteForm with template dropdown
- [x] Create templates list page
- [x] Create new template page
- [x] Create edit template page
- [x] Add navigation link
- [x] Update TypeScript types
- [x] Create database migration for notes/terms columns
- [x] Template search functionality
- [x] Template usage tracking
- [x] Mobile-responsive design
- [x] Multi-tenant security (RLS)
- [x] Form validation
- [x] VAT calculation

---

## Success Metrics

After testing, you should be able to:

1. Create templates in under 2 minutes
2. Load a template into a quote in under 5 seconds
3. Search and find templates quickly
4. Edit templates without data loss
5. Delete templates without errors
6. See usage statistics update correctly
7. Use templates on mobile devices
8. Have complete tenant isolation (security)

---

## Next Steps (Future Enhancements)

Potential improvements not included in this version:

1. **Duplicate Template**: One-click copy of existing template
2. **Template Categories**: Group templates by service type
3. **Import/Export**: Share templates between tenants
4. **Template Preview**: Show formatted PDF preview
5. **Bulk Actions**: Delete multiple templates at once
6. **Template Analytics**: Most-used templates report
7. **Save Quote as Template**: Convert existing quote to template with one click

---

## Support

If you encounter issues:
1. Check browser console for JavaScript errors
2. Check network tab for failed API calls
3. Verify database migration was applied
4. Check Supabase logs for server errors
5. Ensure you're logged in with correct tenant

---

**Feature completed**: 2025-12-03
**Tested on**: Next.js 14, React 18, Supabase
