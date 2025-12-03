import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin, logAdminAction } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/db/supabase-server'
import { ApiResponse } from '../types'

interface CancelRequest {
  tenantId: string
  reason?: string
}

export async function POST(request: NextRequest) {
  try {
    // Require super admin access
    await requireSuperAdmin()

    const body: CancelRequest = await request.json()
    const { tenantId, reason } = body

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Get current tenant details
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select(
        'id, business_name, subscription_status, subscription_tier, current_subscription_id'
      )
      .eq('id', tenantId)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    const previousStatus = tenant.subscription_status
    const now = new Date().toISOString()

    // Calculate end date (immediate cancellation)
    const endDate = now

    // Update tenant to cancelled status
    const { error: updateError } = await supabase
      .from('tenants')
      .update({
        subscription_status: 'cancelled',
        subscription_ends_at: endDate,
        updated_at: now,
      })
      .eq('id', tenantId)

    if (updateError) {
      console.error('Error cancelling subscription:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to cancel subscription' },
        { status: 500 }
      )
    }

    // Update current subscription if exists
    if (tenant.current_subscription_id) {
      await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: now,
          cancellation_reason: reason || 'Admin cancellation',
          end_date: endDate,
          updated_at: now,
        })
        .eq('id', tenant.current_subscription_id)
    }

    // Create subscription event
    await supabase.from('subscription_events').insert({
      tenant_id: tenantId,
      subscription_id: tenant.current_subscription_id,
      event_type: 'cancelled',
      event_data: {
        previous_status: previousStatus,
        cancellation_reason: reason || 'Admin cancellation',
        cancelled_by: 'admin',
        end_date: endDate,
      },
    })

    // Log admin action
    await logAdminAction({
      action: 'cancel_subscription',
      targetType: 'tenant',
      targetId: tenantId,
      metadata: {
        business_name: tenant.business_name,
        previous_status: previousStatus,
        cancellation_reason: reason || 'Admin cancellation',
        subscription_tier: tenant.subscription_tier,
      },
    })

    const response: ApiResponse = {
      success: true,
      data: {
        tenantId,
        previousStatus,
        newStatus: 'cancelled',
        reason: reason || 'Admin cancellation',
        endDate,
        message: 'Subscription cancelled successfully',
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in cancel subscription:', error)
    return NextResponse.json(
      { success: false, error: 'Unauthorized or internal error' },
      { status: 403 }
    )
  }
}
