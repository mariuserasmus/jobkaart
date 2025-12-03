'use client'

/**
 * Record Payment Dialog Component
 * Modal dialog for recording invoice payments
 */

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { Label } from '@/components/ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import { PaymentMethod } from '@/types'

interface RecordPaymentDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payment: PaymentData) => Promise<void>
  maxAmount: number
  invoiceNumber: string
}

export interface PaymentData {
  amount: number
  payment_date: string
  payment_method: PaymentMethod
  reference?: string
}

export function RecordPaymentDialog({
  isOpen,
  onClose,
  onSubmit,
  maxAmount,
  invoiceNumber,
}: RecordPaymentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [amountInput, setAmountInput] = useState(maxAmount.toFixed(2))
  const [formData, setFormData] = useState<PaymentData>({
    amount: maxAmount,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'eft',
    reference: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Parse the amount from input string
    const amount = parseFloat(amountInput.replace(',', '.'))

    // Validation
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid payment amount')
      return
    }

    // Convert to cents (integers) to avoid floating-point comparison issues
    const amountInCents = Math.round(amount * 100)
    const maxAmountInCents = Math.round(maxAmount * 100)

    if (amountInCents > maxAmountInCents) {
      setError(`Payment amount cannot exceed outstanding amount of R${maxAmount.toFixed(2)}`)
      return
    }

    // Use the amount rounded to cents for submission
    const roundedAmount = amountInCents / 100

    setIsSubmitting(true)
    try {
      await onSubmit({ ...formData, amount: roundedAmount })
      // Reset form
      setAmountInput(maxAmount.toFixed(2))
      setFormData({
        amount: maxAmount,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'eft',
        reference: '',
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment for invoice {invoiceNumber}. Outstanding amount: R
            {maxAmount.toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (R)</Label>
              <Input
                id="amount"
                type="text"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="0.00"
                required
                disabled={isSubmitting}
                inputMode="decimal"
                autoComplete="off"
              />
              <p className="text-xs text-gray-500">
                Maximum: R{maxAmount.toFixed(2)}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="payment_date">Payment Date</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, payment_date: e.target.value }))
                }
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value: PaymentMethod) =>
                  setFormData(prev => ({ ...prev, payment_method: value }))
                }
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="eft">EFT</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reference">Reference (Optional)</Label>
              <Input
                id="reference"
                type="text"
                placeholder="Transaction reference or note"
                value={formData.reference}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, reference: e.target.value }))
                }
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
