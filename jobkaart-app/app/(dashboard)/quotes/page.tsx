import { redirect } from 'next/navigation'
import { getTenantId, createServerClient } from '@/lib/db/supabase-server'
import { QuoteList } from '@/components/features/quotes/QuoteList'
import Link from 'next/link'

export const metadata = {
  title: 'Quotes | JobKaart',
  description: 'Manage your quotes',
}

export default async function QuotesPage({
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

  // Fetch initial quotes with customer data
  const { data: quotes, error, count } = await supabase
    .from('quotes')
    .select(`
      *,
      customers!inner(id, name, phone)
    `, { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching quotes:', error)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load quotes. Please try again.</p>
        </div>
      </div>
    )
  }

  // Get quotes needing follow-up (3+ days old, sent/viewed status)
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  const quotesNeedingFollowUp = quotes?.filter(
    (q) =>
      (q.status === 'sent' || q.status === 'viewed') &&
      new Date(q.created_at) < new Date(threeDaysAgo)
  ) || []

  const showHighlight = params.highlight === 'true'

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'R0.00'
    return `R${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`

    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quotes</h1>
        <p className="text-gray-600 mt-2">
          Create and manage professional quotes for your customers
        </p>
      </div>

      {/* Highlighted Section - Quotes Needing Follow-Up */}
      {showHighlight && quotesNeedingFollowUp.length > 0 && (
        <div className="mb-6 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-yellow-900 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 text-sm font-bold text-white bg-red-500 rounded-full">
                  {quotesNeedingFollowUp.length}
                </span>
                Quote{quotesNeedingFollowUp.length !== 1 ? 's' : ''} Needing Follow-Up
              </h2>
              <p className="text-yellow-800 mt-1 text-sm">
                These quotes were sent 3+ days ago and haven't been accepted yet
              </p>
            </div>
            <Link
              href="/quotes"
              className="text-yellow-700 hover:text-yellow-900 text-sm font-medium"
            >
              Clear
            </Link>
          </div>

          <div className="space-y-3">
            {quotesNeedingFollowUp.map((quote) => (
              <Link
                key={quote.id}
                href={`/quotes/${quote.id}`}
                className="block bg-white border border-yellow-300 rounded-lg p-4 hover:border-yellow-500 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-sm font-bold text-blue-600">
                        {quote.quote_number}
                      </p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        quote.status === 'sent'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {quote.status === 'sent' ? 'Sent' : 'Viewed'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {quote.customers.name}
                    </p>
                    <p className="text-xs text-yellow-700 mt-1 font-medium">
                      Sent {formatDate(quote.created_at)} - Follow up now!
                    </p>
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-1">
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(quote.total)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quote List */}
      <QuoteList
        initialQuotes={quotes || []}
        initialTotal={count || 0}
      />
    </div>
  )
}
