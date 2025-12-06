'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ResetTenantDataSectionProps {
  tenantId: string
  businessName: string
}

export function ResetTenantDataSection({ tenantId, businessName }: ResetTenantDataSectionProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [includeCustomers, setIncludeCustomers] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleReset = async () => {
    setResetting(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}/reset-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ includeCustomers }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Failed to reset tenant data')
        setResetting(false)
        return
      }

      const { deleted } = result

      const summary = [
        `${deleted.payments} payments`,
        `${deleted.invoices} invoices`,
        `${deleted.jobPhotos} job photos`,
        `${deleted.jobs} jobs`,
        `${deleted.quotes} quotes`,
      ]

      if (includeCustomers) {
        summary.push(`${deleted.customers} customers`)
      }

      setSuccess(`Successfully deleted: ${summary.join(', ')}`)
      setShowConfirm(false)
      setIncludeCustomers(false)

      // Refresh the page to show updated stats
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } catch (err) {
      console.error('Error resetting tenant data:', err)
      setError('Failed to reset tenant data')
      setResetting(false)
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg mt-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
      </div>
      <div className="p-6">
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        {!showConfirm ? (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Reset Tenant Data
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Permanently delete all tenant data (payments, invoices, jobs, quotes) with option to
              include customers. This action cannot be undone.
            </p>
            <button
              onClick={() => setShowConfirm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
            >
              Reset Tenant Data
            </button>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4">
            <h3 className="text-sm font-bold text-red-900 mb-3">
              ⚠️ Confirm Data Reset for "{businessName}"
            </h3>

            <p className="text-sm text-red-800 mb-4">
              This will permanently delete ALL of the following data for this tenant:
            </p>

            <ul className="list-disc list-inside text-sm text-red-800 mb-4 space-y-1">
              <li>All payments</li>
              <li>All invoices</li>
              <li>All job photos</li>
              <li>All jobs</li>
              <li>All quotes</li>
              <li className="font-semibold">
                {includeCustomers ? 'All customers ✓' : 'Customers will be KEPT (uncheck to delete)'}
              </li>
            </ul>

            <p className="text-sm font-bold text-red-900 mb-4">
              This action CANNOT be undone!
            </p>

            {/* Customer Delete Option */}
            <label className="flex items-center gap-2 mb-4 cursor-pointer bg-white border border-red-300 rounded p-3">
              <input
                type="checkbox"
                checked={includeCustomers}
                onChange={(e) => setIncludeCustomers(e.target.checked)}
                className="w-4 h-4 text-red-600 border-red-300 rounded focus:ring-red-500"
              />
              <span className="text-sm font-medium text-gray-900">
                Also delete all customers
              </span>
            </label>

            <div className="flex gap-2">
              <button
                onClick={handleReset}
                disabled={resetting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                {resetting ? 'Resetting...' : 'Yes, Delete Everything'}
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false)
                  setIncludeCustomers(false)
                }}
                disabled={resetting}
                className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
