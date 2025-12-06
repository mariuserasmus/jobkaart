'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui'
import { Label } from '@/components/ui'

interface DepositInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  jobId: string
  jobTitle: string
  quoteTotal: number
}

const DEPOSIT_OPTIONS = [
  { value: 25, label: '25%' },
  { value: 30, label: '30%' },
  { value: 50, label: '50%' },
  { value: 100, label: '100% (Full payment upfront)' },
]

export function DepositInvoiceModal({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  quoteTotal,
}: DepositInvoiceModalProps) {
  const router = useRouter()
  const [depositPercentage, setDepositPercentage] = useState(50)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const depositAmount = (quoteTotal * depositPercentage) / 100
  const balanceAfter = quoteTotal - depositAmount

  const handleCreateDeposit = async () => {
    setError(null)
    setIsCreating(true)

    try {
      const response = await fetch('/api/invoices/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          deposit_percentage: depositPercentage,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Failed to create deposit invoice')
        return
      }

      // Success! Navigate to the new invoice
      onClose()
      router.push(`/invoices/${result.data.invoice_id}`)
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Error creating deposit invoice:', err)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Deposit Payment</DialogTitle>
          <DialogDescription>
            Create a deposit invoice to request upfront payment before starting work.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Job Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-900">{jobTitle}</p>
            <p className="text-sm text-gray-600 mt-1">
              Quote Total: R{quoteTotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </p>
          </div>

          {/* Deposit Percentage Selection */}
          <div>
            <Label htmlFor="deposit_percentage">Deposit Percentage</Label>
            <select
              id="deposit_percentage"
              value={depositPercentage}
              onChange={(e) => setDepositPercentage(Number(e.target.value))}
              disabled={isCreating}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {DEPOSIT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} - R{((quoteTotal * option.value) / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Common deposit amounts for SA tradies: 30-50% for materials and commitment
            </p>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Deposit Invoice:</span>
              <span className="font-semibold text-gray-900">
                R{depositAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Balance Due After:</span>
              <span className="font-semibold text-gray-900">
                R{balanceAfter.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              </span>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> Once the customer pays the deposit, you can create the final
              balance invoice after completing the job. The deposit will be automatically deducted.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCreateDeposit}
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Deposit Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
