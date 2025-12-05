-- ============================================================================
-- JobKaart Database Schema - Super Admin RLS Policies
-- ============================================================================
-- Description: Adds RLS policies to allow super admins to view all tenant data
-- Version: 1.0.0
-- Date: 2025-12-05
-- ============================================================================
-- CRITICAL: Super admins need to bypass tenant isolation to view all data
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTION: Check if current user is super admin
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
    AND is_super_admin = TRUE
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.is_super_admin IS 'Returns TRUE if current user is a super admin';

-- ============================================================================
-- TABLE: tenants - Add super admin policies
-- ============================================================================

-- Super admins can view all tenants
CREATE POLICY "Super admins can view all tenants"
ON tenants FOR SELECT
USING (public.is_super_admin());

-- Super admins can update all tenants
CREATE POLICY "Super admins can update all tenants"
ON tenants FOR UPDATE
USING (public.is_super_admin());

-- ============================================================================
-- TABLE: users - Add super admin policies
-- ============================================================================

-- Super admins can view all users
CREATE POLICY "Super admins can view all users"
ON users FOR SELECT
USING (public.is_super_admin());

-- Super admins can update all users
CREATE POLICY "Super admins can update all users"
ON users FOR UPDATE
USING (public.is_super_admin());

-- ============================================================================
-- TABLE: customers - Add super admin policies
-- ============================================================================

-- Super admins can view all customers
CREATE POLICY "Super admins can view all customers"
ON customers FOR SELECT
USING (public.is_super_admin());

-- ============================================================================
-- TABLE: quotes - Add super admin policies
-- ============================================================================

-- Super admins can view all quotes
CREATE POLICY "Super admins can view all quotes"
ON quotes FOR SELECT
USING (public.is_super_admin());

-- ============================================================================
-- TABLE: jobs - Add super admin policies
-- ============================================================================

-- Super admins can view all jobs
CREATE POLICY "Super admins can view all jobs"
ON jobs FOR SELECT
USING (public.is_super_admin());

-- ============================================================================
-- TABLE: invoices - Add super admin policies
-- ============================================================================

-- Super admins can view all invoices
CREATE POLICY "Super admins can view all invoices"
ON invoices FOR SELECT
USING (public.is_super_admin());

-- ============================================================================
-- TABLE: payments - Add super admin policies
-- ============================================================================

-- Super admins can view all payments
CREATE POLICY "Super admins can view all payments"
ON payments FOR SELECT
USING (public.is_super_admin());

-- ============================================================================
-- TABLE: view_tracking - Add super admin policies
-- ============================================================================

-- Super admins can view all tracking data
CREATE POLICY "Super admins can view all tracking"
ON view_tracking FOR SELECT
USING (public.is_super_admin());

-- ============================================================================
-- END OF SUPER ADMIN RLS POLICIES MIGRATION
-- ============================================================================
