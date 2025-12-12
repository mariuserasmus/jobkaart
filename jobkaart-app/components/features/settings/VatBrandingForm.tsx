'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Label } from '@/components/ui'

interface VatBrandingFormProps {
  tenant: any
}

export default function VatBrandingForm({ tenant }: VatBrandingFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    vat_registered: tenant.vat_registered || false,
    vat_number: tenant.vat_number || '',
    logo_url: tenant.logo_url || '',
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(
    tenant.logo_url || null
  )
  const [loading, setLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, WebP, or SVG)')
      return
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      setError('Logo file must be less than 2MB')
      return
    }

    setLogoFile(file)
    setError('')

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleLogoUpload = async () => {
    if (!logoFile) return null

    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('file', logoFile)

      const response = await fetch(`/api/tenants/${tenant.id}/logo`, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to upload logo')
      }

      return result.data.logo_url
    } catch (err: any) {
      setError(err.message || 'Failed to upload logo')
      return null
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      let logoUrl = formData.logo_url

      // Upload logo if a new file was selected
      if (logoFile) {
        const uploadedUrl = await handleLogoUpload()
        if (!uploadedUrl) {
          setLoading(false)
          return
        }
        logoUrl = uploadedUrl
      }

      const response = await fetch(`/api/tenants/${tenant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vat_registered: formData.vat_registered,
          vat_number: formData.vat_registered ? formData.vat_number : null,
          logo_url: logoUrl,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Failed to update settings')
        return
      }

      setSuccess(true)
      setLogoFile(null)

      // Refresh the page data to update the tenant prop with new values
      router.refresh()

      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Error updating VAT/branding settings:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* VAT Settings Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">VAT Registration</h3>

        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="vat_registered"
              type="checkbox"
              checked={formData.vat_registered}
              onChange={(e) =>
                setFormData({ ...formData, vat_registered: e.target.checked })
              }
              disabled={loading}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3">
            <Label htmlFor="vat_registered" className="font-normal">
              My business is VAT registered
            </Label>
            <p className="text-sm text-gray-600">
              Enable this to include VAT (15%) on quotes and invoices
            </p>
          </div>
        </div>

        {formData.vat_registered && (
          <div>
            <Label htmlFor="vat_number">VAT Number</Label>
            <Input
              id="vat_number"
              type="text"
              value={formData.vat_number}
              onChange={(e) =>
                setFormData({ ...formData, vat_number: e.target.value })
              }
              disabled={loading}
              placeholder="e.g., 4123456789"
            />
            <p className="text-sm text-gray-600 mt-1">
              Your VAT registration number (appears on quotes and invoices)
            </p>
          </div>
        )}
      </div>

      {/* Logo Upload Section */}
      <div className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900">Business Logo</h3>
        <p className="text-sm text-gray-600">
          Upload your business logo to appear on quotes and invoices. Recommended
          size: 200x200px or larger. Max file size: 2MB.
        </p>

        {logoPreview && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 inline-block">
            <img
              src={logoPreview}
              alt="Logo preview"
              className="max-h-32 max-w-full object-contain"
            />
          </div>
        )}

        <div>
          <Label htmlFor="logo" className="cursor-pointer">
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-blue-600 hover:text-blue-500">
                    Click to upload
                  </span>{' '}
                  or drag and drop
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, WebP, or SVG up to 2MB
                </p>
              </div>
            </div>
            <input
              id="logo"
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              disabled={loading}
              className="sr-only"
            />
          </Label>
        </div>

        {logoFile && (
          <p className="text-sm text-gray-600">
            Selected file: <span className="font-medium">{logoFile.name}</span>
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            VAT and branding settings updated successfully!
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading || uploadingLogo}>
          {loading || uploadingLogo ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
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
              {uploadingLogo ? 'Uploading...' : 'Saving...'}
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  )
}
