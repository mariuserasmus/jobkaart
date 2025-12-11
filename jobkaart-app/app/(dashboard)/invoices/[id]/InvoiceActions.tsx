'use client'

/**
 * Invoice Actions Component
 * Client-side actions for invoice detail page
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { InvoiceStatus } from '@/types'
import { formatPhoneForWhatsApp } from '@/lib/utils'

interface InvoiceActionsProps {
  invoiceId: string
  invoiceNumber: string
  status: InvoiceStatus
  outstandingAmount: number
  totalAmount: number
  dueDate: string
  customerPhone?: string
}

const statusFlow: Record<InvoiceStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-yellow-500' },
  sent: { label: 'Sent', color: 'bg-blue-500' },
  viewed: { label: 'Viewed', color: 'bg-purple-500' },
  partially_paid: { label: 'Partially Paid', color: 'bg-orange-500' },
  paid: { label: 'Paid', color: 'bg-green-500' },
  overdue: { label: 'Overdue', color: 'bg-red-500' },
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
  const router = useRouter()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [forceDelete, setForceDelete] = useState(false)

  const updateStatus = async (newStatus: InvoiceStatus) => {
    setUpdating(true)
    setErrorMessage(null)

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const result = await response.json()

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to update status')
        setTimeout(() => setErrorMessage(null), 3000)
        return
      }

      setSuccessMessage('Status updated successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
      router.refresh()
    } catch (err) {
      console.error('Error updating status:', err)
      setErrorMessage('Failed to update status')
      setTimeout(() => setErrorMessage(null), 3000)
    } finally {
      setUpdating(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // PDF download temporarily disabled due to React-PDF compatibility issues
  // Use the Print button instead
  // const handleDownloadPDF = async () => {
  //   try {
  //     const response = await fetch(`/api/invoices/${invoiceId}/pdf`)
  //     if (!response.ok) {
  //       throw new Error('Failed to generate PDF')
  //     }

  //     const blob = await response.blob()
  //     const url = window.URL.createObjectURL(blob)
  //     const link = document.createElement('a')
  //     link.href = url
  //     link.download = `Invoice-${invoiceNumber}.pdf`
  //     document.body.appendChild(link)
  //     link.click()
  //     document.body.removeChild(link)
  //     window.URL.revokeObjectURL(url)

  //     setSuccessMessage('PDF downloaded successfully')
  //     setTimeout(() => setSuccessMessage(null), 3000)
  //   } catch (err) {
  //     setErrorMessage('Failed to download PDF')
  //     setTimeout(() => setErrorMessage(null), 3000)
  //   }
  // }

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
        const formattedPhone = formatPhoneForWhatsApp(customerPhone || '')
        window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank')

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

  const handleDelete = async () => {
    setDeleting(true)
    setErrorMessage(null)

    try {
      const url = forceDelete
        ? `/api/invoices/${invoiceId}?force=true`
        : `/api/invoices/${invoiceId}`

      const response = await fetch(url, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to delete invoice')
        setDeleting(false)
        // Don't close the confirm dialog so they can try force delete
        return
      }

      setSuccessMessage('Invoice deleted successfully')
      // Redirect to invoices list after short delay
      setTimeout(() => {
        router.push('/invoices')
      }, 1000)
    } catch (err) {
      console.error('Error deleting invoice:', err)
      setErrorMessage('Failed to delete invoice')
      setDeleting(false)
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

        {/* PDF download temporarily disabled - use Print button instead */}
        {/* <Button
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
        </Button> */}

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

        {/* Status Dropdown - Moved from main content for mobile space */}
        <div className="pt-3 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Change Status
          </label>
          <select
            value={status}
            onChange={(e) => updateStatus(e.target.value as InvoiceStatus)}
            disabled={updating}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {Object.entries(statusFlow).map(([statusKey, config]) => (
              <option key={statusKey} value={statusKey}>
                {config.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-gray-500">
            Manually change invoice status if needed
          </p>
        </div>
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

      {/* Delete Section */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Danger Zone</h3>

        {!showDeleteConfirm ? (
          <Button
            onClick={() => setShowDeleteConfirm(true)}
            variant="outline"
            className="w-full border-red-300 text-red-700 hover:bg-red-50"
            size="sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Invoice
          </Button>
        ) : (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4">
            <p className="text-sm font-medium text-red-900 mb-3">
              Are you sure you want to delete this invoice?
            </p>
            <p className="text-xs text-red-700 mb-4">
              This action cannot be undone. The invoice will be permanently deleted and the job status will be updated.
            </p>

            {/* Force Delete Checkbox */}
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={forceDelete}
                onChange={(e) => setForceDelete(e.target.checked)}
                className="w-4 h-4 text-red-600 border-red-300 rounded focus:ring-red-500"
              />
              <span className="text-xs text-red-800">
                Force delete (removes payments and ignores order restrictions)
              </span>
            </label>

            <div className="flex gap-2">
              <Button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                size="sm"
              >
                {deleting ? 'Deleting...' : forceDelete ? 'Force Delete' : 'Yes, Delete'}
              </Button>
              <Button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setForceDelete(false)
                }}
                disabled={deleting}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
