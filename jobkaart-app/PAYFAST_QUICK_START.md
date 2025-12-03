# PayFast Subscription - Quick Start Checklist

## 🚀 5-Minute Setup

### Step 1: Run Database Migration
```bash
# Open Supabase Dashboard → SQL Editor
# Copy/paste contents of: supabase/migrations/00005_add_subscription_billing.sql
# Click "Run"
```

### Step 2: Start Dev Server
```bash
cd c:\Claude\JobKaart\jobkaart-app
npm run dev
```

### Step 3: Test It!
1. Go to `http://localhost:3000/signup` → Create account
2. Click "Billing" in nav → See pricing plans
3. Click "Start Free Trial" → Redirected to PayFast
4. Use test card: `4111111111111111`, Expiry: `12/25`, CVV: `123`
5. Complete payment → See success page
6. Check `/billing` → See active subscription

---

## ✅ Files Checklist

### Database (1 file)
- [x] `supabase/migrations/00005_add_subscription_billing.sql`

### API Routes (4 files)
- [x] `app/api/subscriptions/create/route.ts`
- [x] `app/api/subscriptions/webhook/route.ts`
- [x] `app/api/subscriptions/status/route.ts`
- [x] `app/api/subscriptions/cancel/route.ts`

### Components (2 files)
- [x] `components/billing/PricingPlans.tsx`
- [x] `components/billing/SubscriptionStatus.tsx`

### Pages (5 files)
- [x] `app/billing/page.tsx`
- [x] `app/billing/success/page.tsx`
- [x] `app/billing/cancel/page.tsx`
- [x] `app/billing/expired/page.tsx`
- [x] `app/billing/overdue/page.tsx`

### Utilities (1 file)
- [x] `lib/payfast.ts`

### Updates (2 files)
- [x] `middleware.ts` (subscription checks)
- [x] `app/(dashboard)/components/DashboardNav.tsx` (billing link)

### Documentation (4 files)
- [x] `PAYFAST_SUBSCRIPTION_GUIDE.md`
- [x] `PAYFAST_MIGRATION_SQL.md`
- [x] `PAYFAST_IMPLEMENTATION_SUMMARY.md`
- [x] `PAYFAST_QUICK_START.md` (this file)

**Total: 23 files created/updated**

---

## 💰 Pricing at a Glance

| Plan | Price | Users | Jobs | Support |
|------|-------|-------|------|---------|
| Starter | R299 | 2 | 50/mo | Email |
| Pro ⭐ | R499 | 5 | ∞ | WhatsApp |
| Team | R799 | 10 | ∞ | Priority |

**All plans:** 14-day free trial, cancel anytime

---

## 🔧 Environment Variables

Already configured in `.env.local`:
```bash
PAYFAST_MERCHANT_ID=10000100
PAYFAST_MERCHANT_KEY=46f0cd694581a
PAYFAST_PASSPHRASE=
NEXT_PUBLIC_PAYFAST_URL=https://sandbox.payfast.co.za/eng/process
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🧪 Test Card (Sandbox)

**Success:**
- Card: `4111111111111111`
- Expiry: `12/25`
- CVV: `123`

**Failure:**
- Card: `4000000000000002`
- Expiry: `12/25`
- CVV: `123`

---

## 🔍 Quick Debug Queries

### Check Subscription
```sql
SELECT * FROM subscriptions WHERE tenant_id = '<tenant-id>';
```

### Check Events
```sql
SELECT * FROM subscription_events WHERE tenant_id = '<tenant-id>' ORDER BY created_at DESC;
```

### Check Trial Status
```sql
SELECT subscription_status, trial_ends_at, trial_ends_at > NOW() as is_active
FROM tenants WHERE id = '<tenant-id>';
```

---

## 🐛 Troubleshooting

### Webhook Not Working?
```bash
# Use ngrok to expose localhost
npm install -g ngrok
ngrok http 3000

# Update .env.local
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io

# Restart server
npm run dev
```

### Signature Invalid?
- Check `PAYFAST_PASSPHRASE` matches PayFast account
- Verify sandbox credentials are correct

### Subscription Not Activating?
- Check `subscription_events` table for webhook logs
- Verify PayFast sent ITN webhook
- Check server logs for errors

---

## 🚀 Production Setup

### 1. Update Environment Variables
```bash
# Production credentials
PAYFAST_MERCHANT_ID=<your-production-id>
PAYFAST_MERCHANT_KEY=<your-production-key>
PAYFAST_PASSPHRASE=<your-passphrase>
NEXT_PUBLIC_PAYFAST_URL=https://www.payfast.co.za/eng/process
NEXT_PUBLIC_APP_URL=https://jobkaart.co.za
```

### 2. Configure PayFast Webhook
- Log in to PayFast Dashboard
- Go to Settings → Integration
- Set ITN URL: `https://jobkaart.co.za/api/subscriptions/webhook`

### 3. Deploy & Test
- Deploy to production
- Test full subscription flow
- Verify webhooks received
- Monitor for errors

---

## 📚 Full Documentation

- **Setup Guide:** `PAYFAST_SUBSCRIPTION_GUIDE.md`
- **Migration:** `PAYFAST_MIGRATION_SQL.md`
- **Summary:** `PAYFAST_IMPLEMENTATION_SUMMARY.md`

---

## 🎯 What's Working

✅ 14-day free trial
✅ PayFast recurring billing
✅ Automatic subscription activation
✅ Webhook handling and validation
✅ Subscription management (view, cancel)
✅ Access control (trial, active, expired, overdue)
✅ Pricing plans UI
✅ Billing management dashboard

---

## 🔮 Future Enhancements

- [ ] Email notifications (trial expiry, payment confirmations)
- [ ] Billing history and invoices
- [ ] Plan upgrades/downgrades
- [ ] Usage tracking and limits
- [ ] Annual billing discount
- [ ] Referral codes

---

**Need help?** Check `PAYFAST_SUBSCRIPTION_GUIDE.md` for detailed instructions.
