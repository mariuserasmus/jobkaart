import { createServerClient } from '@/lib/db/supabase-server'
import { QuoteLineItems } from '@/components/features/quotes/QuoteLineItems'
import { QuoteStatusBadge } from '@/components/features/quotes/QuoteStatusBadge'
import { PrintButton } from '@/components/features/quotes/PrintButton'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'View Quote | JobKaart',
  description: 'View quote details',
}

interface PublicQuoteViewPageProps {
  params: Promise<{ id: string }>
}

export default async function PublicQuoteViewPage({ params }: PublicQuoteViewPageProps) {
  const { id } = await params
  const supabase = await createServerClient()

  // Fetch quote (no tenant_id filter needed for public view)
  const { data: quote, error } = await supabase
    .from('quotes')
    .select(`
      *,
      customers!inner(name, phone, email, address)
    `)
    .eq('id', id)
    .single()

  if (error || !quote) {
    notFound()
  }

  // Line items are stored in the quote.line_items JSONB column
  const lineItems = quote.line_items || []

  // Fetch tenant details for branding
  const { data: tenant } = await supabase
    .from('tenants')
    .select('business_name, logo_url, vat_number, banking_details')
    .eq('id', quote.tenant_id)
    .single()

  // Track view (insert into view_tracking table)
  // Note: We're not awaiting this as we don't want to block page render
  supabase
    .from('view_tracking')
    .insert({
      tenant_id: quote.tenant_id,
      link_type: 'quote',
      link_id: id,
      viewed_at: new Date().toISOString(),
    })
    .then()

  // Update quote status to 'viewed' if currently 'sent'
  // The database trigger will automatically update the status based on viewed_at
  if (quote.status === 'sent') {
    supabase
      .from('quotes')
      .update({
        viewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'sent') // Only update if still 'sent' (race condition protection)
      .then()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const isExpired = () => {
    const validUntil = new Date(quote.valid_until)
    return validUntil < new Date() && (quote.status === 'draft' || quote.status === 'sent' || quote.status === 'viewed')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 print:bg-white">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8 print:shadow-none">
        {/* Header */}
        <div className="mb-8 pb-6 border-b-2 border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              {tenant?.logo_url ? (
                <img
                  src={tenant.logo_url}
                  alt={tenant.business_name}
                  className="max-h-64 max-w-[500px] object-contain mb-0"
                />
              ) : (
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {tenant?.business_name || 'JobKaart'}
                </h2>
              )}
              {tenant?.vat_number && (
                <p className="text-sm text-gray-600 mb-3">VAT: {tenant.vat_number}</p>
              )}
              <div className="flex items-center gap-3">
                <QuoteStatusBadge status={isExpired() ? 'expired' : quote.status} />
                {isExpired() && (
                  <span className="text-sm text-red-600 font-medium">
                    Expired on {formatDate(quote.valid_until)}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold text-blue-600 mb-2">QUOTE</h1>
              <p className="text-lg font-semibold text-gray-900">{quote.quote_number}</p>
              <p className="text-sm text-gray-600 mt-1">
                Date: {formatDate(quote.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Quote For:</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold text-gray-900">{quote.customers.name}</p>
            <p className="text-sm text-gray-700 mt-1">{quote.customers.phone}</p>
            {quote.customers.email && (
              <p className="text-sm text-gray-700">{quote.customers.email}</p>
            )}
            {quote.customers.address && (
              <p className="text-sm text-gray-700 mt-1">{quote.customers.address}</p>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quote Details:</h3>
          <QuoteLineItems
            items={lineItems}
            subtotal={quote.subtotal}
            vatAmount={quote.vat_amount}
            total={quote.total}
          />
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes:</h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
            </div>
          </div>
        )}

        {/* Terms & Conditions */}
        {quote.terms_and_conditions && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Terms & Conditions:</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {quote.terms_and_conditions}
              </p>
            </div>
          </div>
        )}

        {/* Valid Until */}
        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm font-medium text-gray-900">
            This quote is valid until:{' '}
            <span className="font-bold">{formatDate(quote.valid_until)}</span>
            {isExpired() && (
              <span className="text-red-600 ml-2">(Expired)</span>
            )}
          </p>
        </div>

        {/* Banking Details */}
        {tenant?.banking_details && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Banking Details:</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p>
                <span className="font-medium">Bank:</span> {tenant.banking_details.bank_name}
              </p>
              <p>
                <span className="font-medium">Account Holder:</span>{' '}
                {tenant.banking_details.account_holder}
              </p>
              <p>
                <span className="font-medium">Account Number:</span>{' '}
                {tenant.banking_details.account_number}
              </p>
              <p>
                <span className="font-medium">Branch Code:</span>{' '}
                {tenant.banking_details.branch_code}
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
          <p>Thank you for your business!</p>
          <p className="mt-2">
            If you have any questions about this quote, please contact us at{' '}
            {quote.customers.phone}
          </p>
        </div>

        {/* Print Button */}
        <PrintButton />
      </div>
    </div>
  )
}
