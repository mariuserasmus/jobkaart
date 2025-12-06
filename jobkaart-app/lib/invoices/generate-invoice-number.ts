import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Generates a unique invoice number with retry logic to handle race conditions
 * Format: INV-YYYY-NNN (e.g., INV-2025-001)
 * Resets to 001 each year
 */
export async function generateInvoiceNumber(
  supabase: SupabaseClient,
  tenantId: string,
  maxRetries = 5
): Promise<string> {
  const currentYear = new Date().getFullYear()

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Get the latest invoice number for this tenant
    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let nextNumber = 1

    if (lastInvoice?.invoice_number) {
      // Try to parse year-based format: INV-YYYY-NNN
      const match = lastInvoice.invoice_number.match(/INV-(\d{4})-(\d{3})/)
      if (match) {
        const year = parseInt(match[1])
        const num = parseInt(match[2])
        if (year === currentYear) {
          nextNumber = num + 1
        }
        // If different year, nextNumber stays 1
      }
    }

    const invoiceNumber = `INV-${currentYear}-${String(nextNumber).padStart(3, '0')}`

    // Verify this number doesn't already exist (race condition check)
    const { data: existing } = await supabase
      .from('invoices')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('invoice_number', invoiceNumber)
      .maybeSingle()

    if (!existing) {
      return invoiceNumber
    }

    // If number already exists, wait briefly and retry
    await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)))
  }

  // Fallback: add random suffix if all retries fail
  const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `INV-${currentYear}-${randomSuffix}`
}
