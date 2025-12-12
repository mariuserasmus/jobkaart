'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Label, Textarea } from '@/components/ui'

interface BusinessDetailsFormProps {
  tenant: any
}

export default function BusinessDetailsForm({ tenant }: BusinessDetailsFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    business_name: tenant.business_name || '',
    phone: tenant.phone || '',
    email: tenant.email || '',
    address: tenant.address || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch(`/api/tenants/${tenant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Failed to update business details')
        return
      }

      setSuccess(true)

      // Refresh the page data to update the tenant prop with new values
      router.refresh()

      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Error updating business details:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="business_name">
            Business Name <span className="text-red-600">*</span>
          </Label>
          <Input
            id="business_name"
            type="text"
            value={formData.business_name}
            onChange={(e) =>
              setFormData({ ...formData, business_name: e.target.value })
            }
            required
            disabled={loading}
            placeholder="e.g., Johan's Plumbing Services"
          />
          <p className="text-sm text-gray-600 mt-1">
            This name appears on quotes and invoices
          </p>
        </div>

        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            disabled={loading}
            placeholder="e.g., 082 123 4567"
          />
          <p className="text-sm text-gray-600 mt-1">
            Contact number for customer inquiries
          </p>
        </div>

        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            disabled={loading}
            placeholder="e.g., hello@johansplumbing.co.za"
          />
          <p className="text-sm text-gray-600 mt-1">
            Business email for quotes and invoices
          </p>
        </div>

        <div>
          <Label htmlFor="address">Business Address</Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            disabled={loading}
            placeholder="e.g., 123 Main Street, Cape Town, 8001"
            rows={3}
          />
          <p className="text-sm text-gray-600 mt-1">
            Physical or postal address (appears on invoices)
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            Business details updated successfully!
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? (
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
