'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { InvoiceStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { RecordPaymentDialog, PaymentData } from './RecordPaymentDialog'

interface InvoiceStatusManagerProps {
  invoiceId: string
  currentStatus: InvoiceStatus
  amountPaid: number
  total: number
  dueDate: string
  invoiceNumber: string
  customerPhone?: string
}

const statusFlow: Record<InvoiceStatus, { label: string; color: string; description: string }> = {
  draft: {
    label: 'Draft',
    color: 'bg-yellow-500',
    description: 'Invoice created but not sent to customer',
  },
  sent: {
    label: 'Sent',
    color: 'bg-blue-500',
    description: 'Invoice sent to customer, awaiting payment',
  },
  viewed: {
    label: 'Viewed',
    color: 'bg-purple-500',
    description: 'Customer has viewed the invoice',
  },
  partially_paid: {
    label: 'Partially Paid',
    color: 'bg-orange-500',
    description: 'Partial payment received',
  },
  paid: {
    label: 'Paid',
    color: 'bg-green-500',
    description: 'Invoice fully paid',
  },
  overdue: {
    label: 'Overdue',
    color: 'bg-red-500',
    description: 'Payment overdue',
  },
}

const statusOrder: InvoiceStatus[] = ['draft', 'sent', 'viewed', 'partially_paid', 'paid']

export function InvoiceStatusManager({
  invoiceId,
  currentStatus,
  amountPaid,
  total,
  dueDate,
  invoiceNumber,
  customerPhone
}: InvoiceStatusManagerProps) {
  const router = useRouter()
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)

  const updateStatus = async (newStatus: InvoiceStatus) => {
    setUpdating(true)
    setError(null)

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
        setError(result.error || 'Failed to update status')
        return
      }

      router.refresh()
    } catch (err) {
      console.error('Error updating status:', err)
      setError('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const handleRecordPayment = async (paymentData: PaymentData) => {
    const response = await fetch(`/api/invoices/${invoiceId}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to record payment')
    }

    router.refresh()
  }

  const handleSendWhatsApp = async () => {
    if (!customerPhone) return

    setUpdating(true)
    setError(null)

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
          `Hi! Here's your invoice ${invoiceNumber}\n\n${invoiceLink}\n\nTotal: R${total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}\nDue: ${formatDate(dueDate)}\n\nPlease click the link above to view your invoice and payment details.\n\nThank you!`
        )
        const phone = customerPhone.replace(/\D/g, '')
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank')

        // Refresh page to show updated status
        router.refresh()
      } else {
        throw new Error(result.error || 'Failed to send invoice')
      }
    } catch (err) {
      console.error('Error sending invoice:', err)
      setError('Failed to send invoice. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  const currentIndex = statusOrder.indexOf(currentStatus === 'overdue' ? 'sent' : currentStatus)
  const outstandingAmount = total - amountPaid
  const isFullyPaid = amountPaid >= total
  const isPastDue = new Date(dueDate) < new Date() && !isFullyPaid

  return (
    <div>
      {/* Status Pipeline */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          {statusOrder.map((status, index) => {
            const isActive = status === currentStatus || (currentStatus === 'overdue' && status === 'sent')
            const isPast = index < currentIndex
            const config = statusFlow[status]

            return (
              <div key={status} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium transition-colors ${
                      isActive
                        ? currentStatus === 'overdue' && status === 'sent'
                          ? statusFlow.overdue.color
                          : config.color
                        : isPast
                        ? 'bg-gray-400'
                        : 'bg-gray-200'
                    }`}
                  >
                    {isPast || status === 'paid' && isFullyPaid ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <span className={`mt-2 text-xs text-center ${isActive ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                    {currentStatus === 'overdue' && status === 'sent' ? statusFlow.overdue.label : config.label}
                  </span>
                </div>
                {index < statusOrder.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${isPast ? 'bg-gray-400' : 'bg-gray-200'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Current Status Info */}
      <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-700">
          <span className="font-medium">Current Status:</span> {statusFlow[currentStatus].description}
        </p>
        {isPastDue && currentStatus !== 'paid' && (
          <p className="text-sm text-red-600 mt-1 font-medium">
            ⚠️ Invoice is overdue
          </p>
        )}
        {(currentStatus === 'sent' || currentStatus === 'viewed' || currentStatus === 'partially_paid' || currentStatus === 'overdue') && !isFullyPaid && (
          <p className="text-sm text-blue-700 mt-2 font-medium">
            Outstanding: {`R${outstandingAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`}
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Status Actions */}
      <div className="flex gap-3">
        {/* Draft/Sent → Show "Send via WhatsApp" button (green) */}
        {(currentStatus === 'draft' || currentStatus === 'sent') && customerPhone && (
          <Button
            onClick={handleSendWhatsApp}
            variant="success"
            disabled={updating}
            className="flex-1"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Send via WhatsApp
          </Button>
        )}

        {/* Draft → Show "Mark as Sent" button */}
        {currentStatus === 'draft' && (
          <Button
            onClick={() => updateStatus('sent')}
            disabled={updating}
            className="flex-1"
          >
            {updating ? 'Updating...' : 'Mark as Sent'}
          </Button>
        )}

        {/* Sent/Viewed/Partially Paid/Overdue → Show "Record Payment" button */}
        {(currentStatus === 'sent' || currentStatus === 'viewed' || currentStatus === 'partially_paid' || currentStatus === 'overdue') && !isFullyPaid && (
          <Button
            onClick={() => setIsPaymentDialogOpen(true)}
            disabled={updating}
            className="flex-1"
          >
            Record Payment
          </Button>
        )}

        {/* Status dropdown - always visible */}
        <select
          value={currentStatus}
          onChange={(e) => updateStatus(e.target.value as InvoiceStatus)}
          disabled={updating}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          {Object.entries(statusFlow).map(([status, config]) => (
            <option key={status} value={status}>
              {config.label}
            </option>
          ))}
        </select>
      </div>

      {/* Hint Text Below Buttons */}
      {currentStatus === 'draft' && (
        <p className="mt-3 text-sm text-gray-600">
          Mark this invoice as sent after sending to customer
        </p>
      )}

      {(currentStatus === 'sent' || currentStatus === 'viewed' || currentStatus === 'partially_paid' || currentStatus === 'overdue') && !isFullyPaid && (
        <p className="mt-3 text-sm text-gray-600">
          Record payments as they come in to track outstanding amounts
        </p>
      )}

      {isFullyPaid && currentStatus !== 'paid' && (
        <p className="mt-3 text-sm text-green-600 font-medium">
          Invoice is fully paid - status will update automatically
        </p>
      )}

      {currentStatus === 'paid' && (
        <p className="mt-3 text-sm text-green-600 font-medium">
          Invoice is complete and paid!
        </p>
      )}

      {/* Record Payment Dialog */}
      <RecordPaymentDialog
        isOpen={isPaymentDialogOpen}
        onClose={() => setIsPaymentDialogOpen(false)}
        onSubmit={handleRecordPayment}
        maxAmount={outstandingAmount}
        invoiceNumber={invoiceNumber}
      />
    </div>
  )
}
