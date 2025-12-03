'use client'

/**
 * Invoice Actions Component
 * Client-side actions for invoice detail page
 */

import { useState } from 'react'
import { Button } from '@/components/ui'
import { InvoiceStatus } from '@/types'

interface InvoiceActionsProps {
  invoiceId: string
  invoiceNumber: string
  status: InvoiceStatus
  outstandingAmount: number
  totalAmount: number
  dueDate: string
  customerPhone?: string
}

export function InvoiceActions({
  invoiceId,
  invoiceNumber,
  status,
  outstandingAmount,
  totalAmount,
  dueDate,
  customerPhone,
}: InvoiceActionsProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`)
      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Invoice-${invoiceNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setSuccessMessage('PDF downloaded successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setErrorMessage('Failed to download PDF')
      setTimeout(() => setErrorMessage(null), 3000)
    }
  }

  const handleSendWhatsApp = async () => {
    try {
      // Update invoice status to 'sent' before opening WhatsApp
      const response = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to update invoice status')
      }

      const result = await response.json()

      if (result.success) {
        // Show success message
        setSuccessMessage('Invoice marked as sent')
        setTimeout(() => setSuccessMessage(null), 3000)

        // Open WhatsApp
        const baseUrl = window.location.origin
        const invoiceLink = `${baseUrl}/invoices/view/${invoiceId}`

        const formatDate = (dateString: string) => {
          const date = new Date(dateString)
          return date.toLocaleDateString('en-ZA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        }

        const message = encodeURIComponent(
          `Hi! Here's your invoice ${invoiceNumber}\n\n${invoiceLink}\n\nTotal: R${totalAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}\nDue: ${formatDate(dueDate)}\n\nPlease click the link above to view your invoice and payment details.\n\nThank you!`
        )
        const phone = customerPhone?.replace(/\D/g, '')
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank')

        // Refresh page to show updated status
        setTimeout(() => window.location.reload(), 1000)
      } else {
        throw new Error(result.error || 'Failed to send invoice')
      }
    } catch (err) {
      setErrorMessage('Failed to send invoice. Please try again.')
      setTimeout(() => setErrorMessage(null), 3000)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>

      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {errorMessage}
        </div>
      )}

      <div className="space-y-3">
        {/* Send via WhatsApp */}
        {customerPhone && (
          <Button
            onClick={handleSendWhatsApp}
            variant="secondary"
            className="w-full bg-green-600 text-white hover:bg-green-700"
            size="sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Send via WhatsApp
          </Button>
        )}

        {/* Download PDF Button */}
        <Button
          onClick={handleDownloadPDF}
          variant="default"
          className="w-full"
          size="sm"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download PDF
        </Button>

        {/* Print Button */}
        <Button
          onClick={handlePrint}
          variant="outline"
          className="w-full"
          size="sm"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Print
        </Button>
      </div>

      {/* Outstanding Amount Highlight */}
      {outstandingAmount > 0 && status !== 'paid' && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-medium text-red-900 mb-1">
              Outstanding Amount
            </p>
            <p className="text-2xl font-bold text-red-700">
              R{outstandingAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </p>
          </div>
        </div>
      )}

      {/* Paid Status */}
      {status === 'paid' && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-medium text-green-900 text-center">
              Invoice Fully Paid
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
