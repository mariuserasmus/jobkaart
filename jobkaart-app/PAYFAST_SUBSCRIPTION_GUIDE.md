# PayFast Subscription Billing Integration Guide

## Overview

This guide covers the complete PayFast subscription billing implementation for JobKaart. The integration handles:

- ✅ Recurring monthly subscriptions (Starter, Pro, Team)
- ✅ 14-day free trial for all new signups
- ✅ Automatic payment collection via PayFast
- ✅ ITN (Instant Transaction Notification) webhook handling
- ✅ Subscription status management (active, trial, overdue, cancelled)
- ✅ Access control based on subscription status

---

## Table of Contents

1. [Files Created](#files-created)
2. [Database Schema](#database-schema)
3. [PayFast Configuration](#payfast-configuration)
4. [Testing in Sandbox Mode](#testing-in-sandbox-mode)
5. [Webhook Setup](#webhook-setup)
6. [User Flow](#user-flow)
7. [API Endpoints](#api-endpoints)
8. [Troubleshooting](#troubleshooting)

---

## Files Created

### Database Migrations

**`supabase/migrations/00005_add_subscription_billing.sql`**
- Creates `subscriptions` table for tracking subscription records
- Creates `subscription_events` table for audit logging
- Adds trial tracking columns to `tenants` table
- Includes helper functions:
  - `create_trial_subscription()` - Creates 14-day trial
  - `activate_subscription()` - Activates after first payment
  - `cancel_subscription()` - Cancels subscription
  - `check_expired_trials()` - Daily cron job
  - `record_subscription_payment()` - Records recurring payments

### PayFast Utilities

**`lib/payfast.ts`**
- PayFast signature generation and validation
- Subscription data builders
- ITN validation functions
- Plan pricing constants
- IP whitelist validation

### API Routes

**`app/api/subscriptions/create/route.ts`**
- Creates subscription record in database
- Generates PayFast subscription form
- Redirects to PayFast payment page

**`app/api/subscriptions/webhook/route.ts`**
- Handles PayFast ITN callbacks
- Validates signature and source IP
- Activates subscriptions on first payment
- Records recurring payments
- Updates subscription status

**`app/api/subscriptions/status/route.ts`**
- Returns current subscription status
- Trial information and days remaining
- Access control information

**`app/api/subscriptions/cancel/route.ts`**
- Cancels active subscriptions
- Logs cancellation reason
- Sets end date to current billing period

### UI Components

**`components/billing/PricingPlans.tsx`**
- Displays pricing cards for all plans
- Handles plan selection
- Shows ROI calculator
- Trial notice

**`components/billing/SubscriptionStatus.tsx`**
- Shows current plan details
- Trial/payment status badges
- Plan features list
- Billing information

### Pages

**`app/billing/page.tsx`**
- Main billing management page
- Shows current subscription status
- Displays pricing plans for upgrades
- Cancel subscription modal

**`app/billing/success/page.tsx`**
- Shown after successful PayFast payment

**`app/billing/cancel/page.tsx`**
- Shown when user cancels payment

**`app/billing/expired/page.tsx`**
- Shown when trial expires without subscription

**`app/billing/overdue/page.tsx`**
- Shown when payment is overdue

### Middleware Enhancement

**`middleware.ts`** (updated)
- Checks subscription status on protected routes
- Redirects to billing pages if expired/overdue
- Allows billing pages without subscription check

**`app/(dashboard)/components/DashboardNav.tsx`** (updated)
- Added "Billing" link to navigation

---

## Database Schema

### Subscriptions Table

```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    plan_type subscription_tier NOT NULL,  -- 'starter', 'pro', 'team'
    status subscription_status NOT NULL,    -- 'trial', 'active', 'cancelled', 'overdue'

    -- PayFast integration
    payfast_subscription_token TEXT UNIQUE,
    payfast_payment_id TEXT,

    -- Dates
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    trial_ends_at TIMESTAMP,
    next_billing_date TIMESTAMP,

    -- Pricing
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'ZAR',

    -- Cancellation
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Subscription Events Table

```sql
CREATE TABLE subscription_events (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    subscription_id UUID,

    event_type TEXT NOT NULL,  -- 'created', 'activated', 'payment_received', etc.
    event_data JSONB,

    payfast_payment_id TEXT,
    payfast_webhook_data JSONB,

    created_at TIMESTAMP DEFAULT NOW()
);
```

### Tenants Table Updates

```sql
-- Added columns:
trial_ends_at TIMESTAMP,
current_subscription_id UUID REFERENCES subscriptions(id)
```

---

## PayFast Configuration

### Environment Variables

Already configured in `.env.local`:

```bash
# PayFast Sandbox Credentials
PAYFAST_MERCHANT_ID=10000100
PAYFAST_MERCHANT_KEY=46f0cd694581a
PAYFAST_PASSPHRASE=
NEXT_PUBLIC_PAYFAST_URL=https://sandbox.payfast.co.za/eng/process

# Application URL (for webhooks)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Plan Pricing

Defined in `lib/payfast.ts`:

| Plan | Price | Users | Jobs/Month | Features |
|------|-------|-------|------------|----------|
| **Starter** | R299/month | 2 | 50 | Basic features, email support |
| **Pro** | R499/month | 5 | Unlimited | All features, WhatsApp support |
| **Team** | R799/month | 10 | Unlimited | Priority support, phone support |

---

## Testing in Sandbox Mode

### 1. Run Database Migrations

```bash
# Navigate to jobkaart-app directory
cd c:\Claude\JobKaart\jobkaart-app

# Run migration via Supabase Dashboard SQL Editor
# Copy contents of supabase/migrations/00005_add_subscription_billing.sql
# Paste and execute in Supabase Dashboard
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Test Subscription Flow

#### Step 1: Sign up for a new account
- Go to `http://localhost:3000/signup`
- Create a new tenant account
- You'll be logged in and start with trial status

#### Step 2: Navigate to Billing
- Click "Billing" in the navigation
- You should see your trial status and pricing plans

#### Step 3: Select a Plan
- Click "Start Free Trial" on any plan
- You'll be redirected to PayFast sandbox payment page

#### Step 4: Complete Payment (Sandbox)

PayFast Sandbox Test Cards:

**Success:**
- Card Number: `4111111111111111`
- Expiry: Any future date (e.g., `12/25`)
- CVV: `123`

**Failure:**
- Card Number: `4000000000000002`
- Expiry: Any future date
- CVV: `123`

#### Step 5: Webhook Processing
- After payment, PayFast sends ITN webhook to your app
- Webhook activates subscription automatically
- You'll be redirected to `/billing/success`

### 4. Test Webhook Locally (Optional)

To test webhooks locally, you need to expose your local server:

**Using ngrok:**
```bash
# Install ngrok
npm install -g ngrok

# Start ngrok tunnel
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Update NEXT_PUBLIC_APP_URL in .env.local
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io

# Restart dev server
npm run dev
```

**Manual Webhook Testing:**

You can also test the webhook manually with curl:

```bash
curl -X POST http://localhost:3000/api/subscriptions/webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "m_payment_id=123456" \
  -d "pf_payment_id=1234567" \
  -d "payment_status=COMPLETE" \
  -d "item_name=JobKaart Pro Plan" \
  -d "item_description=Monthly subscription" \
  -d "amount_gross=499.00" \
  -d "amount_fee=11.48" \
  -d "amount_net=487.52" \
  -d "custom_str1=<tenant-id>" \
  -d "custom_str2=pro" \
  -d "custom_str3=<subscription-id>" \
  -d "token=abc123xyz" \
  -d "signature=<calculated-signature>"
```

---

## Webhook Setup

### Development (with ngrok)

1. Start ngrok tunnel: `ngrok http 3000`
2. Copy HTTPS URL
3. Update `NEXT_PUBLIC_APP_URL` in `.env.local`
4. Webhook URL: `https://your-ngrok-url.ngrok.io/api/subscriptions/webhook`

### Production (Vercel)

1. Deploy to Vercel
2. Get production URL (e.g., `https://jobkaart.vercel.app`)
3. Webhook URL: `https://jobkaart.vercel.app/api/subscriptions/webhook`

### PayFast Webhook Configuration

**Note:** PayFast sandbox may not send webhooks to localhost. For testing:
- Use ngrok to expose local server
- Or deploy to staging environment
- Or manually trigger webhooks with curl

---

## User Flow

### New User Signup

```
1. User signs up → Tenant created
2. No subscription yet (trial_ends_at = NULL)
3. User navigates to /billing
4. User selects plan
5. Trial subscription created (14 days)
6. User redirected to PayFast
7. User completes payment
8. PayFast sends ITN webhook
9. Subscription activated
10. User redirected to /billing/success
```

### Subscription Lifecycle

```
Trial (14 days)
    ↓
[User pays within trial]
    ↓
Active (recurring monthly)
    ↓
[Payment succeeds each month] → Active (continues)
    ↓
[Payment fails] → Overdue (access restricted)
    ↓
[User updates payment] → Active (restored)
    ↓
[User cancels] → Cancelled (access until end date)
```

### Access Control

**Has Access:**
- `subscription_status = 'trial'` AND `trial_ends_at > NOW()`
- `subscription_status = 'active'`

**No Access:**
- `subscription_status = 'cancelled'` AND `trial_ends_at < NOW()`
- `subscription_status = 'overdue'`

---

## API Endpoints

### POST `/api/subscriptions/create`

Creates a new subscription and redirects to PayFast.

**Request:**
```json
{
  "planType": "pro"  // 'starter' | 'pro' | 'team'
}
```

**Response:**
HTML form that auto-submits to PayFast

---

### POST `/api/subscriptions/webhook`

Handles PayFast ITN callbacks.

**Headers:**
- `Content-Type: application/x-www-form-urlencoded`

**Body Parameters:**
- `m_payment_id` - Merchant payment ID
- `pf_payment_id` - PayFast payment ID
- `payment_status` - COMPLETE | FAILED | PENDING | CANCELLED
- `custom_str1` - tenant_id
- `custom_str2` - plan_type
- `custom_str3` - subscription_id
- `token` - Subscription token (for recurring billing)
- `signature` - MD5 signature for validation
- ... other PayFast fields

**Response:**
- `200 OK` - Webhook processed
- `400 Bad Request` - Validation failed
- `404 Not Found` - Subscription not found

---

### GET `/api/subscriptions/status`

Returns current subscription status for authenticated user.

**Response:**
```json
{
  "tenant": {
    "id": "uuid",
    "business_name": "Johan's Plumbing",
    "subscription_tier": "pro",
    "subscription_status": "active",
    "monthly_job_limit": null
  },
  "trial": {
    "is_in_trial": false,
    "ends_at": "2025-12-17T00:00:00Z",
    "days_remaining": 0
  },
  "subscription": {
    "id": "uuid",
    "plan_type": "pro",
    "status": "active",
    "amount": 499.00,
    "currency": "ZAR",
    "start_date": "2025-12-03T00:00:00Z",
    "next_billing_date": "2026-01-03T00:00:00Z",
    "cancelled_at": null
  },
  "access": {
    "has_access": true,
    "reason": "Active subscription"
  }
}
```

---

### POST `/api/subscriptions/cancel`

Cancels the current subscription.

**Request:**
```json
{
  "reason": "Too expensive"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "end_date": "2026-01-03T00:00:00Z",
  "immediate": false
}
```

---

## Troubleshooting

### Issue: Webhook not received

**Possible causes:**
1. PayFast sandbox doesn't send webhooks to localhost
2. Firewall blocking incoming requests
3. Invalid webhook URL

**Solutions:**
- Use ngrok to expose local server
- Deploy to staging environment for testing
- Check PayFast dashboard for webhook logs
- Manually trigger webhook with curl for testing

---

### Issue: Signature validation fails

**Possible causes:**
1. Incorrect passphrase in `.env.local`
2. Parameters not in correct order
3. URL encoding issues

**Solutions:**
- Ensure `PAYFAST_PASSPHRASE` matches PayFast account
- Check `lib/payfast.ts` signature generation logic
- Enable webhook logging to see received signature

---

### Issue: Subscription not activating

**Check:**
1. Database has subscription record
2. Webhook received and processed
3. Check `subscription_events` table for logs
4. Verify `tenant.subscription_status` updated to 'active'

**Debug:**
```sql
-- Check subscription
SELECT * FROM subscriptions WHERE tenant_id = '<tenant-id>';

-- Check events
SELECT * FROM subscription_events WHERE tenant_id = '<tenant-id>' ORDER BY created_at DESC;

-- Check tenant status
SELECT subscription_status, subscription_tier, trial_ends_at FROM tenants WHERE id = '<tenant-id>';
```

---

### Issue: Trial not working

**Check:**
1. `trial_ends_at` is set correctly (NOW() + 14 days)
2. `subscription_status = 'trial'`
3. Middleware allows access during trial

**Debug:**
```sql
SELECT
  subscription_status,
  trial_ends_at,
  trial_ends_at > NOW() as is_trial_active
FROM tenants
WHERE id = '<tenant-id>';
```

---

### Issue: Access denied after payment

**Check:**
1. Webhook processed successfully
2. Subscription activated in database
3. Browser cached old subscription status

**Solutions:**
- Refresh page or clear cache
- Check subscription status API: `/api/subscriptions/status`
- Verify database records

---

## Production Checklist

Before going live with PayFast production:

- [ ] Update PayFast credentials to production (not sandbox)
- [ ] Update `NEXT_PUBLIC_PAYFAST_URL` to production URL
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Configure PayFast webhook URL in PayFast dashboard
- [ ] Test full payment flow in production
- [ ] Set up monitoring for webhook failures
- [ ] Configure email notifications for subscription events
- [ ] Set up daily cron job for `check_expired_trials()`
- [ ] Test subscription cancellation flow
- [ ] Verify signature validation with production passphrase

---

## Support

For issues or questions:
- Check Supabase logs for database errors
- Check Next.js console for API errors
- Review PayFast ITN logs in PayFast dashboard
- Contact PayFast support for payment issues

---

## License

Proprietary - JobKaart (Pty) Ltd
