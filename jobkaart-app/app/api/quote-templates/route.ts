import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getTenantId } from '@/lib/db/supabase-server'

/**
 * GET /api/quote-templates
 * List all quote templates for the current tenant
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
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('quote_templates')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)

    // Search by name
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    // Order by most recently used, then by name
    query = query.order('last_used_at', { ascending: false, nullsFirst: false })
    query = query.order('name', { ascending: true })
    query = query.limit(limit)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching quote templates:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch quote templates' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        templates: data || [],
        total: count || 0,
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
 * POST /api/quote-templates
 * Create a new quote template
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
      name,
      description,
      line_items,
      vat_amount,
      notes,
      terms,
    } = body

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Template name is required' },
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

    // Calculate totals
    const lineItemsData = line_items.map((item: any) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      total: Number(item.quantity) * Number(item.unit_price),
    }))

    const subtotal = lineItemsData.reduce((sum: number, item: any) => {
      return sum + item.total
    }, 0)

    const vat = vat_amount || 0
    const total = subtotal + vat

    // Create template
    const { data: template, error: templateError } = await supabase
      .from('quote_templates')
      .insert({
        tenant_id: tenantId,
        name: name.trim(),
        description: description?.trim() || null,
        line_items: lineItemsData,
        default_subtotal: subtotal,
        default_vat_amount: vat,
        default_total: total,
        notes: notes?.trim() || null,
        terms: terms?.trim() || null,
        times_used: 0,
      })
      .select()
      .single()

    if (templateError || !template) {
      console.error('Error creating quote template:', templateError)
      return NextResponse.json(
        { success: false, error: 'Failed to create quote template' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: template,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
