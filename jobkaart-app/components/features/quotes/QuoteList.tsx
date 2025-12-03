'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Quote, QuoteStatus, Customer } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { QuoteStatusBadge } from './QuoteStatusBadge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface QuoteWithCustomer extends Quote {
  customers: Customer
}

interface QuoteListProps {
  initialQuotes: QuoteWithCustomer[]
  initialTotal: number
}

export function QuoteList({ initialQuotes, initialTotal }: QuoteListProps) {
  const [quotes, setQuotes] = useState(initialQuotes)
  const [total, setTotal] = useState(initialTotal)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [loading, setLoading] = useState(false)

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
    const date = new Date(dateString)
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const isExpired = (quote: Quote) => {
    const validUntil = new Date(quote.valid_until)
    return validUntil < new Date() && (quote.status === 'draft' || quote.status === 'sent' || quote.status === 'viewed')
  }

  const performSearch = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/quotes?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setQuotes(result.data.quotes)
        setTotal(result.data.total)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:w-auto">
          <Input
            type="text"
            placeholder="Search by quote number or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <Link href="/quotes/new">
          <Button className="w-full sm:w-auto">
            + New Quote
          </Button>
        </Link>
      </div>

      {/* Filters */}
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
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-600">
          {total} {total === 1 ? 'quote' : 'quotes'} found
        </span>
      </div>

      {/* Quotes List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Loading quotes...</p>
        </div>
      ) : quotes.length === 0 ? (
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">No quotes found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first quote.
          </p>
          <div className="mt-6">
            <Link href="/quotes/new">
              <Button>+ Create Quote</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {quotes.map((quote) => (
            <Link
              key={quote.id}
              href={`/quotes/${quote.id}`}
              className="block"
            >
              <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Quote Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {quote.quote_number}
                      </h3>
                      <QuoteStatusBadge
                        status={isExpired(quote) ? 'expired' : quote.status}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Customer:</span> {quote.customers.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Valid until:</span> {formatDate(quote.valid_until)}
                      {isExpired(quote) && (
                        <span className="ml-2 text-red-600 font-medium">(Expired)</span>
                      )}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(quote.total)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Created {formatDate(quote.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
