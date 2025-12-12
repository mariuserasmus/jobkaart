'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Customer, LineItem } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface LineItemForm {
  description: string
  quantity: string
  unit_price: string
}

interface InvoiceFormProps {
  jobId?: string
  mode: 'create'
}

interface JobData {
  id: string
  customer_id: string
  customers: Customer
  quotes?: {
    id: string
    line_items: LineItem[]
    subtotal: number
    vat_amount: number
    total: number
  }
}

export function InvoiceForm({ jobId, mode }: InvoiceFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [loadingJob, setLoadingJob] = useState(!!jobId)

  const [customerId, setCustomerId] = useState('')
  const [dueDate, setDueDate] = useState(() => {
    // Default to 30 days from now
    const date = new Date()
    date.setDate(date.getDate() + 30)
    return date.toISOString().split('T')[0]
  })
  const [notes, setNotes] = useState('')
  const [includeVat, setIncludeVat] = useState(true)

  const [lineItems, setLineItems] = useState<LineItemForm[]>([
    { description: '', quantity: '1', unit_price: '' }
  ])

  // Load job data if jobId is provided
  useEffect(() => {
    const loadJobData = async () => {
      if (!jobId) return

      try {
        const response = await fetch(`/api/jobs/${jobId}`)
        const result = await response.json()

        if (result.success && result.data) {
          const job: JobData = result.data

          // Pre-fill customer
          setCustomerId(job.customer_id)

          // Check for existing deposit/progress invoices
          const invoicesResponse = await fetch(`/api/jobs/${jobId}/invoices`)
          const invoicesResult = await invoicesResponse.json()

          let hasExistingInvoices = false
          let totalAlreadyInvoiced = 0
          let existingInvoicesList: any[] = []

          if (invoicesResult.success && invoicesResult.data) {
            const depositProgressInvoices = invoicesResult.data.filter(
              (inv: any) => inv.invoice_type === 'deposit' || inv.invoice_type === 'progress'
            )

            if (depositProgressInvoices.length > 0) {
              hasExistingInvoices = true
              existingInvoicesList = depositProgressInvoices
              totalAlreadyInvoiced = depositProgressInvoices.reduce(
                (sum: number, inv: any) => sum + Number(inv.total),
                0
              )
            }
          }

          // Pre-fill line items from quote if available
          if (job.quotes && job.quotes.line_items && job.quotes.line_items.length > 0) {
            if (hasExistingInvoices) {
              // Show balance invoice line items
              const balanceLineItems: LineItemForm[] = [
                {
                  description: `Final payment for ${job.quotes.line_items[0]?.description || 'job'}`,
                  quantity: '1',
                  unit_price: job.quotes.total.toString(),
                },
                // Show all previous payments
                ...existingInvoicesList.map((inv: any) => ({
                  description: `Less: ${inv.invoice_type === 'deposit' ? 'Deposit' : 'Progress'} paid (${inv.invoice_number})${inv.deposit_percentage ? ` - ${inv.deposit_percentage}%` : ''}`,
                  quantity: '1',
                  unit_price: (-Number(inv.total)).toString(),
                })),
              ]
              setLineItems(balanceLineItems)
              setInfoMessage(`This will create a balance invoice for R${(job.quotes.total - totalAlreadyInvoiced).toFixed(2)} (after ${existingInvoicesList.length} previous payment${existingInvoicesList.length > 1 ? 's' : ''})`)
            } else {
              // Normal full invoice
              setLineItems(
                job.quotes.line_items.map(item => ({
                  description: item.description,
                  quantity: item.quantity.toString(),
                  unit_price: item.unit_price.toString(),
                }))
              )
            }
            setIncludeVat(job.quotes.vat_amount > 0)
          }
        }
      } catch (err) {
        console.error('Failed to load job data:', err)
        setError('Failed to load job data')
      } finally {
        setLoadingJob(false)
      }
    }

    loadJobData()
  }, [jobId])

  // Load customers
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await fetch('/api/customers?limit=1000')
        const result = await response.json()
        if (result.success) {
          setCustomers(result.data.customers)
        }
      } catch (err) {
        console.error('Failed to load customers:', err)
      } finally {
        setLoadingCustomers(false)
      }
    }
    loadCustomers()
  }, [])

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: '1', unit_price: '' }])
  }

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index))
    }
  }

  const updateLineItem = (index: number, field: keyof LineItemForm, value: string) => {
    const updated = [...lineItems]
    updated[index][field] = value
    setLineItems(updated)
  }

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0
      const price = parseFloat(item.unit_price) || 0
      return sum + (qty * price)
    }, 0)

    const vat = includeVat ? subtotal * 0.15 : 0
    const total = subtotal + vat

    return { subtotal, vat, total }
  }

  const { subtotal, vat, total } = calculateTotals()

  const formatCurrency = (amount: number) => {
    if (amount === undefined || amount === null) return 'R0.00'
    return `R${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validation
    if (!customerId) {
      setError('Please select a customer')
      setLoading(false)
      return
    }

    if (lineItems.some(item => !item.description || !item.quantity || !item.unit_price)) {
      setError('Please fill in all line item fields')
      setLoading(false)
      return
    }

    if (!dueDate) {
      setError('Please select a due date')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customerId,
          job_id: jobId || null,
          line_items: lineItems.map(item => ({
            description: item.description,
            quantity: parseFloat(item.quantity),
            unit_price: parseFloat(item.unit_price),
          })),
          subtotal,
          vat_amount: vat,
          total,
          due_date: dueDate,
          notes,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Something went wrong')
        return
      }

      // Redirect to invoice detail page
      router.push(`/invoices/${result.data.id}`)
      router.refresh()
    } catch (err) {
      console.error('Form submission error:', err)
      setError('Failed to create invoice. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (jobId) {
      router.push(`/jobs/${jobId}`)
    } else {
      router.push('/invoices')
    }
  }

  if (loadingJob) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <svg
            className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-600"
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
          <p className="text-gray-600">Loading job data...</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {infoMessage && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Balance Invoice</p>
              <p className="text-sm text-blue-800 mt-1">{infoMessage}</p>
            </div>
          </div>
        </div>
      )}

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

      {/* Job ID Info */}
      {jobId && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <span className="font-medium">Creating invoice from job</span> - Customer and line items have been pre-filled from the job/quote
          </p>
        </div>
      )}

      {/* Customer Selection */}
      <div className="space-y-2">
        <Label htmlFor="customer" className="text-base">
          Customer <span className="text-red-600">*</span>
        </Label>
        {loadingCustomers ? (
          <div className="text-sm text-gray-600">Loading customers...</div>
        ) : (
          <Select
            value={customerId}
            onValueChange={setCustomerId}
            disabled={!!jobId || loading} // Disable if from job or loading
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map(customer => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name} - {customer.phone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {!jobId && (
          <p className="text-sm text-gray-600">
            Don't see the customer?{' '}
            <a href="/customers/new" className="text-blue-600 hover:underline">
              Add them first
            </a>
          </p>
        )}
      </div>

      {/* Due Date */}
      <div className="space-y-2">
        <Label htmlFor="dueDate" className="text-base">
          Due Date <span className="text-red-600">*</span>
        </Label>
        <Input
          id="dueDate"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          disabled={loading}
          required
        />
        <p className="text-sm text-gray-600">
          Default is 30 days from today
        </p>
      </div>

      {/* Line Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base">
            Line Items <span className="text-red-600">*</span>
          </Label>
          {!infoMessage && (
            <Button type="button" variant="outline" size="sm" onClick={addLineItem} disabled={loading}>
              + Add Line Item
            </Button>
          )}
        </div>

        {lineItems.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 border border-gray-200 rounded-lg"
          >
            {/* Description */}
            <div className="md:col-span-6 space-y-1">
              <Label htmlFor={`desc-${index}`} className="text-sm">
                Description
              </Label>
              <Input
                id={`desc-${index}`}
                type="text"
                placeholder="e.g., Plumbing repair, parts included"
                value={item.description}
                onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                required
                disabled={loading}
                readOnly={!!infoMessage}
              />
            </div>

            {/* Quantity */}
            <div className="md:col-span-2 space-y-1">
              <Label htmlFor={`qty-${index}`} className="text-sm">
                Quantity
              </Label>
              <Input
                id={`qty-${index}`}
                type="number"
                step="1"
                min="0"
                placeholder="1"
                value={item.quantity}
                onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                required
                disabled={loading}
                readOnly={!!infoMessage}
              />
            </div>

            {/* Unit Price */}
            <div className="md:col-span-3 space-y-1">
              <Label htmlFor={`price-${index}`} className="text-sm">
                Unit Price (R)
              </Label>
              <Input
                id={`price-${index}`}
                type="number"
                step="0.01"
                placeholder="0.00"
                value={item.unit_price}
                onChange={(e) => updateLineItem(index, 'unit_price', e.target.value)}
                required
                disabled={loading}
                readOnly={!!infoMessage}
              />
            </div>

            {/* Remove Button */}
            {!infoMessage && (
              <div className="md:col-span-1 flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLineItem(index)}
                  disabled={lineItems.length === 1 || loading}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* VAT Toggle */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
        <input
          type="checkbox"
          id="includeVat"
          checked={includeVat}
          onChange={(e) => setIncludeVat(e.target.checked)}
          disabled={loading}
          className="w-5 h-5 rounded"
        />
        <Label htmlFor="includeVat" className="text-base cursor-pointer">
          Include VAT (15%)
        </Label>
      </div>

      {/* Totals Preview */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-700">Subtotal:</span>
          <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
        </div>
        {includeVat && (
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">VAT (15%):</span>
            <span className="font-semibold text-gray-900">{formatCurrency(vat)}</span>
          </div>
        )}
        <div className="flex justify-between text-base pt-2 border-t border-green-300">
          <span className="font-bold text-gray-900">Total Amount Due:</span>
          <span className="font-bold text-green-600 text-xl">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-base">
          Notes (Optional)
        </Label>
        <Textarea
          id="notes"
          placeholder="e.g., Payment terms, additional information"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={loading}
          className="min-h-[100px]"
        />
        <p className="text-sm text-gray-600">
          Additional notes visible to customer on invoice
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
              Creating Invoice...
            </>
          ) : (
            'Create Invoice'
          )}
        </Button>
      </div>
    </form>
  )
}
