import { createServerClient, getTenantId } from '@/lib/db/supabase-server'
import Link from 'next/link'
import { unstable_noStore as noStore } from 'next/cache'
import UsageMeter from '@/components/dashboard/UsageMeter'

// Ensure this page is never cached or statically generated
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'

export default async function DashboardPage() {
  // Opt out of caching for this page
  noStore()

  const tenantId = await getTenantId()
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get tenant subscription info for usage meter
  const { data: tenant } = await supabase
    .from('tenants')
    .select('subscription_status, subscription_tier')
    .eq('id', tenantId)
    .single()

  // Get start and end of current month
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const date = now.getDate()

  // Use consistent date calculations
  const startOfMonth = new Date(year, month, 1, 0, 0, 0).toISOString()
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString()

  // Get start and end of last month
  const startOfLastMonth = new Date(year, month - 1, 1, 0, 0, 0).toISOString()
  const endOfLastMonth = new Date(year, month, 0, 23, 59, 59).toISOString()

  // Get today's date for scheduled jobs
  const today = new Date(year, month, date).toISOString().split('T')[0]

  // Get end of this week (Sunday)
  const dayOfWeek = now.getDay()
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
  const endOfWeek = new Date(year, month, date + daysUntilSunday)
  const endOfWeekDate = endOfWeek.toISOString().split('T')[0]

  // 1. Calculate Outstanding Amount (from invoices)
  const { data: invoices } = await supabase
    .from('invoices')
    .select('total, amount_paid')
    .eq('tenant_id', tenantId)
    .neq('status', 'paid')

  const outstandingAmount = invoices?.reduce((sum, inv) => {
    return sum + (inv.total - inv.amount_paid)
  }, 0) || 0

  // 2. Calculate Revenue This Month (from payments)
  const { data: payments } = await supabase
    .from('payments')
    .select('amount')
    .eq('tenant_id', tenantId)
    .gte('payment_date', startOfMonth)
    .lte('payment_date', endOfMonth)

  const revenueThisMonth = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0

  // 2b. Calculate Revenue Last Month (for comparison)
  const { data: lastMonthPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('tenant_id', tenantId)
    .gte('payment_date', startOfLastMonth)
    .lte('payment_date', endOfLastMonth)

  const revenueLastMonth = lastMonthPayments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
  const revenueDifference = revenueThisMonth - revenueLastMonth

  // 3. Count Jobs This Month
  const { count: jobsThisMonth } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', startOfMonth)
    .lte('created_at', endOfMonth)

  // 4. Count Quotes Sent This Month
  const { count: quotesSentThisMonth } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .in('status', ['sent', 'viewed', 'accepted', 'rejected'])
    .gte('created_at', startOfMonth)
    .lte('created_at', endOfMonth)

  // 5. Today's Scheduled Jobs
  const { data: todaysJobs } = await supabase
    .from('jobs')
    .select(`
      id,
      job_number,
      status,
      scheduled_date,
      customers!inner(id, name, address, phone)
    `)
    .eq('tenant_id', tenantId)
    .eq('scheduled_date', today)
    .in('status', ['scheduled', 'in_progress'])
    .order('scheduled_date', { ascending: true })
    .limit(5)

  // 5b. This Week's Scheduled Jobs (excluding today)
  const { data: thisWeeksJobs } = await supabase
    .from('jobs')
    .select(`
      id,
      job_number,
      status,
      scheduled_date,
      customers!inner(id, name, address, phone)
    `)
    .eq('tenant_id', tenantId)
    .gt('scheduled_date', today)
    .lte('scheduled_date', endOfWeekDate)
    .in('status', ['scheduled', 'in_progress'])
    .order('scheduled_date', { ascending: true })
    .limit(10)

  // 6. Action Items

  // Quotes awaiting response (3+ days old)
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  const { data: quotesAwaitingResponse } = await supabase
    .from('quotes')
    .select(`
      id,
      quote_number,
      created_at,
      customers!inner(id, name)
    `)
    .eq('tenant_id', tenantId)
    .in('status', ['sent', 'viewed'])
    .lt('created_at', threeDaysAgo)
    .order('created_at', { ascending: true })
    .limit(5)

  // Jobs ready to invoice (status = complete)
  const { data: jobsToInvoice } = await supabase
    .from('jobs')
    .select(`
      id,
      job_number,
      total,
      customers!inner(id, name)
    `)
    .eq('tenant_id', tenantId)
    .eq('status', 'complete')
    .order('updated_at', { ascending: true })
    .limit(5)

  // Overdue invoices
  const { data: overdueInvoices } = await supabase
    .from('invoices')
    .select(`
      id,
      invoice_number,
      total,
      amount_paid,
      due_date,
      customers!inner(id, name)
    `)
    .eq('tenant_id', tenantId)
    .lt('due_date', today)
    .neq('status', 'paid')
    .order('due_date', { ascending: true })
    .limit(5)

  const formatCurrency = (amount: number) => {
    return `R${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-ZA', {
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDateWithDay = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-ZA', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const hasActionItems =
    (quotesAwaitingResponse?.length || 0) > 0 ||
    (jobsToInvoice?.length || 0) > 0 ||
    (overdueInvoices?.length || 0) > 0

  const hasTodaysJobs = (todaysJobs?.length || 0) > 0
  const hasThisWeeksJobs = (thisWeeksJobs?.length || 0) > 0

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Welcome back, {user?.user_metadata?.full_name || user?.email}!
        </p>
      </div>

      {/* FREE Tier Usage Meter */}
      {tenant && (
        <div className="mb-8">
          <UsageMeter
            subscriptionStatus={tenant.subscription_status}
            subscriptionTier={tenant.subscription_tier}
          />
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Outstanding Amount */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-red-500 text-white text-2xl font-bold">
                  R
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Customers Owe You
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900" suppressHydrationWarning>
                    {formatCurrency(outstandingAmount)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue This Month */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white text-2xl">
                  ✓
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Revenue This Month
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900" suppressHydrationWarning>
                    {formatCurrency(revenueThisMonth)}
                  </dd>
                  {revenueLastMonth > 0 && (
                    <dd className="mt-1 flex items-center text-sm">
                      {revenueDifference > 0 ? (
                        <>
                          <svg className="w-4 h-4 text-green-600 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-green-600 font-medium">
                            {formatCurrency(Math.abs(revenueDifference))} ahead
                          </span>
                        </>
                      ) : revenueDifference < 0 ? (
                        <>
                          <svg className="w-4 h-4 text-red-600 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-red-600 font-medium">
                            {formatCurrency(Math.abs(revenueDifference))} behind
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-600">Same as last month</span>
                      )}
                    </dd>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs This Month */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white text-2xl">
                  📋
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Jobs This Month
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900" suppressHydrationWarning>
                    {jobsThisMonth || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Quotes Sent */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-yellow-500 text-white text-2xl">
                  📄
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Quotes Sent
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900" suppressHydrationWarning>
                    {quotesSentThisMonth || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Jobs */}
      {hasTodaysJobs && (
        <div className="mb-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Today's Scheduled Jobs
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {todaysJobs?.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        {job.job_number}
                      </p>
                      <p className="text-sm text-gray-900 mt-1">
                        {(job.customers as any).name}
                      </p>
                      {(job.customers as any).address && (
                        <p className="text-xs text-gray-500 mt-1">
                          {(job.customers as any).address}
                        </p>
                      )}
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        job.status === 'scheduled'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {job.status === 'scheduled' ? 'Scheduled' : 'In Progress'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* This Week's Jobs */}
      {hasThisWeeksJobs && (
        <div className="mb-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                This Week's Scheduled Jobs
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {thisWeeksJobs?.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        {job.job_number}
                      </p>
                      <p className="text-sm text-gray-900 mt-1">
                        {(job.customers as any).name}
                      </p>
                      {(job.customers as any).address && (
                        <p className="text-xs text-gray-500 mt-1">
                          {(job.customers as any).address}
                        </p>
                      )}
                      {job.scheduled_date && (
                        <p className="text-xs text-blue-600 font-medium mt-1">
                          {formatDateWithDay(job.scheduled_date)}
                        </p>
                      )}
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        job.status === 'scheduled'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {job.status === 'scheduled' ? 'Scheduled' : 'In Progress'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Items */}
      {hasActionItems && (
        <div className="mb-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Action Needed
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {/* Quotes Awaiting Response */}
              {quotesAwaitingResponse && quotesAwaitingResponse.length > 0 && (
                <div className="px-6 py-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Quotes Waiting for Response ({quotesAwaitingResponse.length})
                  </h3>
                  <div className="space-y-2">
                    {quotesAwaitingResponse.map((quote) => (
                      <Link
                        key={quote.id}
                        href={`/quotes/${quote.id}`}
                        className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {quote.quote_number} - {(quote.customers as any).name}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Sent {formatDate(quote.created_at)} - Follow up now
                          </p>
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
                    ))}
                  </div>
                </div>
              )}

              {/* Jobs Ready to Invoice */}
              {jobsToInvoice && jobsToInvoice.length > 0 && (
                <div className="px-6 py-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Jobs Ready to Invoice ({jobsToInvoice.length})
                  </h3>
                  <div className="space-y-2">
                    {jobsToInvoice.map((job) => (
                      <Link
                        key={job.id}
                        href={`/jobs/${job.id}`}
                        className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {job.job_number} - {(job.customers as any).name}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {formatCurrency(job.total)} - Create invoice
                          </p>
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
                    ))}
                  </div>
                </div>
              )}

              {/* Overdue Invoices */}
              {overdueInvoices && overdueInvoices.length > 0 && (
                <div className="px-6 py-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Overdue Invoices ({overdueInvoices.length})
                  </h3>
                  <div className="space-y-2">
                    {overdueInvoices.map((invoice) => (
                      <Link
                        key={invoice.id}
                        href={`/invoices/${invoice.id}`}
                        className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {invoice.invoice_number} - {(invoice.customers as any).name}
                          </p>
                          <p className="text-xs text-red-600 mt-1">
                            {formatCurrency(invoice.total - invoice.amount_paid)} outstanding - Due {formatDate(invoice.due_date)}
                          </p>
                        </div>
                        <svg
                          className="w-5 h-5 text-red-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State - Only show if no data at all */}
      {!hasActionItems && !hasTodaysJobs && jobsThisMonth === 0 && quotesSentThisMonth === 0 && (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Welcome to JobKaart!
          </h3>
          <p className="text-gray-600 mb-6">
            Start by adding your first customer, then create quotes and track jobs.
          </p>
          <Link
            href="/customers/new"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Add Your First Customer
          </Link>
        </div>
      )}
    </div>
  )
}
