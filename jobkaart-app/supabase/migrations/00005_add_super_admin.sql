-- ============================================================================
-- JobKaart Database Schema - Add Super Admin Support
-- ============================================================================
-- Description: Adds super admin functionality and audit logging
-- Version: 1.0.0
-- Date: 2025-12-03
-- ============================================================================

-- Add is_super_admin column to users table
ALTER TABLE users
ADD COLUMN is_super_admin BOOLEAN DEFAULT FALSE;

-- Create index for faster super admin lookups
CREATE INDEX idx_users_is_super_admin ON users(is_super_admin) WHERE is_super_admin = TRUE;

-- Comments
COMMENT ON COLUMN users.is_super_admin IS 'TRUE for super administrators who can access admin panel';

-- ============================================================================
-- TABLE: admin_audit_logs
-- ============================================================================
-- Purpose: Track all admin actions for security and compliance
-- Notes: Logs every action taken by super admins
-- ============================================================================

CREATE TABLE admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Who performed the action
    admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- What action was performed
    action TEXT NOT NULL, -- e.g., 'view_tenant', 'suspend_tenant', 'impersonate_user', 'view_analytics'

    -- Target of the action (if applicable)
    target_type TEXT, -- e.g., 'tenant', 'user', 'invoice', 'quote'
    target_id UUID, -- ID of the target entity

    -- Additional context (stored as JSONB for flexibility)
    -- Example: {"tenant_name": "John's Plumbing", "previous_status": "active", "new_status": "suspended"}
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Request information
    ip_address INET,
    user_agent TEXT,

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_admin_audit_logs_admin_user_id ON admin_audit_logs(admin_user_id);
CREATE INDEX idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX idx_admin_audit_logs_target ON admin_audit_logs(target_type, target_id);
CREATE INDEX idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);

-- Comments
COMMENT ON TABLE admin_audit_logs IS 'Audit log of all super admin actions';
COMMENT ON COLUMN admin_audit_logs.action IS 'Action performed (e.g., view_tenant, suspend_tenant)';
COMMENT ON COLUMN admin_audit_logs.target_type IS 'Type of entity acted upon (tenant, user, etc.)';
COMMENT ON COLUMN admin_audit_logs.metadata IS 'JSONB: Additional context about the action';

-- ============================================================================
-- VIEW: admin_tenant_stats
-- ============================================================================
-- Purpose: Aggregated statistics for each tenant (for admin dashboard)
-- Notes: Makes it easy to see tenant activity at a glance
-- ============================================================================

CREATE OR REPLACE VIEW admin_tenant_stats AS
SELECT
    t.id as tenant_id,
    t.business_name,
    t.subscription_tier,
    t.subscription_status,
    t.subscription_started_at,
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
COMMENT ON VIEW admin_tenant_stats IS 'Aggregated tenant statistics for admin dashboard';

-- ============================================================================
-- VIEW: admin_system_stats
-- ============================================================================
-- Purpose: System-wide statistics for admin dashboard
-- Notes: Overview of entire platform health and usage
-- ============================================================================

CREATE OR REPLACE VIEW admin_system_stats AS
SELECT
    -- Tenant stats
    (SELECT COUNT(*) FROM tenants) as total_tenants,
    (SELECT COUNT(*) FROM tenants WHERE subscription_status = 'active') as active_tenants,
    (SELECT COUNT(*) FROM tenants WHERE subscription_status = 'trial') as trial_tenants,
    (SELECT COUNT(*) FROM tenants WHERE created_at >= NOW() - INTERVAL '30 days') as new_tenants_last_30_days,

    -- User stats
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM users WHERE is_active = TRUE) as active_users,
    (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_last_30_days,

    -- Subscription distribution
    (SELECT COUNT(*) FROM tenants WHERE subscription_tier = 'starter') as starter_tier_count,
    (SELECT COUNT(*) FROM tenants WHERE subscription_tier = 'pro') as pro_tier_count,
    (SELECT COUNT(*) FROM tenants WHERE subscription_tier = 'team') as team_tier_count,

    -- Activity stats
    (SELECT COUNT(*) FROM quotes WHERE created_at >= NOW() - INTERVAL '30 days') as quotes_last_30_days,
    (SELECT COUNT(*) FROM jobs WHERE created_at >= NOW() - INTERVAL '30 days') as jobs_last_30_days,
    (SELECT COUNT(*) FROM invoices WHERE created_at >= NOW() - INTERVAL '30 days') as invoices_last_30_days,

    -- Revenue stats (estimated based on subscription tiers)
    (
        (SELECT COUNT(*) FROM tenants WHERE subscription_tier = 'starter' AND subscription_status = 'active') * 299 +
        (SELECT COUNT(*) FROM tenants WHERE subscription_tier = 'pro' AND subscription_status = 'active') * 499 +
        (SELECT COUNT(*) FROM tenants WHERE subscription_tier = 'team' AND subscription_status = 'active') * 799
    ) as estimated_mrr,

    -- Timestamp
    NOW() as calculated_at;

-- Comments
COMMENT ON VIEW admin_system_stats IS 'System-wide statistics for admin dashboard';

-- ============================================================================
-- Function to log admin actions
-- ============================================================================

CREATE OR REPLACE FUNCTION log_admin_action(
    p_admin_user_id UUID,
    p_action TEXT,
    p_target_type TEXT DEFAULT NULL,
    p_target_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO admin_audit_logs (
        admin_user_id,
        action,
        target_type,
        target_id,
        metadata
    )
    VALUES (
        p_admin_user_id,
        p_action,
        p_target_type,
        p_target_id,
        p_metadata
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION log_admin_action IS 'Log an admin action to the audit log';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
