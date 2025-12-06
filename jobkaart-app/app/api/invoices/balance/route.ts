import { NextResponse } from 'next/server'
import { createServerClient, getTenantId } from '@/lib/db/supabase-server'

/**
 * POST /api/invoices/balance
 * Create a balance invoice after job completion, deducting the deposit
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
    const { job_id } = body

    // Validation
    if (!job_id) {
      return NextResponse.json(
        { success: false, error: 'job_id is required' },
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

    // Get all existing invoices for this job (deposit + progress)
    const { data: existingInvoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id, invoice_number, invoice_type, total, amount_paid, status, deposit_percentage')
      .eq('job_id', job_id)
      .in('invoice_type', ['deposit', 'progress'])
      .order('created_at', { ascending: true })

    if (invoicesError || !existingInvoices || existingInvoices.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No deposit or progress invoices found for this job' },
        { status: 404 }
      )
    }

    // Verify all previous invoices are paid
    const unpaidInvoices = existingInvoices.filter(inv => inv.status !== 'paid')
    if (unpaidInvoices.length > 0) {
      const unpaidNumbers = unpaidInvoices.map(inv => inv.invoice_number).join(', ')
      return NextResponse.json(
        {
          success: false,
          error: `All previous invoices must be paid before creating balance invoice. Unpaid: ${unpaidNumbers}`,
        },
        { status: 400 }
      )
    }

    // Check if balance invoice already exists
    const { data: existingBalance } = await supabase
      .from('invoices')
      .select('id')
      .eq('job_id', job_id)
      .eq('invoice_type', 'balance')
      .single()

    if (existingBalance) {
      return NextResponse.json(
        { success: false, error: 'A balance invoice already exists for this job' },
        { status: 409 }
      )
    }

    const quote = job.quotes as any

    // Calculate total already invoiced (all deposit + progress invoices)
    const totalAlreadyInvoiced = existingInvoices.reduce((sum, inv) => sum + inv.total, 0)
    const balanceAmount = quote.total - totalAlreadyInvoiced

    // Calculate balance VAT (proportional)
    const invoicedPercentage = (totalAlreadyInvoiced / quote.total) * 100
    const balancePercentage = 100 - invoicedPercentage
    const balanceVatAmount = (quote.vat_amount * balancePercentage) / 100
    const balanceSubtotal = balanceAmount - balanceVatAmount

    // Generate invoice number (format: INV-YYYY-NNN)
    const currentYear = new Date().getFullYear()

    const { data: latestInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let nextNumber = 1
    if (latestInvoice?.invoice_number) {
      // Try to parse year-based format: INV-YYYY-NNN
      const match = latestInvoice.invoice_number.match(/INV-(\d{4})-(\d{3})/)
      if (match) {
        const year = parseInt(match[1])
        const num = parseInt(match[2])
        if (year === currentYear) {
          nextNumber = num + 1
        }
        // If different year, nextNumber stays 1
      }
    }
    const invoiceNumber = `INV-${currentYear}-${String(nextNumber).padStart(3, '0')}`

    // Generate public link
    const publicLink = Math.random().toString(36).substring(2, 15)

    // Calculate due date (14 days from now for balance)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 14)

    // Create balance line items showing the breakdown
    const balanceLineItems = [
      {
        description: `Final payment for ${job.title}`,
        quantity: 1,
        unit_price: quote.total,
      },
      // Show all previous payments (deposit + progress)
      ...existingInvoices.map(inv => ({
        description: `Less: ${inv.invoice_type === 'deposit' ? 'Deposit' : 'Progress'} paid (${inv.invoice_number})${inv.deposit_percentage ? ` - ${inv.deposit_percentage}%` : ''}`,
        quantity: 1,
        unit_price: -inv.total,
      })),
    ]

    // Create balance invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        tenant_id: tenantId,
        customer_id: job.customer_id,
        job_id: job.id,
        invoice_number: invoiceNumber,
        invoice_type: 'balance',
        parent_invoice_id: existingInvoices[0].id, // Link to first invoice (deposit)
        line_items: balanceLineItems,
        subtotal: balanceSubtotal,
        vat_amount: balanceVatAmount,
        total: balanceAmount,
        amount_paid: 0,
        status: 'draft',
        due_date: dueDate.toISOString().split('T')[0],
        public_link: publicLink,
      })
      .select()
      .single()

    if (invoiceError) {
      console.error('Error creating balance invoice:', invoiceError)
      return NextResponse.json(
        { success: false, error: 'Failed to create balance invoice' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        previous_invoices_total: totalAlreadyInvoiced,
        balance_due: balanceAmount,
        total: balanceAmount,
        due_date: invoice.due_date,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/invoices/balance:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
