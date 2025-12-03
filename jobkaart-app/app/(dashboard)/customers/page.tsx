import { redirect } from 'next/navigation'
import { getTenantId, createServerClient } from '@/lib/db/supabase-server'
import { CustomerList } from '@/components/features/customers/CustomerList'
import type { Customer } from '@/types'

export const metadata = {
  title: 'Customers | JobKaart',
  description: 'Manage your customers',
}

export default async function CustomersPage() {
  const tenantId = await getTenantId()

  if (!tenantId) {
    redirect('/auth/login')
  }

  const supabase = await createServerClient()

  // Fetch initial customers
  const { data: customers, error, count } = await supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching customers:', error)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load customers. Please try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-600 mt-2">
          Manage your customer database and view their history
        </p>
      </div>

      {/* Customer List */}
      <CustomerList
        initialCustomers={customers as Customer[] || []}
        initialTotal={count || 0}
      />
    </div>
  )
}
