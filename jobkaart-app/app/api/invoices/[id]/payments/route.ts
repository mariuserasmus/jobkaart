import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getTenantId } from '@/lib/db/supabase-server'

/**
 * POST /api/invoices/[id]/payments
 * Record a payment for an invoice
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params
    const tenantId = await getTenantId()

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      amount,
      payment_date,
      payment_method = 'cash',
      reference,
    } = body

    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid payment amount is required' },
        { status: 400 }
      )
    }

    if (!payment_date) {
      return NextResponse.json(
        { success: false, error: 'Payment date is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Get invoice to validate and update
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, total, amount_paid, customer_id')
      .eq('id', invoiceId)
      .eq('tenant_id', tenantId)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Check if payment amount exceeds outstanding amount
    const outstandingAmount = invoice.total - invoice.amount_paid

    // Convert to cents (integers) to avoid floating-point comparison issues
    const amountInCents = Math.round(amount * 100)
    const outstandingInCents = Math.round(outstandingAmount * 100)

    if (amountInCents > outstandingInCents) {
      return NextResponse.json(
        {
          success: false,
          error: `Payment amount exceeds outstanding amount of R${outstandingAmount.toFixed(2)}`,
        },
        { status: 400 }
      )
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        tenant_id: tenantId,
        invoice_id: invoiceId,
        amount,
        payment_date,
        payment_method,
        reference: reference || null,
      })
      .select()
      .single()

    if (paymentError || !payment) {
      console.error('Error recording payment:', paymentError)
      return NextResponse.json(
        { success: false, error: 'Failed to record payment' },
        { status: 500 }
      )
    }

    // Update invoice amount_paid and status
    // Use cents-based calculation to avoid floating-point precision issues
    const newAmountPaidInCents = Math.round(invoice.amount_paid * 100) + amountInCents
    const newAmountPaid = newAmountPaidInCents / 100
    const totalInCents = Math.round(invoice.total * 100)
    const newStatus = newAmountPaidInCents >= totalInCents ? 'paid' : 'partially_paid'

    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update({
        amount_paid: newAmountPaid,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .eq('tenant_id', tenantId)
      .select(`
        *,
        customers!inner(id, name, phone, email, address),
        jobs(id, job_number, title),
        payments(id, amount, payment_date, payment_method, reference, created_at)
      `)
      .single()

    if (updateError || !updatedInvoice) {
      console.error('Error updating invoice:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update invoice' },
        { status: 500 }
      )
    }

    // If invoice is now fully paid, update related job status to 'paid'
    if (newStatus === 'paid' && updatedInvoice.job_id) {
      await supabase
        .from('jobs')
        .update({ status: 'paid' })
        .eq('id', updatedInvoice.job_id)
        .eq('tenant_id', tenantId)
    }

    return NextResponse.json({
      success: true,
      data: {
        payment,
        invoice: updatedInvoice,
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
