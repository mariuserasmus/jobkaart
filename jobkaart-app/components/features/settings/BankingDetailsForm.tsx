'use client'

import { useState } from 'react'
import { Button, Input, Label } from '@/components/ui'

interface BankingDetailsFormProps {
  tenant: any
}

export default function BankingDetailsForm({ tenant }: BankingDetailsFormProps) {
  const bankingDetails = tenant.banking_details || {}

  const [formData, setFormData] = useState({
    bank_name: bankingDetails.bank_name || '',
    account_holder: bankingDetails.account_holder || '',
    account_number: bankingDetails.account_number || '',
    branch_code: bankingDetails.branch_code || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    // Validate all fields are filled if any field is filled
    const hasAnyField = Object.values(formData).some((val) => val.trim())
    const hasAllFields = Object.values(formData).every((val) => val.trim())

    if (hasAnyField && !hasAllFields) {
      setError('Please fill in all banking fields or leave all empty')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/tenants/${tenant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          banking_details: hasAllFields ? formData : null,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Failed to update banking details')
        return
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Error updating banking details:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-blue-900 mb-2">💡 Banking Information</h3>
        <p className="text-sm text-blue-800">
          Your banking details will appear on invoices so customers know where to
          make payments. This information is stored securely and only visible to you
          and your customers.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="bank_name">Bank Name</Label>
          <Input
            id="bank_name"
            type="text"
            value={formData.bank_name}
            onChange={(e) =>
              setFormData({ ...formData, bank_name: e.target.value })
            }
            disabled={loading}
            placeholder="e.g., FNB, Standard Bank, ABSA"
          />
        </div>

        <div>
          <Label htmlFor="account_holder">Account Holder Name</Label>
          <Input
            id="account_holder"
            type="text"
            value={formData.account_holder}
            onChange={(e) =>
              setFormData({ ...formData, account_holder: e.target.value })
            }
            disabled={loading}
            placeholder="e.g., Johan's Plumbing Services"
          />
          <p className="text-sm text-gray-600 mt-1">
            Name as it appears on the bank account
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="account_number">Account Number</Label>
            <Input
              id="account_number"
              type="text"
              value={formData.account_number}
              onChange={(e) =>
                setFormData({ ...formData, account_number: e.target.value })
              }
              disabled={loading}
              placeholder="e.g., 62123456789"
            />
          </div>

          <div>
            <Label htmlFor="branch_code">Branch Code</Label>
            <Input
              id="branch_code"
              type="text"
              value={formData.branch_code}
              onChange={(e) =>
                setFormData({ ...formData, branch_code: e.target.value })
              }
              disabled={loading}
              placeholder="e.g., 250655"
            />
          </div>
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
            Banking details updated successfully!
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
