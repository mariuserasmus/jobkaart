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

    // TODO: PDF generation temporarily disabled due to React-PDF compatibility issues
    // See Issue #1 in TODO list - needs different approach
    return NextResponse.json(
      {
        success: false,
        error: 'PDF generation temporarily unavailable. Please use the print function or contact support.'
      },
      { status: 503 }
    )
  } catch (error) {
    console.error('Error generating quote PDF:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
