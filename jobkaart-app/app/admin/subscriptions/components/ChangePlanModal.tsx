'use client'

import { useState } from 'react'
import type { SubscriptionTier } from '../types'

interface ChangePlanModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (newTier: SubscriptionTier) => void
  currentTier: SubscriptionTier
  businessName: string
  isLoading?: boolean
}

const tierDetails = {
  free: { name: 'FREE', price: 'R0', color: 'bg-green-100 text-green-800' },
  starter: { name: 'Starter', price: 'R299', color: 'bg-gray-100 text-gray-800' },
  pro: { name: 'Pro', price: 'R499', color: 'bg-blue-100 text-blue-800' },
  team: { name: 'Team', price: 'R799', color: 'bg-purple-100 text-purple-800' },
}

export function ChangePlanModal({
  isOpen,
  onClose,
  onConfirm,
  currentTier,
  businessName,
  isLoading = false,
}: ChangePlanModalProps) {
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(currentTier)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedTier !== currentTier) {
      onConfirm(selectedTier)
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Change Subscription Plan</h3>
          <p className="text-sm text-gray-600 mb-6">{businessName}</p>

          <form onSubmit={handleSubmit}>
            <div className="space-y-3 mb-6">
              {(Object.keys(tierDetails) as SubscriptionTier[]).map((tier) => {
                const details = tierDetails[tier]
                const isCurrentTier = tier === currentTier
                const isSelected = tier === selectedTier

                return (
                  <label
                    key={tier}
                    className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="tier"
                        value={tier}
                        checked={isSelected}
                        onChange={(e) => setSelectedTier(e.target.value as SubscriptionTier)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{details.name}</span>
                          {isCurrentTier && (
                            <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded">
                              Current
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-600">{details.price}/month</span>
                      </div>
                    </div>
                  </label>
                )
              })}
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
                disabled={isLoading || selectedTier === currentTier}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Changing...' : 'Change Plan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
