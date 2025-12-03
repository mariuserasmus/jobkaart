import { createServerClient } from '@/lib/db/supabase-server'

/**
 * Get system-wide statistics
 */
export async function getSystemStats() {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('admin_system_stats')
    .select('*')
    .single()

  if (error) {
    console.error('Error fetching system stats:', error)
    return null
  }

  return data
}

/**
 * Get all tenants with their stats
 */
export async function getAllTenants({
  search,
  status,
  tier,
  sortBy = 'created_at',
  sortOrder = 'desc',
  limit = 50,
  offset = 0,
}: {
  search?: string
  status?: string
  tier?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
} = {}) {
  const supabase = await createServerClient()

  let query = supabase
    .from('admin_tenant_stats')
    .select('*', { count: 'exact' })

  // Apply filters
  if (search) {
    query = query.ilike('business_name', `%${search}%`)
  }

  if (status) {
    query = query.eq('subscription_status', status)
  }

  if (tier) {
    query = query.eq('subscription_tier', tier)
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  // Apply pagination
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching tenants:', error)
    return { data: [], count: 0 }
  }

  return { data: data || [], count: count || 0 }
}

/**
 * Get single tenant details
 */
export async function getTenantDetails(tenantId: string) {
  const supabase = await createServerClient()

  // Get tenant info
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  if (tenantError || !tenant) {
    return null
  }

  // Get tenant stats
  const { data: stats } = await supabase
    .from('admin_tenant_stats')
    .select('*')
    .eq('tenant_id', tenantId)
    .single()

  // Get users
  const { data: users } = await supabase
    .from('users')
    .select('id, email, full_name, role, is_active, created_at, last_login_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  return {
    tenant,
    stats,
    users: users || [],
  }
}

/**
 * Get tenant's recent activity
 */
export async function getTenantActivity(tenantId: string, limit = 20) {
  const supabase = await createServerClient()

  // Get recent quotes
  const { data: quotes } = await supabase
    .from('quotes')
    .select('id, quote_number, status, created_at, customers!inner(name)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit)

  // Get recent jobs
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, job_number, status, created_at, customers!inner(name)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit)

  // Get recent invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, status, total, created_at, customers!inner(name)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return {
    quotes: quotes || [],
    jobs: jobs || [],
    invoices: invoices || [],
  }
}

/**
 * Get growth metrics over time
 */
export async function getGrowthMetrics(days = 30) {
  const supabase = await createServerClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // Get daily tenant signups
  const { data: tenantGrowth } = await supabase
    .from('tenants')
    .select('created_at')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true })

  // Get daily user signups
  const { data: userGrowth } = await supabase
    .from('users')
    .select('created_at')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true })

  return {
    tenantGrowth: tenantGrowth || [],
    userGrowth: userGrowth || [],
  }
}

/**
 * Get feature usage statistics
 */
export async function getFeatureUsage() {
  const supabase = await createServerClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Get quote statistics
  const { data: quoteStats } = await supabase
    .from('quotes')
    .select('status, total')
    .gte('created_at', thirtyDaysAgo.toISOString())

  // Get job statistics
  const { data: jobStats } = await supabase
    .from('jobs')
    .select('status')
    .gte('created_at', thirtyDaysAgo.toISOString())

  // Get invoice statistics
  const { data: invoiceStats } = await supabase
    .from('invoices')
    .select('status, total, amount_paid')
    .gte('created_at', thirtyDaysAgo.toISOString())

  // Calculate averages
  const avgQuoteValue =
    quoteStats && quoteStats.length > 0
      ? quoteStats.reduce((sum, q) => sum + (q.total || 0), 0) / quoteStats.length
      : 0

  const avgInvoiceValue =
    invoiceStats && invoiceStats.length > 0
      ? invoiceStats.reduce((sum, i) => sum + (i.total || 0), 0) / invoiceStats.length
      : 0

  // Calculate conversion rates
  const quotesAccepted = quoteStats?.filter((q) => q.status === 'accepted').length || 0
  const quotesTotal = quoteStats?.length || 0
  const quoteAcceptanceRate = quotesTotal > 0 ? (quotesAccepted / quotesTotal) * 100 : 0

  const invoicesPaid = invoiceStats?.filter((i) => i.status === 'paid').length || 0
  const invoicesTotal = invoiceStats?.length || 0
  const invoicePaymentRate = invoicesTotal > 0 ? (invoicesPaid / invoicesTotal) * 100 : 0

  return {
    quoteStats: quoteStats || [],
    jobStats: jobStats || [],
    invoiceStats: invoiceStats || [],
    avgQuoteValue,
    avgInvoiceValue,
    quoteAcceptanceRate,
    invoicePaymentRate,
  }
}

/**
 * Get admin audit logs
 */
export async function getAuditLogs(limit = 50, offset = 0) {
  const supabase = await createServerClient()

  const { data, error, count } = await supabase
    .from('admin_audit_logs')
    .select(
      `
      *,
      users!admin_audit_logs_admin_user_id_fkey(email, full_name)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching audit logs:', error)
    return { data: [], count: 0 }
  }

  return { data: data || [], count: count || 0 }
}

/**
 * Update tenant subscription status
 */
export async function updateTenantStatus(
  tenantId: string,
  status: 'active' | 'cancelled' | 'overdue' | 'trial'
) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('tenants')
    .update({ subscription_status: status })
    .eq('id', tenantId)
    .select()
    .single()

  if (error) {
    console.error('Error updating tenant status:', error)
    return null
  }

  return data
}

/**
 * Search across tenants
 */
export async function searchTenants(searchTerm: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('admin_tenant_stats')
    .select('*')
    .or(`business_name.ilike.%${searchTerm}%`)
    .limit(10)

  if (error) {
    console.error('Error searching tenants:', error)
    return []
  }

  return data || []
}
