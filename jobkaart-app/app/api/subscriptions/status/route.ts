/**
 * API Route: Get Subscription Status
 *
 * GET /api/subscriptions/status
 *
 * Returns current subscription status for authenticated tenant
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getTenantId } from '@/lib/db/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId();

    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerClient();

    // Get tenant subscription info
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select(
        `
        id,
        business_name,
        subscription_tier,
        subscription_status,
        subscription_started_at,
        subscription_ends_at
      `
      )
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Get current subscription details
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Calculate trial status (now for FREE tier system)
    const isFree = tenant.subscription_status === 'free';

    // Build response
    const response = {
      tenant: {
        id: tenant.id,
        business_name: tenant.business_name,
        subscription_tier: tenant.subscription_tier,
        subscription_status: tenant.subscription_status,
        monthly_job_limit: null // Removed - now handled by monthly_usage table
      },
      trial: {
        is_in_trial: false, // No more trials - everyone starts FREE
        ends_at: null,
        days_remaining: 0
      },
      subscription: subscription
        ? {
            id: subscription.id,
            plan_type: subscription.plan_type,
            status: subscription.status,
            amount: subscription.amount,
            currency: subscription.currency,
            start_date: subscription.start_date,
            next_billing_date: subscription.next_billing_date,
            cancelled_at: subscription.cancelled_at
          }
        : null,
      access: {
        has_access: ['active', 'free'].includes(tenant.subscription_status),
        reason:
          tenant.subscription_status === 'active'
            ? 'Active subscription'
            : tenant.subscription_status === 'free'
            ? 'FREE tier (5 quotes/jobs/invoices per month)'
            : tenant.subscription_status === 'overdue'
            ? 'Payment overdue'
            : 'No active subscription'
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
