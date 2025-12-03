/**
 * API Route: PayFast ITN (Instant Transaction Notification) Webhook
 *
 * POST /api/subscriptions/webhook
 *
 * Handles PayFast webhook callbacks for subscription payments
 * - Validates signature and source IP
 * - Activates subscriptions on first payment
 * - Records recurring payments
 * - Updates tenant subscription status
 *
 * Security:
 * - Validates PayFast signature
 * - Checks source IP is from PayFast servers
 * - Uses service role for database updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateITN, type PayFastITNData } from '@/lib/payfast';

// Create Supabase client with service role (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  // Check common headers for proxied requests
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // In development, default to localhost
  return '127.0.0.1';
}

/**
 * Parse PayFast ITN data from request
 */
async function parseITNData(request: NextRequest): Promise<PayFastITNData> {
  const formData = await request.formData();
  const data: any = {};

  formData.forEach((value, key) => {
    data[key] = value.toString();
  });

  return data as PayFastITNData;
}

export async function POST(request: NextRequest) {
  try {
    // Parse ITN data from PayFast
    const itnData = await parseITNData(request);

    // Get source IP
    const sourceIP = getClientIP(request);

    console.log('[PayFast ITN] Received webhook:', {
      payment_id: itnData.pf_payment_id,
      status: itnData.payment_status,
      amount: itnData.amount_gross,
      token: itnData.token,
      sourceIP
    });

    // Validate ITN (signature, IP, status)
    const validation = await validateITN(itnData, sourceIP);

    if (!validation.valid) {
      console.error('[PayFast ITN] Validation failed:', validation.error);
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Extract custom fields
    const tenantId = itnData.custom_str1;
    const planType = itnData.custom_str2;
    const subscriptionId = itnData.custom_str3;
    const payfastToken = itnData.token; // Subscription token for recurring billing

    if (!tenantId || !subscriptionId) {
      console.error('[PayFast ITN] Missing custom fields');
      return NextResponse.json(
        { error: 'Missing required custom fields' },
        { status: 400 }
      );
    }

    // Get subscription record
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription) {
      console.error('[PayFast ITN] Subscription not found:', subscriptionId);
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Handle payment based on status
    if (itnData.payment_status === 'COMPLETE') {
      // Check if this is the first payment (activation)
      const isFirstPayment = subscription.status === 'trial' || !subscription.payfast_subscription_token;

      if (isFirstPayment) {
        // Activate subscription
        console.log('[PayFast ITN] Activating subscription:', subscriptionId);

        // Update subscription
        const { error: updateSubError } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'active',
            payfast_subscription_token: payfastToken,
            payfast_payment_id: itnData.pf_payment_id,
            next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days
            updated_at: new Date().toISOString()
          })
          .eq('id', subscriptionId);

        if (updateSubError) {
          console.error('[PayFast ITN] Error updating subscription:', updateSubError);
        }

        // Update tenant status
        const { error: updateTenantError } = await supabaseAdmin
          .from('tenants')
          .update({
            subscription_status: 'active',
            payfast_subscription_token: payfastToken,
            subscription_started_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', tenantId);

        if (updateTenantError) {
          console.error('[PayFast ITN] Error updating tenant:', updateTenantError);
        }

        // Log activation event
        await supabaseAdmin.from('subscription_events').insert({
          tenant_id: tenantId,
          subscription_id: subscriptionId,
          event_type: 'activated',
          payfast_payment_id: itnData.pf_payment_id,
          payfast_webhook_data: itnData,
          event_data: {
            payfast_token: payfastToken,
            payment_id: itnData.pf_payment_id,
            amount: parseFloat(itnData.amount_gross)
          }
        });

        console.log('[PayFast ITN] Subscription activated successfully');
      } else {
        // Recurring payment
        console.log('[PayFast ITN] Recording recurring payment:', itnData.pf_payment_id);

        // Update subscription with latest payment
        const { error: updateSubError } = await supabaseAdmin
          .from('subscriptions')
          .update({
            payfast_payment_id: itnData.pf_payment_id,
            next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', subscriptionId);

        if (updateSubError) {
          console.error('[PayFast ITN] Error updating subscription:', updateSubError);
        }

        // Log payment event
        await supabaseAdmin.from('subscription_events').insert({
          tenant_id: tenantId,
          subscription_id: subscriptionId,
          event_type: 'payment_received',
          payfast_payment_id: itnData.pf_payment_id,
          payfast_webhook_data: itnData,
          event_data: {
            amount: parseFloat(itnData.amount_gross),
            next_billing: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        });

        console.log('[PayFast ITN] Recurring payment recorded successfully');
      }

      // Return success
      return new NextResponse('OK', { status: 200 });
    } else if (itnData.payment_status === 'FAILED') {
      // Payment failed
      console.log('[PayFast ITN] Payment failed:', itnData.pf_payment_id);

      // Update subscription status to overdue
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'overdue',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      // Update tenant status
      await supabaseAdmin
        .from('tenants')
        .update({
          subscription_status: 'overdue',
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId);

      // Log failure event
      await supabaseAdmin.from('subscription_events').insert({
        tenant_id: tenantId,
        subscription_id: subscriptionId,
        event_type: 'payment_failed',
        payfast_payment_id: itnData.pf_payment_id,
        payfast_webhook_data: itnData,
        event_data: {
          reason: 'Payment failed'
        }
      });

      return new NextResponse('OK', { status: 200 });
    } else if (itnData.payment_status === 'CANCELLED') {
      // Payment cancelled
      console.log('[PayFast ITN] Payment cancelled:', itnData.pf_payment_id);

      // Update subscription status
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      // Update tenant status
      await supabaseAdmin
        .from('tenants')
        .update({
          subscription_status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId);

      // Log cancellation event
      await supabaseAdmin.from('subscription_events').insert({
        tenant_id: tenantId,
        subscription_id: subscriptionId,
        event_type: 'cancelled',
        payfast_payment_id: itnData.pf_payment_id,
        payfast_webhook_data: itnData,
        event_data: {
          reason: 'Payment cancelled by user'
        }
      });

      return new NextResponse('OK', { status: 200 });
    }

    // Unknown status
    console.log('[PayFast ITN] Unknown payment status:', itnData.payment_status);
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('[PayFast ITN] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Disable body parsing (we need raw body for signature validation)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
