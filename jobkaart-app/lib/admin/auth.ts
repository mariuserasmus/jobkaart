import { createServerClient } from '@/lib/db/supabase-server'

/**
 * Check if the current user is a super admin
 * Returns true if user is super admin, false otherwise
 */
export async function isSuperAdmin(): Promise<boolean> {
  const supabase = await createServerClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (!user || error) {
    return false
  }

  // Query the users table to check is_super_admin flag
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('is_super_admin')
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    return false
  }

  return userData.is_super_admin === true
}

/**
 * Get the current admin user (must be super admin)
 * Returns user data or null if not a super admin
 */
export async function getCurrentAdminUser() {
  const supabase = await createServerClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (!user || error) {
    return null
  }

  // Verify they are a super admin
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (userError || !userData || !userData.is_super_admin) {
    return null
  }

  return userData
}

/**
 * Log an admin action to the audit log
 */
export async function logAdminAction({
  action,
  targetType,
  targetId,
  metadata,
}: {
  action: string
  targetType?: string
  targetId?: string
  metadata?: Record<string, any>
}) {
  const supabase = await createServerClient()
  const adminUser = await getCurrentAdminUser()

  if (!adminUser) {
    throw new Error('Unauthorized: Not a super admin')
  }

  const { error } = await supabase.from('admin_audit_logs').insert({
    admin_user_id: adminUser.id,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata: metadata || {},
  })

  if (error) {
    console.error('Failed to log admin action:', error)
  }
}

/**
 * Require super admin access or throw error
 * Use this in server components/actions to protect admin routes
 * Returns the admin user object if authorized
 */
export async function requireSuperAdmin() {
  const adminUser = await getCurrentAdminUser()

  if (!adminUser) {
    throw new Error('Unauthorized: Super admin access required')
  }

  return adminUser
}
