-- ============================================================================
-- Add Deposit Invoice Support
-- ============================================================================
-- Description: Adds support for deposit invoices and final balance invoices
-- Version: 1.0.0
-- Date: 2025-12-06
-- ============================================================================

-- Create invoice type enum
CREATE TYPE invoice_type AS ENUM ('full', 'deposit', 'balance');

-- Add new columns to invoices table
ALTER TABLE invoices
ADD COLUMN invoice_type invoice_type NOT NULL DEFAULT 'full',
ADD COLUMN parent_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
ADD COLUMN deposit_percentage DECIMAL(5, 2), -- e.g., 50.00 for 50%
ADD COLUMN deposit_amount DECIMAL(10, 2); -- Calculated deposit amount

-- Add index for parent invoice lookups
CREATE INDEX idx_invoices_parent_invoice_id ON invoices(parent_invoice_id);

-- Add comments
COMMENT ON COLUMN invoices.invoice_type IS 'Type of invoice: full (complete payment), deposit (upfront payment), balance (remaining after deposit)';
COMMENT ON COLUMN invoices.parent_invoice_id IS 'Links balance invoices to their deposit invoice';
COMMENT ON COLUMN invoices.deposit_percentage IS 'Percentage of total for deposit invoices (e.g., 50.00 = 50%)';
COMMENT ON COLUMN invoices.deposit_amount IS 'Calculated deposit amount for deposit invoices';

-- ============================================================================
-- USAGE EXAMPLES:
-- ============================================================================
--
-- 1. Create a deposit invoice (50% upfront):
--    INSERT INTO invoices (..., invoice_type, deposit_percentage, deposit_amount)
--    VALUES (..., 'deposit', 50.00, 2500.00);  -- where total is R5,000
--
-- 2. Create a balance invoice after job completion:
--    INSERT INTO invoices (..., invoice_type, parent_invoice_id, total)
--    VALUES (..., 'balance', '<deposit_invoice_id>', 2500.00);  -- remaining R2,500
--
-- 3. Find all invoices for a job including deposits:
--    SELECT * FROM invoices WHERE job_id = '<job_id>' ORDER BY created_at;
--
-- 4. Get deposit invoice for a balance invoice:
--    SELECT d.* FROM invoices d
--    JOIN invoices b ON b.parent_invoice_id = d.id
--    WHERE b.id = '<balance_invoice_id>';
--
-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
