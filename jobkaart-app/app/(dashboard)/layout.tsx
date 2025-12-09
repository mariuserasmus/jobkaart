import { createServerClient } from '@/lib/db/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardNav from './components/DashboardNav'
import LogoutButton from './components/LogoutButton'
import { OnboardingTour } from '@/components/onboarding/OnboardingTour'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (!user || error) {
    redirect('/login')
  }

  // Check if user is super admin
  const { data: userData } = await supabase
    .from('users')
    .select('is_super_admin, tenant_id')
    .eq('id', user.id)
    .single()

  const isSuperAdmin = userData?.is_super_admin || false
  const tenantId = userData?.tenant_id

  // Fetch badge counts
  const today = new Date().toISOString().split('T')[0]
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

  // Count quotes needing follow-up (3+ days old, sent/viewed status)
  const { count: quotesBadge } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .in('status', ['sent', 'viewed'])
    .lt('created_at', threeDaysAgo)

  // Count jobs ready to invoice (status = complete)
  const { count: jobsBadge } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'complete')

  // Count overdue invoices
  const { count: invoicesBadge } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .lt('due_date', today)
    .neq('status', 'paid')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Onboarding Tour (client-side) */}
      <OnboardingTour />

      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <Link href="/dashboard" className="text-xl sm:text-2xl font-bold text-blue-600">
                  JobKaart
                </Link>
              </div>

              {/* Desktop Navigation Links */}
              <DashboardNav
                isSuperAdmin={isSuperAdmin}
                quotesBadge={quotesBadge || 0}
                jobsBadge={jobsBadge || 0}
                invoicesBadge={invoicesBadge || 0}
              />
            </div>

            {/* Right side - User info and logout */}
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="hidden sm:inline text-sm text-gray-700">
                {user.email}
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
