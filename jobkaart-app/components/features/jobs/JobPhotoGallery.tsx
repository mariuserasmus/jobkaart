'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface JobPhoto {
  id: string
  photo_url: string
  caption: string | null
  created_at: string
  file_size: number | null
  mime_type: string | null
}

interface JobPhotoGalleryProps {
  photos: JobPhoto[]
  onPhotoDelete: (photoId: string) => void
}

export function JobPhotoGallery({ photos, onPhotoDelete }: JobPhotoGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-600">No photos uploaded yet</p>
        <p className="text-xs text-gray-500">Upload photos to show proof of work</p>
      </div>
    )
  }

  const openLightbox = (index: number) => {
    setCurrentPhotoIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
    setDeleteConfirm(null)
  }

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)
    setDeleteConfirm(null)
  }

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
    setDeleteConfirm(null)
  }

  const handleDelete = async (photoId: string) => {
    if (deleteConfirm !== photoId) {
      setDeleteConfirm(photoId)
      return
    }

    setIsDeleting(true)
    try {
      await onPhotoDelete(photoId)
      setDeleteConfirm(null)
      // If we deleted the last photo in lightbox, close it
      if (photos.length === 1) {
        closeLightbox()
      } else if (currentPhotoIndex >= photos.length - 1) {
        setCurrentPhotoIndex(0)
      }
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return ''
    const mb = bytes / (1024 * 1024)
    return mb < 1 ? `${(bytes / 1024).toFixed(0)} KB` : `${mb.toFixed(1)} MB`
  }

  return (
    <>
      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
            onClick={() => openLightbox(index)}
          >
            <img
              src={photo.photo_url}
              alt={photo.caption || `Job photo ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {photo.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <p className="text-white text-sm font-medium truncate">{photo.caption}</p>
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Header Controls */}
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            {/* Delete Button */}
            {deleteConfirm === photos[currentPhotoIndex].id ? (
              <>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(photos[currentPhotoIndex].id)
                  }}
                  disabled={isDeleting}
                  className="shadow-lg"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteConfirm(null)
                  }}
                  disabled={isDeleting}
                  className="bg-white text-gray-900 shadow-lg"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  setDeleteConfirm(photos[currentPhotoIndex].id)
                }}
                className="shadow-lg"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete
              </Button>
            )}

            {/* Close Button */}
            <button
              className="text-white hover:text-gray-300 p-1"
              onClick={closeLightbox}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Previous Button */}
          {photos.length > 1 && (
            <button
              className="absolute left-4 text-white hover:text-gray-300 z-10"
              onClick={(e) => {
                e.stopPropagation()
                prevPhoto()
              }}
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          {/* Next Button */}
          {photos.length > 1 && (
            <button
              className="absolute right-4 text-white hover:text-gray-300 z-10"
              onClick={(e) => {
                e.stopPropagation()
                nextPhoto()
              }}
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}

          {/* Image Container */}
          <div
            className="max-w-7xl w-full px-4 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 min-h-0 mb-4 flex items-center justify-center">
              <img
                src={photos[currentPhotoIndex].photo_url}
                alt={photos[currentPhotoIndex].caption || 'Job photo'}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Photo Info */}
            <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white flex-shrink-0">
              {photos[currentPhotoIndex].caption && (
                <p className="text-base font-medium mb-1">
                  {photos[currentPhotoIndex].caption}
                </p>
              )}
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <span>{formatDate(photos[currentPhotoIndex].created_at)}</span>
                {photos[currentPhotoIndex].file_size && (
                  <>
                    <span>•</span>
                    <span>{formatFileSize(photos[currentPhotoIndex].file_size)}</span>
                  </>
                )}
                <span>•</span>
                <span>
                  {currentPhotoIndex + 1} of {photos.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
