import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getTenantId } from '@/lib/db/supabase-server'
import { generateInvoiceNumber } from '@/lib/invoices/generate-invoice-number'
import { checkUsageLimit, incrementUsage } from '@/lib/usage/limits'

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
        jobs(id, job_number, title)
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

    // Check FREE tier usage limits
    const usageCheck = await checkUsageLimit(tenantId, 'invoice')
    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: usageCheck.message || `Monthly invoice limit reached (${usageCheck.limit}). Upgrade to create unlimited invoices.`,
          usage: {
            used: usageCheck.used,
            limit: usageCheck.limit,
          },
        },
        { status: 403 }
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

    // Generate unique invoice number
    const invoiceNumber = await generateInvoiceNumber(supabase, tenantId)

    // Check if this job already has deposit/progress invoices
    let invoice_type: 'full' | 'balance' = 'full'
    let adjusted_total = total
    let adjusted_subtotal = subtotal
    let adjusted_vat = vat_amount || 0
    let adjusted_line_items = line_items
    let parent_invoice_id: string | null = null

    if (job_id) {
      // Get the job with quote total
      const { data: jobData } = await supabase
        .from('jobs')
        .select('quotes(total)')
        .eq('id', job_id)
        .eq('tenant_id', tenantId)
        .single()

      const quoteTotal = (jobData?.quotes as any)?.total || total

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
        const balanceAmount = quoteTotal - totalAlreadyInvoiced

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

        // Use the submitted values (already calculated by form as balance)
        // The form has already done the calculation and sent us the correct balance amount
        adjusted_total = total
        adjusted_subtotal = subtotal
        adjusted_vat = vat_amount || 0
        adjusted_line_items = line_items
      }
    }

    // Generate public link
    const publicLink = Math.random().toString(36).substring(2, 15)

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        tenant_id: tenantId,
        customer_id,
        job_id: job_id || null,
        invoice_number: invoiceNumber,
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
        public_link: publicLink,
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

    // Increment usage counter for FREE tier tracking
    await incrementUsage(tenantId, 'invoice')

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
