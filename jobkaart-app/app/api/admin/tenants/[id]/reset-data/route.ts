import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/supabase-server'
import { cookies } from 'next/headers'

/**
 * POST /api/admin/tenants/[id]/reset-data
 * Reset all data for a tenant (SUPER ADMIN ONLY)
 *
 * Deletes in order:
 * 1. All payments
 * 2. All invoices
 * 3. All job photos
 * 4. All jobs
 * 5. All quotes
 * 6. All customers (if includeCustomers=true)
 *
 * Body: { includeCustomers: boolean }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params
    const cookieStore = await cookies()
    const supabase = await createServerClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is super admin
    const { data: profile } = await supabase
      .from('users')
      .select('is_super_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_super_admin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super admin access required' },
        { status: 403 }
      )
    }

    // Verify tenant exists
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, business_name')
      .eq('id', tenantId)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { includeCustomers = false } = body

    let deletedCounts = {
      payments: 0,
      invoices: 0,
      jobPhotos: 0,
      jobs: 0,
      quotes: 0,
      customers: 0,
    }

    // STEP 1: Delete all payments
    const { data: payments } = await supabase
      .from('payments')
      .delete()
      .eq('tenant_id', tenantId)
      .select('id')

    deletedCounts.payments = payments?.length || 0

    // STEP 2: Delete all invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .delete()
      .eq('tenant_id', tenantId)
      .select('id')

    deletedCounts.invoices = invoices?.length || 0

    // STEP 3: Delete all job photos
    const { data: jobPhotos } = await supabase
      .from('job_photos')
      .delete()
      .eq('tenant_id', tenantId)
      .select('id')

    deletedCounts.jobPhotos = jobPhotos?.length || 0

    // STEP 4: Delete all jobs
    const { data: jobs } = await supabase
      .from('jobs')
      .delete()
      .eq('tenant_id', tenantId)
      .select('id')

    deletedCounts.jobs = jobs?.length || 0

    // STEP 5: Delete all quotes
    const { data: quotes } = await supabase
      .from('quotes')
      .delete()
      .eq('tenant_id', tenantId)
      .select('id')

    deletedCounts.quotes = quotes?.length || 0

    // STEP 6: Delete all customers (if requested)
    if (includeCustomers) {
      const { data: customers } = await supabase
        .from('customers')
        .delete()
        .eq('tenant_id', tenantId)
        .select('id')

      deletedCounts.customers = customers?.length || 0
    }

    console.log(`[ADMIN] Reset tenant data for ${tenant.business_name}:`, deletedCounts)

    return NextResponse.json({
      success: true,
      message: 'Tenant data reset successfully',
      deleted: deletedCounts,
    })
  } catch (error) {
    console.error('Error resetting tenant data:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
