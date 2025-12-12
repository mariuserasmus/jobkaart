-- ============================================================================
-- JobKaart Database Schema - Migrate Trials to FREE Tier
-- ============================================================================
-- Description: Converts all existing trial users to FREE tier
-- Version: 1.0.0
-- Date: 2025-12-11
-- ============================================================================

-- ============================================================================
-- DATA MIGRATION: Convert Trial → FREE
-- ============================================================================

DO $$
DECLARE
    v_affected_tenants INTEGER := 0;
    v_affected_subscriptions INTEGER := 0;
    v_tenant_record RECORD;
BEGIN
    RAISE NOTICE 'Starting migration: Trial → FREE tier';

    -- ==================================================
    -- Step 1: Update tenants table
    -- ==================================================
    RAISE NOTICE 'Step 1: Updating tenants table...';

    -- Convert all trial tenants to FREE
    WITH updated_tenants AS (
        UPDATE tenants
        SET
            subscription_status = 'free',
            subscription_tier = 'free',
            subscription_ends_at = NULL,  -- FREE never expires
            updated_at = NOW()
        WHERE subscription_status = 'free'  -- Note: Already converted by previous migration
        OR subscription_tier = 'starter'  -- Catch any that might still be on starter
        RETURNING id, business_name, subscription_tier, subscription_status
    )
    SELECT COUNT(*) INTO v_affected_tenants FROM updated_tenants;

    RAISE NOTICE 'Updated % tenants to FREE tier', v_affected_tenants;

    -- ==================================================
    -- Step 2: Update subscriptions table
    -- ==================================================
    RAISE NOTICE 'Step 2: Updating subscriptions table...';

    -- Convert all trial subscriptions to FREE
    WITH updated_subscriptions AS (
        UPDATE subscriptions
        SET
            status = 'free',
            plan_type = 'free',
            updated_at = NOW()
        WHERE status = 'free'  -- Note: Already converted by previous migration
        OR plan_type = 'starter'  -- Catch any that might still be on starter
        RETURNING id, tenant_id
    )
    SELECT COUNT(*) INTO v_affected_subscriptions FROM updated_subscriptions;

    RAISE NOTICE 'Updated % subscriptions to FREE tier', v_affected_subscriptions;

    -- ==================================================
    -- Step 3: Log migration events
    -- ==================================================
    RAISE NOTICE 'Step 3: Logging migration events...';

    -- Log subscription events for all affected tenants
    FOR v_tenant_record IN
        SELECT
            t.id as tenant_id,
            t.business_name,
            s.id as subscription_id
        FROM tenants t
        LEFT JOIN subscriptions s ON s.tenant_id = t.id
        WHERE t.subscription_status = 'free'
        AND t.subscription_tier = 'free'
    LOOP
        -- Log the migration event
        INSERT INTO subscription_events (
            tenant_id,
            subscription_id,
            event_type,
            event_data
        ) VALUES (
            v_tenant_record.tenant_id,
            v_tenant_record.subscription_id,
            'trial_migrated_to_free',
            jsonb_build_object(
                'migration_date', NOW(),
                'migration_reason', 'System-wide trial removal - all tenants moved to FREE tier',
                'business_name', v_tenant_record.business_name
            )
        );
    END LOOP;

    -- ==================================================
    -- Step 4: Initialize monthly_usage records
    -- ==================================================
    RAISE NOTICE 'Step 4: Initializing monthly_usage records...';

    -- Create monthly_usage records for all FREE tier tenants for current month
    INSERT INTO monthly_usage (tenant_id, month, quotes_created, jobs_created, invoices_created)
    SELECT
        t.id,
        TO_CHAR(NOW(), 'YYYY-MM'),
        0,
        0,
        0
    FROM tenants t
    WHERE t.subscription_status = 'free'
    AND t.subscription_tier = 'free'
    ON CONFLICT (tenant_id, month) DO NOTHING;

    RAISE NOTICE 'Migration complete!';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '  - Tenants migrated: %', v_affected_tenants;
    RAISE NOTICE '  - Subscriptions migrated: %', v_affected_subscriptions;
    RAISE NOTICE '  - All trial users are now on FREE tier (never expires)';

END $$;

-- ============================================================================
-- UPDATE: Subscription functions to handle FREE tier
-- ============================================================================

-- Update create_trial_subscription to create FREE subscription instead
CREATE OR REPLACE FUNCTION create_trial_subscription(
    p_tenant_id UUID,
    p_plan_type subscription_tier DEFAULT 'free'
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_subscription_id UUID;
    v_amount DECIMAL(10, 2);
BEGIN
    -- FREE tier is always R0
    IF p_plan_type = 'free' THEN
        v_amount := 0.00;
    ELSE
        -- Determine plan amount for paid tiers
        v_amount := CASE p_plan_type
            WHEN 'starter' THEN 299.00
            WHEN 'pro' THEN 499.00
            WHEN 'team' THEN 799.00
            ELSE 0.00
        END;
    END IF;

    -- Create subscription record
    INSERT INTO subscriptions (
        tenant_id,
        plan_type,
        status,
        start_date,
        trial_ends_at,  -- NULL for FREE tier
        amount,
        currency
    ) VALUES (
        p_tenant_id,
        p_plan_type,
        p_plan_type,  -- status = tier for FREE, otherwise 'trial' or 'active'
        NOW(),
        NULL,  -- No trial end date (FREE never expires)
        v_amount,
        'ZAR'
    )
    RETURNING id INTO v_subscription_id;

    -- Update tenant with subscription info
    UPDATE tenants
    SET
        subscription_tier = p_plan_type,
        subscription_status = p_plan_type,  -- FREE tier status = tier
        subscription_ends_at = NULL,  -- FREE never expires
        current_subscription_id = v_subscription_id,
        updated_at = NOW()
    WHERE id = p_tenant_id;

    -- Initialize monthly usage for FREE tier
    IF p_plan_type = 'free' THEN
        INSERT INTO monthly_usage (tenant_id, month)
        VALUES (p_tenant_id, TO_CHAR(NOW(), 'YYYY-MM'))
        ON CONFLICT (tenant_id, month) DO NOTHING;
    END IF;

    -- Log event
    INSERT INTO subscription_events (
        tenant_id,
        subscription_id,
        event_type,
        event_data
    ) VALUES (
        p_tenant_id,
        v_subscription_id,
        CASE
            WHEN p_plan_type = 'free' THEN 'free_tier_started'
            ELSE 'trial_started'
        END,
        jsonb_build_object(
            'plan_type', p_plan_type,
            'amount', v_amount
        )
    );

    RETURN v_subscription_id;
END;
$$;

-- Update check_expired_trials to handle FREE tier (no-op since FREE never expires)
CREATE OR REPLACE FUNCTION check_expired_trials()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    -- FREE tier never expires, so this function is now a no-op
    -- Kept for backward compatibility

    -- In the future, this could be repurposed to check for expired paid subscriptions
    RAISE NOTICE 'check_expired_trials: FREE tier does not expire. Function is now a no-op.';

    RETURN v_count;
END;
$$;

-- ============================================================================
-- COMMENTS: Update documentation
-- ============================================================================

COMMENT ON FUNCTION create_trial_subscription IS 'Creates a FREE tier subscription for new tenants (trial system removed)';
COMMENT ON FUNCTION check_expired_trials IS 'Legacy function - FREE tier does not expire (no-op)';

-- ============================================================================
-- VALIDATION QUERIES (for manual verification)
-- ============================================================================
-- Run these queries manually to verify migration success:
--
-- 1. Check all tenants are on FREE tier:
--    SELECT subscription_tier, subscription_status, COUNT(*)
--    FROM tenants
--    GROUP BY subscription_tier, subscription_status;
--
-- 2. Check all subscriptions are FREE tier:
--    SELECT plan_type, status, COUNT(*)
--    FROM subscriptions
--    GROUP BY plan_type, status;
--
-- 3. Check migration events were logged:
--    SELECT event_type, COUNT(*)
--    FROM subscription_events
--    WHERE event_type = 'trial_migrated_to_free'
--    GROUP BY event_type;
--
-- 4. Check monthly_usage records were created:
--    SELECT COUNT(*)
--    FROM monthly_usage
--    WHERE month = TO_CHAR(NOW(), 'YYYY-MM');
--
-- ============================================================================

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
