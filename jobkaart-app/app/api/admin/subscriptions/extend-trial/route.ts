import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin, logAdminAction } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/db/supabase-server'
import { ApiResponse } from '../types'

interface ExtendTrialRequest {
  tenantId: string
  days: number
}

export async function POST(request: NextRequest) {
  try {
    // Require super admin access
    await requireSuperAdmin()

    const body: ExtendTrialRequest = await request.json()
    const { tenantId, days } = body

    if (!tenantId || !days) {
      return NextResponse.json(
        { success: false, error: 'tenantId and days are required' },
        { status: 400 }
      )
    }

    if (days <= 0 || days > 365) {
      return NextResponse.json(
        { success: false, error: 'days must be between 1 and 365' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Get current tenant details
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select(
        'id, business_name, subscription_status, subscription_tier, trial_ends_at, current_subscription_id'
      )
      .eq('id', tenantId)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    const previousTrialEndsAt = tenant.trial_ends_at

    // Calculate new trial end date
    let newTrialEndsAt: Date
    if (tenant.trial_ends_at) {
      // Extend from current trial end date
      newTrialEndsAt = new Date(tenant.trial_ends_at)
      newTrialEndsAt.setDate(newTrialEndsAt.getDate() + days)
    } else {
      // No trial end date set, start from now
      newTrialEndsAt = new Date()
      newTrialEndsAt.setDate(newTrialEndsAt.getDate() + days)
    }

    const now = new Date().toISOString()

    // Update tenant trial end date
    const { error: updateError } = await supabase
      .from('tenants')
      .update({
        trial_ends_at: newTrialEndsAt.toISOString(),
        subscription_status: 'trial', // Ensure status is trial
        updated_at: now,
      })
      .eq('id', tenantId)

    if (updateError) {
      console.error('Error extending trial:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to extend trial' },
        { status: 500 }
      )
    }

    // Update current subscription if exists
    if (tenant.current_subscription_id) {
      await supabase
        .from('subscriptions')
        .update({
          trial_ends_at: newTrialEndsAt.toISOString(),
          status: 'trial',
          updated_at: now,
        })
        .eq('id', tenant.current_subscription_id)
    }

    // Create subscription event
    await supabase.from('subscription_events').insert({
      tenant_id: tenantId,
      subscription_id: tenant.current_subscription_id,
      event_type: 'trial_extended',
      event_data: {
        previous_trial_ends_at: previousTrialEndsAt,
        new_trial_ends_at: newTrialEndsAt.toISOString(),
        days_extended: days,
        extended_by: 'admin',
      },
    })

    // Log admin action
    await logAdminAction({
      action: 'extend_trial',
      targetType: 'tenant',
      targetId: tenantId,
      metadata: {
        business_name: tenant.business_name,
        previous_trial_ends_at: previousTrialEndsAt,
        new_trial_ends_at: newTrialEndsAt.toISOString(),
        days_extended: days,
      },
    })

    const response: ApiResponse = {
      success: true,
      data: {
        tenantId,
        previousTrialEndsAt,
        newTrialEndsAt: newTrialEndsAt.toISOString(),
        daysExtended: days,
        message: `Trial extended by ${days} days`,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in extend trial:', error)
    return NextResponse.json(
      { success: false, error: 'Unauthorized or internal error' },
      { status: 403 }
    )
  }
}
