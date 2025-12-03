import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getTenantId } from '@/lib/db/supabase-server'

/**
 * POST /api/quotes/[id]/accept
 * Mark quote as accepted
 */
export async function POST(
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

    // Get quote to verify it exists and is pending
    const { data: quote } = await supabase
      .from('quotes')
      .select('id, status')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (!quote) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      )
    }

    const acceptableStatuses = ['draft', 'sent', 'viewed']
    if (!acceptableStatuses.includes(quote.status)) {
      return NextResponse.json(
        { success: false, error: 'Only draft, sent, or viewed quotes can be accepted. This quote is ' + quote.status },
        { status: 400 }
      )
    }

    // Update quote status
    const { data: updatedQuote, error } = await supabase
      .from('quotes')
      .update({
        status: 'accepted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select(`
        *,
        customers!inner(id, name, phone, email, address)
      `)
      .single()

    if (error || !updatedQuote) {
      console.error('Error accepting quote:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to accept quote' },
        { status: 500 }
      )
    }

    // Get line items
    const { data: lineItems } = await supabase
      .from('quote_line_items')
      .select('*')
      .eq('quote_id', id)
      .order('display_order')

    return NextResponse.json({
      success: true,
      data: {
        ...updatedQuote,
        line_items: lineItems || [],
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
