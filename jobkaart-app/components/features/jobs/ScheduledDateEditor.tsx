'use client'

import { useState } from 'react'

interface ScheduledDateEditorProps {
  jobId: string
  currentDate: string | null
  jobStatus?: string
}

export function ScheduledDateEditor({ jobId, currentDate, jobStatus }: ScheduledDateEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [date, setDate] = useState(currentDate || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if job is scheduled but has no date
  const isScheduledWithoutDate = jobStatus === 'scheduled' && !currentDate

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleSave = async () => {
    if (!date) {
      setError('Please select a date')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduled_date: date,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update date')
      }

      setIsEditing(false)
      // Refresh the page to show updated data
      window.location.reload()
    } catch (err) {
      setError('Failed to save date. Please try again.')
      console.error('Error saving date:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setDate(currentDate || '')
    setIsEditing(false)
    setError(null)
  }

  if (isEditing) {
    return (
      <div className="space-y-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          disabled={isSaving}
        />
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className={`text-sm ${isScheduledWithoutDate ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
          {formatDate(currentDate)}
        </span>
        <button
          onClick={() => setIsEditing(true)}
          className="ml-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          Edit
        </button>
      </div>
      {isScheduledWithoutDate && (
        <div className="mt-2 flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <svg
            className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <p className="text-xs text-yellow-800 font-medium">Date Required</p>
            <p className="text-xs text-yellow-700 mt-0.5">
              This job is scheduled but no date is set. Click Edit to set a date.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
