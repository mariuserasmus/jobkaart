# JobKaart Database Schema

This directory contains the complete Supabase database schema for JobKaart - a multi-tenant job management system for SA tradespeople.

## Overview

The database is designed with **multi-tenant architecture** using PostgreSQL Row-Level Security (RLS) to ensure complete data isolation between tenants (businesses).

### Key Features

- **Multi-tenant isolation**: Each tenant's data is completely isolated using RLS policies
- **Auto-numbering**: Quotes, jobs, and invoices get sequential numbers automatically
- **Payment tracking**: Supports partial payments with automatic status updates
- **View tracking**: Tracks when customers view quotes/invoices via public links
- **Lifecycle management**: Automatic status updates based on payments and dates

## Migration Files

### 00001_init_schema.sql
Creates all core tables:
- `tenants` - Business/organization information
- `users` - User accounts (linked to Supabase Auth)
- `customers` - End customers for each tenant
- `quote_templates` - Reusable quote templates
- `quotes` - Customer quotes/estimates
- `jobs` - Job tracking (quote → scheduled → in progress → complete → invoiced → paid)
- `invoices` - Customer invoices with payment tracking
- `payments` - Payment records (supports partial payments)
- `view_tracking` - Tracks quote/invoice views

### 00002_enable_rls.sql
Enables Row-Level Security on all tables with policies:
- Users can only access data for their own tenant
- Public read access for quotes/invoices via public links
- Service role has full access for admin operations

### 00003_create_functions.sql
Creates helper functions and triggers:
- **Auto-numbering**: `generate_quote_number()`, `generate_job_number()`, `generate_invoice_number()`
- **Public links**: `generate_public_link()` for quote/invoice sharing
- **Status automation**: Auto-updates invoice status when payments are recorded
- **Dashboard stats**: `get_dashboard_stats()` for dashboard metrics
- **Customer analytics**: `get_customer_lifetime_value()` for customer history
- **Scheduled tasks**: `mark_overdue_invoices()`, `mark_expired_quotes()` (run via cron)

### 00004_seed_data.sql
Sample development data:
- 2 tenants: Johan's Plumbing (starter) and Sipho's Electrical (pro)
- Multiple users, customers, quotes, jobs, invoices, and payments
- **⚠️ WARNING**: Development only - do NOT run in production

## Database Schema Diagram

```
tenants (Root multi-tenant table)
  ↓
  ├── users (Team members)
  ├── customers (End customers)
  │     ↓
  │     ├── quotes
  │     │     ↓
  │     │     └── jobs
  │     │           ↓
  │     │           └── invoices
  │     │                 ↓
  │     │                 └── payments
  │     └── quote_templates
  └── view_tracking
```

## Running Migrations

### Local Development

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Initialize Supabase** (if not already done):
   ```bash
   supabase init
   ```

3. **Link to your Supabase project**:
   ```bash
   supabase link --project-ref your-project-id
   ```

4. **Run migrations**:
   ```bash
   # Run all migrations
   supabase db push

   # Or run specific migration
   supabase db push --file supabase/migrations/00001_init_schema.sql
   ```

5. **Load seed data** (development only):
   ```bash
   supabase db push --file supabase/migrations/00004_seed_data.sql
   ```

### Production

For production, run migrations via Supabase Dashboard:
1. Go to SQL Editor in Supabase Dashboard
2. Copy contents of migration files
3. Execute in order: 00001 → 00002 → 00003
4. **Skip 00004** (seed data is for development only)

## Key Concepts

### Multi-Tenancy with RLS

Every table (except `tenants`) has a `tenant_id` column. RLS policies automatically filter all queries:

```sql
-- Users can only see their own tenant's data
CREATE POLICY "Users can view own tenant customers"
ON customers FOR SELECT
USING (tenant_id = auth.tenant_id());
```

The `auth.tenant_id()` function extracts the tenant_id from the JWT token, which is set during signup/login.

### Auto-Generated Numbers

Quotes, jobs, and invoices get sequential numbers automatically:

```javascript
// When creating a quote, you don't need to provide quote_number
const { data } = await supabase
  .from('quotes')
  .insert({
    tenant_id: '...',
    customer_id: '...',
    line_items: [...],
    subtotal: 1000,
    total: 1150
    // quote_number auto-generated as Q-2025-001, Q-2025-002, etc.
    // public_link auto-generated as random 8-char code
  });
```

### Invoice Status Automation

When you record a payment, the invoice status updates automatically:

```javascript
// Record a payment
await supabase.from('payments').insert({
  tenant_id: '...',
  invoice_id: '...',
  amount: 500,
  payment_method: 'eft',
  payment_date: '2025-12-02'
});

// Invoice status automatically updates:
// - amount_paid increases by 500
// - status changes to 'partially_paid' (if amount < total)
// - status changes to 'paid' (if amount >= total)
// - paid_at timestamp set (when fully paid)
// - Related job status updates to 'paid'
```

### Public Quote/Invoice Links

Quotes and invoices have public links for customer viewing:

```javascript
// Get quote with public link
const quote = await supabase
  .from('quotes')
  .select('*')
  .eq('public_link', 'a1b2c3d4')
  .single();

// Public URL: https://jobkaart.co.za/q/a1b2c3d4
// When customer views, insert tracking record:
await supabase.from('view_tracking').insert({
  tenant_id: quote.tenant_id,
  link_type: 'quote',
  link_id: quote.id,
  ip_address: request.ip,
  user_agent: request.headers['user-agent']
});

// Update quote status to 'viewed'
await supabase
  .from('quotes')
  .update({ status: 'viewed' })
  .eq('id', quote.id);
```

### Dashboard Statistics

Get comprehensive dashboard stats for a tenant:

```javascript
const { data } = await supabase.rpc('get_dashboard_stats', {
  p_tenant_id: 'your-tenant-id',
  p_month: '2025-12-01' // Optional, defaults to current month
});

// Returns:
{
  total_outstanding: 5000.00,
  overdue_amount: 1200.00,
  month_revenue: 8500.00,
  jobs_completed_this_month: 12,
  jobs_scheduled_today: 3,
  jobs_to_invoice: 2,
  quotes_sent_this_month: 8,
  quotes_awaiting_response: 5,
  quote_acceptance_rate: 62.5,
  overdue_invoices_count: 2
}
```

### Customer Lifetime Value

Get customer history and lifetime value:

```javascript
const { data } = await supabase.rpc('get_customer_lifetime_value', {
  p_customer_id: 'customer-id'
});

// Returns:
{
  total_revenue: 47000.00,      // All paid invoices
  total_outstanding: 2400.00,   // Unpaid amount
  total_paid: 44600.00,         // Sum of all payments
  invoice_count: 15,            // Total invoices
  job_count: 18,                // Total jobs
  first_job_date: '2023-03-15',
  last_job_date: '2025-11-28'
}
```

## Scheduled Tasks

These functions should be run daily via cron job or pg_cron:

### Mark Overdue Invoices
```sql
-- Run daily at 1:00 AM
SELECT cron.schedule('mark-overdue-invoices', '0 1 * * *', $$
  SELECT mark_overdue_invoices();
$$);
```

### Mark Expired Quotes
```sql
-- Run daily at 1:30 AM
SELECT cron.schedule('mark-expired-quotes', '30 1 * * *', $$
  SELECT mark_expired_quotes();
$$);
```

Or call from backend API:
```javascript
// Backend scheduled task (runs daily)
await supabase.rpc('mark_overdue_invoices');
await supabase.rpc('mark_expired_quotes');
```

## Testing RLS Policies

To test RLS policies locally:

```sql
-- Set JWT claim to test as specific tenant
SET request.jwt.claims = '{"tenant_id": "11111111-1111-1111-1111-111111111111"}';

-- Now all queries act as if you're logged in as that tenant
SELECT * FROM customers; -- Only shows customers for that tenant

-- Reset
RESET request.jwt.claims;
```

## Common Queries

### Get all quotes for a customer with status
```sql
SELECT q.*, c.name as customer_name
FROM quotes q
JOIN customers c ON c.id = q.customer_id
WHERE q.customer_id = 'customer-id'
ORDER BY q.created_at DESC;
```

### Get jobs scheduled for today
```sql
SELECT j.*, c.name as customer_name, u.full_name as assigned_to_name
FROM jobs j
JOIN customers c ON c.id = j.customer_id
LEFT JOIN users u ON u.id = j.assigned_to
WHERE j.tenant_id = 'your-tenant-id'
AND j.scheduled_date = CURRENT_DATE
AND j.status IN ('scheduled', 'in_progress')
ORDER BY j.scheduled_time;
```

### Get overdue invoices
```sql
SELECT i.*, c.name as customer_name, c.phone as customer_phone
FROM invoices i
JOIN customers c ON c.id = i.customer_id
WHERE i.tenant_id = 'your-tenant-id'
AND i.status = 'overdue'
ORDER BY i.due_date;
```

### Get quote acceptance rate for a month
```sql
SELECT
  COUNT(*) FILTER (WHERE status = 'accepted') * 100.0 / COUNT(*) as acceptance_rate
FROM quotes
WHERE tenant_id = 'your-tenant-id'
AND sent_at >= '2025-12-01'
AND sent_at < '2026-01-01';
```

## Performance Notes

All critical queries have indexes:

- **Customer search**: Indexed on `(tenant_id, name)` and `(tenant_id, phone)`
- **Status filtering**: Indexed on `(tenant_id, status)` for quotes, jobs, invoices
- **Date ranges**: Indexed on `(tenant_id, created_at DESC)` for all tables
- **Public links**: Unique index on `public_link` for fast lookups
- **Scheduled jobs**: Indexed on `(tenant_id, scheduled_date)`

## Security Notes

1. **Never expose service role key** to frontend - only use in backend
2. **JWT token must include tenant_id** - set during signup/login
3. **Public quote/invoice access** - filter by public_link parameter only
4. **RLS is enforced at database level** - even malicious queries are blocked
5. **Seed data uses known IDs** - regenerate with random UUIDs for production tests

## Troubleshooting

### RLS Policy Issues
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- View all policies
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### Check Auto-Generated Numbers
```sql
-- Test quote number generation
SELECT generate_quote_number('your-tenant-id');

-- Check sequence gaps
SELECT quote_number FROM quotes WHERE tenant_id = 'your-tenant-id' ORDER BY created_at;
```

### Verify Triggers
```sql
-- List all triggers
SELECT * FROM pg_trigger WHERE tgrelid IN (
  SELECT oid FROM pg_class WHERE relname IN ('quotes', 'invoices', 'jobs', 'payments')
);
```

## Support

For issues or questions:
- Check Supabase logs in dashboard
- Review PostgreSQL logs for errors
- Test queries in Supabase SQL Editor
- Verify RLS policies with test tenant

## License

Proprietary - JobKaart (Pty) Ltd
