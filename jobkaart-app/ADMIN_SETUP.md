# JobKaart Super Admin Panel - Setup Guide

## Overview

The Super Admin panel provides powerful tools for managing tenants, viewing analytics, and providing support across the JobKaart platform. All admin actions are logged for security and compliance.

## Features

### 1. Admin Dashboard (`/admin`)
- System-wide statistics (tenants, MRR, signups, users)
- Subscription distribution breakdown
- Platform activity metrics (quotes, jobs, invoices)
- Recent tenants list
- Quick access to all admin features

### 2. Tenant Management (`/admin/tenants`)
- List all tenants with search and filters
- Filter by subscription status (active, trial, cancelled, overdue)
- Filter by subscription tier (starter, pro, team)
- View detailed tenant information
- See tenant usage statistics
- Monitor tenant activity

### 3. Tenant Detail View (`/admin/tenants/[id]`)
- Complete tenant profile
- Subscription information
- Usage statistics (customers, quotes, jobs, invoices)
- Revenue tracking
- User list with roles and status
- Recent activity (quotes, jobs, invoices)

### 4. Analytics (`/admin/analytics`)
- Growth charts (tenant and user signups over time)
- Subscription tier distribution (pie chart)
- Subscription status distribution (pie chart)
- Feature usage statistics (bar chart)
- Key metrics:
  - Average quote value
  - Average invoice value
  - Quote acceptance rate
  - Invoice payment rate
- Status breakdowns for quotes, jobs, and invoices

## Database Setup

### Step 1: Run the Migration

Apply the super admin migration to your database:

```bash
# If using Supabase CLI
supabase db push

# Or apply the migration file directly
psql -h [your-host] -U [your-user] -d [your-db] -f supabase/migrations/00005_add_super_admin.sql
```

This migration creates:
- `is_super_admin` column in the `users` table
- `admin_audit_logs` table for tracking admin actions
- `admin_tenant_stats` view for tenant statistics
- `admin_system_stats` view for system-wide statistics
- Helper function `log_admin_action()` for audit logging

### Step 2: Set Your First Super Admin

After running the migration, promote your user account to super admin:

```sql
-- Replace with your actual user ID from auth.users
UPDATE users
SET is_super_admin = TRUE
WHERE id = 'your-user-id-here';
```

To find your user ID:

```sql
-- Get user ID by email
SELECT id, email, full_name
FROM users
WHERE email = 'your-email@example.com';
```

Example:

```sql
-- Promote john@example.com to super admin
UPDATE users
SET is_super_admin = TRUE
WHERE email = 'john@example.com';
```

### Step 3: Verify Super Admin Access

```sql
-- Check who has super admin access
SELECT id, email, full_name, is_super_admin
FROM users
WHERE is_super_admin = TRUE;
```

## Security Features

### 1. Access Control
- Only users with `is_super_admin = TRUE` can access admin routes
- Automatic redirect to dashboard if non-admin tries to access
- All admin pages check authorization on every request

### 2. Audit Logging
Every admin action is logged to `admin_audit_logs` table:
- Who performed the action (`admin_user_id`)
- What action was performed (`action`)
- When it happened (`created_at`)
- What was affected (`target_type`, `target_id`)
- Additional context (`metadata` JSONB field)

Example logged actions:
- `view_admin_dashboard`
- `view_tenants_list`
- `view_tenant_details`
- `view_analytics`

### 3. Visual Indicators
- Red banner at top: "You are in ADMIN MODE - All actions are logged"
- "Exit Admin Mode" link to return to normal dashboard
- Distinct admin branding (red color scheme vs. blue for regular users)

## Usage Guide

### Accessing the Admin Panel

1. Log in to JobKaart with a super admin account
2. Navigate to `/admin` or click "Admin" link (if added to your navigation)
3. You'll see the red "ADMIN MODE" banner

### Managing Tenants

**View All Tenants:**
1. Go to `/admin/tenants`
2. Use search bar to find tenants by business name
3. Filter by status (active, trial, cancelled, overdue)
4. Filter by tier (starter, pro, team)
5. Click "View" to see detailed information

**View Tenant Details:**
1. Click on any tenant from the list
2. See complete tenant profile
3. Review usage statistics
4. Check user accounts
5. View recent activity

**Suspend/Reactivate Tenant:**
Currently read-only. To change tenant status:

```sql
-- Suspend a tenant
UPDATE tenants
SET subscription_status = 'cancelled'
WHERE id = 'tenant-id-here';

-- Reactivate a tenant
UPDATE tenants
SET subscription_status = 'active'
WHERE id = 'tenant-id-here';
```

### Viewing Analytics

1. Go to `/admin/analytics`
2. Review growth trends over last 30 days
3. Check subscription distribution
4. Monitor feature usage
5. Review conversion rates

### Checking Audit Logs

```sql
-- View recent admin actions
SELECT
    al.*,
    u.email as admin_email,
    u.full_name as admin_name
FROM admin_audit_logs al
JOIN users u ON u.id = al.admin_user_id
ORDER BY al.created_at DESC
LIMIT 50;

-- View actions for specific admin
SELECT *
FROM admin_audit_logs
WHERE admin_user_id = 'user-id-here'
ORDER BY created_at DESC;

-- View actions for specific tenant
SELECT *
FROM admin_audit_logs
WHERE target_type = 'tenant'
AND target_id = 'tenant-id-here'
ORDER BY created_at DESC;
```

## Testing the Admin Panel

### Test Checklist

1. **Access Control:**
   - [ ] Regular user cannot access `/admin` (redirects to `/dashboard`)
   - [ ] Super admin can access `/admin`
   - [ ] Red banner shows "You are in ADMIN MODE"

2. **Dashboard:**
   - [ ] System stats load correctly
   - [ ] Subscription distribution shows correct counts
   - [ ] Recent tenants list displays
   - [ ] MRR calculation is accurate

3. **Tenant Management:**
   - [ ] Tenant list loads all tenants
   - [ ] Search by business name works
   - [ ] Filters (status, tier) work correctly
   - [ ] Clicking "View" shows tenant details

4. **Tenant Details:**
   - [ ] Tenant information displays correctly
   - [ ] User list shows all tenant users
   - [ ] Statistics are accurate
   - [ ] Recent activity loads

5. **Analytics:**
   - [ ] Growth chart displays 30-day trend
   - [ ] Pie charts show correct distributions
   - [ ] Feature usage bar chart displays
   - [ ] Key metrics calculate correctly

6. **Audit Logging:**
   - [ ] Admin actions are logged to database
   - [ ] Logs include correct admin_user_id
   - [ ] Action names are descriptive
   - [ ] Timestamps are accurate

### Manual Testing Steps

```bash
# 1. Start the development server
npm run dev

# 2. Open browser to http://localhost:3000

# 3. Log in with super admin account

# 4. Navigate to /admin

# 5. Test each page:
#    - /admin (dashboard)
#    - /admin/tenants (tenant list)
#    - /admin/tenants/[some-tenant-id] (tenant detail)
#    - /admin/analytics (analytics)

# 6. Check audit logs in database:
```

```sql
SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT 10;
```

## Common Issues & Solutions

### Issue: "Unauthorized: Super admin access required"
**Solution:** Ensure your user has `is_super_admin = TRUE`:

```sql
UPDATE users SET is_super_admin = TRUE WHERE email = 'your-email@example.com';
```

### Issue: Analytics page shows "Failed to load analytics data"
**Solution:**
1. Check that views are created: `admin_system_stats`, `admin_tenant_stats`
2. Verify user has super admin access
3. Check browser console for API errors

### Issue: Tenant list is empty
**Solution:**
1. Verify tenants exist in database
2. Check that `admin_tenant_stats` view exists
3. Ensure RLS policies allow super admin to read all tenants

### Issue: Charts not displaying
**Solution:**
1. Verify `recharts` library is installed: `npm install recharts`
2. Check browser console for errors
3. Ensure API route `/api/admin/analytics` is accessible

## Adding More Super Admins

To promote additional users to super admin:

```sql
-- Add super admin by email
UPDATE users
SET is_super_admin = TRUE
WHERE email = 'new-admin@example.com';

-- Add super admin by user ID
UPDATE users
SET is_super_admin = TRUE
WHERE id = 'user-id-here';
```

To remove super admin access:

```sql
UPDATE users
SET is_super_admin = FALSE
WHERE email = 'former-admin@example.com';
```

## Future Enhancements (Not Yet Implemented)

These features are planned but not yet built:

1. **Impersonation:** Log in as a tenant user for support
2. **Tenant Suspension UI:** Button to suspend/reactivate tenants
3. **Manual Subscription Adjustments:** Change tier/status from UI
4. **Export Data:** Export tenant data to CSV
5. **Error Logs:** View application errors per tenant
6. **Support Tickets:** Track customer support requests
7. **Email Tenants:** Send notifications from admin panel
8. **Bulk Actions:** Apply changes to multiple tenants at once

## Architecture Notes

### File Structure

```
jobkaart-app/
├── app/
│   ├── admin/
│   │   ├── layout.tsx                 # Admin layout with banner
│   │   ├── page.tsx                   # Admin dashboard
│   │   ├── components/
│   │   │   ├── AdminBanner.tsx        # Red "Admin Mode" banner
│   │   │   ├── AdminNav.tsx           # Admin navigation
│   │   │   ├── AdminStats.tsx         # Stat card component
│   │   │   └── AdminTable.tsx         # Reusable table component
│   │   ├── tenants/
│   │   │   ├── page.tsx               # Tenant list
│   │   │   └── [id]/
│   │   │       └── page.tsx           # Tenant detail
│   │   └── analytics/
│   │       └── page.tsx               # Analytics with charts
│   └── api/
│       └── admin/
│           └── analytics/
│               └── route.ts           # Analytics API endpoint
├── lib/
│   └── admin/
│       ├── auth.ts                    # Admin authentication helpers
│       └── queries.ts                 # Admin database queries
└── supabase/
    └── migrations/
        └── 00005_add_super_admin.sql  # Super admin migration
```

### Key Components

**lib/admin/auth.ts:**
- `isSuperAdmin()` - Check if current user is super admin
- `getCurrentAdminUser()` - Get current admin user data
- `logAdminAction()` - Log an admin action to audit log
- `requireSuperAdmin()` - Throw error if not super admin

**lib/admin/queries.ts:**
- `getSystemStats()` - Get system-wide statistics
- `getAllTenants()` - Get all tenants with filters
- `getTenantDetails()` - Get single tenant details
- `getTenantActivity()` - Get tenant's recent activity
- `getGrowthMetrics()` - Get growth data over time
- `getFeatureUsage()` - Get feature usage statistics

### Database Views

**admin_system_stats:**
Provides system-wide statistics in a single query:
- Total tenants (all statuses)
- Active/trial tenant counts
- New signups (last 30 days)
- Total users
- Subscription tier distribution
- Estimated MRR
- Activity counts

**admin_tenant_stats:**
Provides per-tenant statistics:
- User counts (total and active)
- Customer count
- Quote/job/invoice counts (total and last 30 days)
- Revenue (total and last 30 days)
- Last activity timestamp

## Support

For issues or questions about the admin panel:

1. Check this documentation first
2. Review audit logs for errors
3. Check browser console for JavaScript errors
4. Verify database migration was applied successfully
5. Ensure super admin flag is set correctly

## Security Best Practices

1. **Limit Super Admins:** Only grant super admin to trusted users
2. **Regular Audits:** Review `admin_audit_logs` regularly
3. **No Data Modification:** Admin panel is read-only by design
4. **Secure Credentials:** Use strong passwords for admin accounts
5. **Monitor Access:** Watch for unusual admin activity patterns
6. **Log Review:** Check logs weekly for suspicious actions

## Changelog

**Version 1.0.0 (2025-12-03):**
- Initial admin panel implementation
- Dashboard with system statistics
- Tenant management (list and detail views)
- Analytics page with charts
- Audit logging system
- Read-only access to tenant data

---

**Document Last Updated:** December 3, 2025
**JobKaart Version:** 1.0.0
