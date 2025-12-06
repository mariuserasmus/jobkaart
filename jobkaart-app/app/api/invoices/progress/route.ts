import { NextResponse } from 'next/server'
import { createServerClient, getTenantId } from '@/lib/db/supabase-server'

/**
 * POST /api/invoices/progress
 * Create a progress payment invoice for a job
 * This allows invoicing in multiple stages (e.g., 25%, 25%, 25%, 25%)
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
    const { job_id, percentage } = body

    // Validation
    if (!job_id) {
      return NextResponse.json(
        { success: false, error: 'job_id is required' },
        { status: 400 }
      )
    }

    if (!percentage || percentage <= 0 || percentage > 100) {
      return NextResponse.json(
        { success: false, error: 'percentage must be between 1 and 100' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Get job with quote
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        id,
        job_number,
        title,
        customer_id,
        quote_id,
        quotes!inner(id, quote_number, total, subtotal, vat_amount, line_items)
      `)
      .eq('id', job_id)
      .eq('tenant_id', tenantId)
      .single()

    if (jobError || !job || !job.quotes) {
      return NextResponse.json(
        { success: false, error: 'Job or quote not found' },
        { status: 404 }
      )
    }

    const quote = job.quotes as any

    // Get all existing invoices for this job to calculate total invoiced
    const { data: existingInvoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('total, invoice_type')
      .eq('job_id', job_id)
      .eq('tenant_id', tenantId)

    if (invoicesError) {
      console.error('Error fetching existing invoices:', invoicesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch existing invoices' },
        { status: 500 }
      )
    }

    // Calculate total already invoiced
    const totalInvoiced = (existingInvoices || []).reduce((sum, inv) => sum + inv.total, 0)
    const totalInvoicedPercentage = (totalInvoiced / quote.total) * 100

    // Check if this progress invoice would exceed 100%
    if (totalInvoicedPercentage + percentage > 100) {
      const remainingPercentage = 100 - totalInvoicedPercentage
      return NextResponse.json(
        {
          success: false,
          error: `Cannot invoice ${percentage}%. Only ${remainingPercentage.toFixed(1)}% remaining (${totalInvoicedPercentage.toFixed(1)}% already invoiced)`,
        },
        { status: 400 }
      )
    }

    // Calculate progress invoice amounts
    const progressAmount = (quote.total * percentage) / 100
    const progressVatAmount = (quote.vat_amount * percentage) / 100
    const progressSubtotal = progressAmount - progressVatAmount

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

    // Create line items showing this is a progress payment
    const totalPercentageAfterThis = totalInvoicedPercentage + percentage
    const lineItems = [
      {
        description: `Progress payment (${percentage}% of total) - ${job.title || job.job_number}`,
        quantity: 1,
        unit_price: progressSubtotal,
      },
    ]

    // Set due date (14 days from now)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 14)

    // Create progress invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        tenant_id: tenantId,
        customer_id: job.customer_id,
        job_id: job.id,
        invoice_number: invoiceNumber,
        invoice_type: 'progress',
        deposit_percentage: percentage, // Reuse this field to store progress percentage
        line_items: lineItems,
        subtotal: progressSubtotal,
        vat_amount: progressVatAmount,
        total: progressAmount,
        amount_paid: 0,
        status: 'draft',
        due_date: dueDate.toISOString().split('T')[0],
        notes: `Progress payment ${percentage}% (${totalPercentageAfterThis.toFixed(1)}% of total invoiced)`,
      })
      .select()
      .single()

    if (invoiceError || !invoice) {
      console.error('Error creating progress invoice:', invoiceError)
      return NextResponse.json(
        { success: false, error: 'Failed to create progress invoice' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        amount: progressAmount,
        percentage: percentage,
        total_invoiced_percentage: totalPercentageAfterThis,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/invoices/progress:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
