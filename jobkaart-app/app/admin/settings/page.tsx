import { requireSuperAdmin, logAdminAction } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/db/supabase-server'
import { FreeTierLimitsForm } from './components/FreeTierLimitsForm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const SYSTEM_SETTINGS_ID = '00000000-0000-0000-0000-000000000001'

async function getSystemSettings() {
  try {
    // Verify super admin access
    await requireSuperAdmin()

    const supabase = await createServerClient()

    // Get current system settings
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', SYSTEM_SETTINGS_ID)
      .single()

    if (error) {
      console.error('Error fetching system settings:', error)
      return null
    }

    if (!settings) {
      console.error('System settings not found')
      return null
    }

    return {
      free_quotes_per_month: settings.free_quotes_per_month,
      free_jobs_per_month: settings.free_jobs_per_month,
      free_invoices_per_month: settings.free_invoices_per_month,
      updated_at: settings.updated_at,
      updated_by: settings.updated_by,
    }
  } catch (error) {
    console.error('Error fetching system settings:', error)
    return null
  }
}

export default async function AdminSettingsPage() {
  // Log admin action
  await logAdminAction({
    action: 'view_admin_settings',
  })

  // Fetch initial settings
  const initialSettings = await getSystemSettings()

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Configure global system settings and FREE tier limits
        </p>
      </div>

      {/* FREE Tier Limits Section */}
      <div className="bg-white shadow rounded-lg p-6 max-w-2xl">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          FREE Tier Limits
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Set monthly usage limits for FREE tier users. Changes apply immediately to all users on the FREE plan.
        </p>

        {initialSettings ? (
          <>
            <FreeTierLimitsForm initialSettings={initialSettings} />

            {/* Last Updated Info */}
            {initialSettings.updated_at && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Last updated: {new Date(initialSettings.updated_at).toLocaleString('en-ZA', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              Failed to load system settings. Please refresh the page or contact support.
            </p>
          </div>
        )}
      </div>

      {/* Future Settings Sections */}
      <div className="mt-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 max-w-2xl">
        <h3 className="text-lg font-medium text-gray-500">Additional Settings</h3>
        <p className="text-sm text-gray-400 mt-1">
          More configuration options coming soon...
        </p>
      </div>
    </div>
  )
}
