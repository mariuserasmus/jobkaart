'use client'

import { useState } from 'react'

interface ExtendTrialModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (days: number) => void
  businessName: string
  currentTrialEndsAt: string | null
  isLoading?: boolean
}

export function ExtendTrialModal({
  isOpen,
  onClose,
  onConfirm,
  businessName,
  currentTrialEndsAt,
  isLoading = false,
}: ExtendTrialModalProps) {
  const [days, setDays] = useState(7)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (days > 0 && days <= 90) {
      onConfirm(days)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const calculateNewDate = () => {
    if (!currentTrialEndsAt) return 'N/A'
    const newDate = new Date(currentTrialEndsAt)
    newDate.setDate(newDate.getDate() + days)
    return formatDate(newDate.toISOString())
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Extend Trial Period</h3>
          <p className="text-sm text-gray-600 mb-6">{businessName}</p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="days" className="block text-sm font-medium text-gray-700 mb-2">
                Extend by (days)
              </label>
              <input
                type="number"
                id="days"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 0)}
                min={1}
                max={90}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Maximum: 90 days</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Current trial ends:</span>
                <span className="font-medium text-gray-900">{formatDate(currentTrialEndsAt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">New trial end date:</span>
                <span className="font-medium text-blue-900">{calculateNewDate()}</span>
              </div>
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
                disabled={isLoading || days <= 0 || days > 90}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Extending...' : 'Extend Trial'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
