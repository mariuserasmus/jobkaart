import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getTenantId } from '@/lib/db/supabase-server'

/**
 * GET /api/quotes/[id]
 * Get quote details with line items and customer info
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

    // Get quote with customer details
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        *,
        customers!inner(id, name, phone, email, address)
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (quoteError || !quote) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: quote,
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
 * PATCH /api/quotes/[id]
 * Update quote details (only if status = draft)
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
      customer_id,
      line_items,
      vat_amount,
      notes,
      terms_and_conditions,
      valid_until,
    } = body

    const supabase = await createServerClient()

    // Check if quote exists and is editable
    const { data: existingQuote } = await supabase
      .from('quotes')
      .select('id, status')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (!existingQuote) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      )
    }

    if (existingQuote.status !== 'draft') {
      return NextResponse.json(
        { success: false, error: 'Can only edit quotes with draft status' },
        { status: 400 }
      )
    }

    // Validation
    if (!customer_id) {
      return NextResponse.json(
        { success: false, error: 'Customer is required' },
        { status: 400 }
      )
    }

    if (!line_items || !Array.isArray(line_items) || line_items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one line item is required' },
        { status: 400 }
      )
    }

    // Verify customer belongs to tenant
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('id', customer_id)
      .eq('tenant_id', tenantId)
      .single()

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Calculate totals
    const subtotal = line_items.reduce((sum: number, item: any) => {
      return sum + (Number(item.quantity) * Number(item.unit_price))
    }, 0)

    const vat = vat_amount || 0
    const total = subtotal + vat

    // Prepare line items with calculated totals
    const lineItemsData = line_items.map((item: any) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      total: Number(item.quantity) * Number(item.unit_price),
    }))

    // Update quote
    const { data: updatedQuote, error: updateError } = await supabase
      .from('quotes')
      .update({
        customer_id,
        line_items: lineItemsData,
        subtotal,
        vat_amount: vat,
        total,
        notes: notes || null,
        terms: terms_and_conditions || null,
        valid_until: valid_until || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select(`
        *,
        customers!inner(id, name, phone, email, address)
      `)
      .single()

    if (updateError || !updatedQuote) {
      console.error('Error updating quote:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update quote' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedQuote,
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
 * DELETE /api/quotes/[id]
 * Delete a quote
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

    // Check if quote has associated jobs
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id')
      .eq('quote_id', id)
      .eq('tenant_id', tenantId)
      .limit(1)

    if (jobs && jobs.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete quote with associated jobs' },
        { status: 409 }
      )
    }

    // Delete quote
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('Error deleting quote:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete quote' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Quote deleted successfully' },
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
