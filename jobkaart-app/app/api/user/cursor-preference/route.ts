import { createServerClient } from '@/lib/db/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { cursorStyle } = await request.json()

    // Validate cursor style
    const validCursors = ['default', 'spanner', 'brush', 'screwdriver', 'hammer', 'drill']
    if (!validCursors.includes(cursorStyle)) {
      return NextResponse.json(
        { error: 'Invalid cursor style' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Update user's cursor preference
    const { error: updateError } = await supabase
      .from('users')
      .update({ cursor_style: cursorStyle })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating cursor preference:', updateError)
      return NextResponse.json(
        { error: 'Failed to update cursor preference' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in cursor preference API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
