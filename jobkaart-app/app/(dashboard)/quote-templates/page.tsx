import { createServerClient, getTenantId } from '@/lib/db/supabase-server'
import { redirect } from 'next/navigation'
import { QuoteTemplate } from '@/types'
import { QuoteTemplateList } from '@/components/features/quote-templates/QuoteTemplateList'

export const dynamic = 'force-dynamic'

export default async function QuoteTemplatesPage() {
  const tenantId = await getTenantId()

  if (!tenantId) {
    redirect('/login')
  }

  const supabase = await createServerClient()

  // Fetch all quote templates for this tenant
  const { data: templates, error } = await supabase
    .from('quote_templates')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('last_used_at', { ascending: false, nullsFirst: false })
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching quote templates:', error)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quote Templates</h1>
        <p className="text-gray-600">
          Save time by creating reusable templates for common jobs
        </p>
      </div>

      {/* Templates List */}
      <QuoteTemplateList templates={(templates || []) as QuoteTemplate[]} />
    </div>
  )
}
