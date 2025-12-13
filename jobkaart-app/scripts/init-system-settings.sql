-- ============================================================================
-- Initialize system_settings record if it doesn't exist
-- ============================================================================
-- Run this script in your Supabase SQL editor or via psql
-- ============================================================================

-- Ensure the system_settings table exists
CREATE TABLE IF NOT EXISTS system_settings (
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

-- Insert or update the default settings record
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
) ON CONFLICT (id) DO UPDATE SET
    free_quotes_per_month = EXCLUDED.free_quotes_per_month,
    free_jobs_per_month = EXCLUDED.free_jobs_per_month,
    free_invoices_per_month = EXCLUDED.free_invoices_per_month,
    updated_at = NOW();

-- Verify the record was created/updated
SELECT * FROM system_settings WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
