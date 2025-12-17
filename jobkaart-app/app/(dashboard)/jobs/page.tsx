import { createServerClient, getTenantId } from '@/lib/db/supabase-server'
import Link from 'next/link'
import { JobStatusBadge } from '@/components/features/jobs/JobStatusBadge'

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ highlight?: string }>
}) {
  const params = await searchParams
  const tenantId = await getTenantId()
  const supabase = await createServerClient()

  // Fetch all jobs with quotes and invoices for invoice progress tracking
  const { data: jobs } = await supabase
    .from('jobs')
    .select(`
      *,
      customers!inner(id, name, phone, address),
      quotes(id, total),
      invoices(total)
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'R0.00'
    return `R${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Calculate invoice progress for a job
  const calculateInvoiceProgress = (job: any) => {
    const quoteTotal = job.quotes?.total || 0
    const invoices = job.invoices || []
    const totalInvoiced = invoices.reduce((sum: number, inv: any) => sum + inv.total, 0)

    if (quoteTotal === 0) return null

    const percentage = Math.round((totalInvoiced / quoteTotal) * 100)
    const remaining = quoteTotal - totalInvoiced

    return {
      quoteTotal,
      totalInvoiced,
      remaining,
      percentage,
      hasInvoices: invoices.length > 0,
    }
  }

  // Group jobs by status for pipeline view
  const jobsByStatus = {
    quoted: jobs?.filter(j => j.status === 'quoted') || [],
    scheduled: jobs?.filter(j => j.status === 'scheduled') || [],
    in_progress: jobs?.filter(j => j.status === 'in_progress') || [],
    complete: jobs?.filter(j => j.status === 'complete') || [],
    invoiced: jobs?.filter(j => j.status === 'invoiced') || [],
    paid: jobs?.filter(j => j.status === 'paid') || [],
  }

  const statusLabels = {
    quoted: 'Quoted',
    scheduled: 'Scheduled',
    in_progress: 'In Progress',
    complete: 'Complete',
    invoiced: 'Invoiced',
    paid: 'Paid',
  }

  const showHighlight = params.highlight === 'true'
  const jobsToInvoice = jobsByStatus.complete

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
          <p className="mt-2 text-sm text-gray-600">
            Track your jobs from quote to payment
          </p>
        </div>
      </div>

      {/* Highlighted Section - Jobs Ready to Invoice */}
      {showHighlight && jobsToInvoice.length > 0 && (
        <div className="mb-8 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-yellow-900 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 text-sm font-bold text-white bg-red-500 rounded-full">
                  {jobsToInvoice.length}
                </span>
                Job{jobsToInvoice.length !== 1 ? 's' : ''} Ready to Invoice
              </h2>
              <p className="text-yellow-800 mt-1 text-sm">
                {jobsToInvoice.length === 1
                  ? 'This job is complete and ready to be invoiced'
                  : `These ${jobsToInvoice.length} jobs are complete and ready to be invoiced`}
              </p>
            </div>
            <Link
              href="/jobs"
              className="text-yellow-700 hover:text-yellow-900 text-sm font-medium"
            >
              Clear
            </Link>
          </div>

          <div className="space-y-3">
            {jobsToInvoice.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block bg-white border border-yellow-300 rounded-lg p-4 hover:border-yellow-500 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-sm font-bold text-blue-600">
                        {job.job_number}
                      </p>
                      <JobStatusBadge status={job.status} />
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {job.customers.name}
                    </p>
                    {job.title && (
                      <p className="text-sm text-gray-600 mt-1">
                        {job.title}
                      </p>
                    )}
                    {job.completed_date && (
                      <p className="text-xs text-yellow-700 mt-1 font-medium">
                        Completed: {formatDate(job.completed_date)} - Invoice now!
                      </p>
                    )}
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-1">
                    {job.total && (
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(job.total)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {jobs && jobs.length > 0 ? (
        <>
          {/* Stats Summary */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-8">
            {(Object.keys(jobsByStatus) as Array<keyof typeof jobsByStatus>).map((status) => (
              <div key={status} className="bg-white rounded-lg shadow p-4">
                <div className="text-2xl font-bold text-gray-900">
                  {jobsByStatus[status].length}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {statusLabels[status]}
                </div>
              </div>
            ))}
          </div>

          {/* Pipeline View */}
          <div className="space-y-8">
            {(Object.keys(jobsByStatus) as Array<keyof typeof jobsByStatus>).map((status) => {
              const statusJobs = jobsByStatus[status]
              if (statusJobs.length === 0) return null

              return (
                <div key={status} className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {statusLabels[status]}
                      </h2>
                      <span className="text-sm text-gray-600">
                        {statusJobs.length} {statusJobs.length === 1 ? 'job' : 'jobs'}
                      </span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {statusJobs.map((job) => (
                      <Link
                        key={job.id}
                        href={`/jobs/${job.id}`}
                        className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <p className="text-sm font-medium text-blue-600">
                                {job.job_number}
                              </p>
                              <JobStatusBadge status={job.status} />
                            </div>
                            <p className="text-sm font-medium text-gray-900">
                              {job.customers.name}
                            </p>
                            {job.title && (
                              <p className="text-sm text-gray-600 mt-1">
                                {job.title}
                              </p>
                            )}
                            {job.customers.address && (
                              <p className="text-xs text-gray-500 mt-1">
                                {job.customers.address}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              {job.scheduled_date && (
                                <span>Scheduled: {formatDate(job.scheduled_date)}</span>
                              )}
                              {job.completed_date && (
                                <span>Completed: {formatDate(job.completed_date)}</span>
                              )}
                            </div>
                            {(() => {
                              const progress = calculateInvoiceProgress(job)
                              if (progress && progress.hasInvoices) {
                                return (
                                  <div className="mt-2">
                                    <div className="flex items-center gap-2 text-xs">
                                      <span className="text-gray-600">Invoice Progress:</span>
                                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[120px]">
                                        <div
                                          className={`h-full ${
                                            progress.percentage === 100
                                              ? 'bg-green-500'
                                              : progress.percentage >= 50
                                              ? 'bg-blue-500'
                                              : 'bg-orange-500'
                                          }`}
                                          style={{ width: `${progress.percentage}%` }}
                                        />
                                      </div>
                                      <span className="font-medium text-gray-700">{progress.percentage}%</span>
                                    </div>
                                    {progress.remaining > 0 && (
                                      <div className="text-xs text-orange-600 mt-1">
                                        ⚠️ {formatCurrency(progress.remaining)} not yet invoiced
                                      </div>
                                    )}
                                  </div>
                                )
                              }
                              return null
                            })()}
                          </div>
                          <div className="ml-4 flex flex-col items-end gap-2">
                            {job.total && (
                              <span className="text-lg font-semibold text-gray-900">
                                {formatCurrency(job.total)}
                              </span>
                            )}
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
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Jobs Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Jobs are created when you convert accepted quotes. Start by creating a quote and accepting it.
          </p>
          <Link
            href="/quotes"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Go to Quotes
          </Link>
        </div>
      )}
    </div>
  )
}
