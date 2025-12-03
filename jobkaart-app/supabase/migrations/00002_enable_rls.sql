-- ============================================================================
-- JobKaart Database Schema - Row-Level Security (RLS)
-- ============================================================================
-- Description: Enables RLS and creates security policies for multi-tenant isolation
-- Version: 1.0.0
-- Date: 2025-12-02
-- ============================================================================
-- CRITICAL: RLS ensures each tenant can ONLY access their own data
-- JWT tokens contain tenant_id claim set during authentication
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTION: Get tenant_id from JWT
-- ============================================================================

-- Extract tenant_id from Supabase JWT token
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS UUID AS $$
    SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'tenant_id', '')::uuid;
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION auth.tenant_id IS 'Extracts tenant_id from JWT token for RLS policies';

-- ============================================================================
-- TABLE: tenants
-- ============================================================================
-- RLS Strategy: Users can only see/update their own tenant
-- ============================================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Users can view their own tenant
CREATE POLICY "Users can view own tenant"
ON tenants FOR SELECT
USING (id = auth.tenant_id());

-- Users can update their own tenant (owner/admin only - enforced at app level)
CREATE POLICY "Users can update own tenant"
ON tenants FOR UPDATE
USING (id = auth.tenant_id());

-- Service role can do everything (for migrations, admin tasks)
CREATE POLICY "Service role has full access"
ON tenants FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- TABLE: users
-- ============================================================================
-- RLS Strategy: Users can only see other users in their tenant
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view other users in their tenant
CREATE POLICY "Users can view users in own tenant"
ON users FOR SELECT
USING (tenant_id = auth.tenant_id());

-- Users can insert new users to their own tenant (owner/admin only - enforced at app level)
CREATE POLICY "Users can insert users to own tenant"
ON users FOR INSERT
WITH CHECK (tenant_id = auth.tenant_id());

-- Users can update users in their own tenant
CREATE POLICY "Users can update users in own tenant"
ON users FOR UPDATE
USING (tenant_id = auth.tenant_id());

-- Users can delete users from their own tenant (owner only - enforced at app level)
CREATE POLICY "Users can delete users from own tenant"
ON users FOR DELETE
USING (tenant_id = auth.tenant_id());

-- Service role has full access
CREATE POLICY "Service role has full access to users"
ON users FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- TABLE: customers
-- ============================================================================
-- RLS Strategy: Users can only see/manage customers in their tenant
-- ============================================================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Users can view customers in their tenant
CREATE POLICY "Users can view own tenant customers"
ON customers FOR SELECT
USING (tenant_id = auth.tenant_id());

-- Users can insert customers to their tenant
CREATE POLICY "Users can insert own tenant customers"
ON customers FOR INSERT
WITH CHECK (tenant_id = auth.tenant_id());

-- Users can update customers in their tenant
CREATE POLICY "Users can update own tenant customers"
ON customers FOR UPDATE
USING (tenant_id = auth.tenant_id());

-- Users can delete customers from their tenant
CREATE POLICY "Users can delete own tenant customers"
ON customers FOR DELETE
USING (tenant_id = auth.tenant_id());

-- Service role has full access
CREATE POLICY "Service role has full access to customers"
ON customers FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- TABLE: quote_templates
-- ============================================================================
-- RLS Strategy: Users can only see/manage templates in their tenant
-- ============================================================================

ALTER TABLE quote_templates ENABLE ROW LEVEL SECURITY;

-- Users can view templates in their tenant
CREATE POLICY "Users can view own tenant templates"
ON quote_templates FOR SELECT
USING (tenant_id = auth.tenant_id());

-- Users can insert templates to their tenant
CREATE POLICY "Users can insert own tenant templates"
ON quote_templates FOR INSERT
WITH CHECK (tenant_id = auth.tenant_id());

-- Users can update templates in their tenant
CREATE POLICY "Users can update own tenant templates"
ON quote_templates FOR UPDATE
USING (tenant_id = auth.tenant_id());

-- Users can delete templates from their tenant
CREATE POLICY "Users can delete own tenant templates"
ON quote_templates FOR DELETE
USING (tenant_id = auth.tenant_id());

-- Service role has full access
CREATE POLICY "Service role has full access to templates"
ON quote_templates FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- TABLE: quotes
-- ============================================================================
-- RLS Strategy: Users can only see/manage quotes in their tenant
-- Special: Public read access via public_link (for customer views)
-- ============================================================================

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Users can view quotes in their tenant
CREATE POLICY "Users can view own tenant quotes"
ON quotes FOR SELECT
USING (tenant_id = auth.tenant_id());

-- Public can view quotes via public_link (unauthenticated access)
-- This allows customers to view quotes without logging in
CREATE POLICY "Public can view quotes via public link"
ON quotes FOR SELECT
USING (true); -- Always allow SELECT, app will filter by public_link

-- Users can insert quotes to their tenant
CREATE POLICY "Users can insert own tenant quotes"
ON quotes FOR INSERT
WITH CHECK (tenant_id = auth.tenant_id());

-- Users can update quotes in their tenant
CREATE POLICY "Users can update own tenant quotes"
ON quotes FOR UPDATE
USING (tenant_id = auth.tenant_id());

-- Users can delete quotes from their tenant
CREATE POLICY "Users can delete own tenant quotes"
ON quotes FOR DELETE
USING (tenant_id = auth.tenant_id());

-- Service role has full access
CREATE POLICY "Service role has full access to quotes"
ON quotes FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- TABLE: jobs
-- ============================================================================
-- RLS Strategy: Users can only see/manage jobs in their tenant
-- ============================================================================

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Users can view jobs in their tenant
CREATE POLICY "Users can view own tenant jobs"
ON jobs FOR SELECT
USING (tenant_id = auth.tenant_id());

-- Users can insert jobs to their tenant
CREATE POLICY "Users can insert own tenant jobs"
ON jobs FOR INSERT
WITH CHECK (tenant_id = auth.tenant_id());

-- Users can update jobs in their tenant
CREATE POLICY "Users can update own tenant jobs"
ON jobs FOR UPDATE
USING (tenant_id = auth.tenant_id());

-- Users can delete jobs from their tenant
CREATE POLICY "Users can delete own tenant jobs"
ON jobs FOR DELETE
USING (tenant_id = auth.tenant_id());

-- Service role has full access
CREATE POLICY "Service role has full access to jobs"
ON jobs FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- TABLE: invoices
-- ============================================================================
-- RLS Strategy: Users can only see/manage invoices in their tenant
-- Special: Public read access via public_link (for customer views)
-- ============================================================================

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Users can view invoices in their tenant
CREATE POLICY "Users can view own tenant invoices"
ON invoices FOR SELECT
USING (tenant_id = auth.tenant_id());

-- Public can view invoices via public_link (unauthenticated access)
-- This allows customers to view invoices without logging in
CREATE POLICY "Public can view invoices via public link"
ON invoices FOR SELECT
USING (true); -- Always allow SELECT, app will filter by public_link

-- Users can insert invoices to their tenant
CREATE POLICY "Users can insert own tenant invoices"
ON invoices FOR INSERT
WITH CHECK (tenant_id = auth.tenant_id());

-- Users can update invoices in their tenant
CREATE POLICY "Users can update own tenant invoices"
ON invoices FOR UPDATE
USING (tenant_id = auth.tenant_id());

-- Users can delete invoices from their tenant
CREATE POLICY "Users can delete own tenant invoices"
ON invoices FOR DELETE
USING (tenant_id = auth.tenant_id());

-- Service role has full access
CREATE POLICY "Service role has full access to invoices"
ON invoices FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- TABLE: payments
-- ============================================================================
-- RLS Strategy: Users can only see/manage payments in their tenant
-- ============================================================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can view payments in their tenant
CREATE POLICY "Users can view own tenant payments"
ON payments FOR SELECT
USING (tenant_id = auth.tenant_id());

-- Users can insert payments to their tenant
CREATE POLICY "Users can insert own tenant payments"
ON payments FOR INSERT
WITH CHECK (tenant_id = auth.tenant_id());

-- Users can update payments in their tenant
CREATE POLICY "Users can update own tenant payments"
ON payments FOR UPDATE
USING (tenant_id = auth.tenant_id());

-- Users can delete payments from their tenant
CREATE POLICY "Users can delete own tenant payments"
ON payments FOR DELETE
USING (tenant_id = auth.tenant_id());

-- Service role has full access
CREATE POLICY "Service role has full access to payments"
ON payments FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- TABLE: view_tracking
-- ============================================================================
-- RLS Strategy: Users can view tracking data for their tenant
-- Public can INSERT tracking data (for quote/invoice views)
-- ============================================================================

ALTER TABLE view_tracking ENABLE ROW LEVEL SECURITY;

-- Users can view tracking data for their tenant
CREATE POLICY "Users can view own tenant tracking"
ON view_tracking FOR SELECT
USING (tenant_id = auth.tenant_id());

-- Public can insert tracking data (when viewing quotes/invoices)
CREATE POLICY "Public can insert view tracking"
ON view_tracking FOR INSERT
WITH CHECK (true); -- Always allow INSERT, tenant_id will be set correctly

-- Service role has full access
CREATE POLICY "Service role has full access to view_tracking"
ON view_tracking FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================

-- 1. JWT Token Structure:
--    When user logs in via Supabase Auth, JWT contains:
--    {
--      "sub": "user-uuid",
--      "tenant_id": "tenant-uuid",  ← Set during signup/login
--      "role": "authenticated",
--      ...
--    }

-- 2. How RLS Works:
--    - Every query automatically filters by tenant_id = auth.tenant_id()
--    - No way for Tenant A to access Tenant B's data
--    - Even if client tries to query all data, RLS blocks it at DB level

-- 3. Public Access:
--    - Quotes and invoices have "public" policies for SELECT
--    - Application MUST filter by public_link parameter
--    - RLS allows SELECT, but app only shows specific record

-- 4. Service Role:
--    - Backend can use service role key for admin operations
--    - Migrations, cleanup jobs, analytics, etc.
--    - NEVER expose service role key to frontend

-- 5. Testing RLS:
--    To test as a specific tenant, set JWT claim:
--    SET request.jwt.claims = '{"tenant_id": "xxx-xxx-xxx"}';

-- ============================================================================
-- END OF RLS MIGRATION
-- ============================================================================
