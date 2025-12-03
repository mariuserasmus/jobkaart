# Super Admin Quick Start Guide

## 5-Minute Setup

### Step 1: Run Database Migration (1 min)

```bash
cd jobkaart-app
supabase db push
```

Or manually:

```bash
psql -h your-host -U your-user -d your-db -f supabase/migrations/00005_add_super_admin.sql
```

### Step 2: Create Super Admin (1 min)

```sql
-- Replace with your email
UPDATE users
SET is_super_admin = TRUE
WHERE email = 'your-email@example.com';

-- Verify it worked
SELECT email, is_super_admin FROM users WHERE is_super_admin = TRUE;
```

### Step 3: Start Dev Server (1 min)

```bash
npm run dev
```

### Step 4: Test Access (2 min)

1. Open browser: `http://localhost:3000`
2. Log in with your super admin account
3. Navigate to: `http://localhost:3000/admin`
4. You should see:
   - Red banner: "You are in ADMIN MODE"
   - Admin Dashboard with statistics
   - Navigation: Dashboard | Tenants | Analytics

## What You Can Do

### View System Stats
- Go to `/admin`
- See total tenants, MRR, signups, users
- View subscription distribution
- Check platform activity

### Manage Tenants
- Go to `/admin/tenants`
- Search by business name
- Filter by status/tier
- Click "View" for details

### View Analytics
- Go to `/admin/analytics`
- See growth charts
- Review conversion rates
- Check feature usage

## Common Tasks

### Add Another Super Admin

```sql
UPDATE users
SET is_super_admin = TRUE
WHERE email = 'another-admin@example.com';
```

### View Audit Logs

```sql
SELECT
    al.action,
    al.created_at,
    u.email as admin_email
FROM admin_audit_logs al
JOIN users u ON u.id = al.admin_user_id
ORDER BY al.created_at DESC
LIMIT 20;
```

### Suspend a Tenant

```sql
UPDATE tenants
SET subscription_status = 'cancelled'
WHERE id = 'tenant-uuid-here';
```

### Find Inactive Tenants

```sql
SELECT
    business_name,
    last_activity_at,
    EXTRACT(DAY FROM NOW() - last_activity_at) as days_inactive
FROM admin_tenant_stats
WHERE last_activity_at < NOW() - INTERVAL '30 days'
ORDER BY last_activity_at ASC;
```

## Troubleshooting

### Can't access /admin
→ Run: `UPDATE users SET is_super_admin = TRUE WHERE email = 'your@email.com';`

### Analytics not loading
→ Check views exist: `SELECT * FROM admin_system_stats;`

### Audit logs empty
→ Access some admin pages, then check: `SELECT COUNT(*) FROM admin_audit_logs;`

## Documentation

- **Full Setup Guide:** `ADMIN_SETUP.md`
- **Implementation Details:** `ADMIN_SUMMARY.md`
- **SQL Queries:** `supabase/admin_queries.sql`

## Need Help?

1. Check documentation files above
2. Review SQL queries in `supabase/admin_queries.sql`
3. Test database views: `SELECT * FROM admin_tenant_stats LIMIT 5;`
4. Check audit logs for errors

---

**You're all set!** Navigate to `/admin` and start managing your JobKaart platform.
