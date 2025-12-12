import { logAdminAction } from '@/lib/admin/auth'
import { getSystemStats, getAllTenants } from '@/lib/admin/queries'
import { StatCard } from './components/AdminStats'
import { AdminTable } from './components/AdminTable'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminDashboardPage() {
  // Log admin dashboard access
  await logAdminAction({
    action: 'view_admin_dashboard',
  })

  // Get system-wide statistics
  const systemStats = await getSystemStats()

  // Get recent tenants
  const { data: tenants } = await getAllTenants({ limit: 10, sortBy: 'created_at' })

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
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          System-wide overview and key metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Tenants"
          value={systemStats?.total_tenants || 0}
          icon="🏢"
          iconBgColor="bg-blue-500"
          description={`${systemStats?.active_tenants || 0} active, ${systemStats?.free_tenants || 0} free`}
        />

        <StatCard
          title="MRR (Estimated)"
          value={formatCurrency(systemStats?.estimated_mrr || 0)}
          icon="R"
          iconBgColor="bg-green-500"
          description="Monthly Recurring Revenue"
        />

        <StatCard
          title="New Signups (30d)"
          value={systemStats?.new_tenants_last_30_days || 0}
          icon="📈"
          iconBgColor="bg-purple-500"
          description={`${systemStats?.new_users_last_30_days || 0} new users`}
        />

        <StatCard
          title="Total Users"
          value={systemStats?.total_users || 0}
          icon="👥"
          iconBgColor="bg-orange-500"
          description={`${systemStats?.active_users || 0} active users`}
        />
      </div>

      {/* Subscription Distribution */}
      <div className="mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Subscription Distribution
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {systemStats?.starter_tier_count || 0}
              </div>
              <div className="text-sm text-gray-600">Starter (R299/mo)</div>
              <div className="text-xs text-gray-500 mt-1">
                {formatCurrency((systemStats?.starter_tier_count || 0) * 299)} MRR
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {systemStats?.pro_tier_count || 0}
              </div>
              <div className="text-sm text-gray-600">Pro (R499/mo)</div>
              <div className="text-xs text-gray-500 mt-1">
                {formatCurrency((systemStats?.pro_tier_count || 0) * 499)} MRR
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {systemStats?.team_tier_count || 0}
              </div>
              <div className="text-sm text-gray-600">Team (R799/mo)</div>
              <div className="text-xs text-gray-500 mt-1">
                {formatCurrency((systemStats?.team_tier_count || 0) * 799)} MRR
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Stats (30 days) */}
      <div className="mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Platform Activity (Last 30 Days)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-900">
                {systemStats?.quotes_last_30_days || 0}
              </div>
              <div className="text-sm text-yellow-700">Quotes Created</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-900">
                {systemStats?.jobs_last_30_days || 0}
              </div>
              <div className="text-sm text-blue-700">Jobs Created</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-900">
                {systemStats?.invoices_last_30_days || 0}
              </div>
              <div className="text-sm text-green-700">Invoices Created</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tenants */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Tenants</h2>
          <Link
            href="/admin/tenants"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View All Tenants →
          </Link>
        </div>
        <AdminTable
          columns={[
            {
              header: 'Business Name',
              accessor: 'business_name',
              render: (value) => (
                <span className="font-medium text-gray-900">{value}</span>
              ),
            },
            {
              header: 'Subscription',
              accessor: 'subscription_tier',
              render: (value, row) => (
                <div>
                  <span className="capitalize text-sm text-gray-900">{value}</span>
                  <span
                    className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      row.subscription_status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : row.subscription_status === 'free'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
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
                <span className="text-sm text-gray-900">
                  {row.active_user_count}/{value}
                </span>
              ),
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
              header: 'Created',
              accessor: 'created_at',
              render: (value) => (
                <span className="text-sm text-gray-600">{formatDate(value)}</span>
              ),
            },
          ]}
          data={tenants}
          linkPrefix="/admin/tenants"
          emptyMessage="No tenants yet"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/admin/tenants"
          className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="text-lg font-semibold text-gray-900 mb-2">
            Manage Tenants
          </div>
          <div className="text-sm text-gray-600">
            View, search, and manage all tenant accounts
          </div>
        </Link>
        <Link
          href="/admin/analytics"
          className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="text-lg font-semibold text-gray-900 mb-2">
            View Analytics
          </div>
          <div className="text-sm text-gray-600">
            Detailed charts and usage statistics
          </div>
        </Link>
        <div className="bg-gray-100 shadow rounded-lg p-6">
          <div className="text-lg font-semibold text-gray-400 mb-2">
            Support Tools
          </div>
          <div className="text-sm text-gray-500">Coming soon</div>
        </div>
      </div>
    </div>
  )
}
