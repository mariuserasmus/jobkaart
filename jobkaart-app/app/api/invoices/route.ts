import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getTenantId } from '@/lib/db/supabase-server'

/**
 * GET /api/invoices
 * List all invoices with search and filters
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId()

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = await createServerClient()

    // Build query
    let query = supabase
      .from('invoices')
      .select(
        `
        *,
        customers!inner(id, name, phone, email),
        jobs(id, job_number)
      `,
        { count: 'exact' }
      )
      .eq('tenant_id', tenantId)

    // Apply search filter (invoice number or customer name)
    if (search) {
      query = query.or(`invoice_number.ilike.%${search}%,customers.name.ilike.%${search}%`)
    }

    // Apply status filter
    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: invoices, error, count } = await query

    if (error) {
      console.error('Error fetching invoices:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch invoices' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: invoices,
      pagination: {
        total: count || 0,
        limit,
        offset,
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
 * POST /api/invoices
 * Create a new invoice
 */
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId()

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      customer_id,
      job_id,
      line_items,
      subtotal,
      vat_amount,
      total,
      due_date,
      notes,
    } = body

    // Validation
    if (!customer_id) {
      return NextResponse.json(
        { success: false, error: 'Customer is required' },
        { status: 400 }
      )
    }

    if (!line_items || line_items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one line item is required' },
        { status: 400 }
      )
    }

    if (!subtotal || !total) {
      return NextResponse.json(
        { success: false, error: 'Subtotal and total are required' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        tenant_id: tenantId,
        customer_id,
        job_id: job_id || null,
        line_items,
        subtotal,
        vat_amount: vat_amount || 0,
        total,
        amount_paid: 0,
        status: 'draft',
        due_date: due_date || null,
        notes: notes || null,
      })
      .select(
        `
        *,
        customers!inner(id, name, phone, email, address),
        jobs(id, job_number)
      `
      )
      .single()

    if (invoiceError || !invoice) {
      console.error('Error creating invoice:', invoiceError)
      return NextResponse.json(
        { success: false, error: 'Failed to create invoice' },
        { status: 500 }
      )
    }

    // If invoice was created from a job, update job status to 'invoiced'
    if (job_id) {
      await supabase
        .from('jobs')
        .update({ status: 'invoiced' })
        .eq('id', job_id)
        .eq('tenant_id', tenantId)
    }

    return NextResponse.json({
      success: true,
      data: invoice,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
