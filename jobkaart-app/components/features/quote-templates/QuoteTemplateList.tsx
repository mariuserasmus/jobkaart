'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { QuoteTemplate } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

interface QuoteTemplateListProps {
  templates: QuoteTemplate[]
  onDelete?: (templateId: string) => void
}

export function QuoteTemplateList({ templates, onDelete }: QuoteTemplateListProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(search.toLowerCase()) ||
    (template.description && template.description.toLowerCase().includes(search.toLowerCase()))
  )

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return
    }

    setDeletingId(templateId)

    try {
      const response = await fetch(`/api/quote-templates/${templateId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!result.success) {
        alert(result.error || 'Failed to delete template')
        return
      }

      // Call the parent's onDelete callback if provided
      if (onDelete) {
        onDelete(templateId)
      }

      router.refresh()
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Failed to delete template. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return 'R0.00'
    return `R${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search templates by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <Button
          onClick={() => router.push('/quote-templates/new')}
          className="sm:w-auto"
        >
          + New Template
        </Button>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="space-y-3">
            <svg
              className="w-16 h-16 mx-auto text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">
              {search ? 'No templates found' : 'No templates yet'}
            </h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              {search
                ? 'Try adjusting your search terms'
                : 'Create your first quote template to save time on common jobs'}
            </p>
            {!search && (
              <Button
                onClick={() => router.push('/quote-templates/new')}
                className="mt-4"
              >
                Create Template
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className="p-5 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/quote-templates/${template.id}/edit`)}
            >
              {/* Header */}
              <div className="space-y-2 mb-4">
                <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                  {template.name}
                </h3>
                {template.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {template.description}
                  </p>
                )}
              </div>

              {/* Line Items Count */}
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <span>{template.line_items.length} line items</span>
              </div>

              {/* Total Amount */}
              <div className="mb-4 py-3 px-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-700 mb-1">Default Total</div>
                <div className="text-xl font-bold text-blue-600">
                  {formatCurrency(template.default_total)}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                  <span>Used {template.times_used} times</span>
                </div>
                <div>Last used: {formatDate(template.last_used_at)}</div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/quote-templates/${template.id}/edit`)
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(template.id)
                  }}
                  disabled={deletingId === template.id}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  {deletingId === template.id ? (
                    <svg
                      className="animate-spin h-4 w-4"
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
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
