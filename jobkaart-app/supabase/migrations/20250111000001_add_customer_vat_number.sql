-- Add VAT number field to customers table
-- Purpose: Allow tracking customer VAT numbers for VAT-registered clients

ALTER TABLE customers
ADD COLUMN vat_number TEXT;

-- Index for searching by VAT number
CREATE INDEX idx_customers_vat_number ON customers(tenant_id, vat_number) WHERE vat_number IS NOT NULL;

-- Comment
COMMENT ON COLUMN customers.vat_number IS 'Customer VAT number if they are VAT-registered';
