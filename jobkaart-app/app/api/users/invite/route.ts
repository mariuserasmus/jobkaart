import { NextResponse } from 'next/server'
import { createServerClient, getTenantId } from '@/lib/db/supabase-server'
import { PLAN_DETAILS } from '@/lib/payfast'
import { createClient } from '@supabase/supabase-js'

// Create Supabase admin client (with service role key)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/users/invite
 * Invite a new user to the tenant (with subscription limit checking)
 */
export async function POST(request: Request) {
  try {
    const tenantId = await getTenantId()
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createServerClient()
    const body = await request.json()
    const { email, full_name, role } = body

    // Validation
    if (!email || !full_name || !role) {
      return NextResponse.json(
        { success: false, error: 'Email, full name, and role are required' },
        { status: 400 }
      )
    }

    if (!['admin', 'member'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Role must be admin or member' },
        { status: 400 }
      )
    }

    // Get tenant info to check subscription tier
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('subscription_tier')
      .eq('id', tenantId)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Check current user count
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('tenant_id', tenantId)

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json(
        { success: false, error: 'Failed to check user count' },
        { status: 500 }
      )
    }

    // Get user limit for this subscription tier
    const userLimit = PLAN_DETAILS[tenant.subscription_tier as keyof typeof PLAN_DETAILS]?.users || 2

    // Check if at limit
    if (existingUsers && existingUsers.length >= userLimit) {
      return NextResponse.json(
        {
          success: false,
          error: `User limit reached. Your ${tenant.subscription_tier} plan allows ${userLimit} users. Upgrade to add more team members.`,
        },
        { status: 403 }
      )
    }

    // Check if email already exists for this tenant
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'A user with this email already exists in your team' },
        { status: 409 }
      )
    }

    // Generate a temporary password (user will be prompted to change it)
    const tempPassword = `${Math.random().toString(36).slice(-8)}${Math.random().toString(36).slice(-8)}`

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
        tenant_id: tenantId,
        role,
      },
    })

    if (authError) {
      console.error('Auth user creation error:', authError)
      return NextResponse.json(
        { success: false, error: authError.message || 'Failed to create user account' },
        { status: 500 }
      )
    }

    // Create user record in our users table
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        tenant_id: tenantId,
        email,
        full_name,
        role,
      })

    if (userError) {
      console.error('User record creation error:', userError)
      // Rollback: Delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { success: false, error: 'Failed to create user record' },
        { status: 500 }
      )
    }

    // TODO: Send invitation email with temporary password
    // For now, we'll just return the temp password in the response
    // In production, this should be sent via email only

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email,
          full_name,
          role,
        },
        tempPassword, // Remove this in production after email is set up
        message: `User ${full_name} has been invited successfully. Temporary password: ${tempPassword}`,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/users/invite:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
