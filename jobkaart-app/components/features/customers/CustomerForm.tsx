'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Customer } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface CustomerFormProps {
  customer?: Customer
  mode: 'create' | 'edit'
}

export function CustomerForm({ customer, mode }: CustomerFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    vat_number: customer?.vat_number || '',
    address: customer?.address || '',
    notes: customer?.notes || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = mode === 'create'
        ? '/api/customers'
        : `/api/customers/${customer?.id}`

      const method = mode === 'create' ? 'POST' : 'PATCH'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Something went wrong')
        return
      }

      // Redirect to customer detail page
      router.push(`/customers/${result.data.id}`)
      router.refresh()
    } catch (err) {
      console.error('Form submission error:', err)
      setError('Failed to save customer. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (customer) {
      router.push(`/customers/${customer.id}`)
    } else {
      router.push('/customers')
    }
  }

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

      {/* Name - Required */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-base">
          Customer Name <span className="text-red-600">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          required
          placeholder="e.g., Tannie Maria van der Merwe"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          disabled={loading}
          className="text-base"
        />
      </div>

      {/* Phone - Required */}
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-base">
          Phone Number <span className="text-red-600">*</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          required
          placeholder="e.g., 082 123 4567"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          disabled={loading}
          className="text-base"
        />
        <p className="text-sm text-gray-600">
          Used for WhatsApp and phone calls
        </p>
      </div>

      {/* Email - Optional */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-base">
          Email Address (Optional)
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="e.g., maria@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={loading}
          className="text-base"
        />
      </div>

      {/* VAT Number - Optional */}
      <div className="space-y-2">
        <Label htmlFor="vat_number" className="text-base">
          VAT Number (Optional)
        </Label>
        <Input
          id="vat_number"
          type="text"
          placeholder="e.g., 4123456789"
          value={formData.vat_number}
          onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
          disabled={loading}
          className="text-base"
        />
        <p className="text-sm text-gray-600">
          If customer is VAT-registered
        </p>
      </div>

      {/* Address - Optional */}
      <div className="space-y-2">
        <Label htmlFor="address" className="text-base">
          Address (Optional)
        </Label>
        <Input
          id="address"
          type="text"
          placeholder="e.g., 123 Main Street, Pretoria, 0001"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          disabled={loading}
          className="text-base"
        />
        <p className="text-sm text-gray-600">
          Physical address for jobs
        </p>
      </div>

      {/* Notes - Optional */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-base">
          Notes (Optional)
        </Label>
        <Textarea
          id="notes"
          placeholder="e.g., Prefers morning appointments. Has two dogs."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          disabled={loading}
          className="text-base min-h-[120px]"
        />
        <p className="text-sm text-gray-600">
          Internal notes - not visible to customer
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
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
            <>
              {mode === 'create' ? 'Add Customer' : 'Save Changes'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
