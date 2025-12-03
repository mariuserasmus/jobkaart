import { logAdminAction } from '@/lib/admin/auth'
import { getAllTenants } from '@/lib/admin/queries'
import { AdminTable } from '../components/AdminTable'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface SearchParams {
  search?: string
  status?: string
  tier?: string
}

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  // Log admin action
  await logAdminAction({
    action: 'view_tenants_list',
    metadata: { filters: params },
  })

  // Get all tenants with filters
  const { data: tenants, count } = await getAllTenants({
    search: params.search,
    status: params.status,
    tier: params.tier,
    limit: 100,
  })

  const formatCurrency = (amount: number) => {
    return `R${amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tenants</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage all tenant accounts ({count} total)
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <form method="GET" className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Business Name
            </label>
            <input
              type="text"
              id="search"
              name="search"
              defaultValue={params.search}
              placeholder="Search..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={params.status}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="cancelled">Cancelled</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {/* Tier Filter */}
          <div>
            <label htmlFor="tier" className="block text-sm font-medium text-gray-700 mb-1">
              Tier
            </label>
            <select
              id="tier"
              name="tier"
              defaultValue={params.tier}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Tiers</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="team">Team</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              Apply Filters
            </button>
            <Link
              href="/admin/tenants"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
            >
              Clear
            </Link>
          </div>
        </form>
      </div>

      {/* Tenants Table */}
      <AdminTable
        columns={[
          {
            header: 'Business Name',
            accessor: 'business_name',
            render: (value) => (
              <div>
                <div className="font-medium text-gray-900">{value}</div>
              </div>
            ),
          },
          {
            header: 'Subscription',
            accessor: 'subscription_tier',
            render: (value, row) => (
              <div>
                <div className="capitalize text-sm text-gray-900 font-medium">{value}</div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    row.subscription_status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : row.subscription_status === 'trial'
                      ? 'bg-blue-100 text-blue-800'
                      : row.subscription_status === 'overdue'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {row.subscription_status}
                </span>
              </div>
            ),
          },
          {
            header: 'Users',
            accessor: 'user_count',
            render: (value, row) => (
              <div className="text-sm">
                <div className="text-gray-900 font-medium">{value} total</div>
                <div className="text-gray-600 text-xs">{row.active_user_count} active</div>
              </div>
            ),
          },
          {
            header: 'Customers',
            accessor: 'customer_count',
            render: (value) => <span className="text-sm text-gray-900">{value}</span>,
          },
          {
            header: 'Activity (30d)',
            accessor: 'quotes_last_30_days',
            render: (value, row) => (
              <div className="text-xs text-gray-600">
                <div>{row.quotes_last_30_days} quotes</div>
                <div>{row.jobs_last_30_days} jobs</div>
                <div>{row.invoices_last_30_days} invoices</div>
              </div>
            ),
          },
          {
            header: 'Revenue (All Time)',
            accessor: 'total_revenue',
            render: (value) => (
              <span className="text-sm text-gray-900 font-medium">
                {formatCurrency(value)}
              </span>
            ),
          },
          {
            header: 'Last Activity',
            accessor: 'last_activity_at',
            render: (value) => (
              <span className="text-sm text-gray-600">{formatDate(value)}</span>
            ),
          },
          {
            header: 'Created',
            accessor: 'created_at',
            render: (value) => (
              <span className="text-sm text-gray-600">{formatDate(value)}</span>
            ),
          },
        ]}
        data={tenants}
        linkPrefix="/admin/tenants"
        emptyMessage="No tenants found matching your filters"
      />
    </div>
  )
}
