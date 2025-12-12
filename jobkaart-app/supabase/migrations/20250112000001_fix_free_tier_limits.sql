-- ============================================================================
-- Fix FREE tier limits to 5 (update existing system_settings)
-- ============================================================================

-- Update system_settings to ensure FREE tier limits are set to 5
UPDATE system_settings
SET
    free_quotes_per_month = 5,
    free_jobs_per_month = 5,
    free_invoices_per_month = 5,
    updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Verify the update
DO $$
DECLARE
    v_quotes_limit INTEGER;
    v_jobs_limit INTEGER;
    v_invoices_limit INTEGER;
BEGIN
    SELECT free_quotes_per_month, free_jobs_per_month, free_invoices_per_month
    INTO v_quotes_limit, v_jobs_limit, v_invoices_limit
    FROM system_settings
    WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

    RAISE NOTICE 'FREE tier limits updated: quotes=%, jobs=%, invoices=%',
        v_quotes_limit, v_jobs_limit, v_invoices_limit;
END $$;
