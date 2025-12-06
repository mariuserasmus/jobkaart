-- ============================================================================
-- JobKaart Database Schema - Super Admin DELETE Policies
-- ============================================================================
-- Description: Adds DELETE policies to allow super admins to delete any tenant's data
-- Version: 1.0.0
-- Date: 2025-12-06
-- ============================================================================
-- CRITICAL: Super admins need DELETE access for tenant data reset functionality
-- ============================================================================

-- ============================================================================
-- TABLE: customers - Add super admin DELETE policy
-- ============================================================================

CREATE POLICY "Super admins can delete all customers"
ON customers FOR DELETE
USING (public.is_super_admin());

-- ============================================================================
-- TABLE: quotes - Add super admin DELETE policy
-- ============================================================================

CREATE POLICY "Super admins can delete all quotes"
ON quotes FOR DELETE
USING (public.is_super_admin());

-- ============================================================================
-- TABLE: jobs - Add super admin DELETE policy
-- ============================================================================

CREATE POLICY "Super admins can delete all jobs"
ON jobs FOR DELETE
USING (public.is_super_admin());

-- ============================================================================
-- TABLE: invoices - Add super admin DELETE policy
-- ============================================================================

CREATE POLICY "Super admins can delete all invoices"
ON invoices FOR DELETE
USING (public.is_super_admin());

-- ============================================================================
-- TABLE: payments - Add super admin DELETE policy
-- ============================================================================

CREATE POLICY "Super admins can delete all payments"
ON payments FOR DELETE
USING (public.is_super_admin());

-- ============================================================================
-- TABLE: job_photos - Add super admin DELETE policy
-- ============================================================================

CREATE POLICY "Super admins can delete all job_photos"
ON job_photos FOR DELETE
USING (public.is_super_admin());

-- ============================================================================
-- TABLE: view_tracking - Add super admin DELETE policy
-- ============================================================================

CREATE POLICY "Super admins can delete all view_tracking"
ON view_tracking FOR DELETE
USING (public.is_super_admin());

-- ============================================================================
-- COMMENT
-- ============================================================================

COMMENT ON POLICY "Super admins can delete all customers" ON customers
IS 'Allows super admins to delete customers from any tenant (for data reset)';

COMMENT ON POLICY "Super admins can delete all quotes" ON quotes
IS 'Allows super admins to delete quotes from any tenant (for data reset)';

COMMENT ON POLICY "Super admins can delete all jobs" ON jobs
IS 'Allows super admins to delete jobs from any tenant (for data reset)';

COMMENT ON POLICY "Super admins can delete all invoices" ON invoices
IS 'Allows super admins to delete invoices from any tenant (for data reset)';

COMMENT ON POLICY "Super admins can delete all payments" ON payments
IS 'Allows super admins to delete payments from any tenant (for data reset)';

COMMENT ON POLICY "Super admins can delete all job_photos" ON job_photos
IS 'Allows super admins to delete job photos from any tenant (for data reset)';

COMMENT ON POLICY "Super admins can delete all view_tracking" ON view_tracking
IS 'Allows super admins to delete view tracking from any tenant (for data reset)';

-- ============================================================================
-- END OF SUPER ADMIN DELETE POLICIES MIGRATION
-- ============================================================================
