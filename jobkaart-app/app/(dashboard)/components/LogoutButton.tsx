'use client'

import { createClient } from '@/lib/db/supabase-client'

export default function LogoutButton() {
  const handleLogout = async () => {
    try {
      // Sign out on client (clears cookies immediately)
      const supabase = createClient()
      await supabase.auth.signOut()

      // Clear all site data to ensure clean logout
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        for (const registration of registrations) {
          await registration.unregister()
        }
      }

      // Force complete reload to homepage (bypasses all caching and middleware)
      window.location.replace('/')
    } catch (error) {
      console.error('Logout failed:', error)
      // Even if error, still redirect
      window.location.replace('/')
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 cursor-pointer"
    >
      Sign out
    </button>
  )
}
