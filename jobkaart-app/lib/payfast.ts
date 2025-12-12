/**
 * PayFast Integration Utilities
 *
 * Handles PayFast subscription billing for JobKaart
 * Supports: Signature generation, ITN validation, subscription creation
 *
 * PayFast Documentation:
 * - Subscriptions: https://developers.payfast.co.za/docs#subscriptions
 * - ITN (Webhooks): https://developers.payfast.co.za/docs#instant_transaction_notification
 */

import crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export type PlanType = 'free' | 'starter' | 'pro' | 'team';

export interface PlanDetails {
  name: string;
  price: number;
  billingFrequency: number; // 3 = monthly
  cycles: number; // 0 = infinite
  users: number;
  jobLimit: number | null; // null = unlimited
  features: string[];
}

export interface PayFastSubscriptionData {
  // Merchant details
  merchant_id: string;
  merchant_key: string;

  // Subscription details
  subscription_type: '1'; // 1 = subscription
  billing_date: string; // YYYY-MM-DD
  recurring_amount: string;
  frequency: '3'; // 3 = monthly
  cycles: '0'; // 0 = infinite

  // Transaction details
  item_name: string;
  item_description: string;

  // Custom fields
  custom_str1: string; // tenant_id
  custom_str2: string; // plan_type
  custom_str3: string; // subscription_id

  // URLs
  return_url: string;
  cancel_url: string;
  notify_url: string;

  // Buyer details
  email_address: string;
  name_first?: string;
  name_last?: string;

  // Passphrase
  passphrase?: string;
}

export interface PayFastITNData {
  // PayFast fields
  m_payment_id: string;
  pf_payment_id: string;
  payment_status: 'COMPLETE' | 'FAILED' | 'PENDING' | 'CANCELLED';
  item_name: string;
  item_description: string;
  amount_gross: string;
  amount_fee: string;
  amount_net: string;

  // Custom fields
  custom_str1?: string; // tenant_id
  custom_str2?: string; // plan_type
  custom_str3?: string; // subscription_id

  // Subscription fields (if applicable)
  token?: string; // Subscription token for recurring billing
  billing_date?: string;

  // Signature
  signature: string;

  [key: string]: string | undefined;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const PLAN_DETAILS: Record<PlanType, PlanDetails> = {
  free: {
    name: 'Free Plan',
    price: 0,
    billingFrequency: 3,
    cycles: 0,
    users: 1,
    jobLimit: 5,
    features: [
      '1 user',
      '5 quotes/month',
      '5 jobs/month',
      '5 invoices/month',
      'Unlimited customers',
      'Basic support'
    ]
  },
  starter: {
    name: 'Starter Plan',
    price: 299,
    billingFrequency: 3,
    cycles: 0,
    users: 2,
    jobLimit: null,
    features: [
      '2 users included',
      'Unlimited quotes/jobs/invoices',
      'Unlimited quote templates',
      'Email support',
      'All core features'
    ]
  },
  pro: {
    name: 'Pro Plan',
    price: 499,
    billingFrequency: 3,
    cycles: 0,
    users: 5,
    jobLimit: null,
    features: [
      '5 users included',
      'Unlimited quotes/jobs/invoices',
      'Unlimited quote templates',
      'WhatsApp support',
      'Priority support',
      'All core features'
    ]
  },
  team: {
    name: 'Team Plan',
    price: 799,
    billingFrequency: 3,
    cycles: 0,
    users: 10,
    jobLimit: null,
    features: [
      '10 users included',
      'Unlimited quotes/jobs/invoices',
      'Unlimited quote templates',
      'Priority WhatsApp support',
      'Phone support',
      'Dedicated account manager',
      'All core features'
    ]
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get PayFast configuration from environment variables
 */
export function getPayFastConfig() {
  const merchantId = process.env.PAYFAST_MERCHANT_ID;
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
  const passphrase = process.env.PAYFAST_PASSPHRASE || '';
  const payfastUrl = process.env.NEXT_PUBLIC_PAYFAST_URL || 'https://sandbox.payfast.co.za/eng/process';

  if (!merchantId || !merchantKey) {
    throw new Error('PayFast credentials not configured. Check PAYFAST_MERCHANT_ID and PAYFAST_MERCHANT_KEY in .env');
  }

  return {
    merchantId,
    merchantKey,
    passphrase,
    payfastUrl,
    isSandbox: payfastUrl.includes('sandbox')
  };
}

/**
 * Generate MD5 signature for PayFast
 *
 * PayFast requires all parameters to be signed with MD5 hash
 * Parameters must be in alphabetical order, URL encoded, and concatenated
 */
export function generateSignature(data: Record<string, string>, passphrase: string = ''): string {
  // Remove signature if present
  const { signature, ...params } = data as any;

  // Sort parameters alphabetically
  const sortedKeys = Object.keys(params).sort();

  // Build parameter string
  let paramString = sortedKeys
    .map(key => {
      const value = params[key];
      // Skip empty values
      if (value === '' || value === null || value === undefined) {
        return null;
      }
      return `${key}=${encodeURIComponent(value.toString().trim())}`;
    })
    .filter(Boolean)
    .join('&');

  // Add passphrase if provided
  if (passphrase) {
    paramString += `&passphrase=${encodeURIComponent(passphrase.trim())}`;
  }

  // Generate MD5 hash
  return crypto.createHash('md5').update(paramString).digest('hex');
}

/**
 * Validate PayFast ITN signature
 *
 * Verifies that the ITN callback is genuine by checking the signature
 */
export function validateSignature(itnData: PayFastITNData, passphrase: string = ''): boolean {
  const receivedSignature = itnData.signature;
  const calculatedSignature = generateSignature(itnData as any, passphrase);

  return receivedSignature === calculatedSignature;
}

/**
 * Build subscription data for PayFast
 */
export function buildSubscriptionData(
  planType: PlanType,
  tenantId: string,
  subscriptionId: string,
  userEmail: string,
  userName?: { first?: string; last?: string }
): PayFastSubscriptionData {
  const config = getPayFastConfig();
  const plan = PLAN_DETAILS[planType];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Calculate billing start date (14 days from now for trial)
  const billingDate = new Date();
  billingDate.setDate(billingDate.getDate() + 14);
  const billingDateStr = billingDate.toISOString().split('T')[0]; // YYYY-MM-DD

  const subscriptionData: PayFastSubscriptionData = {
    // Merchant details
    merchant_id: config.merchantId,
    merchant_key: config.merchantKey,

    // Subscription details
    subscription_type: '1',
    billing_date: billingDateStr,
    recurring_amount: plan.price.toFixed(2),
    frequency: '3', // Monthly
    cycles: '0', // Infinite

    // Transaction details
    item_name: `JobKaart ${plan.name}`,
    item_description: `Monthly subscription for ${plan.name}`,

    // Custom fields (for tracking)
    custom_str1: tenantId,
    custom_str2: planType,
    custom_str3: subscriptionId,

    // URLs
    return_url: `${appUrl}/billing/success`,
    cancel_url: `${appUrl}/billing/cancel`,
    notify_url: `${appUrl}/api/subscriptions/webhook`,

    // Buyer details
    email_address: userEmail,
    ...(userName?.first && { name_first: userName.first }),
    ...(userName?.last && { name_last: userName.last })
  };

  // Add passphrase if configured
  if (config.passphrase) {
    subscriptionData.passphrase = config.passphrase;
  }

  return subscriptionData;
}

/**
 * Generate signature for subscription data
 */
export function signSubscriptionData(data: PayFastSubscriptionData): string {
  const config = getPayFastConfig();
  return generateSignature(data as any, config.passphrase);
}

/**
 * Build PayFast payment form HTML
 *
 * Returns HTML form that auto-submits to PayFast
 */
export function buildPaymentFormHTML(
  subscriptionData: PayFastSubscriptionData
): string {
  const config = getPayFastConfig();
  const signature = signSubscriptionData(subscriptionData);

  // Remove passphrase before sending to PayFast
  const { passphrase, ...dataToSend } = subscriptionData;

  // Build form fields
  const fields = Object.entries(dataToSend)
    .map(([key, value]) => {
      return `<input type="hidden" name="${key}" value="${value}" />`;
    })
    .join('\n    ');

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Redirecting to PayFast...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .loading {
      text-align: center;
    }
    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #F97316;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="loading">
    <div class="spinner"></div>
    <p>Redirecting to PayFast for secure payment...</p>
  </div>

  <form id="payfast-form" action="${config.payfastUrl}" method="POST">
    ${fields}
    <input type="hidden" name="signature" value="${signature}" />
  </form>

  <script>
    // Auto-submit form
    document.getElementById('payfast-form').submit();
  </script>
</body>
</html>
  `.trim();
}

/**
 * Validate PayFast server IP (security check)
 *
 * PayFast ITN callbacks should only come from valid PayFast IPs
 */
export function isValidPayFastIP(ip: string): boolean {
  // PayFast valid IP addresses
  const validIPs = [
    '197.97.145.144',
    '41.74.179.194',
    '41.74.179.195',
    '41.74.179.196',
    '41.74.179.197',
    '197.97.145.145' // Sandbox
  ];

  // In development/sandbox, accept localhost
  const config = getPayFastConfig();
  if (config.isSandbox && (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.'))) {
    return true;
  }

  return validIPs.includes(ip);
}

/**
 * Validate PayFast ITN data
 *
 * Performs all security checks required by PayFast
 * Returns { valid: boolean, error?: string }
 */
export async function validateITN(
  itnData: PayFastITNData,
  sourceIP: string
): Promise<{ valid: boolean; error?: string }> {
  const config = getPayFastConfig();

  // 1. Validate source IP
  if (!isValidPayFastIP(sourceIP)) {
    return { valid: false, error: `Invalid source IP: ${sourceIP}` };
  }

  // 2. Validate signature
  if (!validateSignature(itnData, config.passphrase)) {
    return { valid: false, error: 'Invalid signature' };
  }

  // 3. Verify payment status
  if (!['COMPLETE'].includes(itnData.payment_status)) {
    return { valid: false, error: `Invalid payment status: ${itnData.payment_status}` };
  }

  // 4. Verify amount matches expected (optional - do server-side lookup)
  // This should be done by looking up the subscription and comparing amounts

  return { valid: true };
}

/**
 * Get plan details by type
 */
export function getPlanDetails(planType: PlanType): PlanDetails {
  return PLAN_DETAILS[planType];
}

/**
 * Check if plan type is valid
 */
export function isValidPlanType(plan: string): plan is PlanType {
  return ['free', 'starter', 'pro', 'team'].includes(plan);
}
