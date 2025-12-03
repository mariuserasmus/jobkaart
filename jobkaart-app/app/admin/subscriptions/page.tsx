import { logAdminAction } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/db/supabase-server'
import { SubscriptionsClient } from './components/SubscriptionsClient'
import type { TenantSubscription, SubscriptionStats } from './types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getSubscriptionsData() {
  try {
    const supabase = await createServerClient()

    // Get all tenants
    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('id, business_name, subscription_tier, subscription_status, trial_ends_at, subscription_ends_at, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tenants:', error)
      throw error
    }

    // Calculate next billing dates for active subscriptions
    const tenantsWithBilling = (tenants || []).map((tenant) => {
      let next_billing_date = null

      // For active subscriptions, next billing is at the end of the month
      if (tenant.subscription_status === 'active') {
        const now = new Date()
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        next_billing_date = nextMonth.toISOString()
      }

      return {
        tenant_id: tenant.id,
        business_name: tenant.business_name,
        subscription_tier: tenant.subscription_tier,
        subscription_status: tenant.subscription_status,
        trial_ends_at: tenant.trial_ends_at,
        next_billing_date,
        created_at: tenant.created_at,
        last_activity_at: tenant.updated_at,
      }
    })

    // Calculate stats
    const stats: SubscriptionStats = {
      total_tenants: tenantsWithBilling.length,
      active_subscriptions: tenantsWithBilling.filter(t => t.subscription_status === 'active').length,
      trial_accounts: tenantsWithBilling.filter(t => t.subscription_status === 'trial').length,
      estimated_mrr: tenantsWithBilling
        .filter(t => t.subscription_status === 'active')
        .reduce((sum, t) => {
          const amounts = { starter: 299, pro: 499, team: 799 }
          return sum + (amounts[t.subscription_tier as keyof typeof amounts] || 0)
        }, 0),
    }

    return {
      tenants: tenantsWithBilling,
      stats,
    }
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    // Return empty data on error
    return {
      tenants: [],
      stats: {
        total_tenants: 0,
        active_subscriptions: 0,
        trial_accounts: 0,
        estimated_mrr: 0,
      },
    }
  }
}

export default async function SubscriptionsPage() {
  // Log admin action
  await logAdminAction({
    action: 'view_subscriptions',
  })

  // Fetch initial data
  const { tenants, stats } = await getSubscriptionsData()

  return (
    <SubscriptionsClient
      initialTenants={tenants as TenantSubscription[]}
      initialStats={stats as SubscriptionStats}
    />
  )
}
