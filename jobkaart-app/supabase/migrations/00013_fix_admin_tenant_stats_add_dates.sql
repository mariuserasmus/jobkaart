-- ============================================================================
-- Fix admin_tenant_stats view - Add missing subscription end date
-- ============================================================================
-- Description: Adds subscription_ends_at as trial_ends_at to admin_tenant_stats view
-- Version: 1.0.0
-- Date: 2025-12-06
-- ============================================================================

-- Drop the existing view first
DROP VIEW IF EXISTS admin_tenant_stats;

-- Recreate with the additional fields
CREATE VIEW admin_tenant_stats AS
SELECT
    t.id as tenant_id,
    t.business_name,
    t.subscription_tier,
    t.subscription_status,
    t.subscription_started_at,
    t.subscription_ends_at as trial_ends_at,  -- Add this for extend trial modal
    t.subscription_ends_at as next_billing_date,  -- Add this for consistency
    t.created_at,

    -- User counts
    (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id) as user_count,
    (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id AND u.is_active = TRUE) as active_user_count,

    -- Customer count
    (SELECT COUNT(*) FROM customers c WHERE c.tenant_id = t.id) as customer_count,

    -- Quote stats
    (SELECT COUNT(*) FROM quotes q WHERE q.tenant_id = t.id) as total_quotes,
    (SELECT COUNT(*) FROM quotes q WHERE q.tenant_id = t.id AND q.created_at >= NOW() - INTERVAL '30 days') as quotes_last_30_days,

    -- Job stats
    (SELECT COUNT(*) FROM jobs j WHERE j.tenant_id = t.id) as total_jobs,
    (SELECT COUNT(*) FROM jobs j WHERE j.tenant_id = t.id AND j.created_at >= NOW() - INTERVAL '30 days') as jobs_last_30_days,

    -- Invoice stats
    (SELECT COUNT(*) FROM invoices i WHERE i.tenant_id = t.id) as total_invoices,
    (SELECT COUNT(*) FROM invoices i WHERE i.tenant_id = t.id AND i.created_at >= NOW() - INTERVAL '30 days') as invoices_last_30_days,

    -- Revenue stats (from invoices)
    (SELECT COALESCE(SUM(total), 0) FROM invoices i WHERE i.tenant_id = t.id) as total_revenue,
    (SELECT COALESCE(SUM(total), 0) FROM invoices i WHERE i.tenant_id = t.id AND i.created_at >= NOW() - INTERVAL '30 days') as revenue_last_30_days,

    -- Last activity
    GREATEST(
        (SELECT MAX(created_at) FROM quotes q WHERE q.tenant_id = t.id),
        (SELECT MAX(created_at) FROM jobs j WHERE j.tenant_id = t.id),
        (SELECT MAX(created_at) FROM invoices i WHERE i.tenant_id = t.id),
        (SELECT MAX(last_login_at) FROM users u WHERE u.tenant_id = t.id)
    ) as last_activity_at

FROM tenants t;

-- Comments
COMMENT ON VIEW admin_tenant_stats IS 'Aggregated tenant statistics for admin dashboard with subscription dates';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
