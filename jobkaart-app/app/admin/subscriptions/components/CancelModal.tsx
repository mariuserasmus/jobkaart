'use client'

import { useState } from 'react'

interface CancelModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  businessName: string
  isLoading?: boolean
}

export function CancelModal({
  isOpen,
  onClose,
  onConfirm,
  businessName,
  isLoading = false,
}: CancelModalProps) {
  const [reason, setReason] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (reason.trim()) {
      onConfirm(reason)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Subscription</h3>
          <p className="text-sm text-gray-600 mb-6">{businessName}</p>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Cancellation Reason
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                required
                placeholder="Please provide a reason for cancellation..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                This helps us understand why customers leave and improve our service.
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-6 overflow-hidden">
              <p className="text-sm text-red-800 break-words whitespace-normal w-full">
                <strong className="font-semibold">Warning:</strong> This will cancel the tenant&apos;s subscription immediately.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !reason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isLoading ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
