import { NextResponse } from 'next/server'
import { createServerClient, getTenantId } from '@/lib/db/supabase-server'

/**
 * GET /api/tenants
 * Get current tenant information
 */
export async function GET() {
  try {
    const tenantId = await getTenantId()
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createServerClient()

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single()

    if (error) {
      console.error('Error fetching tenant:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch tenant information' },
        { status: 500 }
      )
    }

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: tenant,
    })
  } catch (error) {
    console.error('Error in GET /api/tenants:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
