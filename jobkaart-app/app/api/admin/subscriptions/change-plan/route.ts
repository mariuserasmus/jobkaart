import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin, logAdminAction } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/db/supabase-server'
import { ApiResponse, SubscriptionTier } from '../types'

interface ChangePlanRequest {
  tenantId: string
  newTier: SubscriptionTier
}

export async function POST(request: NextRequest) {
  try {
    // Require super admin access
    await requireSuperAdmin()

    const body: ChangePlanRequest = await request.json()
    const { tenantId, newTier } = body

    if (!tenantId || !newTier) {
      return NextResponse.json(
        { success: false, error: 'tenantId and newTier are required' },
        { status: 400 }
      )
    }

    // Validate tier
    const validTiers: SubscriptionTier[] = ['free', 'starter', 'pro', 'team']
    if (!validTiers.includes(newTier)) {
      return NextResponse.json(
        { success: false, error: 'Invalid tier. Must be free, starter, pro, or team' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Get current tenant details
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, business_name, subscription_tier, subscription_status, current_subscription_id')
      .eq('id', tenantId)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    const oldTier = tenant.subscription_tier

    // Determine new subscription status
    const newStatus = newTier === 'free' ? 'free' : 'active'

    // Update tenant subscription tier and status
    const { error: updateError } = await supabase
      .from('tenants')
      .update({
        subscription_tier: newTier,
        subscription_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId)

    if (updateError) {
      console.error('Error changing plan:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to change subscription plan' },
        { status: 500 }
      )
    }

    // Update current subscription if exists
    if (tenant.current_subscription_id) {
      // Get plan amounts
      const planAmounts: Record<SubscriptionTier, number> = {
        free: 0,
        starter: 299,
        pro: 499,
        team: 799,
      }

      await supabase
        .from('subscriptions')
        .update({
          plan_type: newTier,
          amount: planAmounts[newTier],
          updated_at: new Date().toISOString(),
        })
        .eq('id', tenant.current_subscription_id)
    }

    // Create subscription event
    await supabase.from('subscription_events').insert({
      tenant_id: tenantId,
      subscription_id: tenant.current_subscription_id,
      event_type: 'plan_changed',
      event_data: {
        old_tier: oldTier,
        new_tier: newTier,
        changed_by: 'admin',
      },
    })

    // Log admin action
    await logAdminAction({
      action: 'change_plan',
      targetType: 'tenant',
      targetId: tenantId,
      metadata: {
        business_name: tenant.business_name,
        old_tier: oldTier,
        new_tier: newTier,
      },
    })

    const response: ApiResponse = {
      success: true,
      data: {
        tenantId,
        oldTier,
        newTier,
        message: `Plan changed from ${oldTier} to ${newTier}`,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in change plan:', error)
    return NextResponse.json(
      { success: false, error: 'Unauthorized or internal error' },
      { status: 403 }
    )
  }
}
