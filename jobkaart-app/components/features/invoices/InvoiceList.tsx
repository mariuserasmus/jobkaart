'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Invoice, InvoiceStatus, Customer, Job } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InvoiceStatusBadge } from './InvoiceStatusBadge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface InvoiceWithCustomer extends Invoice {
  customers: Customer
  jobs?: Job
}

interface InvoiceListProps {
  initialInvoices: InvoiceWithCustomer[]
  initialTotal: number
}

export function InvoiceList({ initialInvoices, initialTotal }: InvoiceListProps) {
  const [invoices, setInvoices] = useState(initialInvoices)
  const [total, setTotal] = useState(initialTotal)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'date' | 'job'>('date')

  // Auto-search as user types (with 300ms debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch()
    }, 300)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter])

  const formatCurrency = (amount: number) => {
    if (amount === undefined || amount === null) return 'R0.00'
    return `R${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
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

  const isOverdue = (invoice: Invoice) => {
    const dueDate = new Date(invoice.due_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return dueDate < today && invoice.status !== 'paid'
  }

  const getInvoiceStatus = (invoice: Invoice): InvoiceStatus => {
    // Check if overdue
    if (isOverdue(invoice)) {
      return 'overdue'
    }
    return invoice.status
  }

  const performSearch = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/invoices?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setInvoices(result.data)
        setTotal(result.pagination.total)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Group invoices by job
  const groupedByJob = () => {
    const grouped = new Map<string, InvoiceWithCustomer[]>()
    const standalone: InvoiceWithCustomer[] = []

    invoices.forEach((invoice) => {
      if (invoice.job_id && invoice.jobs) {
        const jobKey = invoice.job_id
        if (!grouped.has(jobKey)) {
          grouped.set(jobKey, [])
        }
        grouped.get(jobKey)!.push(invoice)
      } else {
        standalone.push(invoice)
      }
    })

    return { grouped, standalone }
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:w-auto">
          <Input
            type="text"
            placeholder="Search by invoice number or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <Link href="/invoices/new">
          <Button className="w-full sm:w-auto">
            + New Invoice
          </Button>
        </Link>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="viewed">Viewed</SelectItem>
              <SelectItem value="partially_paid">Partially Paid</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-600">
            {total} {total === 1 ? 'invoice' : 'invoices'} found
          </span>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('date')}
            className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
              viewMode === 'date'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            By Date
          </button>
          <button
            onClick={() => setViewMode('job')}
            className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
              viewMode === 'job'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            By Job
          </button>
        </div>
      </div>

      {/* Invoices List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Loading invoices...</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first invoice.
          </p>
          <div className="mt-6">
            <Link href="/invoices/new">
              <Button>+ Create Invoice</Button>
            </Link>
          </div>
        </div>
      ) : viewMode === 'date' ? (
        <div className="grid gap-4">
          {invoices.map((invoice) => {
            const displayStatus = getInvoiceStatus(invoice)
            const overdueFlag = isOverdue(invoice)
            const amountOutstanding = invoice.total - invoice.amount_paid

            return (
              <Link
                key={invoice.id}
                href={`/invoices/${invoice.id}`}
                className="block"
              >
                <div
                  className={`
                    p-4 border rounded-lg hover:shadow-md transition-all
                    ${overdueFlag ? 'border-red-300 bg-red-50 hover:border-red-400' : 'border-gray-200 hover:border-blue-300'}
                  `}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Invoice Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {invoice.invoice_number}
                        </h3>
                        <InvoiceStatusBadge status={displayStatus} />
                        {invoice.invoice_type === 'deposit' && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            Deposit {invoice.deposit_percentage && `(${invoice.deposit_percentage}%)`}
                          </span>
                        )}
                        {invoice.invoice_type === 'progress' && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                            Progress {invoice.deposit_percentage && `(${invoice.deposit_percentage}%)`}
                          </span>
                        )}
                        {invoice.invoice_type === 'balance' && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Final Balance
                          </span>
                        )}
                      </div>
                      {invoice.jobs && (
                        <p className="text-sm text-blue-600 mb-1 font-medium">
                          Job: {invoice.jobs.job_number}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Customer:</span> {invoice.customers.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Due date:</span> {formatDate(invoice.due_date)}
                        {overdueFlag && (
                          <span className="ml-2 text-red-600 font-medium">(OVERDUE)</span>
                        )}
                      </p>
                      {invoice.amount_paid > 0 && invoice.status !== 'paid' && (
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Paid:</span> {formatCurrency(invoice.amount_paid)} / {formatCurrency(invoice.total)}
                        </p>
                      )}
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${overdueFlag ? 'text-red-600' : 'text-blue-600'}`}>
                        {invoice.status === 'paid'
                          ? formatCurrency(invoice.total)
                          : formatCurrency(amountOutstanding)
                        }
                      </p>
                      {invoice.status !== 'paid' && invoice.amount_paid > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Outstanding
                        </p>
                      )}
                      {invoice.status === 'paid' && (
                        <p className="text-xs text-green-600 mt-1 font-medium">
                          PAID IN FULL
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Created {formatDate(invoice.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        // Grouped by Job View
        <div className="space-y-6">
          {(() => {
            const { grouped, standalone } = groupedByJob()

            return (
              <>
                {/* Job-grouped invoices */}
                {Array.from(grouped.entries()).map(([jobId, jobInvoices]) => {
                  const firstInvoice = jobInvoices[0]
                  const job = firstInvoice.jobs!
                  const totalInvoiced = jobInvoices.reduce((sum, inv) => sum + inv.total, 0)
                  const totalPaid = jobInvoices.reduce((sum, inv) => sum + inv.amount_paid, 0)
                  const totalOutstanding = totalInvoiced - totalPaid

                  return (
                    <div key={jobId} className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                      {/* Job Header */}
                      <div className="bg-blue-50 border-b border-blue-200 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-blue-900">
                              Job {job.job_number}
                            </h3>
                            <p className="text-sm text-blue-700 mt-1">
                              Customer: {firstInvoice.customers.name}
                            </p>
                            {job.title && (
                              <p className="text-sm text-gray-600 mt-1">
                                {job.title}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Total Invoiced</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalInvoiced)}</p>
                            {totalPaid > 0 && (
                              <p className="text-xs text-green-600 mt-1">
                                Paid: {formatCurrency(totalPaid)}
                              </p>
                            )}
                            {totalOutstanding > 0 && (
                              <p className="text-xs text-orange-600 font-medium mt-1">
                                Outstanding: {formatCurrency(totalOutstanding)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Job Invoices */}
                      <div className="divide-y divide-gray-200">
                        {jobInvoices.map((invoice) => {
                          const displayStatus = getInvoiceStatus(invoice)
                          const overdueFlag = isOverdue(invoice)
                          const amountOutstanding = invoice.total - invoice.amount_paid

                          return (
                            <Link
                              key={invoice.id}
                              href={`/invoices/${invoice.id}`}
                              className="block p-4 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h4 className="text-base font-semibold text-gray-900">
                                      {invoice.invoice_number}
                                    </h4>
                                    <InvoiceStatusBadge status={displayStatus} />
                                    {invoice.invoice_type === 'deposit' && (
                                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                        Deposit {invoice.deposit_percentage && `(${invoice.deposit_percentage}%)`}
                                      </span>
                                    )}
                                    {invoice.invoice_type === 'progress' && (
                                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                        Progress {invoice.deposit_percentage && `(${invoice.deposit_percentage}%)`}
                                      </span>
                                    )}
                                    {invoice.invoice_type === 'balance' && (
                                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                        Final Balance
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    Due: {formatDate(invoice.due_date)}
                                    {overdueFlag && (
                                      <span className="ml-2 text-red-600 font-medium">(OVERDUE)</span>
                                    )}
                                  </p>
                                  {invoice.amount_paid > 0 && invoice.status !== 'paid' && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      Paid: {formatCurrency(invoice.amount_paid)} / {formatCurrency(invoice.total)}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className={`text-xl font-bold ${overdueFlag ? 'text-red-600' : 'text-blue-600'}`}>
                                    {invoice.status === 'paid'
                                      ? formatCurrency(invoice.total)
                                      : formatCurrency(amountOutstanding)
                                    }
                                  </p>
                                  {invoice.status === 'paid' && (
                                    <p className="text-xs text-green-600 mt-1 font-medium">PAID</p>
                                  )}
                                </div>
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                {/* Standalone invoices (no job) */}
                {standalone.length > 0 && (
                  <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 border-b border-gray-200 p-4">
                      <h3 className="text-lg font-bold text-gray-900">
                        Invoices Without Jobs
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {standalone.length} {standalone.length === 1 ? 'invoice' : 'invoices'}
                      </p>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {standalone.map((invoice) => {
                        const displayStatus = getInvoiceStatus(invoice)
                        const overdueFlag = isOverdue(invoice)
                        const amountOutstanding = invoice.total - invoice.amount_paid

                        return (
                          <Link
                            key={invoice.id}
                            href={`/invoices/${invoice.id}`}
                            className="block p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h4 className="text-base font-semibold text-gray-900">
                                    {invoice.invoice_number}
                                  </h4>
                                  <InvoiceStatusBadge status={displayStatus} />
                                </div>
                                <p className="text-sm text-gray-600 mb-1">
                                  Customer: {invoice.customers.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Due: {formatDate(invoice.due_date)}
                                  {overdueFlag && (
                                    <span className="ml-2 text-red-600 font-medium">(OVERDUE)</span>
                                  )}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className={`text-xl font-bold ${overdueFlag ? 'text-red-600' : 'text-blue-600'}`}>
                                  {invoice.status === 'paid'
                                    ? formatCurrency(invoice.total)
                                    : formatCurrency(amountOutstanding)
                                  }
                                </p>
                                {invoice.status === 'paid' && (
                                  <p className="text-xs text-green-600 mt-1 font-medium">PAID</p>
                                )}
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
