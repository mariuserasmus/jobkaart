import { redirect } from 'next/navigation'
import { getTenantId, createServerClient } from '@/lib/db/supabase-server'
import { QuoteList } from '@/components/features/quotes/QuoteList'

export const metadata = {
  title: 'Quotes | JobKaart',
  description: 'Manage your quotes',
}

export default async function QuotesPage() {
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

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quotes</h1>
        <p className="text-gray-600 mt-2">
          Create and manage professional quotes for your customers
        </p>
      </div>

      {/* Quote List */}
      <QuoteList
        initialQuotes={quotes || []}
        initialTotal={count || 0}
      />
    </div>
  )
}
