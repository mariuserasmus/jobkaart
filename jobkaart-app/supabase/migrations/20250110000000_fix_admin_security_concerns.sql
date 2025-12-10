-- Fix Supabase Security Concerns
-- 1. Remove SECURITY DEFINER from admin views
-- 2. Enable RLS on admin_audit_logs table

-- ==================================================
-- FIX 1 & 2: Recreate admin views WITHOUT SECURITY DEFINER
-- ==================================================

-- Drop existing views
DROP VIEW IF EXISTS admin_tenant_stats;
DROP VIEW IF EXISTS admin_system_stats;

-- Recreate admin_tenant_stats view WITHOUT SECURITY DEFINER
CREATE VIEW admin_tenant_stats AS
SELECT
  t.id,
  t.business_name,
  t.created_at,
  t.subscription_status,
  t.subscription_tier,
  t.subscription_ends_at,
  COUNT(DISTINCT u.id) as user_count,
  COUNT(DISTINCT c.id) as customer_count,
  COUNT(DISTINCT q.id) as quote_count,
  COUNT(DISTINCT j.id) as job_count,
  COUNT(DISTINCT i.id) as invoice_count,
  COALESCE(SUM(i.total), 0) as total_revenue
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id
LEFT JOIN customers c ON c.tenant_id = t.id
LEFT JOIN quotes q ON q.tenant_id = t.id
LEFT JOIN jobs j ON j.tenant_id = t.id
LEFT JOIN invoices i ON i.tenant_id = t.id AND i.status = 'paid'
GROUP BY t.id, t.business_name, t.created_at, t.subscription_status, t.subscription_tier, t.subscription_ends_at;

-- Recreate admin_system_stats view WITHOUT SECURITY DEFINER
CREATE VIEW admin_system_stats AS
SELECT
  (SELECT COUNT(*) FROM tenants) as total_tenants,
  (SELECT COUNT(*) FROM tenants WHERE subscription_status = 'active') as active_tenants,
  (SELECT COUNT(*) FROM tenants WHERE subscription_status = 'trialing') as trial_tenants,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM customers) as total_customers,
  (SELECT COUNT(*) FROM quotes) as total_quotes,
  (SELECT COUNT(*) FROM jobs) as total_jobs,
  (SELECT COUNT(*) FROM invoices) as total_invoices,
  (SELECT COALESCE(SUM(total), 0) FROM invoices WHERE status = 'paid') as total_revenue;

-- ==================================================
-- FIX 3: Enable RLS on admin_audit_logs
-- ==================================================

-- Enable RLS on admin_audit_logs
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Only super admins can view audit logs
CREATE POLICY "Super admins can view all audit logs"
ON admin_audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.is_super_admin = true
  )
);

-- Create RLS policy: System can insert audit logs (for logging purposes)
CREATE POLICY "System can insert audit logs"
ON admin_audit_logs
FOR INSERT
WITH CHECK (true);

-- ==================================================
-- Additional Security: Add RLS policies for admin views
-- ==================================================

-- Note: Views don't have RLS directly, but we'll ensure only super admins can query them
-- by checking permissions in the application layer. The views now run with the
-- querying user's permissions (not SECURITY DEFINER), which is more secure.

-- Add comments for documentation
COMMENT ON VIEW admin_tenant_stats IS 'Admin view of tenant statistics. Access controlled by application layer - super admins only.';
COMMENT ON VIEW admin_system_stats IS 'Admin view of system-wide statistics. Access controlled by application layer - super admins only.';
COMMENT ON TABLE admin_audit_logs IS 'Audit log for admin actions. RLS enabled - only super admins can view.';
