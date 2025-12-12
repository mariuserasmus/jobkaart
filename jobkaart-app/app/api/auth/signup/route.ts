import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Create Supabase admin client (with service role key)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { business_name, full_name, email, phone, password } = body

    // Validation
    if (!business_name || !full_name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // 1. Create tenant (business) - FREE tier by default
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        business_name,
        email, // Add tenant email from signup
        phone, // Add tenant phone from signup
        subscription_tier: 'free', // Start with FREE tier
        subscription_status: 'free', // FREE tier status
        subscription_started_at: new Date().toISOString(),
        subscription_ends_at: null, // FREE tier never expires
      })
      .select()
      .single()

    if (tenantError) {
      console.error('Tenant creation error:', tenantError)
      return NextResponse.json(
        { error: 'Failed to create business account' },
        { status: 500 }
      )
    }

    // 2. Create Supabase auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for now
      user_metadata: {
        full_name,
        tenant_id: tenant.id,
        role: 'owner',
      },
    })

    if (authError) {
      console.error('Auth user creation error:', authError)

      // Rollback: Delete the tenant
      await supabaseAdmin.from('tenants').delete().eq('id', tenant.id)

      return NextResponse.json(
        { error: authError.message || 'Failed to create user account' },
        { status: 500 }
      )
    }

    // 3. Create user record in our users table
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        tenant_id: tenant.id,
        email,
        full_name,
        role: 'owner',
      })

    if (userError) {
      console.error('User record creation error:', userError)

      // Rollback: Delete auth user and tenant
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      await supabaseAdmin.from('tenants').delete().eq('id', tenant.id)

      return NextResponse.json(
        { error: 'Failed to create user record' },
        { status: 500 }
      )
    }

    // 4. Sign in the user automatically
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      console.error('Auto sign-in error:', signInError)
      // User account exists, they can log in manually
      return NextResponse.json(
        { success: true, message: 'Account created. Please log in.' },
        { status: 201 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          tenant_id: tenant.id,
        },
        session: signInData.session,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
