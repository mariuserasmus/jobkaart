import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin, logAdminAction } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/db/supabase-server'
import { ApiResponse } from '../types'

interface ActivateRequest {
  tenantId: string
}

export async function POST(request: NextRequest) {
  try {
    // Require super admin access
    await requireSuperAdmin()

    const body: ActivateRequest = await request.json()
    const { tenantId } = body

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

    // Update tenant to active status
    const { error: updateError } = await supabase
      .from('tenants')
      .update({
        subscription_status: 'active',
        subscription_started_at: now,
        trial_ends_at: null, // Clear trial date
        updated_at: now,
      })
      .eq('id', tenantId)

    if (updateError) {
      console.error('Error activating subscription:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to activate subscription' },
        { status: 500 }
      )
    }

    // Update current subscription if exists
    if (tenant.current_subscription_id) {
      // Calculate next billing date (1 month from now)
      const nextBillingDate = new Date()
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)

      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          trial_ends_at: null,
          next_billing_date: nextBillingDate.toISOString(),
          updated_at: now,
        })
        .eq('id', tenant.current_subscription_id)
    } else {
      // Create a new subscription record
      const planAmounts: Record<string, number> = {
        starter: 299,
        pro: 499,
        team: 799,
      }

      const nextBillingDate = new Date()
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)

      const { data: newSubscription, error: createError } = await supabase
        .from('subscriptions')
        .insert({
          tenant_id: tenantId,
          plan_type: tenant.subscription_tier,
          status: 'active',
          start_date: now,
          next_billing_date: nextBillingDate.toISOString(),
          amount: planAmounts[tenant.subscription_tier] || 299,
          currency: 'ZAR',
        })
        .select()
        .single()

      if (!createError && newSubscription) {
        // Update tenant with new subscription ID
        await supabase
          .from('tenants')
          .update({ current_subscription_id: newSubscription.id })
          .eq('id', tenantId)
      }
    }

    // Create subscription event
    await supabase.from('subscription_events').insert({
      tenant_id: tenantId,
      subscription_id: tenant.current_subscription_id,
      event_type: 'activated',
      event_data: {
        previous_status: previousStatus,
        activated_by: 'admin',
        activation_method: 'manual',
      },
    })

    // Log admin action
    await logAdminAction({
      action: 'activate_subscription',
      targetType: 'tenant',
      targetId: tenantId,
      metadata: {
        business_name: tenant.business_name,
        previous_status: previousStatus,
        subscription_tier: tenant.subscription_tier,
      },
    })

    const response: ApiResponse = {
      success: true,
      data: {
        tenantId,
        previousStatus,
        newStatus: 'active',
        message: 'Subscription activated successfully',
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in activate subscription:', error)
    return NextResponse.json(
      { success: false, error: 'Unauthorized or internal error' },
      { status: 403 }
    )
  }
}
