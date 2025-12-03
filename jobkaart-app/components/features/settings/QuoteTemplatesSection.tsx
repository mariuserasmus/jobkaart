'use client'

import Link from 'next/link'
import { QuoteTemplateList } from '@/components/features/quote-templates/QuoteTemplateList'
import { Button } from '@/components/ui'

interface QuoteTemplatesSectionProps {
  templates: any[]
}

export default function QuoteTemplatesSection({
  templates,
}: QuoteTemplatesSectionProps) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">📄 Quote Templates</h3>
        <p className="text-sm text-blue-800">
          Quote templates help you create professional quotes faster. Save
          commonly used services, materials, and pricing as templates. When
          creating a new quote, you can start from a template and customize it for
          each customer.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900">Your Templates</h3>
        <p className="text-sm text-gray-600 mb-4">
          {templates.length === 0
            ? 'No templates yet. Create your first template to get started.'
            : `${templates.length} template${templates.length === 1 ? '' : 's'} saved`}
        </p>
      </div>

      {templates.length > 0 ? (
        <QuoteTemplateList templates={templates} />
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No quote templates
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first template
          </p>
          <div className="mt-6">
            <Link href="/quote-templates/new">
              <Button>+ Create Template</Button>
            </Link>
          </div>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">💡 Template Tips</h4>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li>Create templates for common jobs (e.g., "Standard Bathroom Repair", "Kitchen Sink Installation")</li>
          <li>Include typical materials and labor costs</li>
          <li>Add notes and terms you use regularly</li>
          <li>Templates can be edited when creating a quote</li>
          <li>Use templates to maintain consistent pricing</li>
        </ul>
      </div>
    </div>
  )
}
