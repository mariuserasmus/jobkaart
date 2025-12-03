'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QuoteStatusBadge } from '@/components/features/quotes/QuoteStatusBadge'
import { QuoteLineItems } from '@/components/features/quotes/QuoteLineItems'

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [quote, setQuote] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load quote data
  useState(() => {
    const loadQuote = async () => {
      try {
        const response = await fetch(`/api/quotes/${id}`)
        const result = await response.json()
        if (result.success) {
          setQuote(result.data)
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const isExpired = () => {
    if (!quote) return false
    const validUntil = new Date(quote.valid_until)
    return validUntil < new Date() && (quote.status === 'draft' || quote.status === 'sent' || quote.status === 'viewed')
  }

  const handleAccept = async () => {
    if (!confirm('Mark this quote as accepted?')) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/quotes/${id}/accept`, {
        method: 'POST',
      })
      const result = await response.json()
      if (result.success) {
        setQuote(result.data)
        alert('Quote accepted successfully!')
      } else {
        alert(result.error || 'Failed to accept quote')
      }
    } catch (err) {
      alert('Failed to accept quote')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDecline = async () => {
    if (!confirm('Mark this quote as declined?')) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/quotes/${id}/decline`, {
        method: 'POST',
      })
      const result = await response.json()
      if (result.success) {
        setQuote(result.data)
        alert('Quote declined')
      } else {
        alert(result.error || 'Failed to decline quote')
      }
    } catch (err) {
      alert('Failed to decline quote')
    } finally {
      setActionLoading(false)
    }
  }

  const handleConvertToJob = async () => {
    if (!confirm('Convert this quote to a job?')) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/quotes/${id}/convert-to-job`, {
        method: 'POST',
      })
      const result = await response.json()
      if (result.success) {
        alert('Quote converted to job successfully!')
        router.push(`/jobs/${result.data.job.id}`)
      } else {
        alert(result.error || 'Failed to convert quote')
      }
    } catch (err) {
      alert('Failed to convert quote')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this quote? This action cannot be undone.')) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/quotes/${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (result.success) {
        router.push('/quotes')
      } else {
        alert(result.error || 'Failed to delete quote')
      }
    } catch (err) {
      alert('Failed to delete quote')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSendWhatsApp = async () => {
    if (!quote) return

    try {
      setActionLoading(true)

      // Update quote status to 'sent' before opening WhatsApp
      const response = await fetch(`/api/quotes/${id}/send`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to update quote status')
      }

      const result = await response.json()

      if (result.success) {
        // Update local state with new status
        setQuote(result.data)

        // Open WhatsApp
        const publicUrl = `${window.location.origin}/quotes/view/${id}`
        const message = `Hi ${quote.customers.name}, here's your quote: ${publicUrl}`
        const phone = quote.customers.phone.replace(/\D/g, '')
        const waPhone = phone.startsWith('27') ? phone : `27${phone.replace(/^0/, '')}`
        const whatsappUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`

        window.open(whatsappUrl, '_blank')
      } else {
        throw new Error(result.error || 'Failed to send quote')
      }
    } catch (error) {
      console.error('Error sending quote:', error)
      alert('Failed to send quote. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/quotes/${id}/pdf`)
      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Quote-${quote.quote_number}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Failed to download PDF')
    }
  }

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
          <span className="text-gray-900 font-medium">{quote.quote_number}</span>
        </nav>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{quote.quote_number}</h1>
            <QuoteStatusBadge status={isExpired() ? 'expired' : quote.status} />
          </div>
          <p className="text-gray-600">
            Created on {formatDate(quote.created_at)}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button onClick={handleSendWhatsApp} variant="default">
          Send via WhatsApp
        </Button>
        <Button onClick={handleDownloadPDF} variant="outline">
          Download PDF
        </Button>
        {(quote.status === 'draft' || quote.status === 'sent' || quote.status === 'viewed') && (
          <>
            <Link href={`/quotes/${id}/edit`}>
              <Button variant="outline">Edit Quote</Button>
            </Link>
            <Button onClick={handleAccept} variant="outline" disabled={actionLoading}>
              Accept Quote
            </Button>
            <Button onClick={handleDecline} variant="outline" disabled={actionLoading}>
              Decline Quote
            </Button>
          </>
        )}
        {quote.status === 'accepted' && (
          <Button onClick={handleConvertToJob} variant="success" disabled={actionLoading}>
            Convert to Job
          </Button>
        )}
        <Button onClick={handleDelete} variant="destructive" disabled={actionLoading}>
          Delete
        </Button>
      </div>

      {/* Expired Warning */}
      {isExpired() && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">
            This quote expired on {formatDate(quote.valid_until)}
          </p>
        </div>
      )}

      {/* Customer Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Customer Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="font-medium text-gray-700">Name:</span>{' '}
            <span className="text-gray-900">{quote.customers.name}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Phone:</span>{' '}
            <span className="text-gray-900">{quote.customers.phone}</span>
          </div>
          {quote.customers.email && (
            <div>
              <span className="font-medium text-gray-700">Email:</span>{' '}
              <span className="text-gray-900">{quote.customers.email}</span>
            </div>
          )}
          {quote.customers.address && (
            <div>
              <span className="font-medium text-gray-700">Address:</span>{' '}
              <span className="text-gray-900">{quote.customers.address}</span>
            </div>
          )}
          <div className="pt-2">
            <Link href={`/customers/${quote.customer_id}`} className="text-blue-600 hover:underline text-sm">
              View Customer Profile
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quote Details</CardTitle>
        </CardHeader>
        <CardContent>
          <QuoteLineItems
            items={quote.line_items || []}
            subtotal={quote.subtotal}
            vatAmount={quote.vat_amount}
            total={quote.total}
          />
        </CardContent>
      </Card>

      {/* Notes */}
      {quote.notes && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Terms & Conditions */}
      {quote.terms_and_conditions && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{quote.terms_and_conditions}</p>
          </CardContent>
        </Card>
      )}

      {/* Valid Until */}
      <Card>
        <CardHeader>
          <CardTitle>Quote Validity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            This quote is valid until <span className="font-semibold">{formatDate(quote.valid_until)}</span>
            {isExpired() && <span className="text-red-600 ml-2">(Expired)</span>}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
