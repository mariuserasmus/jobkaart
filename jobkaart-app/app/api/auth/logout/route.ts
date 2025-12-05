import { createClient } from '@/lib/db/supabase-client'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = createClient()
  await supabase.auth.signOut()

  // Return success - let the client handle redirect
  return NextResponse.json({ success: true })
}
