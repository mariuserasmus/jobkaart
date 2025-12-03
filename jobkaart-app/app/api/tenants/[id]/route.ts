import { NextResponse } from 'next/server'
import { createServerClient, getTenantId } from '@/lib/db/supabase-server'

/**
 * PATCH /api/tenants/[id]
 * Update tenant settings
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantId()
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const params = await context.params
    const requestedTenantId = params.id

    // Ensure user can only update their own tenant
    if (requestedTenantId !== tenantId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Allowed fields to update
    const allowedFields = [
      'business_name',
      'phone',
      'email',
      'address',
      'vat_number',
      'vat_registered',
      'banking_details',
      'logo_url',
    ]

    // Filter out any fields not in the allowed list
    const updates: Record<string, any> = {}
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    // Validate required fields if provided
    if ('business_name' in updates && !updates.business_name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Business name is required' },
        { status: 400 }
      )
    }

    // Validate banking details structure if provided
    if ('banking_details' in updates && updates.banking_details) {
      const banking = updates.banking_details
      if (
        typeof banking !== 'object' ||
        !banking.bank_name ||
        !banking.account_holder ||
        !banking.account_number ||
        !banking.branch_code
      ) {
        return NextResponse.json(
          {
            success: false,
            error: 'Banking details must include bank_name, account_holder, account_number, and branch_code',
          },
          { status: 400 }
        )
      }
    }

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString()

    const supabase = await createServerClient()

    const { data: tenant, error } = await supabase
      .from('tenants')
      .update(updates)
      .eq('id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('Error updating tenant:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update tenant information' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: tenant,
    })
  } catch (error) {
    console.error('Error in PATCH /api/tenants/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
