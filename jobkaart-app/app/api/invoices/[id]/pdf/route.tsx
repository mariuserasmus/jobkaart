import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getTenantId } from '@/lib/db/supabase-server'
import { renderToStream } from '@react-pdf/renderer'
import { InvoicePDF } from '@/components/pdf/InvoicePDF'
import React from 'react'
import { Readable } from 'stream'

/**
 * GET /api/invoices/[id]/pdf
 * Generate and download invoice PDF
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

    // Get invoice with customer details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        customers!inner(id, name, phone, email, address)
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Get tenant information including banking details
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('business_name, logo_url, vat_number, phone, email, address, banking_details')
      .eq('id', tenantId)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant information not found' },
        { status: 404 }
      )
    }

    // Calculate outstanding amount
    const outstandingAmount = invoice.total - invoice.amount_paid

    // Calculate totals for line items (database only stores quantity and unit_price)
    const lineItemsWithTotals = invoice.line_items.map((item: any) => ({
      ...item,
      total: item.quantity * item.unit_price,
    }))

    // Prepare data for PDF - ensure customers is properly structured
    const pdfData = {
      invoice: {
        invoice_number: invoice.invoice_number,
        created_at: invoice.created_at,
        due_date: invoice.due_date,
        subtotal: invoice.subtotal,
        vat_amount: invoice.vat_amount,
        total: invoice.total,
        notes: invoice.notes,
        line_items: lineItemsWithTotals,
        paid_amount: invoice.amount_paid,
        outstanding_amount: outstandingAmount,
        customers: invoice.customers, // This is already an object from Supabase join
      },
      tenant: {
        company_name: tenant.business_name,
        phone: tenant.phone,
        email: tenant.email,
        address: tenant.address,
        bank_name: tenant.banking_details?.bank_name || null,
        bank_account_number: tenant.banking_details?.account_number || null,
        bank_branch_code: tenant.banking_details?.branch_code || null,
        logo_url: tenant.logo_url,
      },
    }

    // Generate PDF stream
    const stream = await renderToStream(
      React.createElement(InvoicePDF, pdfData)
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
        'Content-Disposition': `attachment; filename="Invoice-${invoice.invoice_number}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating invoice PDF:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
