'use client'

import { useState, useEffect } from 'react'
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

interface ProgressOrBalanceModalProps {
  isOpen: boolean
  onClose: () => void
  jobId: string
  jobTitle: string
  quoteTotal: number
}

const PROGRESS_OPTIONS = [
  { value: 10, label: '10%' },
  { value: 15, label: '15%' },
  { value: 20, label: '20%' },
  { value: 25, label: '25%' },
  { value: 30, label: '30%' },
  { value: 33, label: '33%' },
  { value: 40, label: '40%' },
  { value: 50, label: '50%' },
]

export function ProgressOrBalanceModal({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  quoteTotal,
}: ProgressOrBalanceModalProps) {
  const router = useRouter()
  const [invoiceType, setInvoiceType] = useState<'progress' | 'balance'>('progress')
  const [progressPercentage, setProgressPercentage] = useState(25)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invoiceStats, setInvoiceStats] = useState({
    totalInvoiced: 0,
    percentageInvoiced: 0,
    remaining: 0,
    remainingPercentage: 0,
  })

  // Fetch existing invoices to calculate what's been invoiced
  useEffect(() => {
    if (isOpen) {
      fetchInvoiceStats()
    }
  }, [isOpen, jobId])

  const fetchInvoiceStats = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/invoices`)
      const result = await response.json()

      if (result.success) {
        const invoices = result.data || []
        const totalInvoiced = invoices.reduce((sum: number, inv: any) => sum + inv.total, 0)
        const percentageInvoiced = (totalInvoiced / quoteTotal) * 100
        const remaining = quoteTotal - totalInvoiced
        const remainingPercentage = 100 - percentageInvoiced

        setInvoiceStats({
          totalInvoiced,
          percentageInvoiced,
          remaining,
          remainingPercentage,
        })
      }
    } catch (err) {
      console.error('Error fetching invoice stats:', err)
    }
  }

  const progressAmount = (quoteTotal * progressPercentage) / 100
  const totalAfterProgress = invoiceStats.totalInvoiced + progressAmount
  const percentageAfterProgress = (totalAfterProgress / quoteTotal) * 100

  const handleCreate = async () => {
    setError(null)
    setIsCreating(true)

    try {
      if (invoiceType === 'progress') {
        // Create progress invoice
        const response = await fetch('/api/invoices/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_id: jobId,
            percentage: progressPercentage,
          }),
        })

        const result = await response.json()

        if (!result.success) {
          setError(result.error || 'Failed to create progress invoice')
          return
        }

        // Success! Navigate to the new invoice
        onClose()
        router.push(`/invoices/${result.data.invoice_id}`)
        router.refresh()
      } else {
        // Create balance invoice
        const response = await fetch('/api/invoices/balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_id: jobId }),
        })

        const result = await response.json()

        if (!result.success) {
          setError(result.error || 'Failed to create balance invoice')
          return
        }

        // Success! Navigate to the new invoice
        onClose()
        router.push(`/invoices/${result.data.invoice_id}`)
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Error creating invoice:', err)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
          <DialogDescription>
            Choose to invoice progress payment or create final balance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Job Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-900">{jobTitle}</p>
            <p className="text-sm text-gray-600 mt-1">
              Quote Total: R{quoteTotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </p>
            <div className="mt-2 pt-2 border-t border-gray-300">
              <p className="text-xs text-gray-600">
                Already Invoiced: R{invoiceStats.totalInvoiced.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} ({invoiceStats.percentageInvoiced.toFixed(1)}%)
              </p>
              <p className="text-xs font-medium text-blue-600">
                Remaining: R{invoiceStats.remaining.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} ({invoiceStats.remainingPercentage.toFixed(1)}%)
              </p>
            </div>
          </div>

          {/* Invoice Type Selection */}
          <div className="space-y-3">
            {/* Progress Payment Option */}
            <div
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                invoiceType === 'progress'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setInvoiceType('progress')}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  checked={invoiceType === 'progress'}
                  onChange={() => setInvoiceType('progress')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label className="text-base font-semibold cursor-pointer">
                    Progress Payment
                  </Label>
                  <p className="text-xs text-gray-600 mt-1">
                    Invoice a portion of the remaining amount
                  </p>

                  {invoiceType === 'progress' && (
                    <div className="mt-3">
                      <select
                        value={progressPercentage}
                        onChange={(e) => setProgressPercentage(Number(e.target.value))}
                        disabled={isCreating}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {PROGRESS_OPTIONS.map((option) => {
                          const amount = (quoteTotal * option.value) / 100
                          return (
                            <option key={option.value} value={option.value}>
                              {option.label} - R{amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            </option>
                          )
                        })}
                      </select>
                      <div className="mt-2 bg-white border border-blue-200 rounded p-2">
                        <p className="text-xs text-gray-600">
                          This invoice: <span className="font-semibold">R{progressAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>
                        </p>
                        <p className="text-xs text-gray-600">
                          Total invoiced after: <span className="font-semibold">{percentageAfterProgress.toFixed(1)}%</span> (R{totalAfterProgress.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')})
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Final Balance Option */}
            <div
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                invoiceType === 'balance'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setInvoiceType('balance')}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  checked={invoiceType === 'balance'}
                  onChange={() => setInvoiceType('balance')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label className="text-base font-semibold cursor-pointer">
                    Final Balance Invoice
                  </Label>
                  <p className="text-xs text-gray-600 mt-1">
                    Invoice the complete remaining balance
                  </p>

                  {invoiceType === 'balance' && (
                    <div className="mt-3 bg-white border border-green-200 rounded p-2">
                      <p className="text-sm font-semibold text-green-900">
                        R{invoiceStats.remaining.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      </p>
                      <p className="text-xs text-gray-600">
                        ({invoiceStats.remainingPercentage.toFixed(1)}% of total)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
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
            onClick={handleCreate}
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : `Create ${invoiceType === 'progress' ? 'Progress' : 'Balance'} Invoice`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
