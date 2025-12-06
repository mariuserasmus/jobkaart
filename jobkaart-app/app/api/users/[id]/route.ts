import { NextResponse } from 'next/server'
import { createServerClient, getTenantId } from '@/lib/db/supabase-server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase admin client (with service role key)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * PATCH /api/users/[id]
 * Update user status or role
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantId()
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const params = await context.params
    const userId = params.id
    const body = await request.json()

    const supabase = await createServerClient()

    // Verify user belongs to current tenant
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role, tenant_id')
      .eq('id', userId)
      .single()

    if (userError || !user || user.tenant_id !== tenantId) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Cannot modify owner role
    if (user.role === 'owner') {
      return NextResponse.json(
        { success: false, error: 'Cannot modify the owner account' },
        { status: 403 }
      )
    }

    // Allowed fields to update
    const allowedFields = ['is_active', 'role']
    const updates: Record<string, any> = {}

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Validate role if provided
    if ('role' in updates && !['admin', 'member'].includes(updates.role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      )
    }

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error in PATCH /api/users/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/users/[id]
 * Remove user from tenant
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantId()
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const params = await context.params
    const userId = params.id

    const supabase = await createServerClient()

    // Verify user belongs to current tenant
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role, tenant_id, email')
      .eq('id', userId)
      .single()

    if (userError || !user || user.tenant_id !== tenantId) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Cannot delete owner
    if (user.role === 'owner') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the owner account' },
        { status: 403 }
      )
    }

    // Delete user record (this will cascade to auth.users via RLS)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)
      .eq('tenant_id', tenantId)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete user' },
        { status: 500 }
      )
    }

    // Delete from auth (using admin client)
    await supabaseAdmin.auth.admin.deleteUser(userId)

    return NextResponse.json({
      success: true,
      message: 'User removed successfully',
    })
  } catch (error) {
    console.error('Error in DELETE /api/users/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
