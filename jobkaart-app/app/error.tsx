'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Check if this is a chunk loading error
    const isChunkError =
      error.message.includes('Failed to load chunk') ||
      error.message.includes('Loading chunk') ||
      error.message.includes('ChunkLoadError')

    if (isChunkError) {
      // Auto-reload once to get the new chunks
      const hasReloaded = sessionStorage.getItem('chunk-error-reloaded')

      if (!hasReloaded) {
        sessionStorage.setItem('chunk-error-reloaded', 'true')
        window.location.reload()
      }
    }

    // Log error for debugging
    console.error('Application error:', error)
  }, [error])

  // Clear reload flag when error boundary is reset
  const handleReset = () => {
    sessionStorage.removeItem('chunk-error-reloaded')
    reset()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 mb-6">
            We're having trouble loading the page. This usually happens after an update.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Reload Page
          </button>
          <button
            onClick={handleReset}
            className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Try Again
          </button>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          If the problem persists, please contact support via WhatsApp.
        </p>
      </div>
    </div>
  )
}
