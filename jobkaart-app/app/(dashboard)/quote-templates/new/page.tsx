import { getTenantId } from '@/lib/db/supabase-server'
import { redirect } from 'next/navigation'
import { QuoteTemplateForm } from '@/components/features/quote-templates/QuoteTemplateForm'

export default async function NewQuoteTemplatePage() {
  const tenantId = await getTenantId()

  if (!tenantId) {
    redirect('/login')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Quote Template</h1>
        <p className="text-gray-600">
          Create a reusable template for common jobs to save time when creating quotes
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <QuoteTemplateForm mode="create" />
      </div>
    </div>
  )
}
