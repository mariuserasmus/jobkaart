// Shared types for subscription management API routes

export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'team'
export type SubscriptionStatus = 'active' | 'cancelled' | 'overdue' | 'free'

export interface TenantSubscriptionDetails {
  id: string
  business_name: string
  email: string | null
  phone: string | null
  subscription_tier: SubscriptionTier
  subscription_status: SubscriptionStatus
  trial_ends_at: string | null
  subscription_started_at: string | null
  subscription_ends_at: string | null
  created_at: string
  user_count: number
  active_user_count: number
  total_quotes: number
  total_jobs: number
  total_invoices: number
  last_activity_at: string | null
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T = any> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
