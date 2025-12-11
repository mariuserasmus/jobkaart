import { createServerClient, getTenantId } from '@/lib/db/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { InvoiceStatusBadge } from '@/components/features/invoices/InvoiceStatusBadge'
import { InvoiceStatusManager } from '@/components/features/invoices/InvoiceStatusManager'
import { InvoiceActions } from './InvoiceActions'
import { Invoice, Payment, Customer, Job } from '@/types'
import { formatPhoneForWhatsApp } from '@/lib/utils'

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>
}

interface InvoiceWithRelations extends Invoice {
  customers: Customer
  jobs: Job | null
  payments: Payment[]
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = await params
  const tenantId = await getTenantId()
  const supabase = await createServerClient()

  // Fetch invoice with related data
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`
      *,
      customers!inner(id, name, phone, email, address),
      jobs(id, job_number, title),
      payments(id, amount, payment_date, payment_method, reference, created_at)
    `)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (error || !invoice) {
    notFound()
  }

  const typedInvoice = invoice as unknown as InvoiceWithRelations

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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const outstandingAmount = typedInvoice.total - typedInvoice.amount_paid

  // Sort payments by date (most recent first)
  const sortedPayments = [...typedInvoice.payments].sort(
    (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <Link href="/invoices" className="hover:text-gray-900">
            Invoices
          </Link>
          <span>/</span>
          <span className="text-gray-900">{typedInvoice.invoice_number}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{typedInvoice.invoice_number}</h1>
          </div>
          <InvoiceStatusBadge status={typedInvoice.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Status Management */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Invoice Status
            </h2>
            <InvoiceStatusManager
              invoiceId={typedInvoice.id}
              currentStatus={typedInvoice.status}
              amountPaid={typedInvoice.amount_paid}
              total={typedInvoice.total}
              dueDate={typedInvoice.due_date}
              invoiceNumber={typedInvoice.invoice_number}
              customerPhone={typedInvoice.customers.phone}
            />
          </div>

          {/* Invoice Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Invoice Details
            </h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Invoice Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(typedInvoice.created_at)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Due Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(typedInvoice.due_date)}
                </dd>
              </div>
              {typedInvoice.sent_at && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Sent Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(typedInvoice.sent_at)}
                  </dd>
                </div>
              )}
              {typedInvoice.paid_at && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Paid Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(typedInvoice.paid_at)}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Line Items */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Line Items
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
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
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {typedInvoice.line_items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {formatCurrency(item.quantity * item.unit_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                      Subtotal
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {formatCurrency(typedInvoice.subtotal)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                      VAT (15%)
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {formatCurrency(typedInvoice.vat_amount)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-base font-bold text-gray-900 text-right">
                      Total
                    </td>
                    <td className="px-4 py-3 text-base font-bold text-gray-900 text-right">
                      {formatCurrency(typedInvoice.total)}
                    </td>
                  </tr>
                  {typedInvoice.amount_paid > 0 && (
                    <>
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-sm font-medium text-green-700 text-right">
                          Amount Paid
                        </td>
                        <td className="px-4 py-3 text-sm text-green-700 text-right">
                          {formatCurrency(typedInvoice.amount_paid)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-base font-bold text-red-700 text-right">
                          Outstanding
                        </td>
                        <td className="px-4 py-3 text-base font-bold text-red-700 text-right">
                          {formatCurrency(outstandingAmount)}
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
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Payment History
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reference
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedPayments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatDate(payment.payment_date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 capitalize">
                          {payment.payment_method.replace('_', ' ')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {payment.reference || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                          {formatCurrency(payment.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Related Job */}
          {typedInvoice.jobs && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Related Job
              </h2>
              <Link
                href={`/jobs/${typedInvoice.jobs.id}`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-blue-600">
                    {typedInvoice.jobs.job_number}
                  </p>
                  {typedInvoice.jobs.title && (
                    <p className="text-sm text-gray-600 mt-1">
                      {typedInvoice.jobs.title}
                    </p>
                  )}
                </div>
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Customer
            </h2>
            <div className="space-y-3">
              <div>
                <Link
                  href={`/customers/${typedInvoice.customers.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  {typedInvoice.customers.name}
                </Link>
              </div>
              {typedInvoice.customers.phone && (
                <div>
                  <dt className="text-xs text-gray-500">Phone</dt>
                  <dd className="mt-1">
                    <a
                      href={`tel:${typedInvoice.customers.phone}`}
                      className="text-sm text-gray-900 hover:text-blue-600"
                    >
                      {typedInvoice.customers.phone}
                    </a>
                  </dd>
                </div>
              )}
              {typedInvoice.customers.email && (
                <div>
                  <dt className="text-xs text-gray-500">Email</dt>
                  <dd className="mt-1">
                    <a
                      href={`mailto:${typedInvoice.customers.email}`}
                      className="text-sm text-gray-900 hover:text-blue-600"
                    >
                      {typedInvoice.customers.email}
                    </a>
                  </dd>
                </div>
              )}
              {typedInvoice.customers.address && (
                <div>
                  <dt className="text-xs text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {typedInvoice.customers.address}
                  </dd>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
              <a
                href={`https://wa.me/${formatPhoneForWhatsApp(typedInvoice.customers.phone || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </a>
              <a
                href={`tel:${typedInvoice.customers.phone}`}
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call
              </a>
            </div>
          </div>

          {/* Actions */}
          <InvoiceActions
            invoiceId={typedInvoice.id}
            invoiceNumber={typedInvoice.invoice_number}
            status={typedInvoice.status}
            outstandingAmount={outstandingAmount}
            totalAmount={typedInvoice.total}
            dueDate={typedInvoice.due_date}
            customerPhone={typedInvoice.customers.phone}
          />
        </div>
      </div>
    </div>
  )
}
