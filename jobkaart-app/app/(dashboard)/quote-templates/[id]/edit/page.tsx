import { createServerClient, getTenantId } from '@/lib/db/supabase-server'
import { redirect } from 'next/navigation'
import { QuoteTemplate } from '@/types'
import { QuoteTemplateForm } from '@/components/features/quote-templates/QuoteTemplateForm'

export const dynamic = 'force-dynamic'

interface EditQuoteTemplatePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditQuoteTemplatePage({ params }: EditQuoteTemplatePageProps) {
  const { id } = await params
  const tenantId = await getTenantId()

  if (!tenantId) {
    redirect('/login')
  }

  const supabase = await createServerClient()

  // Fetch the template
  const { data: template, error } = await supabase
    .from('quote_templates')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (error || !template) {
    redirect('/quote-templates')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Quote Template</h1>
        <p className="text-gray-600">
          Update your template to keep it current with your pricing and services
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <QuoteTemplateForm
          template={template as QuoteTemplate}
          mode="edit"
        />
      </div>
    </div>
  )
}
