-- Migration: Fix job status triggers to only update for final invoices
-- This prevents deposit and progress invoices from incorrectly marking jobs as invoiced/paid

-- ============================================================================
-- TRIGGER: Update job status when invoice is created
-- ============================================================================
-- Fix: Only update job to 'invoiced' for FULL invoices (not deposit/progress/balance)

CREATE OR REPLACE FUNCTION trigger_update_job_on_invoice()
RETURNS TRIGGER AS $$
BEGIN
    -- If invoice is linked to a job AND it's a FULL invoice, update job status to 'invoiced'
    -- Don't update for deposit, progress, or balance invoices
    IF NEW.job_id IS NOT NULL AND (NEW.invoice_type = 'full' OR NEW.invoice_type IS NULL) THEN
        UPDATE jobs
        SET status = 'invoiced'
        WHERE id = NEW.job_id
        AND status != 'paid'; -- Don't downgrade if already paid
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION trigger_update_job_on_invoice IS 'Updates job status to invoiced when FULL invoice is created (not deposit/progress/balance)';

-- ============================================================================
-- TRIGGER: Update job status when invoice is fully paid
-- ============================================================================
-- Fix: Only update job to 'paid' for FULL or BALANCE invoices (not deposit/progress)

CREATE OR REPLACE FUNCTION trigger_update_job_on_invoice_paid()
RETURNS TRIGGER AS $$
BEGIN
    -- If invoice status changed to 'paid' and linked to a job
    -- ONLY update job to 'paid' if it's a FULL or BALANCE invoice
    -- Don't update for deposit or progress invoices
    IF NEW.status = 'paid' AND OLD.status != 'paid' AND NEW.job_id IS NOT NULL THEN
        -- Check invoice type
        IF NEW.invoice_type = 'full' OR NEW.invoice_type = 'balance' OR NEW.invoice_type IS NULL THEN
            UPDATE jobs
            SET status = 'paid'
            WHERE id = NEW.job_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION trigger_update_job_on_invoice_paid IS 'Updates job status to paid when FULL or BALANCE invoice is fully paid (not deposit/progress)';
