-- ============================================================================
-- JobKaart Database Schema - Subscription Billing Migration
-- ============================================================================
-- Description: Adds subscription billing tables and updates tenant fields
-- Version: 1.0.0
-- Date: 2025-12-03
-- ============================================================================

-- ============================================================================
-- TABLE: subscriptions
-- ============================================================================
-- Purpose: Tracks individual subscription records and payment history
-- Notes: Tenants can have multiple subscription records over time
-- ============================================================================

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Plan details
    plan_type subscription_tier NOT NULL,
    status subscription_status NOT NULL DEFAULT 'trial',

    -- PayFast integration
    payfast_subscription_token TEXT UNIQUE, -- PayFast subscription token
    payfast_payment_id TEXT, -- Latest payment ID from PayFast

    -- Subscription period
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE, -- NULL for active subscriptions
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    next_billing_date TIMESTAMP WITH TIME ZONE,

    -- Pricing
    amount DECIMAL(10, 2) NOT NULL, -- Monthly amount in ZAR
    currency TEXT DEFAULT 'ZAR',

    -- Cancellation tracking
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_payfast_token ON subscriptions(payfast_subscription_token);
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date);

-- Comments
COMMENT ON TABLE subscriptions IS 'Subscription records with PayFast integration';
COMMENT ON COLUMN subscriptions.payfast_subscription_token IS 'Unique token from PayFast for recurring billing';
COMMENT ON COLUMN subscriptions.trial_ends_at IS '14-day free trial end date';

-- ============================================================================
-- TABLE: subscription_events
-- ============================================================================
-- Purpose: Audit log for subscription lifecycle events
-- Notes: Records all subscription changes for debugging and analytics
-- ============================================================================

CREATE TABLE subscription_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

    -- Event details
    event_type TEXT NOT NULL, -- 'created', 'activated', 'payment_received', 'cancelled', 'expired', 'trial_started', 'trial_ended'
    event_data JSONB, -- Additional event-specific data

    -- PayFast webhook data (if applicable)
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

-- Comments
COMMENT ON TABLE subscription_events IS 'Audit log for all subscription lifecycle events';
COMMENT ON COLUMN subscription_events.event_data IS 'JSONB with event-specific details';

-- ============================================================================
-- UPDATE: tenants table
-- ============================================================================
-- Add trial tracking to tenants table
-- ============================================================================

-- Add trial tracking column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'tenants'
                   AND column_name = 'trial_ends_at') THEN
        ALTER TABLE tenants ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add current subscription reference
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'tenants'
                   AND column_name = 'current_subscription_id') THEN
        ALTER TABLE tenants ADD COLUMN current_subscription_id UUID REFERENCES subscriptions(id);
    END IF;
END $$;

-- Add index for trial queries
CREATE INDEX IF NOT EXISTS idx_tenants_trial_ends_at ON tenants(trial_ends_at);

-- ============================================================================
-- FUNCTION: create_trial_subscription
-- ============================================================================
-- Purpose: Creates a 14-day trial subscription for new tenants
-- Usage: Called during tenant signup
-- ============================================================================

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
    -- Calculate trial end date (14 days from now)
    v_trial_end := NOW() + INTERVAL '14 days';

    -- Determine plan amount
    v_amount := CASE p_plan_type
        WHEN 'starter' THEN 299.00
        WHEN 'pro' THEN 499.00
        WHEN 'team' THEN 799.00
        ELSE 299.00
    END;

    -- Create subscription record
    INSERT INTO subscriptions (
        tenant_id,
        plan_type,
        status,
        start_date,
        trial_ends_at,
        amount,
        currency
    ) VALUES (
        p_tenant_id,
        p_plan_type,
        'trial',
        NOW(),
        v_trial_end,
        v_amount,
        'ZAR'
    )
    RETURNING id INTO v_subscription_id;

    -- Update tenant with trial info
    UPDATE tenants
    SET
        subscription_tier = p_plan_type,
        subscription_status = 'trial',
        trial_ends_at = v_trial_end,
        current_subscription_id = v_subscription_id
    WHERE id = p_tenant_id;

    -- Log event
    INSERT INTO subscription_events (
        tenant_id,
        subscription_id,
        event_type,
        event_data
    ) VALUES (
        p_tenant_id,
        v_subscription_id,
        'trial_started',
        jsonb_build_object(
            'plan_type', p_plan_type,
            'trial_ends_at', v_trial_end
        )
    );

    RETURN v_subscription_id;
END;
$$;

-- ============================================================================
-- FUNCTION: activate_subscription
-- ============================================================================
-- Purpose: Activates a subscription after successful payment
-- Usage: Called from PayFast webhook handler
-- ============================================================================

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
    -- Get subscription details
    SELECT tenant_id, plan_type
    INTO v_tenant_id, v_plan_type
    FROM subscriptions
    WHERE id = p_subscription_id;

    -- Update subscription
    UPDATE subscriptions
    SET
        status = 'active',
        payfast_subscription_token = p_payfast_token,
        payfast_payment_id = p_payfast_payment_id,
        next_billing_date = NOW() + INTERVAL '1 month',
        updated_at = NOW()
    WHERE id = p_subscription_id;

    -- Update tenant status
    UPDATE tenants
    SET
        subscription_status = 'active',
        payfast_subscription_token = p_payfast_token,
        subscription_started_at = NOW(),
        updated_at = NOW()
    WHERE id = v_tenant_id;

    -- Log event
    INSERT INTO subscription_events (
        tenant_id,
        subscription_id,
        event_type,
        payfast_payment_id,
        event_data
    ) VALUES (
        v_tenant_id,
        p_subscription_id,
        'activated',
        p_payfast_payment_id,
        jsonb_build_object(
            'payfast_token', p_payfast_token,
            'payment_id', p_payfast_payment_id
        )
    );
END;
$$;

-- ============================================================================
-- FUNCTION: cancel_subscription
-- ============================================================================
-- Purpose: Cancels an active subscription
-- Usage: Called when user cancels or payment fails
-- ============================================================================

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
    -- Get tenant_id
    SELECT tenant_id INTO v_tenant_id
    FROM subscriptions
    WHERE id = p_subscription_id;

    -- Calculate end date (end of current billing period)
    SELECT next_billing_date INTO v_end_date
    FROM subscriptions
    WHERE id = p_subscription_id;

    -- Update subscription
    UPDATE subscriptions
    SET
        status = 'cancelled',
        cancelled_at = NOW(),
        cancellation_reason = p_reason,
        end_date = COALESCE(v_end_date, NOW()),
        updated_at = NOW()
    WHERE id = p_subscription_id;

    -- Update tenant status
    UPDATE tenants
    SET
        subscription_status = 'cancelled',
        subscription_ends_at = COALESCE(v_end_date, NOW()),
        updated_at = NOW()
    WHERE id = v_tenant_id;

    -- Log event
    INSERT INTO subscription_events (
        tenant_id,
        subscription_id,
        event_type,
        event_data
    ) VALUES (
        v_tenant_id,
        p_subscription_id,
        'cancelled',
        jsonb_build_object(
            'reason', p_reason,
            'end_date', COALESCE(v_end_date, NOW())
        )
    );
END;
$$;

-- ============================================================================
-- FUNCTION: check_expired_trials
-- ============================================================================
-- Purpose: Marks expired trials and sends notifications
-- Usage: Run daily via cron or scheduled task
-- ============================================================================

CREATE OR REPLACE FUNCTION check_expired_trials()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER := 0;
    v_record RECORD;
BEGIN
    -- Find and update expired trials
    FOR v_record IN
        SELECT s.id, s.tenant_id
        FROM subscriptions s
        WHERE s.status = 'trial'
        AND s.trial_ends_at < NOW()
    LOOP
        -- Update subscription status
        UPDATE subscriptions
        SET status = 'cancelled', end_date = NOW()
        WHERE id = v_record.id;

        -- Update tenant status
        UPDATE tenants
        SET subscription_status = 'cancelled'
        WHERE id = v_record.tenant_id;

        -- Log event
        INSERT INTO subscription_events (
            tenant_id,
            subscription_id,
            event_type,
            event_data
        ) VALUES (
            v_record.tenant_id,
            v_record.id,
            'trial_ended',
            jsonb_build_object('expired', true)
        );

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;

-- ============================================================================
-- FUNCTION: record_payment
-- ============================================================================
-- Purpose: Records a subscription payment from PayFast webhook
-- Usage: Called from ITN webhook handler
-- ============================================================================

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
    -- Get tenant_id
    SELECT tenant_id INTO v_tenant_id
    FROM subscriptions
    WHERE id = p_subscription_id;

    -- Update subscription with latest payment
    UPDATE subscriptions
    SET
        payfast_payment_id = p_payfast_payment_id,
        next_billing_date = NOW() + INTERVAL '1 month',
        updated_at = NOW()
    WHERE id = p_subscription_id;

    -- Log payment event
    INSERT INTO subscription_events (
        tenant_id,
        subscription_id,
        event_type,
        payfast_payment_id,
        payfast_webhook_data,
        event_data
    ) VALUES (
        v_tenant_id,
        p_subscription_id,
        'payment_received',
        p_payfast_payment_id,
        p_webhook_data,
        jsonb_build_object(
            'amount', p_amount,
            'next_billing', NOW() + INTERVAL '1 month'
        )
    );
END;
$$;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on new tables
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
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION create_trial_subscription IS 'Creates a 14-day trial subscription for new tenants';
COMMENT ON FUNCTION activate_subscription IS 'Activates subscription after PayFast payment confirmation';
COMMENT ON FUNCTION cancel_subscription IS 'Cancels subscription and sets end date';
COMMENT ON FUNCTION check_expired_trials IS 'Daily cron job to mark expired trial subscriptions';
COMMENT ON FUNCTION record_subscription_payment IS 'Records monthly subscription payment from PayFast ITN';
