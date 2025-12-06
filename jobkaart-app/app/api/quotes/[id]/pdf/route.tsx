import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getTenantId } from '@/lib/db/supabase-server'
import { renderToStream } from '@react-pdf/renderer'
import { QuotePDF } from '@/components/pdf/QuotePDF'
import React from 'react'
import { Readable } from 'stream'

/**
 * GET /api/quotes/[id]/pdf
 * Generate and download quote PDF
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

    // Get tenant information
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('business_name, logo_url, vat_number, phone, email, address')
      .eq('id', tenantId)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant information not found' },
        { status: 404 }
      )
    }

    // Calculate totals for line items (database only stores quantity and unit_price)
    const lineItemsWithTotals = quote.line_items.map((item: any) => ({
      ...item,
      total: item.quantity * item.unit_price,
    }))

    // Prepare data for PDF - ensure customers is properly structured
    const pdfData = {
      quote: {
        quote_number: quote.quote_number,
        created_at: quote.created_at,
        valid_until: quote.valid_until,
        subtotal: quote.subtotal,
        vat_amount: quote.vat_amount,
        total: quote.total,
        notes: quote.notes,
        terms: quote.terms_and_conditions,
        line_items: lineItemsWithTotals,
        customers: quote.customers, // This is already an object from Supabase join
      },
      tenant: {
        company_name: tenant.business_name,
        phone: tenant.phone,
        email: tenant.email,
        address: tenant.address,
        logo_url: tenant.logo_url,
      },
    }

    // Generate PDF stream
    const stream = await renderToStream(
      React.createElement(QuotePDF, pdfData)
    )

    // Convert ReadableStream to Node.js Readable stream, then to buffer
    const reader = stream.getReader()
    const chunks: Uint8Array[] = []

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }

    const buffer = Buffer.concat(chunks)

    // Return PDF as downloadable file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Quote-${quote.quote_number}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating quote PDF:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
