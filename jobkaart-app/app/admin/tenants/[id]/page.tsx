import { logAdminAction } from '@/lib/admin/auth'
import { getTenantDetails, getTenantActivity } from '@/lib/admin/queries'
import { notFound } from 'next/navigation'
import { StatCard } from '../../components/AdminStats'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TenantDetailPage({ params }: PageProps) {
  const { id } = await params

  // Log admin action
  await logAdminAction({
    action: 'view_tenant_details',
    targetType: 'tenant',
    targetId: id,
  })

  // Get tenant details
  const tenantData = await getTenantDetails(id)

  if (!tenantData) {
    notFound()
  }

  const { tenant, stats, users } = tenantData

  // Get recent activity
  const activity = await getTenantActivity(id, 10)

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
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatShortDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-ZA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      trial: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800',
      overdue: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div>
      {/* Header with Back Button */}
      <div className="mb-6">
        <Link
          href="/admin/tenants"
          className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block"
        >
          ← Back to Tenants
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{tenant.business_name}</h1>
            <p className="mt-2 text-sm text-gray-600">
              Tenant ID: {tenant.id}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
                tenant.subscription_status
              )}`}
            >
              {tenant.subscription_status}
            </span>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 capitalize">
              {tenant.subscription_tier} tier
            </span>
          </div>
        </div>
      </div>

      {/* Tenant Information */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tenant Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500">Email</div>
            <div className="text-sm text-gray-900">{tenant.email || 'N/A'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Phone</div>
            <div className="text-sm text-gray-900">{tenant.phone || 'N/A'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Address</div>
            <div className="text-sm text-gray-900">{tenant.address || 'N/A'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">VAT Number</div>
            <div className="text-sm text-gray-900">
              {tenant.vat_number || 'Not VAT registered'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Subscription Started</div>
            <div className="text-sm text-gray-900">
              {formatShortDate(tenant.subscription_started_at)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Subscription Ends</div>
            <div className="text-sm text-gray-900">
              {formatShortDate(tenant.subscription_ends_at)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Created</div>
            <div className="text-sm text-gray-900">{formatShortDate(tenant.created_at)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Last Updated</div>
            <div className="text-sm text-gray-900">{formatShortDate(tenant.updated_at)}</div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="Total Users"
          value={stats?.user_count || 0}
          icon="👥"
          iconBgColor="bg-blue-500"
          description={`${stats?.active_user_count || 0} active`}
        />

        <StatCard
          title="Customers"
          value={stats?.customer_count || 0}
          icon="📇"
          iconBgColor="bg-purple-500"
        />

        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.total_revenue || 0)}
          icon="R"
          iconBgColor="bg-green-500"
          description={`${formatCurrency(stats?.revenue_last_30_days || 0)} last 30d`}
        />

        <StatCard
          title="Total Quotes"
          value={stats?.total_quotes || 0}
          icon="📄"
          iconBgColor="bg-yellow-500"
          description={`${stats?.quotes_last_30_days || 0} last 30d`}
        />
      </div>

      {/* Activity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Jobs</h3>
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {stats?.total_jobs || 0}
          </div>
          <div className="text-sm text-gray-600">
            {stats?.jobs_last_30_days || 0} created last 30 days
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Invoices</h3>
          <div className="text-3xl font-bold text-green-600 mb-2">
            {stats?.total_invoices || 0}
          </div>
          <div className="text-sm text-gray-600">
            {stats?.invoices_last_30_days || 0} created last 30 days
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Last Activity</h3>
          <div className="text-sm font-medium text-gray-900">
            {stats?.last_activity_at ? formatShortDate(stats.last_activity_at) : 'No activity'}
          </div>
        </div>
      </div>

      {/* Users */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Users ({users.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Login
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.full_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="capitalize px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        user.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.last_login_at ? formatShortDate(user.last_login_at) : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Quotes */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Quotes</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {activity.quotes.length > 0 ? (
              activity.quotes.map((quote) => (
                <div key={quote.id} className="px-6 py-3">
                  <div className="text-sm font-medium text-gray-900">{quote.quote_number}</div>
                  <div className="text-xs text-gray-600">{(quote.customers as any).name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatShortDate(quote.created_at)}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-4 text-sm text-gray-500">No quotes yet</div>
            )}
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Jobs</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {activity.jobs.length > 0 ? (
              activity.jobs.map((job) => (
                <div key={job.id} className="px-6 py-3">
                  <div className="text-sm font-medium text-gray-900">{job.job_number}</div>
                  <div className="text-xs text-gray-600">{(job.customers as any).name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatShortDate(job.created_at)}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-4 text-sm text-gray-500">No jobs yet</div>
            )}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {activity.invoices.length > 0 ? (
              activity.invoices.map((invoice) => (
                <div key={invoice.id} className="px-6 py-3">
                  <div className="text-sm font-medium text-gray-900">
                    {invoice.invoice_number}
                  </div>
                  <div className="text-xs text-gray-600">{(invoice.customers as any).name}</div>
                  <div className="text-xs font-medium text-green-600 mt-1">
                    {formatCurrency(invoice.total)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatShortDate(invoice.created_at)}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-4 text-sm text-gray-500">No invoices yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
