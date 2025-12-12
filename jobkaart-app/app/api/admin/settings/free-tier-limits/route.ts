import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin, logAdminAction } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/db/supabase-server'

const SYSTEM_SETTINGS_ID = '00000000-0000-0000-0000-000000000001'

interface FreeTierLimitsUpdate {
  free_quotes_per_month: number
  free_jobs_per_month: number
  free_invoices_per_month: number
}

/**
 * GET /api/admin/settings/free-tier-limits
 * Fetch current FREE tier limits
 */
export async function GET() {
  try {
    // Require super admin access
    const adminUser = await requireSuperAdmin()

    const supabase = await createServerClient()

    // Get current system settings
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', SYSTEM_SETTINGS_ID)
      .single()

    if (error) {
      console.error('Error fetching system settings:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch system settings' },
        { status: 500 }
      )
    }

    if (!settings) {
      return NextResponse.json(
        { success: false, error: 'System settings not found' },
        { status: 404 }
      )
    }

    // Log admin action
    await logAdminAction({
      action: 'view_system_settings',
    })

    return NextResponse.json({
      success: true,
      data: {
        free_quotes_per_month: settings.free_quotes_per_month,
        free_jobs_per_month: settings.free_jobs_per_month,
        free_invoices_per_month: settings.free_invoices_per_month,
        updated_at: settings.updated_at,
        updated_by: settings.updated_by,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/admin/settings/free-tier-limits:', error)
    return NextResponse.json(
      { success: false, error: 'Unauthorized or internal error' },
      { status: 403 }
    )
  }
}

/**
 * PUT /api/admin/settings/free-tier-limits
 * Update FREE tier limits
 */
export async function PUT(request: NextRequest) {
  try {
    // Require super admin access
    const adminUser = await requireSuperAdmin()

    const body: FreeTierLimitsUpdate = await request.json()
    const { free_quotes_per_month, free_jobs_per_month, free_invoices_per_month } = body

    // Validate required fields
    if (
      free_quotes_per_month === undefined ||
      free_jobs_per_month === undefined ||
      free_invoices_per_month === undefined
    ) {
      return NextResponse.json(
        { success: false, error: 'All limit fields are required' },
        { status: 400 }
      )
    }

    // Validate data types and ranges
    const limits = [
      { name: 'free_quotes_per_month', value: free_quotes_per_month },
      { name: 'free_jobs_per_month', value: free_jobs_per_month },
      { name: 'free_invoices_per_month', value: free_invoices_per_month },
    ]

    for (const limit of limits) {
      if (!Number.isInteger(limit.value)) {
        return NextResponse.json(
          { success: false, error: `${limit.name} must be an integer` },
          { status: 400 }
        )
      }

      if (limit.value < 0) {
        return NextResponse.json(
          { success: false, error: `${limit.name} must be non-negative` },
          { status: 400 }
        )
      }

      if (limit.value > 1000) {
        return NextResponse.json(
          { success: false, error: `${limit.name} must be 1000 or less` },
          { status: 400 }
        )
      }
    }

    const supabase = await createServerClient()

    // Get current settings for logging
    const { data: currentSettings } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', SYSTEM_SETTINGS_ID)
      .single()

    // Update system settings
    const { data: updatedSettings, error: updateError } = await supabase
      .from('system_settings')
      .update({
        free_quotes_per_month,
        free_jobs_per_month,
        free_invoices_per_month,
        updated_at: new Date().toISOString(),
        updated_by: adminUser.id,
      })
      .eq('id', SYSTEM_SETTINGS_ID)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating system settings:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update system settings' },
        { status: 500 }
      )
    }

    // Log admin action with old and new values
    await logAdminAction({
      action: 'update_free_tier_limits',
      metadata: {
        old_limits: {
          quotes: currentSettings?.free_quotes_per_month,
          jobs: currentSettings?.free_jobs_per_month,
          invoices: currentSettings?.free_invoices_per_month,
        },
        new_limits: {
          quotes: free_quotes_per_month,
          jobs: free_jobs_per_month,
          invoices: free_invoices_per_month,
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        free_quotes_per_month: updatedSettings.free_quotes_per_month,
        free_jobs_per_month: updatedSettings.free_jobs_per_month,
        free_invoices_per_month: updatedSettings.free_invoices_per_month,
        updated_at: updatedSettings.updated_at,
        updated_by: updatedSettings.updated_by,
      },
    })
  } catch (error) {
    console.error('Error in PUT /api/admin/settings/free-tier-limits:', error)
    return NextResponse.json(
      { success: false, error: 'Unauthorized or internal error' },
      { status: 403 }
    )
  }
}
