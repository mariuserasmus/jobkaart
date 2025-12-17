import { redirect } from 'next/navigation'
import { getTenantId, createServerClient } from '@/lib/db/supabase-server'
import { InvoiceList } from '@/components/features/invoices/InvoiceList'
import { InvoiceStatusBadge } from '@/components/features/invoices/InvoiceStatusBadge'
import Link from 'next/link'

export const metadata = {
  title: 'Invoices | JobKaart',
  description: 'Manage your invoices',
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ highlight?: string }>
}) {
  const params = await searchParams
  const tenantId = await getTenantId()

  if (!tenantId) {
    redirect('/auth/login')
  }

  const supabase = await createServerClient()

  // Fetch initial invoices with customer data and job details
  const { data: invoices, error, count } = await supabase
    .from('invoices')
    .select(`
      *,
      customers!inner(id, name, phone, email),
      jobs(id, job_number, title)
    `, { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching invoices:', error)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load invoices. Please try again.</p>
        </div>
      </div>
    )
  }

  // Get overdue invoices
  const today = new Date().toISOString().split('T')[0]
  const overdueInvoices = invoices?.filter(
    (inv) => inv.due_date < today && inv.status !== 'paid'
  ) || []

  const showHighlight = params.highlight === 'true'

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'R0.00'
    return `R${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return '1 day overdue'
    if (diffDays < 7) return `${diffDays} days overdue`
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7)
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} overdue`
    }
    const months = Math.floor(diffDays / 30)
    return `${months} ${months === 1 ? 'month' : 'months'} overdue`
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
        <p className="text-gray-600 mt-2">
          Create and manage invoices for your completed jobs
        </p>
      </div>

      {/* Highlighted Section - Overdue Invoices */}
      {showHighlight && overdueInvoices.length > 0 && (
        <div className="mb-6 bg-red-50 border-2 border-red-400 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-red-900 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 text-sm font-bold text-white bg-red-500 rounded-full">
                  {overdueInvoices.length}
                </span>
                Overdue Invoice{overdueInvoices.length !== 1 ? 's' : ''}
              </h2>
              <p className="text-red-800 mt-1 text-sm">
                {overdueInvoices.length === 1
                  ? 'This invoice is past its due date and needs immediate attention'
                  : `These ${overdueInvoices.length} invoices are past their due dates and need immediate attention`}
              </p>
            </div>
            <Link
              href="/invoices"
              className="text-red-700 hover:text-red-900 text-sm font-medium"
            >
              Clear
            </Link>
          </div>

          <div className="space-y-3">
            {overdueInvoices.map((invoice) => (
              <Link
                key={invoice.id}
                href={`/invoices/${invoice.id}`}
                className="block bg-white border border-red-300 rounded-lg p-4 hover:border-red-500 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-sm font-bold text-blue-600">
                        {invoice.invoice_number}
                      </p>
                      <InvoiceStatusBadge status="overdue" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {invoice.customers.name}
                    </p>
                    {invoice.jobs?.job_number && (
                      <p className="text-xs text-gray-600 mt-1">
                        Job: {invoice.jobs.job_number}
                      </p>
                    )}
                    <p className="text-xs text-red-700 mt-1 font-bold">
                      {formatDate(invoice.due_date)}
                    </p>
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-1">
                    <span className="text-lg font-bold text-red-600">
                      {formatCurrency(invoice.total)}
                    </span>
                    <button
                      className="text-xs text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md font-medium transition-colors"
                      onClick={(e) => {
                        e.preventDefault()
                        window.location.href = `/invoices/${invoice.id}?action=remind`
                      }}
                    >
                      Send Reminder
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Invoice List */}
      <InvoiceList
        initialInvoices={invoices || []}
        initialTotal={count || 0}
      />
    </div>
  )
}
