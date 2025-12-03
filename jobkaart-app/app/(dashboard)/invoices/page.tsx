import { redirect } from 'next/navigation'
import { getTenantId, createServerClient } from '@/lib/db/supabase-server'
import { InvoiceList } from '@/components/features/invoices/InvoiceList'

export const metadata = {
  title: 'Invoices | JobKaart',
  description: 'Manage your invoices',
}

export default async function InvoicesPage() {
  const tenantId = await getTenantId()

  if (!tenantId) {
    redirect('/auth/login')
  }

  const supabase = await createServerClient()

  // Fetch initial invoices with customer data
  const { data: invoices, error, count } = await supabase
    .from('invoices')
    .select(`
      *,
      customers!inner(id, name, phone, email),
      jobs(id, job_number)
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

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
        <p className="text-gray-600 mt-2">
          Create and manage invoices for your completed jobs
        </p>
      </div>

      {/* Invoice List */}
      <InvoiceList
        initialInvoices={invoices || []}
        initialTotal={count || 0}
      />
    </div>
  )
}
