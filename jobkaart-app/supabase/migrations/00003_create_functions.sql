-- ============================================================================
-- JobKaart Database Schema - Helper Functions & Triggers
-- ============================================================================
-- Description: Business logic functions and automated triggers
-- Version: 1.0.0
-- Date: 2025-12-02
-- ============================================================================

-- ============================================================================
-- FUNCTION: Generate Quote Number
-- ============================================================================
-- Purpose: Auto-generate sequential quote numbers per tenant
-- Format: Q-YYYY-NNN (e.g., Q-2025-001, Q-2025-002, ...)
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_quote_number(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_year TEXT;
    v_next_number INTEGER;
    v_quote_number TEXT;
BEGIN
    -- Get current year
    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;

    -- Get next sequential number for this tenant and year
    SELECT COALESCE(MAX(
        CAST(SPLIT_PART(quote_number, '-', 3) AS INTEGER)
    ), 0) + 1
    INTO v_next_number
    FROM quotes
    WHERE tenant_id = p_tenant_id
    AND quote_number LIKE 'Q-' || v_year || '-%';

    -- Format: Q-2025-001
    v_quote_number := 'Q-' || v_year || '-' || LPAD(v_next_number::TEXT, 3, '0');

    RETURN v_quote_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_quote_number IS 'Generates sequential quote numbers per tenant (Q-YYYY-NNN)';

-- ============================================================================
-- FUNCTION: Generate Job Number
-- ============================================================================
-- Purpose: Auto-generate sequential job numbers per tenant
-- Format: J-YYYY-NNN (e.g., J-2025-001, J-2025-002, ...)
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_job_number(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_year TEXT;
    v_next_number INTEGER;
    v_job_number TEXT;
BEGIN
    -- Get current year
    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;

    -- Get next sequential number for this tenant and year
    SELECT COALESCE(MAX(
        CAST(SPLIT_PART(job_number, '-', 3) AS INTEGER)
    ), 0) + 1
    INTO v_next_number
    FROM jobs
    WHERE tenant_id = p_tenant_id
    AND job_number LIKE 'J-' || v_year || '-%';

    -- Format: J-2025-001
    v_job_number := 'J-' || v_year || '-' || LPAD(v_next_number::TEXT, 3, '0');

    RETURN v_job_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_job_number IS 'Generates sequential job numbers per tenant (J-YYYY-NNN)';

-- ============================================================================
-- FUNCTION: Generate Invoice Number
-- ============================================================================
-- Purpose: Auto-generate sequential invoice numbers per tenant
-- Format: INV-YYYY-NNN (e.g., INV-2025-001, INV-2025-002, ...)
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_invoice_number(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_year TEXT;
    v_next_number INTEGER;
    v_invoice_number TEXT;
BEGIN
    -- Get current year
    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;

    -- Get next sequential number for this tenant and year
    SELECT COALESCE(MAX(
        CAST(SPLIT_PART(invoice_number, '-', 3) AS INTEGER)
    ), 0) + 1
    INTO v_next_number
    FROM invoices
    WHERE tenant_id = p_tenant_id
    AND invoice_number LIKE 'INV-' || v_year || '-%';

    -- Format: INV-2025-001
    v_invoice_number := 'INV-' || v_year || '-' || LPAD(v_next_number::TEXT, 3, '0');

    RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_invoice_number IS 'Generates sequential invoice numbers per tenant (INV-YYYY-NNN)';

-- ============================================================================
-- FUNCTION: Generate Public Link
-- ============================================================================
-- Purpose: Generate unique short codes for public quote/invoice links
-- Format: 8-character alphanumeric (e.g., a7f4k2m9)
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_public_link()
RETURNS TEXT AS $$
DECLARE
    v_chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
    v_link TEXT := '';
    v_i INTEGER;
BEGIN
    -- Generate 8 random characters
    FOR v_i IN 1..8 LOOP
        v_link := v_link || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
    END LOOP;

    RETURN v_link;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_public_link IS 'Generates 8-character alphanumeric codes for public links';

-- ============================================================================
-- TRIGGER: Auto-generate quote_number and public_link
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_set_quote_defaults()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate quote_number if not provided
    IF NEW.quote_number IS NULL OR NEW.quote_number = '' THEN
        NEW.quote_number := generate_quote_number(NEW.tenant_id);
    END IF;

    -- Generate public_link if not provided
    IF NEW.public_link IS NULL OR NEW.public_link = '' THEN
        -- Keep trying until we get a unique link
        LOOP
            NEW.public_link := generate_public_link();
            EXIT WHEN NOT EXISTS (SELECT 1 FROM quotes WHERE public_link = NEW.public_link);
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_quote_defaults
BEFORE INSERT ON quotes
FOR EACH ROW
EXECUTE FUNCTION trigger_set_quote_defaults();

COMMENT ON FUNCTION trigger_set_quote_defaults IS 'Auto-generates quote_number and public_link on insert';

-- ============================================================================
-- TRIGGER: Auto-generate job_number
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_set_job_defaults()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate job_number if not provided
    IF NEW.job_number IS NULL OR NEW.job_number = '' THEN
        NEW.job_number := generate_job_number(NEW.tenant_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_job_defaults
BEFORE INSERT ON jobs
FOR EACH ROW
EXECUTE FUNCTION trigger_set_job_defaults();

COMMENT ON FUNCTION trigger_set_job_defaults IS 'Auto-generates job_number on insert';

-- ============================================================================
-- TRIGGER: Auto-generate invoice_number and public_link
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_set_invoice_defaults()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate invoice_number if not provided
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := generate_invoice_number(NEW.tenant_id);
    END IF;

    -- Generate public_link if not provided
    IF NEW.public_link IS NULL OR NEW.public_link = '' THEN
        -- Keep trying until we get a unique link
        LOOP
            NEW.public_link := generate_public_link();
            EXIT WHEN NOT EXISTS (SELECT 1 FROM invoices WHERE public_link = NEW.public_link);
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invoice_defaults
BEFORE INSERT ON invoices
FOR EACH ROW
EXECUTE FUNCTION trigger_set_invoice_defaults();

COMMENT ON FUNCTION trigger_set_invoice_defaults IS 'Auto-generates invoice_number and public_link on insert';

-- ============================================================================
-- TRIGGER: Update invoice status based on payments
-- ============================================================================
-- Purpose: Automatically update invoice.status and invoice.amount_paid
--          when payments are added/updated/deleted
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_update_invoice_status()
RETURNS TRIGGER AS $$
DECLARE
    v_invoice_id UUID;
    v_total_paid DECIMAL(10, 2);
    v_invoice_total DECIMAL(10, 2);
    v_due_date DATE;
    v_new_status invoice_status;
BEGIN
    -- Get invoice_id (works for INSERT, UPDATE, DELETE)
    IF TG_OP = 'DELETE' THEN
        v_invoice_id := OLD.invoice_id;
    ELSE
        v_invoice_id := NEW.invoice_id;
    END IF;

    -- Calculate total payments for this invoice
    SELECT COALESCE(SUM(amount), 0)
    INTO v_total_paid
    FROM payments
    WHERE invoice_id = v_invoice_id;

    -- Get invoice total and due date
    SELECT total, due_date
    INTO v_invoice_total, v_due_date
    FROM invoices
    WHERE id = v_invoice_id;

    -- Determine new status
    IF v_total_paid = 0 THEN
        -- No payments
        IF v_due_date < CURRENT_DATE THEN
            v_new_status := 'overdue';
        ELSE
            v_new_status := 'sent'; -- Or keep current status if viewed
        END IF;
    ELSIF v_total_paid >= v_invoice_total THEN
        -- Fully paid
        v_new_status := 'paid';
    ELSE
        -- Partially paid
        v_new_status := 'partially_paid';
    END IF;

    -- Update invoice
    UPDATE invoices
    SET
        amount_paid = v_total_paid,
        status = v_new_status,
        paid_at = CASE WHEN v_new_status = 'paid' THEN NOW() ELSE NULL END
    WHERE id = v_invoice_id;

    RETURN NULL; -- For AFTER trigger
END;
$$ LANGUAGE plpgsql;

-- Create triggers for INSERT, UPDATE, DELETE on payments
CREATE TRIGGER update_invoice_on_payment_insert
AFTER INSERT ON payments
FOR EACH ROW
EXECUTE FUNCTION trigger_update_invoice_status();

CREATE TRIGGER update_invoice_on_payment_update
AFTER UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION trigger_update_invoice_status();

CREATE TRIGGER update_invoice_on_payment_delete
AFTER DELETE ON payments
FOR EACH ROW
EXECUTE FUNCTION trigger_update_invoice_status();

COMMENT ON FUNCTION trigger_update_invoice_status IS 'Updates invoice status and amount_paid when payments change';

-- ============================================================================
-- TRIGGER: Update job status when invoice is created
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_update_job_on_invoice()
RETURNS TRIGGER AS $$
BEGIN
    -- If invoice is linked to a job, update job status to 'invoiced'
    IF NEW.job_id IS NOT NULL THEN
        UPDATE jobs
        SET status = 'invoiced'
        WHERE id = NEW.job_id
        AND status != 'paid'; -- Don't downgrade if already paid
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_job_on_invoice_insert
AFTER INSERT ON invoices
FOR EACH ROW
EXECUTE FUNCTION trigger_update_job_on_invoice();

COMMENT ON FUNCTION trigger_update_job_on_invoice IS 'Updates job status to invoiced when invoice is created';

-- ============================================================================
-- TRIGGER: Update job status when invoice is fully paid
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_update_job_on_invoice_paid()
RETURNS TRIGGER AS $$
BEGIN
    -- If invoice status changed to 'paid' and linked to a job, update job to 'paid'
    IF NEW.status = 'paid' AND OLD.status != 'paid' AND NEW.job_id IS NOT NULL THEN
        UPDATE jobs
        SET status = 'paid'
        WHERE id = NEW.job_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_job_on_invoice_paid
AFTER UPDATE ON invoices
FOR EACH ROW
WHEN (NEW.status = 'paid' AND OLD.status != 'paid')
EXECUTE FUNCTION trigger_update_job_on_invoice_paid();

COMMENT ON FUNCTION trigger_update_job_on_invoice_paid IS 'Updates job status to paid when invoice is fully paid';

-- ============================================================================
-- TRIGGER: Update quote viewed_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_update_quote_viewed()
RETURNS TRIGGER AS $$
BEGIN
    -- Set viewed_at timestamp if status changes to 'viewed'
    IF NEW.status = 'viewed' AND (OLD.status IS NULL OR OLD.status != 'viewed') THEN
        NEW.viewed_at := NOW();
    END IF;

    -- Update status to 'viewed' if currently 'sent'
    IF NEW.viewed_at IS NOT NULL AND NEW.status = 'sent' THEN
        NEW.status := 'viewed';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quote_viewed
BEFORE UPDATE ON quotes
FOR EACH ROW
EXECUTE FUNCTION trigger_update_quote_viewed();

COMMENT ON FUNCTION trigger_update_quote_viewed IS 'Auto-updates viewed_at timestamp when quote is viewed';

-- ============================================================================
-- TRIGGER: Update invoice viewed_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_update_invoice_viewed()
RETURNS TRIGGER AS $$
BEGIN
    -- Set viewed_at timestamp if status changes to 'viewed'
    IF NEW.status = 'viewed' AND (OLD.status IS NULL OR OLD.status != 'viewed') THEN
        NEW.viewed_at := NOW();
    END IF;

    -- Update status to 'viewed' if currently 'sent'
    IF NEW.viewed_at IS NOT NULL AND NEW.status = 'sent' THEN
        NEW.status := 'viewed';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_viewed
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION trigger_update_invoice_viewed();

COMMENT ON FUNCTION trigger_update_invoice_viewed IS 'Auto-updates viewed_at timestamp when invoice is viewed';

-- ============================================================================
-- FUNCTION: Mark invoice as overdue (run via cron job)
-- ============================================================================
-- Purpose: Background job to update invoices past due_date to 'overdue' status
-- Should be called daily via cron or pg_cron
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_overdue_invoices()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE invoices
    SET status = 'overdue'
    WHERE status IN ('sent', 'viewed', 'partially_paid')
    AND due_date < CURRENT_DATE
    AND amount_paid < total;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_overdue_invoices IS 'Updates invoices to overdue status (run daily via cron)';

-- ============================================================================
-- FUNCTION: Mark quotes as expired (run via cron job)
-- ============================================================================
-- Purpose: Background job to update quotes past valid_until to 'expired' status
-- Should be called daily via cron or pg_cron
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_expired_quotes()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE quotes
    SET status = 'expired'
    WHERE status IN ('sent', 'viewed')
    AND valid_until < CURRENT_DATE;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_expired_quotes IS 'Updates quotes to expired status (run daily via cron)';

-- ============================================================================
-- FUNCTION: Get customer lifetime value
-- ============================================================================
-- Purpose: Calculate total revenue and outstanding balance for a customer
-- Returns: JSONB with total_revenue, total_outstanding, invoice_count, job_count
-- ============================================================================

CREATE OR REPLACE FUNCTION get_customer_lifetime_value(p_customer_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_revenue', COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.total ELSE 0 END), 0),
        'total_outstanding', COALESCE(SUM(CASE WHEN i.status IN ('sent', 'viewed', 'partially_paid', 'overdue') THEN i.total - i.amount_paid ELSE 0 END), 0),
        'total_paid', COALESCE(SUM(i.amount_paid), 0),
        'invoice_count', COUNT(DISTINCT i.id),
        'job_count', COUNT(DISTINCT j.id),
        'first_job_date', MIN(j.created_at),
        'last_job_date', MAX(j.created_at)
    ) INTO v_result
    FROM customers c
    LEFT JOIN jobs j ON j.customer_id = c.id
    LEFT JOIN invoices i ON i.customer_id = c.id
    WHERE c.id = p_customer_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_customer_lifetime_value IS 'Returns customer lifetime value and statistics';

-- ============================================================================
-- FUNCTION: Get dashboard stats for tenant
-- ============================================================================
-- Purpose: Calculate key metrics for dashboard
-- Returns: JSONB with various dashboard statistics
-- ============================================================================

CREATE OR REPLACE FUNCTION get_dashboard_stats(p_tenant_id UUID, p_month DATE DEFAULT CURRENT_DATE)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    -- Calculate month boundaries
    v_start_date := DATE_TRUNC('month', p_month)::DATE;
    v_end_date := (DATE_TRUNC('month', p_month) + INTERVAL '1 month')::DATE;

    SELECT jsonb_build_object(
        -- Money metrics
        'total_outstanding', (
            SELECT COALESCE(SUM(total - amount_paid), 0)
            FROM invoices
            WHERE tenant_id = p_tenant_id
            AND status IN ('sent', 'viewed', 'partially_paid', 'overdue')
        ),
        'overdue_amount', (
            SELECT COALESCE(SUM(total - amount_paid), 0)
            FROM invoices
            WHERE tenant_id = p_tenant_id
            AND status = 'overdue'
        ),
        'month_revenue', (
            SELECT COALESCE(SUM(amount), 0)
            FROM payments p
            JOIN invoices i ON i.id = p.invoice_id
            WHERE i.tenant_id = p_tenant_id
            AND p.payment_date >= v_start_date
            AND p.payment_date < v_end_date
        ),

        -- Job metrics
        'jobs_completed_this_month', (
            SELECT COUNT(*)
            FROM jobs
            WHERE tenant_id = p_tenant_id
            AND completed_date >= v_start_date
            AND completed_date < v_end_date
        ),
        'jobs_scheduled_today', (
            SELECT COUNT(*)
            FROM jobs
            WHERE tenant_id = p_tenant_id
            AND scheduled_date = CURRENT_DATE
            AND status IN ('scheduled', 'in_progress')
        ),
        'jobs_to_invoice', (
            SELECT COUNT(*)
            FROM jobs
            WHERE tenant_id = p_tenant_id
            AND status = 'complete'
        ),

        -- Quote metrics
        'quotes_sent_this_month', (
            SELECT COUNT(*)
            FROM quotes
            WHERE tenant_id = p_tenant_id
            AND sent_at >= v_start_date
            AND sent_at < v_end_date
        ),
        'quotes_awaiting_response', (
            SELECT COUNT(*)
            FROM quotes
            WHERE tenant_id = p_tenant_id
            AND status IN ('sent', 'viewed')
            AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
        ),
        'quote_acceptance_rate', (
            SELECT CASE
                WHEN COUNT(*) = 0 THEN 0
                ELSE ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'accepted') / COUNT(*), 1)
            END
            FROM quotes
            WHERE tenant_id = p_tenant_id
            AND sent_at >= v_start_date
            AND sent_at < v_end_date
        ),

        -- Invoice metrics
        'overdue_invoices_count', (
            SELECT COUNT(*)
            FROM invoices
            WHERE tenant_id = p_tenant_id
            AND status = 'overdue'
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_dashboard_stats IS 'Returns comprehensive dashboard statistics for a tenant';

-- ============================================================================
-- END OF FUNCTIONS MIGRATION
-- ============================================================================
