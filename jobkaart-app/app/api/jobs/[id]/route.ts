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
