import { createServerClient } from '@/lib/db/supabase-server'
import { notFound } from 'next/navigation'
import { InvoiceStatusBadge } from '@/components/features/invoices/InvoiceStatusBadge'
import { PrintButton } from '@/components/features/invoices/PrintButton'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface PublicInvoiceViewPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PublicInvoiceViewPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServerClient()

  // Fetch invoice for metadata
  const { data: invoice } = await supabase
    .from('invoices')
    .select(`
      *,
      customers!inner(name, phone, email, address, vat_number)
    `)
    .eq('id', id)
    .single()

  if (!invoice) {
    return {
      title: 'Invoice Not Found | JobKaart',
      description: 'The requested invoice could not be found.',
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'R0.00'
    return `R${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  }

  const outstandingAmount = invoice.total - invoice.amount_paid
  const isPaid = invoice.amount_paid >= invoice.total

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jobkaart.co.za'
  const title = `Invoice ${invoice.invoice_number} for ${invoice.customers.name}`
  const description = isPaid
    ? `Invoice for ${formatCurrency(invoice.total)} - Paid in Full - JobKaart`
    : `Invoice for ${formatCurrency(invoice.total)} - ${formatCurrency(outstandingAmount)} Outstanding - JobKaart`
  const imageUrl = `${baseUrl}/icon-512.png`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${baseUrl}/invoices/view/${id}`,
      siteName: 'JobKaart',
      images: [
        {
          url: imageUrl,
          width: 512,
          height: 512,
          alt: 'JobKaart Logo',
        },
      ],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default async function PublicInvoiceViewPage({ params }: PublicInvoiceViewPageProps) {
  const { id } = await params
  const supabase = await createServerClient()

  // Fetch invoice (no tenant_id filter needed for public view)
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`
      *,
      customers!inner(name, phone, email, address, vat_number),
      payments(id, amount, payment_date, payment_method, reference, created_at)
    `)
    .eq('id', id)
    .single()

  if (error || !invoice) {
    notFound()
  }

  // Line items are stored in the invoice.line_items JSONB column
  const lineItems = invoice.line_items || []

  // Fetch tenant details for branding and banking
  const { data: tenant } = await supabase
    .from('tenants')
    .select('business_name, logo_url, vat_number, banking_details, phone, email')
    .eq('id', invoice.tenant_id)
    .single()

  // Track view (insert into view_tracking table)
  supabase
    .from('view_tracking')
    .insert({
      tenant_id: invoice.tenant_id,
      link_type: 'invoice',
      link_id: id,
      viewed_at: new Date().toISOString(),
    })
    .then()

  // Update invoice status to 'viewed' if currently 'sent'
  // The database trigger will automatically update the status based on viewed_at
  if (invoice.status === 'sent') {
    supabase
      .from('invoices')
      .update({
        viewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'sent') // Only update if still 'sent' (race condition protection)
      .then()
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'R0.00'
    return `R${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const outstandingAmount = invoice.total - invoice.amount_paid
  const isPaid = invoice.amount_paid >= invoice.total
  const isOverdue = new Date(invoice.due_date) < new Date() && !isPaid

  // Sort payments by date (most recent first)
  const sortedPayments = [...invoice.payments].sort(
    (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
  )

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
                <InvoiceStatusBadge status={invoice.status} />
                {isOverdue && (
                  <span className="text-sm text-red-600 font-medium">
                    Payment Overdue
                  </span>
                )}
                {isPaid && (
                  <span className="text-sm text-green-600 font-medium">
                    Paid in Full
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold text-blue-600 mb-2">INVOICE</h1>
              <p className="text-lg font-semibold text-gray-900">{invoice.invoice_number}</p>
              <p className="text-sm text-gray-600 mt-1">
                Date: {formatDate(invoice.created_at)}
              </p>
              <p className="text-sm text-gray-600">
                Due: {formatDate(invoice.due_date)}
              </p>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To:</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold text-gray-900">{invoice.customers.name}</p>
            <p className="text-sm text-gray-700 mt-1">{invoice.customers.phone}</p>
            {invoice.customers.email && (
              <p className="text-sm text-gray-700">{invoice.customers.email}</p>
            )}
            {invoice.customers.vat_number && (
              <p className="text-sm text-gray-700">VAT: {invoice.customers.vat_number}</p>
            )}
            {invoice.customers.address && (
              <p className="text-sm text-gray-700 mt-1">{invoice.customers.address}</p>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details:</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lineItems.map((item: any, index: number) => {
                  const amount = item.quantity * item.unit_price
                  return (
                    <tr key={index}>
                      <td className="px-4 py-4 text-sm text-gray-900">{item.description}</td>
                      <td className="px-4 py-4 text-sm text-gray-900 text-right">{item.quantity}</td>
                      <td className="px-4 py-4 text-sm text-gray-900 text-right">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(amount)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200">
                  <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                    Subtotal:
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(invoice.subtotal)}
                  </td>
                </tr>
                {invoice.vat_amount > 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                      VAT (15%):
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.vat_amount)}
                    </td>
                  </tr>
                )}
                <tr className="border-t-2 border-gray-300">
                  <td colSpan={3} className="px-4 py-4 text-right text-lg font-bold text-gray-900">
                    Total:
                  </td>
                  <td className="px-4 py-4 text-right text-xl font-bold text-blue-600">
                    {formatCurrency(invoice.total)}
                  </td>
                </tr>
                {invoice.amount_paid > 0 && (
                  <>
                    <tr className="border-t border-gray-200">
                      <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-green-700">
                        Amount Paid:
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-green-700">
                        -{formatCurrency(invoice.amount_paid)}
                      </td>
                    </tr>
                    <tr className="border-t-2 border-gray-300">
                      <td colSpan={3} className="px-4 py-4 text-right text-lg font-bold text-gray-900">
                        {isPaid ? 'PAID IN FULL' : 'Amount Due:'}
                      </td>
                      <td className="px-4 py-4 text-right text-xl font-bold text-red-600">
                        {isPaid ? formatCurrency(0) : formatCurrency(outstandingAmount)}
                      </td>
                    </tr>
                  </>
                )}
              </tfoot>
            </table>
          </div>
        </div>

        {/* Payment History */}
        {sortedPayments.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment History:</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              {sortedPayments.map((payment: any) => (
                <div key={payment.id} className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-medium text-gray-900">
                      {formatDate(payment.payment_date)}
                    </span>
                    <span className="text-gray-600 ml-2">
                      ({payment.payment_method})
                    </span>
                    {payment.reference && (
                      <span className="text-gray-500 ml-2 text-xs">
                        Ref: {payment.reference}
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-green-700">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes:</h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          </div>
        )}

        {/* Due Date Warning */}
        {!isPaid && (
          <div className={`mb-8 p-4 border rounded-lg ${
            isOverdue
              ? 'bg-red-50 border-red-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <p className={`text-sm font-medium ${
              isOverdue ? 'text-red-900' : 'text-gray-900'
            }`}>
              {isOverdue ? '⚠️ Payment Overdue' : 'Payment Due:'}{' '}
              <span className="font-bold">{formatDate(invoice.due_date)}</span>
            </p>
            {isOverdue && (
              <p className="text-xs text-red-700 mt-1">
                This invoice is overdue. Please make payment as soon as possible.
              </p>
            )}
          </div>
        )}

        {/* Banking Details */}
        {!isPaid && (
          <>
            {tenant?.banking_details ? (
              <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900 mb-3">
                  💳 Payment Details:
                </h3>
                <div className="text-sm text-gray-800 space-y-1">
                  <p>
                    <span className="font-medium">Bank:</span> {tenant.banking_details.bank_name}
                  </p>
                  <p>
                    <span className="font-medium">Account Holder:</span>{' '}
                    {tenant.banking_details.account_holder}
                  </p>
                  <p>
                    <span className="font-medium">Account Number:</span>{' '}
                    <span className="font-mono font-bold text-lg">{tenant.banking_details.account_number}</span>
                  </p>
                  <p>
                    <span className="font-medium">Branch Code:</span>{' '}
                    {tenant.banking_details.branch_code}
                  </p>
                  <p className="mt-3 text-xs text-gray-600">
                    Please use <span className="font-semibold">{invoice.invoice_number}</span> as your payment reference
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                  ⚠️ Payment Details Not Available
                </h3>
                <p className="text-sm text-yellow-800">
                  Banking details have not been configured yet. Please contact {tenant?.business_name || 'us'} for payment information.
                </p>
                {tenant?.phone && (
                  <p className="text-sm text-yellow-800 mt-2">
                    Phone: <a href={`tel:${tenant.phone}`} className="font-semibold hover:underline">{tenant.phone}</a>
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* Paid Status */}
        {isPaid && (
          <div className="mb-8 p-6 bg-green-50 border-2 border-green-500 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-700">✓ PAID IN FULL</p>
            <p className="text-sm text-green-600 mt-2">Thank you for your payment!</p>
          </div>
        )}

        {/* Footer */}
        <div className="pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
          <p className="font-medium">Thank you for your business!</p>
          {tenant?.phone && (
            <p className="mt-2">
              Questions? Contact us at{' '}
              <a href={`tel:${tenant.phone}`} className="text-blue-600 hover:underline">
                {tenant.phone}
              </a>
            </p>
          )}
          {tenant?.email && (
            <p className="mt-1">
              Email:{' '}
              <a href={`mailto:${tenant.email}`} className="text-blue-600 hover:underline">
                {tenant.email}
              </a>
            </p>
          )}
        </div>

        {/* Print Button */}
        <div className="mt-8 print:hidden">
          <PrintButton />
        </div>
      </div>
    </div>
  )
}
