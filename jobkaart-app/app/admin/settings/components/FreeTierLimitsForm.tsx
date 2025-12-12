'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { FreeTierLimitsUpdate } from '@/types'

interface FreeTierLimitsFormProps {
  initialSettings: {
    free_quotes_per_month: number
    free_jobs_per_month: number
    free_invoices_per_month: number
  }
}

export function FreeTierLimitsForm({ initialSettings }: FreeTierLimitsFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState<FreeTierLimitsUpdate>({
    free_quotes_per_month: initialSettings.free_quotes_per_month,
    free_jobs_per_month: initialSettings.free_jobs_per_month,
    free_invoices_per_month: initialSettings.free_invoices_per_month,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/admin/settings/free-tier-limits', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Failed to update settings')
        return
      }

      setSuccess(true)

      // Refresh the page to show updated values
      router.refresh()

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false)
      }, 3000)
    } catch (err) {
      console.error('Error updating settings:', err)
      setError('Failed to update settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      free_quotes_per_month: initialSettings.free_quotes_per_month,
      free_jobs_per_month: initialSettings.free_jobs_per_month,
      free_invoices_per_month: initialSettings.free_invoices_per_month,
    })
    setError(null)
    setSuccess(false)
  }

  const hasChanges =
    formData.free_quotes_per_month !== initialSettings.free_quotes_per_month ||
    formData.free_jobs_per_month !== initialSettings.free_jobs_per_month ||
    formData.free_invoices_per_month !== initialSettings.free_invoices_per_month

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-600 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-green-600 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">Success</p>
              <p className="text-sm text-green-700 mt-1">
                FREE tier limits updated successfully
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quotes Limit */}
      <div className="space-y-2">
        <Label htmlFor="quotes" className="text-base font-medium">
          Quotes per Month
        </Label>
        <div className="flex items-center gap-3">
          <Input
            id="quotes"
            type="number"
            min="0"
            max="1000"
            value={formData.free_quotes_per_month}
            onChange={(e) =>
              setFormData({
                ...formData,
                free_quotes_per_month: parseInt(e.target.value) || 0,
              })
            }
            disabled={loading}
            required
            className="max-w-xs"
          />
          <span className="text-sm text-gray-600">quotes</span>
        </div>
        <p className="text-sm text-gray-500">
          Maximum number of quotes FREE tier users can create per month
        </p>
      </div>

      {/* Jobs Limit */}
      <div className="space-y-2">
        <Label htmlFor="jobs" className="text-base font-medium">
          Jobs per Month
        </Label>
        <div className="flex items-center gap-3">
          <Input
            id="jobs"
            type="number"
            min="0"
            max="1000"
            value={formData.free_jobs_per_month}
            onChange={(e) =>
              setFormData({
                ...formData,
                free_jobs_per_month: parseInt(e.target.value) || 0,
              })
            }
            disabled={loading}
            required
            className="max-w-xs"
          />
          <span className="text-sm text-gray-600">jobs</span>
        </div>
        <p className="text-sm text-gray-500">
          Maximum number of jobs FREE tier users can create per month
        </p>
      </div>

      {/* Invoices Limit */}
      <div className="space-y-2">
        <Label htmlFor="invoices" className="text-base font-medium">
          Invoices per Month
        </Label>
        <div className="flex items-center gap-3">
          <Input
            id="invoices"
            type="number"
            min="0"
            max="1000"
            value={formData.free_invoices_per_month}
            onChange={(e) =>
              setFormData({
                ...formData,
                free_invoices_per_month: parseInt(e.target.value) || 0,
              })
            }
            disabled={loading}
            required
            className="max-w-xs"
          />
          <span className="text-sm text-gray-600">invoices</span>
        </div>
        <p className="text-sm text-gray-500">
          Maximum number of invoices FREE tier users can create per month
        </p>
      </div>

      {/* Warning Notice */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800">Important</p>
            <p className="text-sm text-blue-700 mt-1">
              Changes apply immediately to all FREE tier users. Users who have already exceeded the new limits will be blocked from creating more resources until next month.
            </p>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={loading || !hasChanges}
          className="w-full sm:w-auto"
        >
          Reset
        </Button>
        <Button
          type="submit"
          disabled={loading || !hasChanges}
          className="w-full sm:flex-1"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  )
}
