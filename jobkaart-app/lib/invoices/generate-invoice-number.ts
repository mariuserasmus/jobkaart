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
    // Get ALL invoices for this year and find the maximum number
    // We need to check all invoices, not just the most recent by created_at,
    // because deposit/progress/balance invoices may be created out of order
    const { data: yearInvoices } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('tenant_id', tenantId)
      .like('invoice_number', `INV-${currentYear}-%`)

    let nextNumber = 1

    if (yearInvoices && yearInvoices.length > 0) {
      // Parse all invoice numbers and find the maximum
      const numbers = yearInvoices
        .map((inv) => {
          const match = inv.invoice_number.match(/INV-(\d{4})-(\d{3})/)
          return match ? parseInt(match[2]) : 0
        })
        .filter((num) => num > 0)

      if (numbers.length > 0) {
        nextNumber = Math.max(...numbers) + 1
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

  // Fallback: Should never reach here, but if it does, throw an error instead of using random suffix
  console.error(`Failed to generate invoice number after ${maxRetries} attempts for tenant ${tenantId}`)
  throw new Error('Unable to generate unique invoice number. Please try again.')
}
