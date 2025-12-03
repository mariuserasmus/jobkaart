'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CustomerHistory as CustomerHistoryType } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CustomerHistoryProps {
  history: CustomerHistoryType
}

type TabType = 'all' | 'quotes' | 'jobs' | 'invoices'

export function CustomerHistory({ history }: CustomerHistoryProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all')

  const getQuoteStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      viewed: 'bg-purple-100 text-purple-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-orange-100 text-orange-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getJobStatusColor = (status: string) => {
    const colors = {
      quoted: 'bg-yellow-100 text-yellow-800',
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-orange-100 text-orange-800',
      complete: 'bg-green-100 text-green-800',
      invoiced: 'bg-purple-100 text-purple-800',
      paid: 'bg-gray-100 text-gray-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getInvoiceStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      viewed: 'bg-purple-100 text-purple-800',
      partially_paid: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const tabs = [
    { id: 'all' as TabType, label: 'All Activity', count: history.quotes.length + history.jobs.length + history.invoices.length },
    { id: 'quotes' as TabType, label: 'Quotes', count: history.quotes.length },
    { id: 'jobs' as TabType, label: 'Jobs', count: history.jobs.length },
    { id: 'invoices' as TabType, label: 'Invoices', count: history.invoices.length },
  ]

  // Combine and sort all activities by date
  const allActivities = [
    ...history.quotes.map((q) => ({ type: 'quote' as const, data: q, date: q.created_at })),
    ...history.jobs.map((j) => ({ type: 'job' as const, data: j, date: j.created_at })),
    ...history.invoices.map((i) => ({ type: 'invoice' as const, data: i, date: i.created_at })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const filteredActivities = activeTab === 'all'
    ? allActivities
    : allActivities.filter((a) => a.type === activeTab.slice(0, -1))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity History</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
              <span className="ml-2 text-sm opacity-80">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Activity List */}
        {filteredActivities.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
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
            <p className="mt-4 text-gray-600">
              No {activeTab === 'all' ? 'activity' : activeTab} yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((activity, index) => {
              if (activity.type === 'quote') {
                const quote = activity.data
                return (
                  <Link
                    key={`quote-${quote.id}`}
                    href={`/quotes/${quote.id}`}
                    className="block p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-yellow-900">
                            Quote {quote.quote_number}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getQuoteStatusColor(quote.status)}`}>
                            {formatStatus(quote.status)}
                          </span>
                        </div>
                        <p className="text-sm text-yellow-700">
                          {formatDate(quote.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-yellow-900">
                          {formatCurrency(Number(quote.total))}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              }

              if (activity.type === 'job') {
                const job = activity.data
                return (
                  <Link
                    key={`job-${job.id}`}
                    href={`/jobs/${job.id}`}
                    className="block p-4 bg-blue-50 border border-blue-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-blue-900">
                            Job {job.job_number}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getJobStatusColor(job.status)}`}>
                            {formatStatus(job.status)}
                          </span>
                        </div>
                        <p className="font-medium text-blue-900 mb-1">{job.title}</p>
                        <p className="text-sm text-blue-700">
                          {formatDate(job.created_at)}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              }

              if (activity.type === 'invoice') {
                const invoice = activity.data
                const outstanding = Number(invoice.total) - Number(invoice.amount_paid)
                return (
                  <Link
                    key={`invoice-${invoice.id}`}
                    href={`/invoices/${invoice.id}`}
                    className="block p-4 bg-purple-50 border border-purple-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-purple-900">
                            Invoice {invoice.invoice_number}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getInvoiceStatusColor(invoice.status)}`}>
                            {formatStatus(invoice.status)}
                          </span>
                        </div>
                        <p className="text-sm text-purple-700">
                          {formatDate(invoice.created_at)}
                        </p>
                        {outstanding > 0 && (
                          <p className="text-sm text-orange-600 mt-1 font-medium">
                            Outstanding: {formatCurrency(outstanding)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-purple-900">
                          {formatCurrency(Number(invoice.total))}
                        </p>
                        {Number(invoice.amount_paid) > 0 && (
                          <p className="text-sm text-green-600 mt-1">
                            Paid: {formatCurrency(Number(invoice.amount_paid))}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              }

              return null
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
