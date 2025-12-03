/**
 * API Route: Get Subscription Status
 *
 * GET /api/subscriptions/status
 *
 * Returns current subscription status for authenticated tenant
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // Not used
          },
          remove(name: string, options: any) {
            // Not used
          }
        }
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's tenant
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const tenantId = userData.tenant_id;

    // Get tenant subscription info
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select(
        `
        id,
        business_name,
        subscription_tier,
        subscription_status,
        trial_ends_at,
        subscription_started_at,
        subscription_ends_at,
        monthly_job_limit
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

    // Calculate trial status
    const now = new Date();
    const trialEndsAt = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : null;
    const isInTrial = trialEndsAt && trialEndsAt > now;
    const trialDaysRemaining = isInTrial
      ? Math.ceil((trialEndsAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Build response
    const response = {
      tenant: {
        id: tenant.id,
        business_name: tenant.business_name,
        subscription_tier: tenant.subscription_tier,
        subscription_status: tenant.subscription_status,
        monthly_job_limit: tenant.monthly_job_limit
      },
      trial: {
        is_in_trial: isInTrial,
        ends_at: tenant.trial_ends_at,
        days_remaining: trialDaysRemaining
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
        has_access: ['active', 'trial'].includes(tenant.subscription_status),
        reason:
          tenant.subscription_status === 'active'
            ? 'Active subscription'
            : tenant.subscription_status === 'trial'
            ? `Trial (${trialDaysRemaining} days remaining)`
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
