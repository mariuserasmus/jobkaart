'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { QuoteWithDetails, Customer, LineItem, QuoteTemplate } from '@/types'
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

interface QuoteFormProps {
  quote?: QuoteWithDetails
  mode: 'create' | 'edit'
  preselectedCustomerId?: string
}

export function QuoteForm({ quote, mode, preselectedCustomerId }: QuoteFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [templates, setTemplates] = useState<QuoteTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')

  const [customerId, setCustomerId] = useState(
    preselectedCustomerId || quote?.customer_id || ''
  )
  const [notes, setNotes] = useState(quote?.notes || '')
  const [termsAndConditions, setTermsAndConditions] = useState(
    quote?.terms_and_conditions || ''
  )
  const [validUntil, setValidUntil] = useState(() => {
    if (quote?.valid_until) {
      return quote.valid_until.split('T')[0]
    }
    // Default to 30 days from now
    const date = new Date()
    date.setDate(date.getDate() + 30)
    return date.toISOString().split('T')[0]
  })
  const [includeVat, setIncludeVat] = useState(
    quote ? quote.vat_amount > 0 : true
  )

  const [lineItems, setLineItems] = useState<LineItemForm[]>(() => {
    if (quote?.line_items && quote.line_items.length > 0) {
      return quote.line_items.map(item => ({
        description: item.description,
        quantity: item.quantity.toString(),
        unit_price: item.unit_price.toString(),
      }))
    }
    return [{ description: '', quantity: '1', unit_price: '' }]
  })

  // Update form when quote prop changes (for edit mode)
  useEffect(() => {
    if (quote) {
      setCustomerId(quote.customer_id)
      setNotes(quote.notes || '')
      setTermsAndConditions(quote.terms_and_conditions || '')
      setIncludeVat(quote.vat_amount > 0)

      if (quote.valid_until) {
        setValidUntil(quote.valid_until.split('T')[0])
      }

      if (quote.line_items && quote.line_items.length > 0) {
        setLineItems(quote.line_items.map(item => ({
          description: item.description,
          quantity: item.quantity.toString(),
          unit_price: item.unit_price.toString(),
        })))
      }
    }
  }, [quote])

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

  // Load quote templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await fetch('/api/quote-templates?limit=100')
        const result = await response.json()
        if (result.success) {
          setTemplates(result.data.templates)
        }
      } catch (err) {
        console.error('Failed to load templates:', err)
      } finally {
        setLoadingTemplates(false)
      }
    }
    loadTemplates()
  }, [])

  // Handle template selection
  const handleLoadTemplate = async (templateId: string) => {
    if (!templateId) {
      setSelectedTemplateId('')
      return
    }

    try {
      const response = await fetch(`/api/quote-templates/${templateId}`)
      const result = await response.json()

      if (result.success && result.data) {
        const template: QuoteTemplate = result.data

        // Load line items from template
        setLineItems(template.line_items.map(item => ({
          description: item.description,
          quantity: item.quantity.toString(),
          unit_price: item.unit_price.toString(),
        })))

        // Load VAT setting
        setIncludeVat((template.default_vat_amount || 0) > 0)

        // Load notes and terms if present
        if (template.notes) {
          setNotes(template.notes)
        }
        if (template.terms) {
          setTermsAndConditions(template.terms)
        }

        setSelectedTemplateId(templateId)

        // Update template usage (fire and forget)
        fetch(`/api/quote-templates/${templateId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            times_used: template.times_used + 1,
            last_used_at: new Date().toISOString(),
          }),
        }).catch(err => console.error('Failed to update template usage:', err))
      }
    } catch (err) {
      console.error('Failed to load template:', err)
      alert('Failed to load template. Please try again.')
    }
  }

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

    try {
      const url = mode === 'create'
        ? '/api/quotes'
        : `/api/quotes/${quote?.id}`

      const method = mode === 'create' ? 'POST' : 'PATCH'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customerId,
          line_items: lineItems.map(item => ({
            description: item.description,
            quantity: parseFloat(item.quantity),
            unit_price: parseFloat(item.unit_price),
          })),
          vat_amount: vat,
          notes,
          terms_and_conditions: termsAndConditions,
          valid_until: validUntil,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Something went wrong')
        return
      }

      // Redirect to quote detail page
      router.push(`/quotes/${result.data.id}`)
      router.refresh()
    } catch (err) {
      console.error('Form submission error:', err)
      setError('Failed to save quote. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (quote) {
      router.push(`/quotes/${quote.id}`)
    } else {
      router.push('/quotes')
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

      {/* Customer Selection */}
      <div className="space-y-2">
        <Label htmlFor="customer" className="text-base">
          Customer <span className="text-red-600">*</span>
        </Label>
        {loadingCustomers ? (
          <div className="text-sm text-gray-600">Loading customers...</div>
        ) : (
          <Select value={customerId} onValueChange={setCustomerId}>
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
        <p className="text-sm text-gray-600">
          Don't see the customer?{' '}
          <a href="/customers/new" className="text-blue-600 hover:underline">
            Add them first
          </a>
        </p>
      </div>

      {/* Load from Template */}
      {mode === 'create' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
          <Label htmlFor="template" className="text-base">
            Load from Template (Optional)
          </Label>
          {loadingTemplates ? (
            <div className="text-sm text-gray-600">Loading templates...</div>
          ) : (
            <>
              <Select value={selectedTemplateId || undefined} onValueChange={handleLoadTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template to load..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                      {template.description && ` - ${template.description}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {templates.length === 0 ? (
                <p className="text-sm text-gray-600">
                  No templates yet.{' '}
                  <a href="/quote-templates/new" className="text-blue-600 hover:underline">
                    Create your first template
                  </a>
                </p>
              ) : selectedTemplateId ? (
                <p className="text-sm text-green-700">
                  Template loaded. You can edit the fields below as needed.
                </p>
              ) : (
                <p className="text-sm text-gray-600">
                  Select a template to pre-fill line items, notes, and terms
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Line Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base">
            Line Items <span className="text-red-600">*</span>
          </Label>
          <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
            + Add Line Item
          </Button>
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
                min="0"
                placeholder="0.00"
                value={item.unit_price}
                onChange={(e) => updateLineItem(index, 'unit_price', e.target.value)}
                required
              />
            </div>

            {/* Remove Button */}
            <div className="md:col-span-1 flex items-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeLineItem(index)}
                disabled={lineItems.length === 1}
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
          className="w-5 h-5 rounded"
        />
        <Label htmlFor="includeVat" className="text-base cursor-pointer">
          Include VAT (15%)
        </Label>
      </div>

      {/* Totals Preview */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
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
        <div className="flex justify-between text-base pt-2 border-t border-blue-300">
          <span className="font-bold text-gray-900">Total:</span>
          <span className="font-bold text-blue-600 text-xl">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Valid Until */}
      <div className="space-y-2">
        <Label htmlFor="validUntil" className="text-base">
          Valid Until <span className="text-red-600">*</span>
        </Label>
        <Input
          id="validUntil"
          type="date"
          value={validUntil}
          onChange={(e) => setValidUntil(e.target.value)}
          required
        />
        <p className="text-sm text-gray-600">
          Default is 30 days from today
        </p>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-base">
          Notes (Optional)
        </Label>
        <Textarea
          id="notes"
          placeholder="e.g., Additional work details, special requirements"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[100px]"
        />
        <p className="text-sm text-gray-600">
          Internal notes - visible to customer
        </p>
      </div>

      {/* Terms & Conditions */}
      <div className="space-y-2">
        <Label htmlFor="terms" className="text-base">
          Terms & Conditions (Optional)
        </Label>
        <Textarea
          id="terms"
          placeholder="e.g., 50% deposit required, final payment on completion"
          value={termsAndConditions}
          onChange={(e) => setTermsAndConditions(e.target.value)}
          className="min-h-[100px]"
        />
        <p className="text-sm text-gray-600">
          Payment terms, warranty info, etc.
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
              {mode === 'create' ? 'Create Quote' : 'Save Changes'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
