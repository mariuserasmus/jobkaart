import { createServerClient, getTenantId } from '@/lib/db/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { JobStatusBadge } from '@/components/features/jobs/JobStatusBadge'
import { JobStatusManager } from '@/components/features/jobs/JobStatusManager'
import { ScheduledDateEditor } from '@/components/features/jobs/ScheduledDateEditor'
import { JobPhotosSection } from '@/components/features/jobs/JobPhotosSection'
import { JobInvoicesSection } from '@/components/features/jobs/JobInvoicesSection'
import { JobActions } from './JobActions'

interface JobDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params
  const tenantId = await getTenantId()
  const supabase = await createServerClient()

  // Fetch job with related data
  const { data: job, error } = await supabase
    .from('jobs')
    .select(`
      *,
      customers!inner(id, name, phone, email, address),
      quotes(id, quote_number, total, line_items)
    `)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (error || !job) {
    notFound()
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'R0.00'
    return `R${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <Link href="/jobs" className="hover:text-gray-900">
            Jobs
          </Link>
          <span>/</span>
          <span className="text-gray-900">{job.job_number}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{job.job_number}</h1>
            {job.title && (
              <p className="mt-1 text-lg text-gray-600">{job.title}</p>
            )}
          </div>
          <JobStatusBadge status={job.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Management */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Job Status
            </h2>
            <JobStatusManager
              jobId={job.id}
              currentStatus={job.status}
              canCreateInvoice={job.status === 'complete'}
            />
          </div>

          {/* Job Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Job Details
            </h2>
            <dl className="space-y-4">
              {job.description && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {job.description}
                  </dd>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Scheduled Date</dt>
                  <dd className="mt-1">
                    <ScheduledDateEditor
                      jobId={job.id}
                      currentDate={job.scheduled_date}
                      jobStatus={job.status}
                    />
                  </dd>
                </div>
                {job.completed_date && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Completed Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatDate(job.completed_date)}
                    </dd>
                  </div>
                )}
              </div>
              {job.total && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Job Value</dt>
                  <dd className="mt-1 text-2xl font-bold text-gray-900">
                    {formatCurrency(job.total)}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDateTime(job.created_at)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Related Quote */}
          {job.quotes && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Related Quote
              </h2>
              <Link
                href={`/quotes/${job.quotes.id}`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-blue-600">
                    {job.quotes.quote_number}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatCurrency(job.quotes.total)}
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
            </div>
          )}

          {/* Invoices Section - Deposit & Balance */}
          <JobInvoicesSection
            jobId={job.id}
            jobTitle={job.title}
            jobStatus={job.status}
            quoteTotal={job.quotes?.total}
          />

          {/* Job Photos */}
          <JobPhotosSection jobId={job.id} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Customer
            </h2>
            <div className="space-y-3">
              <div>
                <Link
                  href={`/customers/${job.customers.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  {job.customers.name}
                </Link>
              </div>
              {job.customers.phone && (
                <div>
                  <dt className="text-xs text-gray-500">Phone</dt>
                  <dd className="mt-1">
                    <a
                      href={`tel:${job.customers.phone}`}
                      className="text-sm text-gray-900 hover:text-blue-600"
                    >
                      {job.customers.phone}
                    </a>
                  </dd>
                </div>
              )}
              {job.customers.email && (
                <div>
                  <dt className="text-xs text-gray-500">Email</dt>
                  <dd className="mt-1">
                    <a
                      href={`mailto:${job.customers.email}`}
                      className="text-sm text-gray-900 hover:text-blue-600"
                    >
                      {job.customers.email}
                    </a>
                  </dd>
                </div>
              )}
              {job.customers.address && (
                <div>
                  <dt className="text-xs text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {job.customers.address}
                  </dd>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
              <a
                href={`https://wa.me/${job.customers.phone?.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </a>
              <a
                href={`tel:${job.customers.phone}`}
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call
              </a>
            </div>
          </div>

          {/* Job Actions */}
          <JobActions
            jobId={job.id}
            jobNumber={job.job_number}
            jobStatus={job.status}
          />
        </div>
      </div>
    </div>
  )
}
