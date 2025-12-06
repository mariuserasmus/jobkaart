'use client'

/**
 * Job Actions Component
 * Client-side actions for job detail page
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'

interface JobActionsProps {
  jobId: string
  jobNumber: string
  jobStatus: string
}

export function JobActions({
  jobId,
  jobNumber,
  jobStatus,
}: JobActionsProps) {
  const router = useRouter()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [forceDelete, setForceDelete] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    setErrorMessage(null)

    try {
      const url = forceDelete
        ? `/api/jobs/${jobId}?force=true`
        : `/api/jobs/${jobId}`

      const response = await fetch(url, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to delete job')
        setDeleting(false)
        // Don't close the confirm dialog so they can try force delete
        return
      }

      setSuccessMessage('Job deleted successfully')
      // Redirect to jobs list after short delay
      setTimeout(() => {
        router.push('/jobs')
      }, 1000)
    } catch (err) {
      console.error('Error deleting job:', err)
      setErrorMessage('Failed to delete job')
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

      {/* Delete Section */}
      <div>
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
            Delete Job
          </Button>
        ) : (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4">
            <p className="text-sm font-medium text-red-900 mb-3">
              Are you sure you want to delete this job?
            </p>
            <p className="text-xs text-red-700 mb-4">
              This action cannot be undone. The job and all associated invoices will be permanently deleted. The quote will remain available for creating a new job.
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
                Force delete (removes all payments and invoices)
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
