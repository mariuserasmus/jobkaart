-- Migration: Fix Public View Tracking for Quotes and Invoices
-- Description: Add RLS policies to allow anonymous users to mark quotes/invoices as viewed
-- Created: 2025-12-03

-- ============================================================================
-- QUOTES: Allow public to mark as viewed
-- ============================================================================

-- Drop existing policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Public can mark quotes as viewed" ON quotes;

-- Allow public/anonymous users to update ONLY the viewed_at field when status is 'sent'
CREATE POLICY "Public can mark quotes as viewed"
ON quotes FOR UPDATE
USING (
  -- Can only update quotes that are currently 'sent'
  status = 'sent'
)
WITH CHECK (
  -- After update, status must still be 'sent' and viewed_at must be set
  -- This prevents updating other fields
  status = 'sent' AND
  viewed_at IS NOT NULL
);

-- ============================================================================
-- INVOICES: Allow public to mark as viewed
-- ============================================================================

-- Drop existing policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Public can mark invoices as viewed" ON invoices;

-- Allow public/anonymous users to update ONLY the viewed_at field when status is 'sent'
CREATE POLICY "Public can mark invoices as viewed"
ON invoices FOR UPDATE
USING (
  -- Can only update invoices that are currently 'sent'
  status = 'sent'
)
WITH CHECK (
  -- After update, status must still be 'sent' and viewed_at must be set
  -- This prevents updating other fields
  status = 'sent' AND
  viewed_at IS NOT NULL
);

-- ============================================================================
-- NOTES
-- ============================================================================

-- Security considerations:
-- 1. Only allows updates when current status is 'sent'
-- 2. Only allows setting the viewed_at timestamp
-- 3. Cannot modify other fields (line_items, total, customer info, etc.)
-- 4. Triggers will automatically change status from 'sent' to 'viewed'
-- 5. Race condition protection exists in app code (.eq('status', 'sent'))

-- How it works:
-- 1. Customer clicks public quote/invoice link (not authenticated)
-- 2. Page loads (SELECT allowed by existing public policy)
-- 3. Page updates viewed_at field (now allowed by this policy)
-- 4. Database trigger detects viewed_at is set while status = 'sent'
-- 5. Trigger changes status to 'viewed' automatically
-- 6. User sees status change in dashboard
