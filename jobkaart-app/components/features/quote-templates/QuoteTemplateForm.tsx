'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { QuoteTemplate, LineItem } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface LineItemForm {
  description: string
  quantity: string
  unit_price: string
}

interface QuoteTemplateFormProps {
  template?: QuoteTemplate
  mode: 'create' | 'edit'
}

export function QuoteTemplateForm({ template, mode }: QuoteTemplateFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(template?.name || '')
  const [description, setDescription] = useState(template?.description || '')
  const [notes, setNotes] = useState(template?.notes || '')
  const [terms, setTerms] = useState(template?.terms || '')
  const [includeVat, setIncludeVat] = useState(
    template ? (template.default_vat_amount || 0) > 0 : true
  )

  const [lineItems, setLineItems] = useState<LineItemForm[]>(() => {
    if (template?.line_items && template.line_items.length > 0) {
      return template.line_items.map(item => ({
        description: item.description,
        quantity: item.quantity.toString(),
        unit_price: item.unit_price.toString(),
      }))
    }
    return [{ description: '', quantity: '1', unit_price: '' }]
  })

  // Update form when template prop changes
  useEffect(() => {
    if (template) {
      setName(template.name)
      setDescription(template.description || '')
      setNotes(template.notes || '')
      setTerms(template.terms || '')
      setIncludeVat((template.default_vat_amount || 0) > 0)

      if (template.line_items && template.line_items.length > 0) {
        setLineItems(template.line_items.map(item => ({
          description: item.description,
          quantity: item.quantity.toString(),
          unit_price: item.unit_price.toString(),
        })))
      }
    }
  }, [template])

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
    if (!name.trim()) {
      setError('Please enter a template name')
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
        ? '/api/quote-templates'
        : `/api/quote-templates/${template?.id}`

      const method = mode === 'create' ? 'POST' : 'PATCH'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          line_items: lineItems.map(item => ({
            description: item.description,
            quantity: parseFloat(item.quantity),
            unit_price: parseFloat(item.unit_price),
          })),
          vat_amount: vat,
          notes: notes.trim() || null,
          terms: terms.trim() || null,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Something went wrong')
        return
      }

      // Redirect to templates list
      router.push('/quote-templates')
      router.refresh()
    } catch (err) {
      console.error('Form submission error:', err)
      setError('Failed to save template. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/quote-templates')
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

      {/* Template Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-base">
          Template Name <span className="text-red-600">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="e.g., Standard Bathroom Repair, 3-Bedroom House COC"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          required
        />
        <p className="text-sm text-gray-600">
          Give this template a clear, descriptive name
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-base">
          Description (Optional)
        </Label>
        <Textarea
          id="description"
          placeholder="e.g., Standard repair job for bathroom plumbing issues"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          className="min-h-[80px]"
        />
        <p className="text-sm text-gray-600">
          Brief description of what this template is for
        </p>
      </div>

      {/* Line Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base">
            Line Items <span className="text-red-600">*</span>
          </Label>
          <Button type="button" variant="outline" size="sm" onClick={addLineItem} disabled={loading}>
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
                placeholder="e.g., Labour, Parts, Materials"
                value={item.description}
                onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-base">
          Default Notes (Optional)
        </Label>
        <Textarea
          id="notes"
          placeholder="e.g., Default notes that will appear on quotes using this template"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={loading}
          className="min-h-[100px]"
        />
        <p className="text-sm text-gray-600">
          These notes will be pre-filled when using this template
        </p>
      </div>

      {/* Terms & Conditions */}
      <div className="space-y-2">
        <Label htmlFor="terms" className="text-base">
          Default Terms & Conditions (Optional)
        </Label>
        <Textarea
          id="terms"
          placeholder="e.g., 50% deposit required, final payment on completion"
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          disabled={loading}
          className="min-h-[100px]"
        />
        <p className="text-sm text-gray-600">
          These terms will be pre-filled when using this template
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
              {mode === 'create' ? 'Create Template' : 'Save Changes'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
