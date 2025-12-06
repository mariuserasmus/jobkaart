import { NextResponse } from 'next/server'
import { createServerClient, getTenantId } from '@/lib/db/supabase-server'
import { generateInvoiceNumber } from '@/lib/invoices/generate-invoice-number'

/**
 * POST /api/invoices/deposit
 * Create a deposit invoice for a job
 */
export async function POST(request: Request) {
  try {
    const tenantId = await getTenantId()
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { job_id, deposit_percentage } = body

    // Validation
    if (!job_id || !deposit_percentage) {
      return NextResponse.json(
        { success: false, error: 'job_id and deposit_percentage are required' },
        { status: 400 }
      )
    }

    if (deposit_percentage < 1 || deposit_percentage > 100) {
      return NextResponse.json(
        { success: false, error: 'deposit_percentage must be between 1 and 100' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Get job details with quote
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        id,
        customer_id,
        quote_id,
        title,
        quotes!inner(line_items, subtotal, vat_amount, total)
      `)
      .eq('id', job_id)
      .eq('tenant_id', tenantId)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    // Check if deposit invoice already exists for this job
    const { data: existingDeposit } = await supabase
      .from('invoices')
      .select('id')
      .eq('job_id', job_id)
      .eq('invoice_type', 'deposit')
      .single()

    if (existingDeposit) {
      return NextResponse.json(
        { success: false, error: 'A deposit invoice already exists for this job' },
        { status: 409 }
      )
    }

    const quote = job.quotes as any
    const depositAmount = (quote.total * deposit_percentage) / 100

    // Calculate deposit VAT (proportional)
    const depositVatAmount = (quote.vat_amount * deposit_percentage) / 100
    const depositSubtotal = depositAmount - depositVatAmount

    // Generate unique invoice number
    const invoiceNumber = await generateInvoiceNumber(supabase, tenantId)

    // Generate public link
    const publicLink = Math.random().toString(36).substring(2, 15)

    // Calculate due date (7 days from now for deposits)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 7)

    // Create deposit line items
    const depositLineItems = [
      {
        description: `Deposit for ${job.title} (${deposit_percentage}%)`,
        quantity: 1,
        unit_price: depositAmount,
      },
    ]

    // Create deposit invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        tenant_id: tenantId,
        customer_id: job.customer_id,
        job_id: job.id,
        invoice_number: invoiceNumber,
        invoice_type: 'deposit',
        deposit_percentage,
        deposit_amount: depositAmount,
        line_items: depositLineItems,
        subtotal: depositSubtotal,
        vat_amount: depositVatAmount,
        total: depositAmount,
        amount_paid: 0,
        status: 'draft',
        due_date: dueDate.toISOString().split('T')[0],
        public_link: publicLink,
      })
      .select()
      .single()

    if (invoiceError) {
      console.error('Error creating deposit invoice:', invoiceError)
      return NextResponse.json(
        { success: false, error: 'Failed to create deposit invoice' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        deposit_amount: depositAmount,
        deposit_percentage,
        total: depositAmount,
        due_date: invoice.due_date,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/invoices/deposit:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
