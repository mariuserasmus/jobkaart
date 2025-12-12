export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'team'
export type SubscriptionStatus = 'active' | 'free' | 'cancelled' | 'overdue'

export interface TenantSubscription {
  tenant_id: string
  business_name: string
  subscription_tier: SubscriptionTier
  subscription_status: SubscriptionStatus
  trial_ends_at: string | null
  next_billing_date: string | null
  created_at: string
  last_activity_at: string | null
}

export interface SubscriptionStats {
  total_tenants: number
  active_subscriptions: number
  free_accounts: number
  estimated_mrr: number
}

export interface ChangePlanData {
  tenant_id: string
  new_tier: SubscriptionTier
}

export interface CancelSubscriptionData {
  tenant_id: string
  reason: string
}

export interface ExtendTrialData {
  tenant_id: string
  days: number
}
