import { createClient } from '@/lib/db/supabase-client'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  await supabase.auth.signOut()

  // Use the request origin to redirect (works in all environments)
  const origin = request.nextUrl.origin
  return NextResponse.redirect(new URL('/login', origin))
}
