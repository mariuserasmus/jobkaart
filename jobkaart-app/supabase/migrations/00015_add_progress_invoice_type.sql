-- Migration: Add 'progress' invoice type for progress billing
-- This allows creating multiple progress payment invoices between deposit and final balance

-- Add 'progress' to the invoice_type enum
ALTER TYPE invoice_type ADD VALUE IF NOT EXISTS 'progress';

-- Note: The existing columns (parent_invoice_id, deposit_percentage, deposit_amount)
-- from migration 00014 will also be used for progress invoices
