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
 * Automatically detects if deposit/progress invoices exist and creates balance invoice
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

    // Check if this job already has deposit/progress invoices
    let invoice_type: 'full' | 'balance' = 'full'
    let adjusted_total = total
    let adjusted_subtotal = subtotal
    let adjusted_vat = vat_amount || 0
    let adjusted_line_items = line_items
    let parent_invoice_id: string | null = null

    if (job_id) {
      const { data: existingInvoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, invoice_type, total, deposit_percentage')
        .eq('job_id', job_id)
        .in('invoice_type', ['deposit', 'progress'])
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: true })

      if (existingInvoices && existingInvoices.length > 0) {
        // Calculate total already invoiced
        const totalAlreadyInvoiced = existingInvoices.reduce((sum, inv) => sum + Number(inv.total), 0)
        const balanceAmount = total - totalAlreadyInvoiced

        if (balanceAmount <= 0) {
          return NextResponse.json(
            {
              success: false,
              error: 'Job already fully invoiced. Total invoiced: R' + totalAlreadyInvoiced.toFixed(2),
            },
            { status: 400 }
          )
        }

        // Create a balance invoice instead
        invoice_type = 'balance'
        parent_invoice_id = existingInvoices[0].id

        // Calculate proportional VAT for balance
        const invoicedPercentage = (totalAlreadyInvoiced / total) * 100
        const balancePercentage = 100 - invoicedPercentage
        const balanceVatAmount = ((vat_amount || 0) * balancePercentage) / 100
        const balanceSubtotal = balanceAmount - balanceVatAmount

        adjusted_total = balanceAmount
        adjusted_subtotal = balanceSubtotal
        adjusted_vat = balanceVatAmount

        // Show breakdown in line items
        adjusted_line_items = [
          {
            description: `Final payment for job`,
            quantity: 1,
            unit_price: total,
          },
          // Show all previous payments
          ...existingInvoices.map(inv => ({
            description: `Less: ${inv.invoice_type === 'deposit' ? 'Deposit' : 'Progress'} paid (${inv.invoice_number})${inv.deposit_percentage ? ` - ${inv.deposit_percentage}%` : ''}`,
            quantity: 1,
            unit_price: -Number(inv.total),
          })),
        ]
      }
    }

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        tenant_id: tenantId,
        customer_id,
        job_id: job_id || null,
        invoice_type,
        parent_invoice_id,
        line_items: adjusted_line_items,
        subtotal: adjusted_subtotal,
        vat_amount: adjusted_vat,
        total: adjusted_total,
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

    // Note: Job status update is handled by database trigger for balance/full invoices

    return NextResponse.json({
      success: true,
      data: invoice,
      message: invoice_type === 'balance'
        ? 'Balance invoice created (after deducting deposit/progress payments)'
        : undefined,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
