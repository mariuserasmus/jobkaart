import { NextRequest, NextResponse } from 'next/server'
import { getTenantId } from '@/lib/db/supabase-server'
import { getCurrentUsage } from '@/lib/usage/limits'

/**
 * GET /api/usage/current
 * Get current month's usage for the logged-in tenant
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId()
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get usage via RPC function
    const usage = await getCurrentUsage(tenantId)

    return NextResponse.json(usage)
  } catch (error) {
    console.error('Error fetching usage:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    )
  }
}
