import { getTenantId } from '@/lib/db/supabase-server'
import { createServerClient } from '@/lib/db/supabase-server'
import { redirect } from 'next/navigation'
import SettingsTabs from '@/components/features/settings/SettingsTabs'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const tenantId = await getTenantId()

  if (!tenantId) {
    redirect('/login')
  }

  const supabase = await createServerClient()

  // Fetch tenant data
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  if (tenantError || !tenant) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load tenant information</p>
        </div>
      </div>
    )
  }

  // Fetch quote templates
  const { data: templates, error: templatesError } = await supabase
    .from('quote_templates')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('last_used_at', { ascending: false, nullsFirst: false })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your business information, banking details, and quote templates
        </p>
      </div>

      <SettingsTabs
        tenant={tenant}
        templates={templates || []}
      />
    </div>
  )
}
