import { NextResponse } from 'next/server'
import { createServerClient, getTenantId } from '@/lib/db/supabase-server'

/**
 * GET /api/jobs/[id]/invoices
 * Get all invoices for a specific job
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantId()
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const params = await context.params
    const jobId = params.id

    const supabase = await createServerClient()

    // Verify job belongs to tenant
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', jobId)
      .eq('tenant_id', tenantId)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    // Get all invoices for this job, ordered by creation date
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id, invoice_number, invoice_type, total, amount_paid, status, deposit_percentage, created_at')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true })

    if (invoicesError) {
      console.error('Error fetching job invoices:', invoicesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch invoices' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: invoices || [],
    })
  } catch (error) {
    console.error('Error in GET /api/jobs/[id]/invoices:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
