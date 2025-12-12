-- ============================================================================
-- JobKaart Database Schema - FREE Tier Implementation
-- ============================================================================
-- Description: Implements FREE tier with usage tracking and limits
-- Version: 1.0.0
-- Date: 2025-12-11
-- ============================================================================

-- ============================================================================
-- TABLE: system_settings
-- ============================================================================
-- Purpose: Global system configuration for FREE tier limits
-- Notes: Single-row table with configurable limits
-- ============================================================================

CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- FREE tier limits (monthly)
    free_quotes_per_month INTEGER NOT NULL DEFAULT 5,
    free_jobs_per_month INTEGER NOT NULL DEFAULT 5,
    free_invoices_per_month INTEGER NOT NULL DEFAULT 5,

    -- Paid tier limits (for reference/future use)
    starter_quotes_per_month INTEGER DEFAULT 50,
    starter_jobs_per_month INTEGER DEFAULT 50,
    starter_invoices_per_month INTEGER DEFAULT 50,

    -- System metadata
    settings_version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Ensure only one settings row
    CONSTRAINT single_row_check CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

-- Insert default settings record
INSERT INTO system_settings (
    id,
    free_quotes_per_month,
    free_jobs_per_month,
    free_invoices_per_month,
    starter_quotes_per_month,
    starter_jobs_per_month,
    starter_invoices_per_month
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    5,
    5,
    5,
    50,
    50,
    50
) ON CONFLICT (id) DO NOTHING;

-- Comments
COMMENT ON TABLE system_settings IS 'Global system configuration for FREE tier limits (single-row table)';
COMMENT ON COLUMN system_settings.free_quotes_per_month IS 'Maximum quotes allowed per month for FREE tier';
COMMENT ON COLUMN system_settings.free_jobs_per_month IS 'Maximum jobs allowed per month for FREE tier';
COMMENT ON COLUMN system_settings.free_invoices_per_month IS 'Maximum invoices allowed per month for FREE tier';

-- ============================================================================
-- TABLE: monthly_usage
-- ============================================================================
-- Purpose: Tracks monthly usage for each tenant (quotes, jobs, invoices)
-- Notes: One row per tenant per month, reset automatically each month
-- ============================================================================

CREATE TABLE monthly_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Month tracking (YYYY-MM format, e.g., "2025-12")
    month TEXT NOT NULL,

    -- Usage counters
    quotes_created INTEGER NOT NULL DEFAULT 0,
    jobs_created INTEGER NOT NULL DEFAULT 0,
    invoices_created INTEGER NOT NULL DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure one row per tenant per month
    CONSTRAINT monthly_usage_tenant_month_unique UNIQUE (tenant_id, month)
);

-- Indexes
CREATE INDEX idx_monthly_usage_tenant_id ON monthly_usage(tenant_id);
CREATE INDEX idx_monthly_usage_month ON monthly_usage(month);
CREATE INDEX idx_monthly_usage_tenant_month ON monthly_usage(tenant_id, month);

-- Comments
COMMENT ON TABLE monthly_usage IS 'Monthly usage tracking per tenant for FREE tier limits enforcement';
COMMENT ON COLUMN monthly_usage.month IS 'Month in YYYY-MM format (e.g., "2025-12")';
COMMENT ON COLUMN monthly_usage.quotes_created IS 'Number of quotes created this month';
COMMENT ON COLUMN monthly_usage.jobs_created IS 'Number of jobs created this month';
COMMENT ON COLUMN monthly_usage.invoices_created IS 'Number of invoices created this month';

-- ============================================================================
-- ENUM UPDATES: Add 'free' tier and update subscription_status
-- ============================================================================

-- Step 1: Add 'free' to subscription_tier enum
ALTER TYPE subscription_tier ADD VALUE IF NOT EXISTS 'free';

-- Step 2: Update subscription_status enum (replace 'trial' with 'free')
-- PostgreSQL doesn't support removing enum values, so we create a new enum and migrate

-- Drop dependent views that use subscription_status
DROP VIEW IF EXISTS admin_tenant_stats CASCADE;
DROP VIEW IF EXISTS admin_system_stats CASCADE;

-- Create new enum with updated values
CREATE TYPE subscription_status_new AS ENUM ('active', 'cancelled', 'overdue', 'free');

-- Drop default constraints before type change
ALTER TABLE tenants ALTER COLUMN subscription_status DROP DEFAULT;
ALTER TABLE subscriptions ALTER COLUMN status DROP DEFAULT;

-- Migrate data: Convert all 'trial' → 'free' in tenants table
ALTER TABLE tenants
    ALTER COLUMN subscription_status TYPE subscription_status_new
    USING (
        CASE
            WHEN subscription_status::text = 'trial' THEN 'free'::subscription_status_new
            ELSE subscription_status::text::subscription_status_new
        END
    );

-- Migrate data: Convert all 'trial' → 'free' in subscriptions table
ALTER TABLE subscriptions
    ALTER COLUMN status TYPE subscription_status_new
    USING (
        CASE
            WHEN status::text = 'trial' THEN 'free'::subscription_status_new
            ELSE status::text::subscription_status_new
        END
    );

-- Drop old enum and rename new one
DROP TYPE subscription_status;
ALTER TYPE subscription_status_new RENAME TO subscription_status;

-- Restore default values with new enum
ALTER TABLE tenants ALTER COLUMN subscription_status SET DEFAULT 'free'::subscription_status;
ALTER TABLE subscriptions ALTER COLUMN status SET DEFAULT 'free'::subscription_status;

-- ============================================================================
-- TABLE UPDATES: Remove trial_ends_at and monthly_job_limit from tenants
-- ============================================================================

-- Remove trial_ends_at column (no longer needed - FREE never expires)
ALTER TABLE tenants DROP COLUMN IF EXISTS trial_ends_at;

-- Remove monthly_job_limit column (replaced by monthly_usage tracking)
ALTER TABLE tenants DROP COLUMN IF EXISTS monthly_job_limit;

-- Drop related index if it exists
DROP INDEX IF EXISTS idx_tenants_trial_ends_at;

-- ============================================================================
-- FUNCTION: get_monthly_usage
-- ============================================================================
-- Purpose: Gets current month's usage for a tenant
-- Returns: JSONB with quotes_created, jobs_created, invoices_created
-- ============================================================================

CREATE OR REPLACE FUNCTION get_monthly_usage(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_month TEXT;
    v_usage RECORD;
BEGIN
    -- Get current month in YYYY-MM format
    v_current_month := TO_CHAR(NOW(), 'YYYY-MM');

    -- Get or create usage record for current month
    INSERT INTO monthly_usage (tenant_id, month)
    VALUES (p_tenant_id, v_current_month)
    ON CONFLICT (tenant_id, month) DO NOTHING;

    -- Fetch usage
    SELECT quotes_created, jobs_created, invoices_created
    INTO v_usage
    FROM monthly_usage
    WHERE tenant_id = p_tenant_id
    AND month = v_current_month;

    -- Return as JSONB
    RETURN jsonb_build_object(
        'month', v_current_month,
        'quotes_created', COALESCE(v_usage.quotes_created, 0),
        'jobs_created', COALESCE(v_usage.jobs_created, 0),
        'invoices_created', COALESCE(v_usage.invoices_created, 0)
    );
END;
$$;

-- Comments
COMMENT ON FUNCTION get_monthly_usage IS 'Returns current month usage for a tenant (creates record if missing)';

-- ============================================================================
-- FUNCTION: increment_usage
-- ============================================================================
-- Purpose: Increments usage counter for a specific type (quote/job/invoice)
-- Parameters: p_tenant_id, p_usage_type ('quote', 'job', 'invoice')
-- Returns: New count for that type
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_usage(
    p_tenant_id UUID,
    p_usage_type TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_month TEXT;
    v_new_count INTEGER;
BEGIN
    -- Get current month in YYYY-MM format
    v_current_month := TO_CHAR(NOW(), 'YYYY-MM');

    -- Ensure usage record exists for current month
    INSERT INTO monthly_usage (tenant_id, month)
    VALUES (p_tenant_id, v_current_month)
    ON CONFLICT (tenant_id, month) DO NOTHING;

    -- Increment the appropriate counter
    IF p_usage_type = 'quote' THEN
        UPDATE monthly_usage
        SET quotes_created = quotes_created + 1,
            updated_at = NOW()
        WHERE tenant_id = p_tenant_id
        AND month = v_current_month
        RETURNING quotes_created INTO v_new_count;

    ELSIF p_usage_type = 'job' THEN
        UPDATE monthly_usage
        SET jobs_created = jobs_created + 1,
            updated_at = NOW()
        WHERE tenant_id = p_tenant_id
        AND month = v_current_month
        RETURNING jobs_created INTO v_new_count;

    ELSIF p_usage_type = 'invoice' THEN
        UPDATE monthly_usage
        SET invoices_created = invoices_created + 1,
            updated_at = NOW()
        WHERE tenant_id = p_tenant_id
        AND month = v_current_month
        RETURNING invoices_created INTO v_new_count;

    ELSE
        RAISE EXCEPTION 'Invalid usage type: %. Must be quote, job, or invoice', p_usage_type;
    END IF;

    RETURN v_new_count;
END;
$$;

-- Comments
COMMENT ON FUNCTION increment_usage IS 'Increments monthly usage counter for quote/job/invoice creation';

-- ============================================================================
-- FUNCTION: check_usage_limit
-- ============================================================================
-- Purpose: Checks if tenant has exceeded monthly limit for a usage type
-- Parameters: p_tenant_id, p_usage_type ('quote', 'job', 'invoice')
-- Returns: JSONB with allowed: true/false, current_count, limit
-- ============================================================================

CREATE OR REPLACE FUNCTION check_usage_limit(
    p_tenant_id UUID,
    p_usage_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_tier subscription_tier;
    v_tenant_status subscription_status;
    v_current_month TEXT;
    v_current_count INTEGER;
    v_limit INTEGER;
    v_allowed BOOLEAN;
BEGIN
    -- Get tenant subscription info
    SELECT subscription_tier, subscription_status
    INTO v_tenant_tier, v_tenant_status
    FROM tenants
    WHERE id = p_tenant_id;

    -- If not FREE tier, no limits (unlimited for paid tiers)
    IF v_tenant_status != 'free' THEN
        RETURN jsonb_build_object(
            'allowed', true,
            'current_count', 0,
            'limit', null,
            'message', 'Unlimited (paid tier)'
        );
    END IF;

    -- Get current month
    v_current_month := TO_CHAR(NOW(), 'YYYY-MM');

    -- Get current usage count
    SELECT
        CASE
            WHEN p_usage_type = 'quote' THEN quotes_created
            WHEN p_usage_type = 'job' THEN jobs_created
            WHEN p_usage_type = 'invoice' THEN invoices_created
            ELSE 0
        END
    INTO v_current_count
    FROM monthly_usage
    WHERE tenant_id = p_tenant_id
    AND month = v_current_month;

    -- If no usage record, count is 0
    v_current_count := COALESCE(v_current_count, 0);

    -- Get limit from system_settings
    SELECT
        CASE
            WHEN p_usage_type = 'quote' THEN free_quotes_per_month
            WHEN p_usage_type = 'job' THEN free_jobs_per_month
            WHEN p_usage_type = 'invoice' THEN free_invoices_per_month
            ELSE 0
        END
    INTO v_limit
    FROM system_settings
    WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

    -- Check if allowed
    v_allowed := v_current_count < v_limit;

    -- Return result
    RETURN jsonb_build_object(
        'allowed', v_allowed,
        'current_count', v_current_count,
        'limit', v_limit,
        'remaining', GREATEST(v_limit - v_current_count, 0),
        'message', CASE
            WHEN v_allowed THEN 'Within limit'
            ELSE 'Monthly limit exceeded. Upgrade to continue.'
        END
    );
END;
$$;

-- Comments
COMMENT ON FUNCTION check_usage_limit IS 'Checks if tenant can create more quotes/jobs/invoices (FREE tier limit enforcement)';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_usage ENABLE ROW LEVEL SECURITY;

-- system_settings: Everyone can read (needed for limit checks), only super admins can modify
CREATE POLICY "Everyone can read system settings"
ON system_settings FOR SELECT
USING (true);

CREATE POLICY "Only super admins can update system settings"
ON system_settings FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.is_super_admin = true
    )
);

-- monthly_usage: Users can view their own tenant's usage
CREATE POLICY "Users can view own tenant usage"
ON monthly_usage FOR SELECT
USING (
    tenant_id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    )
);

-- monthly_usage: Service role has full access (for increment_usage function)
CREATE POLICY "Service role has full access to monthly_usage"
ON monthly_usage FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Super admins can view all usage
CREATE POLICY "Super admins can view all usage"
ON monthly_usage FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.is_super_admin = true
    )
);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp for monthly_usage
CREATE TRIGGER update_monthly_usage_updated_at
    BEFORE UPDATE ON monthly_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at timestamp for system_settings
CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INDEXES: Performance optimization
-- ============================================================================

-- Add index for subscription_tier on tenants (for FREE tier queries)
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_tier ON tenants(subscription_tier);

-- Add composite index for tier + status queries
CREATE INDEX IF NOT EXISTS idx_tenants_tier_status ON tenants(subscription_tier, subscription_status);

-- ============================================================================
-- RECREATE VIEWS: Restore admin_tenant_stats view
-- ============================================================================

CREATE VIEW admin_tenant_stats AS
SELECT
    t.id as tenant_id,
    t.business_name,
    t.subscription_tier,
    t.subscription_status,
    t.subscription_started_at,
    t.subscription_ends_at as trial_ends_at,  -- For FREE tier, this will be NULL
    t.subscription_ends_at as next_billing_date,  -- For FREE tier, this will be NULL
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

COMMENT ON VIEW admin_tenant_stats IS 'Aggregated tenant statistics for admin dashboard (updated for FREE tier)';

-- Recreate admin_system_stats view (updated for FREE tier)
CREATE VIEW admin_system_stats AS
SELECT
  (SELECT COUNT(*) FROM tenants) as total_tenants,
  (SELECT COUNT(*) FROM tenants WHERE subscription_status = 'active') as active_tenants,
  (SELECT COUNT(*) FROM tenants WHERE subscription_status = 'free') as free_tenants,  -- Changed from trial_tenants
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM customers) as total_customers,
  (SELECT COUNT(*) FROM quotes) as total_quotes,
  (SELECT COUNT(*) FROM jobs) as total_jobs,
  (SELECT COUNT(*) FROM invoices) as total_invoices,
  (SELECT COALESCE(SUM(total), 0) FROM invoices WHERE status = 'paid') as total_revenue;

COMMENT ON VIEW admin_system_stats IS 'System-wide statistics for admin dashboard (updated for FREE tier)';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
