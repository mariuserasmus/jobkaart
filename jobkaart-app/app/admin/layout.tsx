import { redirect } from 'next/navigation'
import Link from 'next/link'
import { isSuperAdmin } from '@/lib/admin/auth'
import { AdminBanner } from './components/AdminBanner'
import { AdminNav } from './components/AdminNav'
import { createServerClient } from '@/lib/db/supabase-server'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if user is super admin
  const isAdmin = await isSuperAdmin()

  if (!isAdmin) {
    redirect('/dashboard')
  }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Mode Banner */}
      <AdminBanner />

      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <Link href="/admin" className="text-2xl font-bold text-red-600">
                  JobKaart Admin
                </Link>
              </div>

              {/* Admin Navigation Links */}
              <AdminNav />
            </div>

            {/* Right side - User info and links */}
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Exit Admin Mode
              </Link>
              <span className="text-sm text-gray-700">{user?.email}</span>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
