import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getTenantId, createServerClient } from '@/lib/db/supabase-server'
import { CustomerCard } from '@/components/features/customers/CustomerCard'
import { CustomerHistory } from '@/components/features/customers/CustomerHistory'
import { Button } from '@/components/ui/button'
import type { Customer, CustomerHistory as CustomerHistoryType } from '@/types'

export const metadata = {
  title: 'Customer Details | JobKaart',
  description: 'View customer details and history',
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const tenantId = await getTenantId()

  if (!tenantId) {
    redirect('/auth/login')
  }

  const supabase = await createServerClient()

  // Fetch customer
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (customerError || !customer) {
    notFound()
  }

  // Fetch quotes
  const { data: quotes } = await supabase
    .from('quotes')
    .select('*')
    .eq('customer_id', id)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  // Fetch jobs
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('customer_id', id)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  // Fetch invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('customer_id', id)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  // Calculate totals
  const total_paid = invoices?.reduce((sum, inv) => sum + Number(inv.amount_paid), 0) || 0
  const total_outstanding = invoices?.reduce((sum, inv) => {
    const outstanding = Number(inv.total) - Number(inv.amount_paid)
    return sum + (outstanding > 0 ? outstanding : 0)
  }, 0) || 0

  const history: CustomerHistoryType = {
    quotes: quotes || [],
    jobs: jobs || [],
    invoices: invoices || [],
    total_paid,
    total_outstanding,
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/customers" className="hover:text-blue-600 transition-colors">
            Customers
          </Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium">{customer.name}</span>
        </nav>
      </div>

      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Details</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/customers/${id}/edit`}>
            <Button variant="outline" size="sm">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </Button>
          </Link>
          <Link href={`/quotes/new?customerId=${id}`}>
            <Button size="sm">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Quote
            </Button>
          </Link>
        </div>
      </div>

      {/* Customer Card */}
      <div className="mb-6">
        <CustomerCard customer={customer as Customer} history={history} />
      </div>

      {/* Customer History */}
      <CustomerHistory history={history} />
    </div>
  )
}
