import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getTenantId } from '@/lib/db/supabase-server'

/**
 * GET /api/invoices/[id]
 * Get invoice details with payments
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

    // Get invoice with related data
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        customers!inner(id, name, phone, email, address),
        jobs(id, job_number, title),
        payments(id, amount, payment_date, payment_method, reference, created_at)
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
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

/**
 * PATCH /api/invoices/[id]
 * Update invoice details or status
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
    const {
      status,
      line_items,
      subtotal,
      vat_amount,
      total,
      due_date,
      notes,
    } = body

    const supabase = await createServerClient()

    // Check if invoice exists
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id, status')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (!existingInvoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (status !== undefined) updateData.status = status
    if (line_items !== undefined) updateData.line_items = line_items
    if (subtotal !== undefined) updateData.subtotal = subtotal
    if (vat_amount !== undefined) updateData.vat_amount = vat_amount
    if (total !== undefined) updateData.total = total
    if (due_date !== undefined) updateData.due_date = due_date
    if (notes !== undefined) updateData.notes = notes

    // Update invoice
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
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

    return NextResponse.json({
      success: true,
      data: updatedInvoice,
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
 * DELETE /api/invoices/[id]?force=true
 * Delete an invoice
 * - By default: only if no payments recorded
 * - With force=true: deletes payments first, then invoice (for cleanup/testing)
 * Updates job status back to appropriate state
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

    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    const supabase = await createServerClient()

    // Get invoice details to check job_id and invoice type
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, job_id, invoice_type')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Check if invoice has payments
    const { data: payments } = await supabase
      .from('payments')
      .select('id')
      .eq('invoice_id', id)
      .eq('tenant_id', tenantId)

    if (payments && payments.length > 0) {
      if (force) {
        // Force delete: Remove all payments first
        const { error: deletePaymentsError } = await supabase
          .from('payments')
          .delete()
          .eq('invoice_id', id)
          .eq('tenant_id', tenantId)

        if (deletePaymentsError) {
          console.error('Error deleting payments:', deletePaymentsError)
          return NextResponse.json(
            { success: false, error: 'Failed to delete invoice payments' },
            { status: 500 }
          )
        }
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Cannot delete invoice with recorded payments. Use force delete to override.',
          },
          { status: 400 }
        )
      }
    }

    // CRITICAL: Enforce reverse-order deletion for invoices with same job
    // Invoices can ONLY be deleted in reverse order of creation (unless force=true)
    if (invoice.job_id && !force) {
      const { data: allJobInvoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, created_at')
        .eq('job_id', invoice.job_id)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (allJobInvoices && allJobInvoices.length > 1) {
        // Find the most recently created invoice
        const mostRecentInvoice = allJobInvoices[0]

        // If trying to delete an invoice that's NOT the most recent one, reject
        if (mostRecentInvoice.id !== id) {
          return NextResponse.json(
            {
              success: false,
              error: `Cannot delete this invoice. Invoices must be deleted in reverse order. Please delete ${mostRecentInvoice.invoice_number} first, or use force delete.`,
            },
            { status: 400 }
          )
        }
      }
    }

    // Delete invoice
    const { error: deleteError } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (deleteError) {
      console.error('Error deleting invoice:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete invoice' },
        { status: 500 }
      )
    }

    // If invoice was linked to a job, update job status
    if (invoice.job_id) {
      // Check if there are any remaining invoices for this job
      const { data: remainingInvoices } = await supabase
        .from('invoices')
        .select('id, status, total, amount_paid, invoice_type')
        .eq('job_id', invoice.job_id)
        .eq('tenant_id', tenantId)

      let newJobStatus = 'complete' // Default to complete if no invoices

      if (remainingInvoices && remainingInvoices.length > 0) {
        // Check if any invoices are fully paid
        const hasFullyPaidInvoice = remainingInvoices.some(
          (inv) => inv.status === 'paid' && inv.amount_paid >= inv.total
        )

        // Check if all are balance/full invoices and all paid
        const hasBalanceOrFullInvoice = remainingInvoices.some(
          (inv) => (inv.invoice_type === 'balance' || inv.invoice_type === 'full') && inv.status === 'paid'
        )

        if (hasBalanceOrFullInvoice) {
          newJobStatus = 'paid'
        } else if (remainingInvoices.some((inv) => inv.status !== 'draft')) {
          newJobStatus = 'invoiced'
        } else {
          newJobStatus = 'complete'
        }
      }

      // Update job status
      await supabase
        .from('jobs')
        .update({ status: newJobStatus })
        .eq('id', invoice.job_id)
        .eq('tenant_id', tenantId)
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice deleted successfully',
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
