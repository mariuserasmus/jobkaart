import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin, logAdminAction, getCurrentAdminUser } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/db/supabase-server'
import { ApiResponse } from '../types'

interface ResetTrialRequest {
  tenantId: string
}

export async function POST(request: NextRequest) {
  try {
    // Require super admin access
    await requireSuperAdmin()

    const body: ResetTrialRequest = await request.json()
    const { tenantId } = body

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Get current tenant details for logging
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, business_name, subscription_status, subscription_tier, subscription_ends_at')
      .eq('id', tenantId)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Calculate new trial end date (14 days from now)
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 14)

    const trialStartsAt = new Date()

    // Update tenant to trial status
    const { error: updateError } = await supabase
      .from('tenants')
      .update({
        subscription_status: 'trial',
        subscription_started_at: trialStartsAt.toISOString(),
        subscription_ends_at: trialEndsAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId)

    if (updateError) {
      console.error('Error resetting trial:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to reset trial' },
        { status: 500 }
      )
    }

    // Create subscription event
    await supabase.from('subscription_events').insert({
      tenant_id: tenantId,
      event_type: 'trial_reset',
      event_data: {
        previous_status: tenant.subscription_status,
        previous_subscription_ends_at: tenant.subscription_ends_at,
        new_subscription_ends_at: trialEndsAt.toISOString(),
        reset_by: 'admin',
      },
    })

    // Log admin action
    await logAdminAction({
      action: 'reset_trial',
      targetType: 'tenant',
      targetId: tenantId,
      metadata: {
        business_name: tenant.business_name,
        previous_status: tenant.subscription_status,
        previous_subscription_ends_at: tenant.subscription_ends_at,
        new_subscription_ends_at: trialEndsAt.toISOString(),
      },
    })

    const response: ApiResponse = {
      success: true,
      data: {
        tenantId,
        trialEndsAt: trialEndsAt.toISOString(),
        message: 'Trial reset successfully to 14 days',
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in reset trial:', error)
    return NextResponse.json(
      { success: false, error: 'Unauthorized or internal error' },
      { status: 403 }
    )
  }
}
