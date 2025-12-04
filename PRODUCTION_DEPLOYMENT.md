# 🚀 Production Deployment Guide - JobKaart

## Quick Deployment Steps (Afrihost Shared Hosting)

### Step 1: Build Locally (5 minutes)

```bash
cd jobkaart-app

# Install dependencies (if not already done)
npm install

# Build for production
npm run build
```

**Note**: Building locally avoids the memory/resource limits on shared hosting.

---

### Step 2: Prepare Environment Variables (2 minutes)

Create `.env.local` file in `jobkaart-app/` folder with **PRODUCTION** values:

```bash
# Supabase Configuration (PRODUCTION)
NEXT_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# PayFast Configuration (PRODUCTION - LIVE!)
PAYFAST_MERCHANT_ID=your-live-merchant-id
PAYFAST_MERCHANT_KEY=your-live-merchant-key
PAYFAST_PASSPHRASE=your-live-passphrase
NEXT_PUBLIC_PAYFAST_URL=https://www.payfast.co.za/eng/process

# SendGrid Configuration
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=hello@jobkaart.co.za

# Application Configuration (PRODUCTION URL!)
NEXT_PUBLIC_APP_URL=https://jobkaart.co.za
NODE_ENV=production
```

**CRITICAL**:
- Use your **production Supabase project** (not dev)
- Use **LIVE PayFast credentials** (not sandbox)
- Set `NEXT_PUBLIC_PAYFAST_URL` to **live URL** (not sandbox)
- Set `NEXT_PUBLIC_APP_URL` to your actual domain

---

### Step 3: Upload to Afrihost (10 minutes)

#### Option A: FTP Upload (Recommended for Shared Hosting)

1. **Connect via FTP** (FileZilla, WinSCP, etc.):
   - Host: `ftp.jobkaart.co.za` (or your FTP hostname)
   - Username: Your cPanel username
   - Password: Your cPanel password

2. **Upload these folders/files**:
   ```
   jobkaart-app/.next/          → /public_html/.next/
   jobkaart-app/public/         → /public_html/public/
   jobkaart-app/package.json    → /public_html/package.json
   jobkaart-app/.env.local      → /public_html/.env.local
   jobkaart-app/next.config.ts  → /public_html/next.config.ts
   ```

3. **Also upload** (if they exist):
   ```
   jobkaart-app/node_modules/   → /public_html/node_modules/
   jobkaart-app/server.js       → /public_html/server.js
   ```

#### Option B: SSH Upload (If you have SSH access)

```bash
# Compress locally
cd jobkaart-app
tar -czf deploy.tar.gz .next public package.json .env.local next.config.ts node_modules

# Upload via SCP
scp deploy.tar.gz username@jobkaart.co.za:/home/username/

# SSH into server and extract
ssh username@jobkaart.co.za
cd public_html
tar -xzf ~/deploy.tar.gz
```

---

### Step 4: Setup Node.js App in cPanel (5 minutes)

1. **Login to cPanel** → **Setup Node.js App**

2. **Create/Edit Application**:
   - **Node.js Version**: 18.x or higher
   - **Application Mode**: Production
   - **Application Root**: `/home/username/public_html`
   - **Application URL**: `https://jobkaart.co.za`
   - **Application Startup File**: `server.js`
   - **Environment Variables**: Copy from `.env.local`

3. **Restart the application**

---

### Step 5: Database Setup (Supabase) - CRITICAL! (10 minutes)

#### 5.1 Run ALL Migrations on Production Database

Connect to your **PRODUCTION Supabase** project:

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

2. **Run migrations in order** (copy/paste each file):
   ```
   jobkaart-app/supabase/migrations/00001_init_schema.sql
   jobkaart-app/supabase/migrations/00002_enable_rls.sql
   jobkaart-app/supabase/migrations/00003_create_functions.sql
   jobkaart-app/supabase/migrations/00005_add_super_admin.sql
   jobkaart-app/supabase/migrations/00005_add_subscription_billing.sql
   jobkaart-app/supabase/migrations/00005_add_quote_template_notes_terms.sql
   jobkaart-app/supabase/migrations/00005_create_job_photos_table.sql
   jobkaart-app/supabase/migrations/00006_job_photos_rls.sql
   jobkaart-app/supabase/migrations/00007_storage_setup.sql
   jobkaart-app/supabase/migrations/00010_fix_public_view_tracking.sql
   jobkaart-app/supabase/migrations/00011_tenant_logos_storage.sql
   ```

3. **OPTIONAL**: Run seed data if you want demo tenants:
   ```
   jobkaart-app/supabase/migrations/00004_seed_data.sql
   ```

#### 5.2 Setup Storage Buckets

In Supabase Dashboard → Storage:

1. **Create bucket**: `job-photos`
   - Public: No (Private)
   - Allowed MIME types: `image/*`

2. **Create bucket**: `tenant-logos`
   - Public: Yes (Public read)
   - Allowed MIME types: `image/*`

3. **RLS Policies**: Should be created automatically by migrations

#### 5.3 Create Your Super Admin Account

1. **Sign up** at: `https://jobkaart.co.za/signup`
   - Use your admin email
   - Create business details

2. **Mark as Super Admin** in Supabase:
   ```sql
   UPDATE users
   SET is_super_admin = true
   WHERE email = 'your-admin@email.com';
   ```

3. **Test admin access**: `https://jobkaart.co.za/admin`

---

### Step 6: PayFast Integration Setup (5 minutes)

#### 6.1 Go LIVE with PayFast

1. **Login to PayFast**: https://www.payfast.co.za/login
2. **Switch to LIVE mode** (if in sandbox)
3. **Get LIVE credentials**:
   - Merchant ID
   - Merchant Key
   - Passphrase

#### 6.2 Update Environment Variables

Make sure `.env.local` on production has **LIVE credentials**:
```bash
PAYFAST_MERCHANT_ID=10012345  # Your LIVE ID
PAYFAST_MERCHANT_KEY=live-key-here
PAYFAST_PASSPHRASE=your-live-passphrase
NEXT_PUBLIC_PAYFAST_URL=https://www.payfast.co.za/eng/process
```

#### 6.3 Configure PayFast Webhooks

In PayFast Dashboard:
- **ITN (Instant Transaction Notification) URL**:
  ```
  https://jobkaart.co.za/api/subscriptions/webhook
  ```
- **Return URL**:
  ```
  https://jobkaart.co.za/billing/success
  ```
- **Cancel URL**:
  ```
  https://jobkaart.co.za/billing/cancel
  ```

---

### Step 7: DNS & Domain Setup (If not done)

1. **Point domain to Afrihost server**:
   - A Record: `@` → Your server IP
   - CNAME: `www` → `jobkaart.co.za`

2. **SSL Certificate** (in cPanel):
   - Go to **SSL/TLS Status**
   - Enable AutoSSL or install Let's Encrypt

---

### Step 8: Test Everything! (10 minutes)

#### 8.1 Test Authentication
- ✅ Sign up: `https://jobkaart.co.za/signup`
- ✅ Login: `https://jobkaart.co.za/login`
- ✅ Logout

#### 8.2 Test Tenant Features
- ✅ Dashboard loads
- ✅ Create customer
- ✅ Create quote
- ✅ Send quote via WhatsApp
- ✅ Upload job photo
- ✅ Create invoice
- ✅ Settings page (upload logo)

#### 8.3 Test Admin Features
- ✅ Access `/admin` dashboard
- ✅ View all tenants
- ✅ `/admin/subscriptions` management
- ✅ Reset trial
- ✅ Change plan
- ✅ Cancel subscription

#### 8.4 Test Billing
- ✅ Go to `/billing`
- ✅ Click "Subscribe" on Starter plan
- ✅ Redirects to PayFast
- ✅ **IMPORTANT**: Test with small amount first!

---

## Quick Troubleshooting

### Build fails locally
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### "Cannot find module" errors on server
```bash
# Make sure node_modules uploaded OR run on server:
npm install --production
```

### 500 errors on production
1. Check cPanel Error Log
2. Check Node.js App logs in cPanel
3. Verify `.env.local` exists and has correct values

### Supabase connection fails
- Verify `NEXT_PUBLIC_SUPABASE_URL` is production URL
- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Check Supabase project is not paused

### PayFast not working
- Verify using **LIVE** credentials (not sandbox)
- Verify `NEXT_PUBLIC_PAYFAST_URL` is LIVE URL
- Check PayFast webhook URL is correct
- Test with small amount first (R10)

### Images not uploading
- Check storage buckets exist in Supabase
- Verify RLS policies are set
- Check Sharp package installed: `npm install sharp`

---

## Files to Upload to Production

**Required**:
```
.next/                  (Built output)
public/                 (Static files)
node_modules/           (Dependencies - or run npm install on server)
package.json
.env.local             (PRODUCTION values!)
next.config.ts
server.js              (If using custom server)
```

**DO NOT upload**:
```
.git/
.env.local.example
*.md files (documentation)
test files
```

---

## Post-Launch Checklist

- [ ] All migrations run on production Supabase
- [ ] Super admin account created and tested
- [ ] PayFast switched to LIVE mode
- [ ] PayFast webhook configured
- [ ] SSL certificate active (HTTPS working)
- [ ] Test signup flow end-to-end
- [ ] Test subscription payment (small amount)
- [ ] Test admin subscription management
- [ ] Test quote sending via WhatsApp
- [ ] Test invoice creation and sending
- [ ] Monitor cPanel logs for errors

---

## Emergency Rollback

If something breaks:

1. **Keep old build**: Before deploying, rename:
   ```
   public_html/.next  →  public_html/.next.backup
   ```

2. **Rollback**:
   ```
   public_html/.next.backup  →  public_html/.next
   ```

3. **Restart app** in cPanel Node.js App Manager

---

## Production Environment Variables Reference

```bash
# Supabase (PRODUCTION PROJECT!)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...

# PayFast (LIVE MODE!)
PAYFAST_MERCHANT_ID=10012345
PAYFAST_MERCHANT_KEY=xxxxxxxxxx
PAYFAST_PASSPHRASE=your-secure-passphrase
NEXT_PUBLIC_PAYFAST_URL=https://www.payfast.co.za/eng/process

# SendGrid
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=hello@jobkaart.co.za

# App (YOUR DOMAIN!)
NEXT_PUBLIC_APP_URL=https://jobkaart.co.za
NODE_ENV=production
```

---

## Need Help?

**Common Issues**:
1. **White screen**: Check Node.js app logs in cPanel
2. **API errors**: Check `.env.local` values
3. **Database errors**: Verify migrations ran successfully
4. **Payment issues**: Verify PayFast is in LIVE mode

**Monitoring**:
- cPanel → Error Logs
- cPanel → Node.js App → Logs
- Supabase Dashboard → Logs
- PayFast Dashboard → Transaction History

---

**Good luck with your launch! 🚀**

Remember: Start with a small test transaction (R10) before going fully live!
