'use client'

import { useEffect } from 'react'

export function PWAInstaller() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((registration) => {
            console.log('Service Worker registered:', registration)
          })
          .catch((error) => {
            console.log('Service Worker registration failed:', error)
          })
      })
    }

    // Handle chunk loading errors globally
    const handleChunkError = (event: ErrorEvent) => {
      const isChunkError =
        event.message?.includes('Failed to load chunk') ||
        event.message?.includes('Loading chunk') ||
        event.message?.includes('ChunkLoadError')

      if (isChunkError) {
        event.preventDefault()

        // Auto-reload once to get new chunks
        const hasReloaded = sessionStorage.getItem('chunk-error-reloaded')

        if (!hasReloaded) {
          sessionStorage.setItem('chunk-error-reloaded', 'true')
          console.log('Chunk loading error detected - reloading page to fetch new deployment')
          window.location.reload()
        }
      }
    }

    window.addEventListener('error', handleChunkError)

    return () => {
      window.removeEventListener('error', handleChunkError)
    }
  }, [])

  return null // This component doesn't render anything
}
