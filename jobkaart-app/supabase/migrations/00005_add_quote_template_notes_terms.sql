-- ============================================================================
-- Add notes and terms columns to quote_templates
-- ============================================================================
-- Description: Adds optional notes and terms columns to quote_templates table
--              to allow templates to include default notes and terms/conditions
-- Date: 2025-12-03
-- ============================================================================

-- Add notes and terms columns to quote_templates
ALTER TABLE quote_templates
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS terms TEXT;

-- Comments
COMMENT ON COLUMN quote_templates.notes IS 'Default notes that will appear on quotes using this template';
COMMENT ON COLUMN quote_templates.terms IS 'Default terms and conditions that will appear on quotes using this template';
