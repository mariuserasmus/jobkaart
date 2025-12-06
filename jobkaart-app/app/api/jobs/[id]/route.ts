import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getTenantId } from '@/lib/db/supabase-server'

/**
 * GET /api/jobs/[id]
 * Get job details with customer and quote info
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

    // Get job with customer and quote details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        *,
        customers!inner(id, name, phone, email, address),
        quotes(id, quote_number, line_items, subtotal, vat_amount, total)
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: job,
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
 * PATCH /api/jobs/[id]
 * Update job details (status, scheduled_date, etc.)
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
      scheduled_date,
      completed_date,
      description,
      assigned_to,
    } = body

    const supabase = await createServerClient()

    // Check if job exists
    const { data: existingJob } = await supabase
      .from('jobs')
      .select('id, status')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (!existingJob) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (status) {
      updateData.status = status

      // Auto-set completed_date when status changes to 'complete'
      if (status === 'complete' && !existingJob.status.includes('complete')) {
        updateData.completed_date = new Date().toISOString()
      }
    }

    if (scheduled_date !== undefined) {
      updateData.scheduled_date = scheduled_date
    }

    if (completed_date !== undefined) {
      updateData.completed_date = completed_date
    }

    if (description !== undefined) {
      updateData.description = description
    }

    if (assigned_to !== undefined) {
      updateData.assigned_to = assigned_to
    }

    // Update job
    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select(`
        *,
        customers!inner(id, name, phone, email, address),
        quotes(id, quote_number, line_items, subtotal, vat_amount, total)
      `)
      .single()

    if (updateError || !updatedJob) {
      console.error('Error updating job:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update job' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedJob,
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
 * DELETE /api/jobs/[id]
 * Delete a job and all related invoices (if no payments recorded)
 * Updates quote to allow creating new jobs
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

    // Get job details to check for quote_id
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, quote_id')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    // Check if any invoices have payments
    const { data: invoicesWithPayments } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        payments!inner(id)
      `)
      .eq('job_id', id)
      .eq('tenant_id', tenantId)

    if (invoicesWithPayments && invoicesWithPayments.length > 0) {
      const invoiceNumbers = invoicesWithPayments
        .map((inv) => inv.invoice_number)
        .join(', ')
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete job with invoices that have payments. Invoices: ${invoiceNumbers}`,
        },
        { status: 400 }
      )
    }

    // Delete all invoices for this job (cascade should handle payments)
    const { error: deleteInvoicesError } = await supabase
      .from('invoices')
      .delete()
      .eq('job_id', id)
      .eq('tenant_id', tenantId)

    if (deleteInvoicesError) {
      console.error('Error deleting invoices:', deleteInvoicesError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete job invoices' },
        { status: 500 }
      )
    }

    // Delete the job
    const { error: deleteJobError } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (deleteJobError) {
      console.error('Error deleting job:', deleteJobError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete job' },
        { status: 500 }
      )
    }

    // Quote can now be used to create new jobs (no action needed, just document behavior)
    // The quote remains in 'accepted' status and can be converted to a new job

    return NextResponse.json({
      success: true,
      message: 'Job and related invoices deleted successfully',
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
