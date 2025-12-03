# Frontend Integration Examples

This document provides examples of how to integrate the Subscription Management API routes into a frontend application.

## TypeScript Client Module

Create a client module for type-safe API calls:

```typescript
// lib/admin/subscription-api.ts

import { TenantSubscriptionDetails, PaginatedResponse, ApiResponse, SubscriptionTier } from '@/app/api/admin/subscriptions/types'

export class SubscriptionAPI {
  private baseUrl = '/api/admin/subscriptions'

  /**
   * List all tenants with subscription details
   */
  async list(params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    tier?: string
  }): Promise<PaginatedResponse<TenantSubscriptionDetails>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.status) searchParams.append('status', params.status)
    if (params?.tier) searchParams.append('tier', params.tier)

    const response = await fetch(`${this.baseUrl}/list?${searchParams}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch subscriptions: ${response.statusText}`)
    }
    return response.json()
  }

  /**
   * Reset a tenant to 14-day trial
   */
  async resetTrial(tenantId: string): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/reset-trial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId }),
    })
    if (!response.ok) {
      throw new Error(`Failed to reset trial: ${response.statusText}`)
    }
    return response.json()
  }

  /**
   * Change subscription plan
   */
  async changePlan(tenantId: string, newTier: SubscriptionTier): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/change-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId, newTier }),
    })
    if (!response.ok) {
      throw new Error(`Failed to change plan: ${response.statusText}`)
    }
    return response.json()
  }

  /**
   * Activate subscription
   */
  async activate(tenantId: string): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId }),
    })
    if (!response.ok) {
      throw new Error(`Failed to activate subscription: ${response.statusText}`)
    }
    return response.json()
  }

  /**
   * Cancel subscription
   */
  async cancel(tenantId: string, reason?: string): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId, reason }),
    })
    if (!response.ok) {
      throw new Error(`Failed to cancel subscription: ${response.statusText}`)
    }
    return response.json()
  }

  /**
   * Extend trial period
   */
  async extendTrial(tenantId: string, days: number): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/extend-trial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId, days }),
    })
    if (!response.ok) {
      throw new Error(`Failed to extend trial: ${response.statusText}`)
    }
    return response.json()
  }
}

// Export singleton instance
export const subscriptionAPI = new SubscriptionAPI()
```

---

## React Component Example

Example React component for subscription management table:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { subscriptionAPI } from '@/lib/admin/subscription-api'
import { TenantSubscriptionDetails } from '@/app/api/admin/subscriptions/types'

export function SubscriptionManagementTable() {
  const [tenants, setTenants] = useState<TenantSubscriptionDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Load tenants
  useEffect(() => {
    loadTenants()
  }, [page, search, statusFilter])

  const loadTenants = async () => {
    setLoading(true)
    try {
      const response = await subscriptionAPI.list({
        page,
        limit: 20,
        search,
        status: statusFilter || undefined,
      })
      setTenants(response.data)
      setTotalPages(response.pagination.totalPages)
    } catch (error) {
      console.error('Failed to load tenants:', error)
      alert('Failed to load tenants')
    } finally {
      setLoading(false)
    }
  }

  const handleResetTrial = async (tenantId: string, businessName: string) => {
    if (!confirm(`Reset trial for ${businessName}?`)) return

    try {
      await subscriptionAPI.resetTrial(tenantId)
      alert('Trial reset successfully')
      loadTenants() // Reload data
    } catch (error) {
      console.error('Failed to reset trial:', error)
      alert('Failed to reset trial')
    }
  }

  const handleActivate = async (tenantId: string, businessName: string) => {
    if (!confirm(`Activate subscription for ${businessName}?`)) return

    try {
      await subscriptionAPI.activate(tenantId)
      alert('Subscription activated successfully')
      loadTenants()
    } catch (error) {
      console.error('Failed to activate:', error)
      alert('Failed to activate subscription')
    }
  }

  const handleCancel = async (tenantId: string, businessName: string) => {
    const reason = prompt(`Cancel subscription for ${businessName}. Reason:`)
    if (!reason) return

    try {
      await subscriptionAPI.cancel(tenantId, reason)
      alert('Subscription cancelled successfully')
      loadTenants()
    } catch (error) {
      console.error('Failed to cancel:', error)
      alert('Failed to cancel subscription')
    }
  }

  const handleExtendTrial = async (tenantId: string, businessName: string) => {
    const daysStr = prompt(`Extend trial for ${businessName} by how many days?`, '7')
    if (!daysStr) return
    const days = parseInt(daysStr, 10)
    if (isNaN(days) || days < 1 || days > 365) {
      alert('Invalid number of days')
      return
    }

    try {
      await subscriptionAPI.extendTrial(tenantId, days)
      alert(`Trial extended by ${days} days`)
      loadTenants()
    } catch (error) {
      console.error('Failed to extend trial:', error)
      alert('Failed to extend trial')
    }
  }

  const handleChangePlan = async (tenantId: string, businessName: string, currentTier: string) => {
    const newTier = prompt(
      `Change plan for ${businessName}. Current: ${currentTier}. Enter new tier (starter/pro/team):`,
      currentTier
    )
    if (!newTier || !['starter', 'pro', 'team'].includes(newTier)) {
      alert('Invalid tier')
      return
    }

    try {
      await subscriptionAPI.changePlan(tenantId, newTier as any)
      alert(`Plan changed to ${newTier}`)
      loadTenants()
    } catch (error) {
      console.error('Failed to change plan:', error)
      alert('Failed to change plan')
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      trial: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      overdue: 'bg-orange-100 text-orange-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getTierBadge = (tier: string) => {
    const colors = {
      starter: 'bg-blue-100 text-blue-800',
      pro: 'bg-purple-100 text-purple-800',
      team: 'bg-indigo-100 text-indigo-800',
    }
    return colors[tier as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border rounded"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded"
        >
          <option value="">All Statuses</option>
          <option value="trial">Trial</option>
          <option value="active">Active</option>
          <option value="cancelled">Cancelled</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Business</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Tier</th>
              <th className="p-2 text-left">Trial Ends</th>
              <th className="p-2 text-right">Users</th>
              <th className="p-2 text-right">Jobs</th>
              <th className="p-2 text-left">Last Activity</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="border-b">
                <td className="p-2">
                  <div className="font-medium">{tenant.business_name}</div>
                  <div className="text-sm text-gray-500">{tenant.email}</div>
                </td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(tenant.subscription_status)}`}>
                    {tenant.subscription_status}
                  </span>
                </td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-xs ${getTierBadge(tenant.subscription_tier)}`}>
                    {tenant.subscription_tier}
                  </span>
                </td>
                <td className="p-2 text-sm">
                  {tenant.trial_ends_at
                    ? new Date(tenant.trial_ends_at).toLocaleDateString()
                    : '-'}
                </td>
                <td className="p-2 text-right">
                  {tenant.active_user_count}/{tenant.user_count}
                </td>
                <td className="p-2 text-right">{tenant.total_jobs}</td>
                <td className="p-2 text-sm">
                  {tenant.last_activity_at
                    ? new Date(tenant.last_activity_at).toLocaleDateString()
                    : 'Never'}
                </td>
                <td className="p-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleActivate(tenant.id, tenant.business_name)}
                      className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                      title="Activate"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => handleResetTrial(tenant.id, tenant.business_name)}
                      className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                      title="Reset Trial"
                    >
                      ↻
                    </button>
                    <button
                      onClick={() => handleExtendTrial(tenant.id, tenant.business_name)}
                      className="px-2 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
                      title="Extend Trial"
                    >
                      +
                    </button>
                    <button
                      onClick={() => handleChangePlan(tenant.id, tenant.business_name, tenant.subscription_tier)}
                      className="px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
                      title="Change Plan"
                    >
                      ⇄
                    </button>
                    <button
                      onClick={() => handleCancel(tenant.id, tenant.business_name)}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}
```

---

## Server Action Example (Next.js 14)

If you prefer Server Actions instead of API routes:

```typescript
// app/admin/subscriptions/actions.ts
'use server'

import { requireSuperAdmin } from '@/lib/admin/auth'
import { subscriptionAPI } from '@/lib/admin/subscription-api'
import { revalidatePath } from 'next/cache'

export async function resetTrialAction(tenantId: string) {
  await requireSuperAdmin()
  const result = await subscriptionAPI.resetTrial(tenantId)
  revalidatePath('/admin/subscriptions')
  return result
}

export async function activateAction(tenantId: string) {
  await requireSuperAdmin()
  const result = await subscriptionAPI.activate(tenantId)
  revalidatePath('/admin/subscriptions')
  return result
}

export async function cancelAction(tenantId: string, reason?: string) {
  await requireSuperAdmin()
  const result = await subscriptionAPI.cancel(tenantId, reason)
  revalidatePath('/admin/subscriptions')
  return result
}

// ... etc
```

---

## React Query Integration

For better caching and state management:

```typescript
// hooks/use-subscriptions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { subscriptionAPI } from '@/lib/admin/subscription-api'

export function useSubscriptions(params?: {
  page?: number
  limit?: number
  search?: string
  status?: string
}) {
  return useQuery({
    queryKey: ['subscriptions', params],
    queryFn: () => subscriptionAPI.list(params),
  })
}

export function useResetTrial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tenantId: string) => subscriptionAPI.resetTrial(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
    },
  })
}

export function useActivateSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tenantId: string) => subscriptionAPI.activate(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
    },
  })
}

// Usage in component:
function SubscriptionTable() {
  const { data, isLoading } = useSubscriptions({ page: 1, limit: 20 })
  const resetTrial = useResetTrial()

  const handleResetTrial = (tenantId: string) => {
    resetTrial.mutate(tenantId, {
      onSuccess: () => alert('Trial reset successfully'),
      onError: (error) => alert(`Error: ${error.message}`),
    })
  }

  // ...
}
```

---

## Error Handling Example

Robust error handling with toast notifications:

```typescript
import { toast } from 'sonner' // or your preferred toast library

async function handleAction(
  action: () => Promise<any>,
  successMessage: string,
  errorMessage: string
) {
  try {
    const result = await action()
    if (result.success) {
      toast.success(successMessage)
      return result
    } else {
      toast.error(result.error || errorMessage)
      return null
    }
  } catch (error) {
    console.error(error)
    toast.error(errorMessage)
    return null
  }
}

// Usage:
const handleResetTrial = async (tenantId: string) => {
  await handleAction(
    () => subscriptionAPI.resetTrial(tenantId),
    'Trial reset successfully',
    'Failed to reset trial'
  )
  loadTenants()
}
```

---

## Testing Examples

```typescript
// __tests__/subscription-api.test.ts
import { subscriptionAPI } from '@/lib/admin/subscription-api'

describe('SubscriptionAPI', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  it('should list subscriptions', async () => {
    const mockResponse = {
      success: true,
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    }

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await subscriptionAPI.list({ page: 1, limit: 10 })

    expect(result).toEqual(mockResponse)
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/subscriptions/list?page=1&limit=10'
    )
  })

  it('should reset trial', async () => {
    const mockResponse = { success: true, data: { tenantId: '123' } }

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await subscriptionAPI.resetTrial('123')

    expect(result).toEqual(mockResponse)
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/subscriptions/reset-trial',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ tenantId: '123' }),
      })
    )
  })
})
```

---

## Summary

These examples demonstrate:
1. **Type-safe client module** for API calls
2. **React component** with full subscription management UI
3. **Server Actions** as an alternative to direct API calls
4. **React Query integration** for better state management
5. **Error handling** with toast notifications
6. **Testing examples** for the client module

Choose the approach that best fits your application architecture and existing patterns.
