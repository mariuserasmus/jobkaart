import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getTenantId } from '@/lib/db/supabase-server'

/**
 * GET /api/quote-templates/[id]
 * Get a single quote template by ID
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

    const { data: template, error } = await supabase
      .from('quote_templates')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error || !template) {
      return NextResponse.json(
        { success: false, error: 'Quote template not found' },
        { status: 404 }
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

/**
 * PATCH /api/quote-templates/[id]
 * Update a quote template
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
      name,
      description,
      line_items,
      vat_amount,
      notes,
      terms,
      times_used,
      last_used_at,
    } = body

    // Validation
    if (name !== undefined && (!name || !name.trim())) {
      return NextResponse.json(
        { success: false, error: 'Template name cannot be empty' },
        { status: 400 }
      )
    }

    if (line_items !== undefined) {
      if (!Array.isArray(line_items) || line_items.length === 0) {
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
    }

    const supabase = await createServerClient()

    // Verify template belongs to tenant
    const { data: existing } = await supabase
      .from('quote_templates')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Quote template not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (name !== undefined) {
      updateData.name = name.trim()
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }

    if (notes !== undefined) {
      updateData.notes = notes?.trim() || null
    }

    if (terms !== undefined) {
      updateData.terms = terms?.trim() || null
    }

    if (times_used !== undefined) {
      updateData.times_used = times_used
    }

    if (last_used_at !== undefined) {
      updateData.last_used_at = last_used_at
    }

    if (line_items !== undefined) {
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

      const vat = vat_amount !== undefined ? vat_amount : 0
      const total = subtotal + vat

      updateData.line_items = lineItemsData
      updateData.default_subtotal = subtotal
      updateData.default_vat_amount = vat
      updateData.default_total = total
    }

    // Update template
    const { data: template, error: updateError } = await supabase
      .from('quote_templates')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (updateError || !template) {
      console.error('Error updating quote template:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update quote template' },
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

/**
 * DELETE /api/quote-templates/[id]
 * Delete a quote template
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

    // Delete template (RLS will ensure it belongs to tenant)
    const { error } = await supabase
      .from('quote_templates')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('Error deleting quote template:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete quote template' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { id },
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
