/**
 * Usage tracking and limit enforcement for FREE tier
 * Uses database RPC functions for efficient limit checking
 */

import { createServerClient } from '@/lib/db/supabase-server'
import type { UsageLimits } from '@/types'

export type UsageType = 'quote' | 'job' | 'invoice'

/**
 * Check if tenant can create more resources of a given type
 * Uses database RPC function for efficient checking
 *
 * @param tenantId - UUID of the tenant
 * @param type - Type of resource ('quote', 'job', or 'invoice')
 * @returns UsageLimits object with allowed, used, limit, and message
 */
export async function checkUsageLimit(
  tenantId: string,
  type: UsageType
): Promise<UsageLimits> {
  try {
    const supabase = await createServerClient()

    // Call the database RPC function to check limits
    const { data, error } = await supabase
      .rpc('check_usage_limit', {
        p_tenant_id: tenantId,
        p_usage_type: type,
      })
      .single()

    if (error) {
      console.error('Error checking usage limit:', error)
      // Fail open - allow creation if check fails
      return {
        allowed: true,
        used: 0,
        limit: 0,
        message: 'Unable to check usage limit',
      }
    }

    return {
      allowed: data.allowed,
      used: data.current_count,
      limit: data.limit,
      message: data.message,
    }
  } catch (error) {
    console.error('Unexpected error in checkUsageLimit:', error)
    // Fail open - allow creation if check fails
    return {
      allowed: true,
      used: 0,
      limit: 0,
      message: 'Unexpected error checking usage limit',
    }
  }
}

/**
 * Increment usage counter after successfully creating a resource
 * Uses database RPC function for atomic increment
 *
 * @param tenantId - UUID of the tenant
 * @param type - Type of resource ('quote', 'job', or 'invoice')
 */
export async function incrementUsage(
  tenantId: string,
  type: UsageType
): Promise<void> {
  try {
    const supabase = await createServerClient()

    // Call the database RPC function to increment usage
    const { error } = await supabase.rpc('increment_usage', {
      p_tenant_id: tenantId,
      p_usage_type: type,
    })

    if (error) {
      console.error('Error incrementing usage:', error)
      // Don't throw - we don't want to fail resource creation if tracking fails
    }
  } catch (error) {
    console.error('Unexpected error in incrementUsage:', error)
    // Don't throw - we don't want to fail resource creation if tracking fails
  }
}

/**
 * Get current month's usage for a tenant
 * Uses database RPC function
 *
 * @param tenantId - UUID of the tenant
 * @returns Object with quotes_created, jobs_created, invoices_created
 */
export async function getCurrentUsage(tenantId: string) {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .rpc('get_monthly_usage', {
        p_tenant_id: tenantId,
      })
      .single()

    if (error) {
      console.error('Error getting current usage:', error)
      return {
        month: new Date().toISOString().substring(0, 7),
        quotes_created: 0,
        jobs_created: 0,
        invoices_created: 0,
      }
    }

    return data
  } catch (error) {
    console.error('Unexpected error in getCurrentUsage:', error)
    return {
      month: new Date().toISOString().substring(0, 7),
      quotes_created: 0,
      jobs_created: 0,
      invoices_created: 0,
    }
  }
}
