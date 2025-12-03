/**
 * API Route: Cancel Subscription
 *
 * POST /api/subscriptions/cancel
 *
 * Cancels the current subscription for the authenticated tenant
 * Note: This doesn't cancel on PayFast side - user must do that manually
 * The subscription remains active until end of billing period
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

// Service role client for bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reason } = body;

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
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only owner/admin can cancel subscription
    if (!['owner', 'admin'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Only owners and admins can cancel subscriptions' },
        { status: 403 }
      );
    }

    const tenantId = userData.tenant_id;

    // Get current active subscription
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('tenant_id', tenantId)
      .in('status', ['active', 'trial'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'No active subscription found to cancel' },
        { status: 404 }
      );
    }

    // Calculate end date (end of current billing period or immediate for trial)
    const now = new Date();
    let endDate: Date;

    if (subscription.status === 'trial') {
      // For trial, cancel immediately
      endDate = now;
    } else {
      // For active subscriptions, end at next billing date
      endDate = subscription.next_billing_date
        ? new Date(subscription.next_billing_date)
        : now;
    }

    // Update subscription status
    const { error: updateSubError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: now.toISOString(),
        cancellation_reason: reason || 'User requested cancellation',
        end_date: endDate.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('id', subscription.id);

    if (updateSubError) {
      console.error('Error updating subscription:', updateSubError);
      return NextResponse.json(
        { error: 'Failed to cancel subscription' },
        { status: 500 }
      );
    }

    // Update tenant status
    const { error: updateTenantError } = await supabaseAdmin
      .from('tenants')
      .update({
        subscription_status: 'cancelled',
        subscription_ends_at: endDate.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('id', tenantId);

    if (updateTenantError) {
      console.error('Error updating tenant:', updateTenantError);
    }

    // Log cancellation event
    await supabaseAdmin.from('subscription_events').insert({
      tenant_id: tenantId,
      subscription_id: subscription.id,
      event_type: 'cancelled',
      event_data: {
        reason: reason || 'User requested cancellation',
        end_date: endDate.toISOString(),
        cancelled_by: user.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      end_date: endDate.toISOString(),
      immediate: subscription.status === 'trial'
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
