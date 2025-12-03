import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getTenantId } from '@/lib/db/supabase-server'
import type { Quote, LineItem } from '@/types'

/**
 * GET /api/quotes
 * List all quotes for the current tenant
 * Supports filtering by status, customer, and search
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId()
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const customerId = searchParams.get('customer_id') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    let query = supabase
      .from('quotes')
      .select(`
        *,
        customers!inner(id, name, phone)
      `, { count: 'exact' })
      .eq('tenant_id', tenantId)

    // Filter by status
    if (status) {
      query = query.eq('status', status)
    }

    // Filter by customer
    if (customerId) {
      query = query.eq('customer_id', customerId)
    }

    // Search by quote number or customer name
    if (search) {
      const searchTerm = `%${search}%`

      // First, find customer IDs that match the search term
      const { data: matchingCustomers } = await supabase
        .from('customers')
        .select('id')
        .eq('tenant_id', tenantId)
        .ilike('name', searchTerm)

      const matchingCustomerIds = matchingCustomers?.map(c => c.id) || []

      // Build OR condition: quote_number matches OR customer_id is in matching customers
      if (matchingCustomerIds.length > 0) {
        query = query.or(`quote_number.ilike.${searchTerm},customer_id.in.(${matchingCustomerIds.join(',')})`)
      } else {
        // No matching customers, just search quote numbers
        query = query.ilike('quote_number', searchTerm)
      }
    }

    // Pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching quotes:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch quotes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        quotes: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
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

/**
 * POST /api/quotes
 * Create a new quote with line items
 */
export async function POST(request: NextRequest) {
  try {
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

    // Validate line items
    for (const item of line_items) {
      if (!item.description || !item.quantity || !item.unit_price) {
        return NextResponse.json(
          { success: false, error: 'Each line item must have description, quantity, and unit_price' },
          { status: 400 }
        )
      }
    }

    const supabase = await createServerClient()

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

    // Set valid_until date (default 30 days from now if not provided)
    const validUntilDate = valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Prepare line items with calculated totals
    const lineItemsData = line_items.map((item: any) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      total: Number(item.quantity) * Number(item.unit_price),
    }))

    // Create quote (quote_number and public_link will be auto-generated by database triggers)
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        tenant_id: tenantId,
        customer_id,
        quote_number: '', // Will be generated by trigger
        public_link: '', // Will be generated by trigger
        status: 'draft',
        line_items: lineItemsData,
        subtotal,
        vat_amount: vat,
        total,
        notes: notes || null,
        terms: terms_and_conditions || null,
        valid_until: validUntilDate,
      })
      .select(`
        *,
        customers!inner(id, name, phone, email, address)
      `)
      .single()

    if (quoteError || !quote) {
      console.error('Error creating quote:', quoteError)
      return NextResponse.json(
        { success: false, error: 'Failed to create quote' },
        { status: 500 }
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
