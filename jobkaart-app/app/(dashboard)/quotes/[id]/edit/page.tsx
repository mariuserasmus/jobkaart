'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QuoteForm } from '@/components/features/quotes/QuoteForm'

export default function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [quote, setQuote] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load quote data
  useState(() => {
    const loadQuote = async () => {
      try {
        const response = await fetch(`/api/quotes/${id}`)
        const result = await response.json()
        if (result.success) {
          const editableStatuses = ['draft', 'sent', 'viewed']
          if (!editableStatuses.includes(result.data.status)) {
            setError('Only draft, sent, or viewed quotes can be edited. This quote has been ' + result.data.status + '.')
          } else {
            setQuote(result.data)
          }
        } else {
          setError(result.error || 'Failed to load quote')
        }
      } catch (err) {
        setError('Failed to load quote')
      } finally {
        setLoading(false)
      }
    }
    loadQuote()
  })

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Loading quote...</p>
        </div>
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Quote not found'}</p>
          <Link href="/quotes" className="text-blue-600 hover:underline mt-2 inline-block">
            Back to Quotes
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/quotes" className="hover:text-blue-600 transition-colors">
            Quotes
          </Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href={`/quotes/${id}`} className="hover:text-blue-600 transition-colors">
            {quote.quote_number}
          </Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium">Edit</span>
        </nav>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Quote</h1>
        <p className="text-gray-600 mt-2">
          Update quote details for {quote.quote_number}
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Quote Details</CardTitle>
        </CardHeader>
        <CardContent>
          <QuoteForm mode="edit" quote={quote} />
        </CardContent>
      </Card>
    </div>
  )
}
