# Supabase Setup Guide for JobKaart

## Quick Setup (5 minutes)

### Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - **Name**: JobKaart
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to South Africa (e.g., Frankfurt or Mumbai)
4. Click "Create new project"
5. Wait 2-3 minutes for setup to complete

### Step 2: Get API Keys

1. In your Supabase project dashboard, click **Settings** (gear icon on left)
2. Click **API** in the settings menu
3. You'll see:
   - **Project URL** - Copy this
   - **anon public** key - Copy this
   - **service_role** key - Click "Reveal" then copy

### Step 3: Update .env.local

Open `c:\Claude\JobKaart\jobkaart-app\.env.local` and replace:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

With your actual values from Step 2.

**Example:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xyzabc123.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Run Database Migrations

In your Supabase project:

1. Click **SQL Editor** (in left sidebar)
2. Click "New query"
3. Copy contents of `supabase/migrations/00001_init_schema.sql`
4. Paste into SQL editor
5. Click **RUN** (bottom right)
6. Wait for "Success" message

Repeat for:
- `00002_enable_rls.sql`
- `00003_create_functions.sql`
- `00004_seed_data.sql` (optional - sample data for testing)

**Alternative: Use Supabase CLI**

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project (you'll need your project ID)
cd c:\Claude\JobKaart\jobkaart-app
supabase link --project-ref your-project-id

# Push all migrations
supabase db push
```

### Step 5: Restart Dev Server

```bash
# Stop the dev server (Ctrl+C)
# Start it again
npm run dev
```

### Step 6: Test the App!

1. Go to http://localhost:3000/signup
2. Create a new account
3. You should be redirected to /dashboard
4. Try adding a customer at /customers

---

## Troubleshooting

### Error: "Invalid API key"
- Double-check you copied the correct keys from Supabase dashboard
- Make sure there are no extra spaces or line breaks
- Restart dev server after updating .env.local

### Error: "relation 'tenants' does not exist"
- Run the migrations (Step 4)
- Check SQL Editor for any errors
- Verify all 4 migration files ran successfully

### Error: "Row level security policy violation"
- Make sure 00002_enable_rls.sql ran successfully
- Check that you're logged in (session exists)
- Clear cookies and try logging in again

### Can't see data in Supabase dashboard
- Click **Table Editor** in left sidebar
- Select table (e.g., "tenants", "customers")
- You should see data created from signup/app

---

## Verify Setup

Run this query in Supabase SQL Editor:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should return:
-- customers, invoices, jobs, payments,
-- quote_templates, quotes, tenants, users, view_tracking
```

---

## Next Steps

Once Supabase is set up:

1. ✅ Landing page works (already live)
2. ✅ Signup/Login works
3. ✅ Customer Database works
4. 🚧 Build Quote Builder next
5. 🚧 Build Job Tracker
6. 🚧 Build Invoicing
7. 🚧 Build Dashboard

---

## Need Help?

- Supabase Docs: https://supabase.com/docs
- JobKaart Database Schema: See `supabase/README.md`
- SQL Reference: See `supabase/QUICK_REFERENCE.md`

**You're almost there! Just set up Supabase and you'll have a working app.**
