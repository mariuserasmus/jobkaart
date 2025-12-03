-- ============================================================================
-- JobKaart Super Admin - Common SQL Queries
-- ============================================================================
-- Quick reference for managing super admins and viewing system data
-- ============================================================================

-- ============================================================================
-- SUPER ADMIN MANAGEMENT
-- ============================================================================

-- 1. Promote user to super admin by email
UPDATE users
SET is_super_admin = TRUE
WHERE email = 'admin@example.com';

-- 2. Promote user to super admin by ID
UPDATE users
SET is_super_admin = TRUE
WHERE id = 'user-uuid-here';

-- 3. Remove super admin access
UPDATE users
SET is_super_admin = FALSE
WHERE email = 'former-admin@example.com';

-- 4. List all super admins
SELECT
    id,
    email,
    full_name,
    tenant_id,
    created_at
FROM users
WHERE is_super_admin = TRUE
ORDER BY created_at DESC;

-- 5. Find user ID by email (useful for promoting to admin)
SELECT
    id,
    email,
    full_name,
    tenant_id,
    is_super_admin
FROM users
WHERE email = 'user@example.com';

-- ============================================================================
-- AUDIT LOG QUERIES
-- ============================================================================

-- 6. View recent admin actions (last 50)
SELECT
    al.id,
    al.action,
    al.target_type,
    al.target_id,
    al.created_at,
    u.email as admin_email,
    u.full_name as admin_name,
    al.metadata
FROM admin_audit_logs al
JOIN users u ON u.id = al.admin_user_id
ORDER BY al.created_at DESC
LIMIT 50;

-- 7. View actions by specific admin
SELECT
    action,
    target_type,
    target_id,
    metadata,
    created_at
FROM admin_audit_logs
WHERE admin_user_id = 'user-uuid-here'
ORDER BY created_at DESC;

-- 8. View actions for specific tenant
SELECT
    al.action,
    al.created_at,
    u.email as admin_email,
    al.metadata
FROM admin_audit_logs al
JOIN users u ON u.id = al.admin_user_id
WHERE al.target_type = 'tenant'
AND al.target_id = 'tenant-uuid-here'
ORDER BY al.created_at DESC;

-- 9. Count actions by admin user
SELECT
    u.email,
    u.full_name,
    COUNT(*) as action_count,
    MAX(al.created_at) as last_action
FROM admin_audit_logs al
JOIN users u ON u.id = al.admin_user_id
GROUP BY u.id, u.email, u.full_name
ORDER BY action_count DESC;

-- 10. Count actions by action type
SELECT
    action,
    COUNT(*) as count
FROM admin_audit_logs
GROUP BY action
ORDER BY count DESC;

-- ============================================================================
-- TENANT MANAGEMENT
-- ============================================================================

-- 11. View all tenants with key stats
SELECT
    business_name,
    subscription_tier,
    subscription_status,
    user_count,
    customer_count,
    total_quotes,
    total_jobs,
    total_invoices,
    total_revenue,
    created_at
FROM admin_tenant_stats
ORDER BY created_at DESC;

-- 12. Find tenants by business name
SELECT *
FROM admin_tenant_stats
WHERE business_name ILIKE '%search-term%'
ORDER BY created_at DESC;

-- 13. Suspend a tenant account
UPDATE tenants
SET subscription_status = 'cancelled',
    updated_at = NOW()
WHERE id = 'tenant-uuid-here';

-- 14. Reactivate a tenant account
UPDATE tenants
SET subscription_status = 'active',
    updated_at = NOW()
WHERE id = 'tenant-uuid-here';

-- 15. Change tenant subscription tier
UPDATE tenants
SET subscription_tier = 'pro', -- or 'starter', 'team'
    updated_at = NOW()
WHERE id = 'tenant-uuid-here';

-- 16. View tenants by subscription status
SELECT
    business_name,
    subscription_tier,
    subscription_status,
    user_count,
    created_at
FROM admin_tenant_stats
WHERE subscription_status = 'active' -- or 'trial', 'cancelled', 'overdue'
ORDER BY created_at DESC;

-- 17. View trial tenants (potential conversions)
SELECT
    business_name,
    email,
    phone,
    subscription_started_at,
    subscription_ends_at,
    EXTRACT(DAY FROM subscription_ends_at - NOW()) as days_remaining
FROM tenants
WHERE subscription_status = 'trial'
ORDER BY subscription_ends_at ASC;

-- 18. View inactive tenants (no recent activity)
SELECT
    business_name,
    subscription_tier,
    subscription_status,
    last_activity_at,
    EXTRACT(DAY FROM NOW() - last_activity_at) as days_inactive
FROM admin_tenant_stats
WHERE last_activity_at < NOW() - INTERVAL '30 days'
ORDER BY last_activity_at ASC;

-- ============================================================================
-- SYSTEM STATISTICS
-- ============================================================================

-- 19. View system-wide stats
SELECT * FROM admin_system_stats;

-- 20. Calculate actual MRR (Monthly Recurring Revenue)
SELECT
    SUM(CASE
        WHEN subscription_tier = 'starter' THEN 299
        WHEN subscription_tier = 'pro' THEN 499
        WHEN subscription_tier = 'team' THEN 799
        ELSE 0
    END) as estimated_mrr,
    COUNT(*) as active_tenants
FROM tenants
WHERE subscription_status = 'active';

-- 21. View subscription tier distribution
SELECT
    subscription_tier,
    COUNT(*) as count,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
FROM tenants
GROUP BY subscription_tier
ORDER BY count DESC;

-- 22. View subscription status distribution
SELECT
    subscription_status,
    COUNT(*) as count,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
FROM tenants
GROUP BY subscription_status
ORDER BY count DESC;

-- 23. New signups by month (last 12 months)
SELECT
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as signups
FROM tenants
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- 24. User growth by month
SELECT
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as new_users
FROM users
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- ============================================================================
-- FEATURE USAGE ANALYTICS
-- ============================================================================

-- 25. Quote statistics (last 30 days)
SELECT
    COUNT(*) as total_quotes,
    COUNT(*) FILTER (WHERE status = 'accepted') as accepted,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
    COUNT(*) FILTER (WHERE status IN ('sent', 'viewed')) as pending,
    AVG(total) as avg_quote_value,
    SUM(total) FILTER (WHERE status = 'accepted') as accepted_value
FROM quotes
WHERE created_at >= NOW() - INTERVAL '30 days';

-- 26. Job statistics (last 30 days)
SELECT
    COUNT(*) as total_jobs,
    COUNT(*) FILTER (WHERE status = 'paid') as completed_and_paid,
    COUNT(*) FILTER (WHERE status = 'complete') as ready_to_invoice,
    COUNT(*) FILTER (WHERE status IN ('scheduled', 'in_progress')) as in_progress
FROM jobs
WHERE created_at >= NOW() - INTERVAL '30 days';

-- 27. Invoice statistics (last 30 days)
SELECT
    COUNT(*) as total_invoices,
    COUNT(*) FILTER (WHERE status = 'paid') as paid,
    COUNT(*) FILTER (WHERE status = 'overdue') as overdue,
    SUM(total) as total_invoiced,
    SUM(amount_paid) as total_collected,
    SUM(total - amount_paid) as total_outstanding
FROM invoices
WHERE created_at >= NOW() - INTERVAL '30 days';

-- 28. Most active tenants (last 30 days)
SELECT
    t.business_name,
    COUNT(DISTINCT q.id) as quotes,
    COUNT(DISTINCT j.id) as jobs,
    COUNT(DISTINCT i.id) as invoices,
    COUNT(DISTINCT q.id) + COUNT(DISTINCT j.id) + COUNT(DISTINCT i.id) as total_activity
FROM tenants t
LEFT JOIN quotes q ON q.tenant_id = t.id AND q.created_at >= NOW() - INTERVAL '30 days'
LEFT JOIN jobs j ON j.tenant_id = t.id AND j.created_at >= NOW() - INTERVAL '30 days'
LEFT JOIN invoices i ON i.tenant_id = t.id AND i.created_at >= NOW() - INTERVAL '30 days'
GROUP BY t.id, t.business_name
ORDER BY total_activity DESC
LIMIT 20;

-- 29. Average values by subscription tier
SELECT
    t.subscription_tier,
    COUNT(DISTINCT t.id) as tenant_count,
    AVG(q.total) as avg_quote_value,
    AVG(i.total) as avg_invoice_value,
    SUM(i.amount_paid) as total_revenue
FROM tenants t
LEFT JOIN quotes q ON q.tenant_id = t.id
LEFT JOIN invoices i ON i.tenant_id = t.id
GROUP BY t.subscription_tier
ORDER BY t.subscription_tier;

-- 30. Conversion funnel (last 30 days)
SELECT
    COUNT(DISTINCT q.id) as quotes_created,
    COUNT(DISTINCT CASE WHEN q.status = 'accepted' THEN q.id END) as quotes_accepted,
    COUNT(DISTINCT j.id) as jobs_created,
    COUNT(DISTINCT CASE WHEN j.status = 'complete' THEN j.id END) as jobs_completed,
    COUNT(DISTINCT i.id) as invoices_created,
    COUNT(DISTINCT CASE WHEN i.status = 'paid' THEN i.id END) as invoices_paid
FROM quotes q
LEFT JOIN jobs j ON j.quote_id = q.id
LEFT JOIN invoices i ON i.job_id = j.id
WHERE q.created_at >= NOW() - INTERVAL '30 days';

-- ============================================================================
-- USER MANAGEMENT
-- ============================================================================

-- 31. View all users across all tenants
SELECT
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.is_active,
    t.business_name as tenant_name,
    u.created_at,
    u.last_login_at
FROM users u
JOIN tenants t ON t.id = u.tenant_id
ORDER BY u.created_at DESC;

-- 32. Find users by email
SELECT
    u.email,
    u.full_name,
    u.role,
    u.is_active,
    t.business_name as tenant_name
FROM users u
JOIN tenants t ON t.id = u.tenant_id
WHERE u.email ILIKE '%search@example%'
ORDER BY u.created_at DESC;

-- 33. View tenant's users
SELECT
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.is_active,
    u.last_login_at
FROM users u
WHERE u.tenant_id = 'tenant-uuid-here'
ORDER BY u.created_at DESC;

-- ============================================================================
-- HEALTH CHECKS
-- ============================================================================

-- 34. Check for tenants without users
SELECT
    t.id,
    t.business_name,
    t.subscription_status,
    t.created_at
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.tenant_id = t.id
)
ORDER BY t.created_at DESC;

-- 35. Check for overdue tenants
SELECT
    business_name,
    email,
    phone,
    subscription_ends_at,
    EXTRACT(DAY FROM NOW() - subscription_ends_at) as days_overdue
FROM tenants
WHERE subscription_status = 'overdue'
ORDER BY subscription_ends_at ASC;

-- 36. Check for inactive users (never logged in)
SELECT
    u.email,
    u.full_name,
    t.business_name as tenant_name,
    u.created_at,
    EXTRACT(DAY FROM NOW() - u.created_at) as days_since_signup
FROM users u
JOIN tenants t ON t.id = u.tenant_id
WHERE u.last_login_at IS NULL
AND u.created_at < NOW() - INTERVAL '7 days'
ORDER BY u.created_at ASC;

-- ============================================================================
-- DATA CLEANUP (USE WITH CAUTION)
-- ============================================================================

-- 37. Delete test tenant (DANGEROUS - use only in development)
-- DELETE FROM tenants WHERE id = 'test-tenant-uuid-here';

-- 38. Reset tenant data (keeps tenant, removes all data)
-- DO NOT RUN IN PRODUCTION WITHOUT BACKUP
-- DELETE FROM quotes WHERE tenant_id = 'tenant-uuid-here';
-- DELETE FROM jobs WHERE tenant_id = 'tenant-uuid-here';
-- DELETE FROM invoices WHERE tenant_id = 'tenant-uuid-here';
-- DELETE FROM customers WHERE tenant_id = 'tenant-uuid-here';

-- ============================================================================
-- END OF ADMIN QUERIES
-- ============================================================================
