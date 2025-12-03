import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin, logAdminAction } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/db/supabase-server'
import { TenantSubscriptionDetails, PaginatedResponse } from '../types'

export async function GET(request: NextRequest) {
  try {
    // Require super admin access
    await requireSuperAdmin()

    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const tier = searchParams.get('tier') || ''
    const offset = (page - 1) * limit

    // Log action
    await logAdminAction({
      action: 'list_subscriptions',
      metadata: { page, limit, search, status, tier },
    })

    // Build the base query
    let query = supabase
      .from('tenants')
      .select(
        `
        id,
        business_name,
        email,
        phone,
        subscription_tier,
        subscription_status,
        trial_ends_at,
        subscription_started_at,
        subscription_ends_at,
        created_at
      `,
        { count: 'exact' }
      )

    // Apply filters
    if (search) {
      query = query.or(
        `business_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      )
    }

    if (status) {
      query = query.eq('subscription_status', status)
    }

    if (tier) {
      query = query.eq('subscription_tier', tier)
    }

    // Order by created_at descending
    query = query.order('created_at', { ascending: false })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    // Execute query
    const { data: tenants, error, count } = await query

    if (error) {
      console.error('Error fetching tenants:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch tenant subscriptions' },
        { status: 500 }
      )
    }

    // Get additional stats for each tenant
    const tenantsWithStats = await Promise.all(
      (tenants || []).map(async (tenant) => {
        // Get user counts
        const { data: users } = await supabase
          .from('users')
          .select('id, is_active')
          .eq('tenant_id', tenant.id)

        const userCount = users?.length || 0
        const activeUserCount = users?.filter((u) => u.is_active).length || 0

        // Get quote count
        const { count: quoteCount } = await supabase
          .from('quotes')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)

        // Get job count
        const { count: jobCount } = await supabase
          .from('jobs')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)

        // Get invoice count
        const { count: invoiceCount } = await supabase
          .from('invoices')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)

        // Get last activity
        const { data: lastQuote } = await supabase
          .from('quotes')
          .select('created_at')
          .eq('tenant_id', tenant.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        const { data: lastJob } = await supabase
          .from('jobs')
          .select('created_at')
          .eq('tenant_id', tenant.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        const { data: lastInvoice } = await supabase
          .from('invoices')
          .select('created_at')
          .eq('tenant_id', tenant.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        const { data: lastUserLogin } = await supabase
          .from('users')
          .select('last_login_at')
          .eq('tenant_id', tenant.id)
          .order('last_login_at', { ascending: false })
          .limit(1)
          .single()

        // Find the most recent activity
        const activityDates = [
          lastQuote?.created_at,
          lastJob?.created_at,
          lastInvoice?.created_at,
          lastUserLogin?.last_login_at,
        ].filter(Boolean)

        const lastActivityAt =
          activityDates.length > 0
            ? activityDates.reduce((latest, current) =>
                new Date(current!) > new Date(latest!) ? current : latest
              )
            : null

        return {
          ...tenant,
          user_count: userCount,
          active_user_count: activeUserCount,
          total_quotes: quoteCount || 0,
          total_jobs: jobCount || 0,
          total_invoices: invoiceCount || 0,
          last_activity_at: lastActivityAt,
        } as TenantSubscriptionDetails
      })
    )

    const response: PaginatedResponse<TenantSubscriptionDetails> = {
      success: true,
      data: tenantsWithStats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in list subscriptions:', error)
    return NextResponse.json(
      { success: false, error: 'Unauthorized or internal error' },
      { status: 403 }
    )
  }
}
