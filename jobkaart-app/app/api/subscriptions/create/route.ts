/**
 * API Route: Create Subscription
 *
 * POST /api/subscriptions/create
 *
 * Creates a PayFast subscription and redirects user to payment page
 * After 14-day trial, first payment will be collected
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { buildSubscriptionData, buildPaymentFormHTML, isValidPlanType, getPlanDetails } from '@/lib/payfast';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planType } = body;

    // Validate plan type
    if (!planType || !isValidPlanType(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type. Must be: starter, pro, or team' },
        { status: 400 }
      );
    }

    // Create Supabase client with cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // Not used in this context
          },
          remove(name: string, options: any) {
            // Not used in this context
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

    // Get user's tenant and current subscription status
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id, tenants(id, business_name, subscription_status, subscription_tier, email)')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const tenantId = userData.tenant_id;
    const tenant = userData.tenants as any;

    // Check if tenant already has an active paid subscription
    // Allow trial users to upgrade to paid plans
    if (tenant.subscription_status === 'active' && tenant.subscription_tier) {
      // Check if they're trying to switch to a different plan
      if (tenant.subscription_tier !== planType) {
        return NextResponse.json(
          { error: 'You already have an active subscription. Please cancel it first to change plans.' },
          { status: 400 }
        );
      }
      // If same plan, allow re-activation
    }

    // Get plan details
    const planDetails = getPlanDetails(planType);

    // Determine if this is a trial or paid subscription
    // If user is already in trial, convert to paid; otherwise start new trial
    const isAlreadyInTrial = tenant.subscription_status === 'trial';
    const subscriptionStatus = isAlreadyInTrial ? 'pending_payment' : 'trial';
    const trialEndsAt = isAlreadyInTrial ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    // Create subscription record
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        tenant_id: tenantId,
        plan_type: planType,
        status: subscriptionStatus,
        amount: planDetails.price,
        currency: 'ZAR',
        trial_ends_at: trialEndsAt
      })
      .select()
      .single();

    if (subError || !subscription) {
      console.error('Error creating subscription:', subError);
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      );
    }

    // Update tenant with subscription info
    const { error: updateError } = await supabase
      .from('tenants')
      .update({
        subscription_tier: planType,
        subscription_status: subscriptionStatus,
        trial_ends_at: subscription.trial_ends_at,
        current_subscription_id: subscription.id
      })
      .eq('id', tenantId);

    if (updateError) {
      console.error('Error updating tenant:', updateError);
    }

    // Log subscription event
    await supabase.from('subscription_events').insert({
      tenant_id: tenantId,
      subscription_id: subscription.id,
      event_type: isAlreadyInTrial ? 'trial_to_paid_conversion' : 'trial_started',
      event_data: {
        plan_type: planType,
        trial_ends_at: subscription.trial_ends_at,
        is_conversion: isAlreadyInTrial
      }
    });

    // Build PayFast subscription data
    const userEmail = tenant.email || user.email;
    const userName = user.user_metadata?.full_name
      ? { first: user.user_metadata.full_name.split(' ')[0], last: user.user_metadata.full_name.split(' ').slice(1).join(' ') }
      : undefined;

    const payfastData = buildSubscriptionData(
      planType,
      tenantId,
      subscription.id,
      userEmail,
      userName
    );

    // Generate payment form HTML
    const paymentFormHTML = buildPaymentFormHTML(payfastData);

    // Return HTML response that will redirect to PayFast
    return new NextResponse(paymentFormHTML, {
      status: 200,
      headers: {
        'Content-Type': 'text/html'
      }
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
