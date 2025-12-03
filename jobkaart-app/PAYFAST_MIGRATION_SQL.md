# PayFast Subscription Billing - Database Migration

## Quick Setup

Copy and paste this SQL into your **Supabase SQL Editor** to set up subscription billing.

---

## Migration SQL

```sql
-- ============================================================================
-- JobKaart - PayFast Subscription Billing Migration
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: Create subscriptions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Plan details
    plan_type subscription_tier NOT NULL,
    status subscription_status NOT NULL DEFAULT 'trial',

    -- PayFast integration
    payfast_subscription_token TEXT UNIQUE,
    payfast_payment_id TEXT,

    -- Subscription period
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    next_billing_date TIMESTAMP WITH TIME ZONE,

    -- Pricing
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'ZAR',

    -- Cancellation tracking
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_payfast_token ON subscriptions(payfast_subscription_token);
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date);

-- ============================================================================
-- STEP 2: Create subscription_events table
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

    -- Event details
    event_type TEXT NOT NULL,
    event_data JSONB,

    -- PayFast webhook data
    payfast_payment_id TEXT,
    payfast_webhook_data JSONB,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscription_events_tenant_id ON subscription_events(tenant_id);
CREATE INDEX idx_subscription_events_subscription_id ON subscription_events(subscription_id);
CREATE INDEX idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX idx_subscription_events_created_at ON subscription_events(created_at DESC);

-- ============================================================================
-- STEP 3: Update tenants table
-- ============================================================================

-- Add trial tracking columns
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS current_subscription_id UUID REFERENCES subscriptions(id);

-- Add index
CREATE INDEX IF NOT EXISTS idx_tenants_trial_ends_at ON tenants(trial_ends_at);

-- ============================================================================
-- STEP 4: Enable Row Level Security
-- ============================================================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
CREATE POLICY "Users can view own tenant subscriptions"
ON subscriptions FOR SELECT
USING (
    tenant_id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    )
);

CREATE POLICY "Service role has full access to subscriptions"
ON subscriptions FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Subscription events policies
CREATE POLICY "Users can view own tenant subscription events"
ON subscription_events FOR SELECT
USING (
    tenant_id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    )
);

CREATE POLICY "Service role has full access to subscription events"
ON subscription_events FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- STEP 5: Create helper functions
-- ============================================================================

-- Function: create_trial_subscription
CREATE OR REPLACE FUNCTION create_trial_subscription(
    p_tenant_id UUID,
    p_plan_type subscription_tier DEFAULT 'starter'
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_subscription_id UUID;
    v_trial_end TIMESTAMP WITH TIME ZONE;
    v_amount DECIMAL(10, 2);
BEGIN
    v_trial_end := NOW() + INTERVAL '14 days';

    v_amount := CASE p_plan_type
        WHEN 'starter' THEN 299.00
        WHEN 'pro' THEN 499.00
        WHEN 'team' THEN 799.00
        ELSE 299.00
    END;

    INSERT INTO subscriptions (
        tenant_id, plan_type, status, start_date, trial_ends_at, amount, currency
    ) VALUES (
        p_tenant_id, p_plan_type, 'trial', NOW(), v_trial_end, v_amount, 'ZAR'
    )
    RETURNING id INTO v_subscription_id;

    UPDATE tenants
    SET subscription_tier = p_plan_type,
        subscription_status = 'trial',
        trial_ends_at = v_trial_end,
        current_subscription_id = v_subscription_id
    WHERE id = p_tenant_id;

    INSERT INTO subscription_events (tenant_id, subscription_id, event_type, event_data)
    VALUES (p_tenant_id, v_subscription_id, 'trial_started',
            jsonb_build_object('plan_type', p_plan_type, 'trial_ends_at', v_trial_end));

    RETURN v_subscription_id;
END;
$$;

-- Function: activate_subscription
CREATE OR REPLACE FUNCTION activate_subscription(
    p_subscription_id UUID,
    p_payfast_token TEXT,
    p_payfast_payment_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_tenant_id UUID;
    v_plan_type subscription_tier;
BEGIN
    SELECT tenant_id, plan_type INTO v_tenant_id, v_plan_type
    FROM subscriptions WHERE id = p_subscription_id;

    UPDATE subscriptions
    SET status = 'active',
        payfast_subscription_token = p_payfast_token,
        payfast_payment_id = p_payfast_payment_id,
        next_billing_date = NOW() + INTERVAL '1 month',
        updated_at = NOW()
    WHERE id = p_subscription_id;

    UPDATE tenants
    SET subscription_status = 'active',
        payfast_subscription_token = p_payfast_token,
        subscription_started_at = NOW(),
        updated_at = NOW()
    WHERE id = v_tenant_id;

    INSERT INTO subscription_events (tenant_id, subscription_id, event_type, payfast_payment_id, event_data)
    VALUES (v_tenant_id, p_subscription_id, 'activated', p_payfast_payment_id,
            jsonb_build_object('payfast_token', p_payfast_token, 'payment_id', p_payfast_payment_id));
END;
$$;

-- Function: cancel_subscription
CREATE OR REPLACE FUNCTION cancel_subscription(
    p_subscription_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_tenant_id UUID;
    v_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT tenant_id, next_billing_date INTO v_tenant_id, v_end_date
    FROM subscriptions WHERE id = p_subscription_id;

    UPDATE subscriptions
    SET status = 'cancelled',
        cancelled_at = NOW(),
        cancellation_reason = p_reason,
        end_date = COALESCE(v_end_date, NOW()),
        updated_at = NOW()
    WHERE id = p_subscription_id;

    UPDATE tenants
    SET subscription_status = 'cancelled',
        subscription_ends_at = COALESCE(v_end_date, NOW()),
        updated_at = NOW()
    WHERE id = v_tenant_id;

    INSERT INTO subscription_events (tenant_id, subscription_id, event_type, event_data)
    VALUES (v_tenant_id, p_subscription_id, 'cancelled',
            jsonb_build_object('reason', p_reason, 'end_date', COALESCE(v_end_date, NOW())));
END;
$$;

-- Function: check_expired_trials
CREATE OR REPLACE FUNCTION check_expired_trials()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER := 0;
    v_record RECORD;
BEGIN
    FOR v_record IN
        SELECT s.id, s.tenant_id
        FROM subscriptions s
        WHERE s.status = 'trial' AND s.trial_ends_at < NOW()
    LOOP
        UPDATE subscriptions SET status = 'cancelled', end_date = NOW() WHERE id = v_record.id;
        UPDATE tenants SET subscription_status = 'cancelled' WHERE id = v_record.tenant_id;

        INSERT INTO subscription_events (tenant_id, subscription_id, event_type, event_data)
        VALUES (v_record.tenant_id, v_record.id, 'trial_ended', jsonb_build_object('expired', true));

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;

-- Function: record_subscription_payment
CREATE OR REPLACE FUNCTION record_subscription_payment(
    p_subscription_id UUID,
    p_payfast_payment_id TEXT,
    p_amount DECIMAL(10, 2),
    p_webhook_data JSONB
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    SELECT tenant_id INTO v_tenant_id FROM subscriptions WHERE id = p_subscription_id;

    UPDATE subscriptions
    SET payfast_payment_id = p_payfast_payment_id,
        next_billing_date = NOW() + INTERVAL '1 month',
        updated_at = NOW()
    WHERE id = p_subscription_id;

    INSERT INTO subscription_events (tenant_id, subscription_id, event_type,
                                     payfast_payment_id, payfast_webhook_data, event_data)
    VALUES (v_tenant_id, p_subscription_id, 'payment_received', p_payfast_payment_id,
            p_webhook_data, jsonb_build_object('amount', p_amount, 'next_billing', NOW() + INTERVAL '1 month'));
END;
$$;

-- ============================================================================
-- STEP 6: Add trigger for updated_at
-- ============================================================================

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Migration Complete!
-- ============================================================================

-- Verify tables created
SELECT 'Migration complete! Tables created:' as status;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('subscriptions', 'subscription_events');
```

---

## Verification Queries

After running the migration, verify everything is set up correctly:

```sql
-- Check subscriptions table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- Check subscription_events table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'subscription_events'
ORDER BY ordinal_position;

-- Check tenants table updates
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tenants'
AND column_name IN ('trial_ends_at', 'current_subscription_id');

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('subscriptions', 'subscription_events');

-- Check functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%subscription%';
```

---

## Rollback (if needed)

If you need to undo the migration:

```sql
-- WARNING: This will delete all subscription data!

DROP TABLE IF EXISTS subscription_events CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;

ALTER TABLE tenants DROP COLUMN IF EXISTS trial_ends_at;
ALTER TABLE tenants DROP COLUMN IF EXISTS current_subscription_id;

DROP FUNCTION IF EXISTS create_trial_subscription;
DROP FUNCTION IF EXISTS activate_subscription;
DROP FUNCTION IF EXISTS cancel_subscription;
DROP FUNCTION IF EXISTS check_expired_trials;
DROP FUNCTION IF EXISTS record_subscription_payment;
```

---

## Next Steps

After running this migration:

1. ✅ Tables and functions are created
2. ⏭️ Deploy frontend changes (API routes, components, pages)
3. ⏭️ Test subscription flow in development
4. ⏭️ Configure PayFast webhook URL
5. ⏭️ Test full payment flow

See `PAYFAST_SUBSCRIPTION_GUIDE.md` for complete setup instructions.
