'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { JobStatus } from '@/types'
import { Button } from '@/components/ui/button'

interface JobStatusManagerProps {
  jobId: string
  currentStatus: JobStatus
  canCreateInvoice?: boolean
}

const statusFlow: Record<JobStatus, { label: string; next: JobStatus | null; color: string }> = {
  quoted: {
    label: 'Quoted',
    next: 'scheduled',
    color: 'bg-yellow-500',
  },
  scheduled: {
    label: 'Scheduled',
    next: 'in_progress',
    color: 'bg-blue-500',
  },
  in_progress: {
    label: 'In Progress',
    next: 'complete',
    color: 'bg-orange-500',
  },
  complete: {
    label: 'Complete',
    next: 'invoiced',
    color: 'bg-green-500',
  },
  invoiced: {
    label: 'Invoiced',
    next: 'paid',
    color: 'bg-purple-500',
  },
  paid: {
    label: 'Paid',
    next: null,
    color: 'bg-gray-500',
  },
}

const allStatuses: JobStatus[] = ['quoted', 'scheduled', 'in_progress', 'complete', 'invoiced', 'paid']

export function JobStatusManager({ jobId, currentStatus, canCreateInvoice = false }: JobStatusManagerProps) {
  const router = useRouter()
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateStatus = async (newStatus: JobStatus) => {
    setUpdating(true)
    setError(null)

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
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

  const currentIndex = allStatuses.indexOf(currentStatus)
  const nextStatus = statusFlow[currentStatus].next

  return (
    <div>
      {/* Status Pipeline */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          {allStatuses.map((status, index) => {
            const isActive = status === currentStatus
            const isPast = index < currentIndex
            const config = statusFlow[status]

            return (
              <div key={status} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium transition-colors ${
                      isActive
                        ? config.color
                        : isPast
                        ? 'bg-gray-400'
                        : 'bg-gray-200'
                    }`}
                  >
                    {isPast ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <span className={`mt-2 text-xs text-center ${isActive ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                    {config.label}
                  </span>
                </div>
                {index < allStatuses.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${isPast ? 'bg-gray-400' : 'bg-gray-200'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Status Actions */}
      <div className="flex gap-3">
        {/* Show "Create Invoice" button for Complete status if canCreateInvoice is true */}
        {currentStatus === 'complete' && canCreateInvoice ? (
          <a
            href={`/invoices/new?jobId=${jobId}`}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium transition-colors"
          >
            Create Invoice
          </a>
        ) : nextStatus && currentStatus !== 'complete' ? (
          <Button
            onClick={() => updateStatus(nextStatus)}
            disabled={updating}
            className="flex-1"
          >
            {updating ? 'Updating...' : `Mark as ${statusFlow[nextStatus].label}`}
          </Button>
        ) : null}

        {/* Quick jump to any status - exclude Invoiced when current status is Complete */}
        <select
          value={currentStatus}
          onChange={(e) => updateStatus(e.target.value as JobStatus)}
          disabled={updating}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          {allStatuses
            .filter((status) => {
              // Hide "Invoiced" option when current status is "Complete"
              if (currentStatus === 'complete' && status === 'invoiced') {
                return false
              }
              return true
            })
            .map((status) => (
              <option key={status} value={status}>
                {statusFlow[status].label}
              </option>
            ))}
        </select>
      </div>

      {/* Status Info */}
      {currentStatus === 'complete' && canCreateInvoice ? (
        <p className="mt-3 text-sm text-gray-600">
          Job is complete and ready to invoice
        </p>
      ) : nextStatus && currentStatus !== 'complete' ? (
        <p className="mt-3 text-sm text-gray-600">
          Next: Move to <span className="font-medium">{statusFlow[nextStatus].label}</span>
        </p>
      ) : !nextStatus ? (
        <p className="mt-3 text-sm text-green-600 font-medium">
          Job is complete and paid!
        </p>
      ) : null}
    </div>
  )
}
