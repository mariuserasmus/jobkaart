import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getTenantId } from '@/lib/db/supabase-server'
import type { Customer, CustomerHistory } from '@/types'

/**
 * GET /api/customers/[id]
 * Get customer details with history
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tenantId = await getTenantId()

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createServerClient()

    // Get customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (customerError || !customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Get quotes
    const { data: quotes } = await supabase
      .from('quotes')
      .select('*')
      .eq('customer_id', id)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    // Get jobs
    const { data: jobs } = await supabase
      .from('jobs')
      .select('*')
      .eq('customer_id', id)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    // Get invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*')
      .eq('customer_id', id)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    // Calculate totals
    const total_paid = invoices?.reduce((sum, inv) => sum + Number(inv.amount_paid), 0) || 0
    const total_outstanding = invoices?.reduce((sum, inv) => {
      const outstanding = Number(inv.total) - Number(inv.amount_paid)
      return sum + (outstanding > 0 ? outstanding : 0)
    }, 0) || 0

    const history: CustomerHistory = {
      quotes: quotes || [],
      jobs: jobs || [],
      invoices: invoices || [],
      total_paid,
      total_outstanding,
    }

    return NextResponse.json({
      success: true,
      data: {
        customer: customer as Customer,
        history,
      },
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/customers/[id]
 * Update customer details
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tenantId = await getTenantId()

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, phone, email, address, notes } = body

    // Validation
    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: 'Name and phone are required' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Check for duplicate phone number (excluding current customer)
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('phone', phone)
      .neq('id', id)
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Another customer with this phone number already exists' },
        { status: 409 }
      )
    }

    // Update customer
    const { data, error } = await supabase
      .from('customers')
      .update({
        name,
        phone,
        email: email || null,
        address: address || null,
        notes: notes || null,
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('Error updating customer:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update customer' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data as Customer,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/customers/[id]
 * Delete a customer
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tenantId = await getTenantId()

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createServerClient()

    // Check if customer has any quotes, jobs, or invoices
    const { data: quotes } = await supabase
      .from('quotes')
      .select('id')
      .eq('customer_id', id)
      .eq('tenant_id', tenantId)
      .limit(1)

    const { data: jobs } = await supabase
      .from('jobs')
      .select('id')
      .eq('customer_id', id)
      .eq('tenant_id', tenantId)
      .limit(1)

    const { data: invoices } = await supabase
      .from('invoices')
      .select('id')
      .eq('customer_id', id)
      .eq('tenant_id', tenantId)
      .limit(1)

    if ((quotes && quotes.length > 0) || (jobs && jobs.length > 0) || (invoices && invoices.length > 0)) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete customer with existing quotes, jobs, or invoices' },
        { status: 409 }
      )
    }

    // Delete customer
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('Error deleting customer:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete customer' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Customer deleted successfully' },
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
