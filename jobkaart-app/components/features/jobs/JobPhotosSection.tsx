'use client'

import { useState, useEffect } from 'react'
import { JobPhotoUpload } from './JobPhotoUpload'
import { JobPhotoGallery } from './JobPhotoGallery'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface JobPhoto {
  id: string
  photo_url: string
  caption: string | null
  created_at: string
  file_size: number | null
  mime_type: string | null
}

interface JobPhotosSectionProps {
  jobId: string
}

export function JobPhotosSection({ jobId }: JobPhotosSectionProps) {
  const [photos, setPhotos] = useState<JobPhoto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const fetchPhotos = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/photos`)
      const result = await response.json()

      if (result.success) {
        setPhotos(result.data)
      }
    } catch (error) {
      console.error('Error fetching photos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMounted) {
      fetchPhotos()
    }
  }, [jobId, isMounted])

  const handleUploadSuccess = () => {
    fetchPhotos()
    setUploadDialogOpen(false)
  }

  const handlePhotoDelete = async (photoId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/photos/${photoId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        // Remove photo from local state
        setPhotos(photos.filter((photo) => photo.id !== photoId))
      } else {
        throw new Error(result.error || 'Delete failed')
      }
    } catch (error) {
      console.error('Error deleting photo:', error)
      throw error
    }
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted || isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <svg
            className="animate-spin h-8 w-8 text-blue-600"
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
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Job Photos</h2>
          {photos.length > 0 && (
            <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
            </span>
          )}
        </div>

        {photos.length < 10 && (
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Upload Photo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Job Photo</DialogTitle>
              </DialogHeader>
              <JobPhotoUpload jobId={jobId} onUploadSuccess={handleUploadSuccess} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {photos.length >= 10 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Maximum of 10 photos reached. Delete a photo to upload a new one.
          </p>
        </div>
      )}

      <JobPhotoGallery photos={photos} onPhotoDelete={handlePhotoDelete} />
    </div>
  )
}
