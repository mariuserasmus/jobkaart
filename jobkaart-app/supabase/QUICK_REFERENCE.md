# JobKaart Database - Quick Reference

Quick SQL snippets for common operations in JobKaart.

## Table of Contents
- [Setup & Authentication](#setup--authentication)
- [Customers](#customers)
- [Quotes](#quotes)
- [Jobs](#jobs)
- [Invoices & Payments](#invoices--payments)
- [Dashboard Queries](#dashboard-queries)
- [Analytics](#analytics)
- [Maintenance](#maintenance)

---

## Setup & Authentication

### Set Tenant Context (Testing)
```sql
-- Test as Johan's Plumbing
SET request.jwt.claims = '{"tenant_id": "11111111-1111-1111-1111-111111111111"}';

-- Reset
RESET request.jwt.claims;
```

### Create New Tenant (via API)
```javascript
// Backend only (uses service role)
const { data: tenant } = await supabase
  .from('tenants')
  .insert({
    business_name: 'New Plumbing Co',
    vat_registered: true,
    vat_number: '4123456789',
    subscription_tier: 'starter',
    subscription_status: 'trial'
  })
  .select()
  .single();

// Create owner user
const { data: user } = await supabase.auth.admin.createUser({
  email: 'owner@newplumbing.co.za',
  password: 'secure-password',
  user_metadata: {
    tenant_id: tenant.id,
    full_name: 'John Smith'
  }
});

// Link user to tenant
await supabase.from('users').insert({
  id: user.id,
  tenant_id: tenant.id,
  email: user.email,
  full_name: 'John Smith',
  role: 'owner'
});
```

---

## Customers

### Create Customer
```javascript
const { data } = await supabase
  .from('customers')
  .insert({
    tenant_id: currentUser.tenant_id,
    name: 'Tannie Maria',
    phone: '082 123 4567',
    email: 'maria@gmail.com',
    address: '45 Oak Street, Linden',
    notes: 'Regular customer - very friendly'
  })
  .select()
  .single();
```

### Search Customers
```javascript
// By name (case-insensitive)
const { data } = await supabase
  .from('customers')
  .select('*')
  .ilike('name', '%maria%')
  .order('name');

// By phone
const { data } = await supabase
  .from('customers')
  .select('*')
  .eq('phone', '082 123 4567')
  .single();
```

### Get Customer with Full History
```sql
SELECT
  c.*,
  jsonb_agg(DISTINCT jsonb_build_object(
    'id', q.id,
    'quote_number', q.quote_number,
    'total', q.total,
    'status', q.status,
    'created_at', q.created_at
  )) FILTER (WHERE q.id IS NOT NULL) as quotes,
  jsonb_agg(DISTINCT jsonb_build_object(
    'id', j.id,
    'job_number', j.job_number,
    'title', j.title,
    'status', j.status,
    'created_at', j.created_at
  )) FILTER (WHERE j.id IS NOT NULL) as jobs,
  get_customer_lifetime_value(c.id) as lifetime_value
FROM customers c
LEFT JOIN quotes q ON q.customer_id = c.id
LEFT JOIN jobs j ON j.customer_id = c.id
WHERE c.id = 'customer-id'
GROUP BY c.id;
```

---

## Quotes

### Create Quote from Template
```javascript
// Get template
const { data: template } = await supabase
  .from('quote_templates')
  .select('*')
  .eq('id', 'template-id')
  .single();

// Create quote from template
const { data: quote } = await supabase
  .from('quotes')
  .insert({
    tenant_id: currentUser.tenant_id,
    customer_id: 'customer-id',
    line_items: template.line_items,
    subtotal: template.default_subtotal,
    vat_amount: template.default_vat_amount,
    total: template.default_total,
    valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    created_by: currentUser.id
    // quote_number and public_link auto-generated
  })
  .select()
  .single();

// Update template usage stats
await supabase
  .from('quote_templates')
  .update({
    times_used: template.times_used + 1,
    last_used_at: new Date().toISOString()
  })
  .eq('id', template.id);
```

### Send Quote (Mark as Sent)
```javascript
const { data } = await supabase
  .from('quotes')
  .update({
    status: 'sent',
    sent_at: new Date().toISOString()
  })
  .eq('id', 'quote-id')
  .select()
  .single();

// Generate WhatsApp link
const whatsappUrl = `https://wa.me/${customer.phone.replace(/\s/g, '')}?text=${encodeURIComponent(
  `Hi ${customer.name}, here's your quote: https://jobkaart.co.za/q/${quote.public_link}`
)}`;
```

### Mark Quote as Viewed (Public Page)
```javascript
// When customer visits public quote page
const { data: quote } = await supabase
  .from('quotes')
  .select('*')
  .eq('public_link', 'a1b2c3d4')
  .single();

// Record view tracking
await supabase.from('view_tracking').insert({
  tenant_id: quote.tenant_id,
  link_type: 'quote',
  link_id: quote.id,
  ip_address: request.ip,
  user_agent: request.headers['user-agent']
});

// Update quote status
if (quote.status === 'sent') {
  await supabase
    .from('quotes')
    .update({ status: 'viewed' })
    .eq('id', quote.id);
}
```

### Convert Quote to Job
```javascript
const { data: job } = await supabase
  .from('jobs')
  .insert({
    tenant_id: quote.tenant_id,
    customer_id: quote.customer_id,
    quote_id: quote.id,
    title: `Job from Quote ${quote.quote_number}`,
    description: 'Accepted quote - ready to schedule',
    status: 'quoted'
    // job_number auto-generated
  })
  .select()
  .single();

// Update quote status
await supabase
  .from('quotes')
  .update({ status: 'accepted', accepted_at: new Date().toISOString() })
  .eq('id', quote.id);
```

### Get Quotes Awaiting Response (3+ Days)
```sql
SELECT q.*, c.name as customer_name, c.phone as customer_phone
FROM quotes q
JOIN customers c ON c.id = q.customer_id
WHERE q.tenant_id = 'your-tenant-id'
AND q.status IN ('sent', 'viewed')
AND q.sent_at < NOW() - INTERVAL '3 days'
AND (q.valid_until IS NULL OR q.valid_until >= CURRENT_DATE)
ORDER BY q.sent_at;
```

---

## Jobs

### Update Job Status
```javascript
// Schedule job
await supabase
  .from('jobs')
  .update({
    status: 'scheduled',
    scheduled_date: '2025-12-03',
    scheduled_time: '09:00',
    assigned_to: 'user-id'
  })
  .eq('id', 'job-id');

// Mark in progress
await supabase
  .from('jobs')
  .update({ status: 'in_progress' })
  .eq('id', 'job-id');

// Mark complete
await supabase
  .from('jobs')
  .update({
    status: 'complete',
    completed_date: new Date().toISOString().split('T')[0]
  })
  .eq('id', 'job-id');
```

### Add Job Photos
```javascript
// Upload photo to Supabase Storage
const file = event.target.files[0];
const filePath = `${tenant_id}/jobs/${job_id}/${Date.now()}_${file.name}`;

const { data: uploadData } = await supabase.storage
  .from('job-photos')
  .upload(filePath, file);

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('job-photos')
  .getPublicUrl(filePath);

// Add to job photos array
const { data: job } = await supabase
  .from('jobs')
  .select('photos')
  .eq('id', 'job-id')
  .single();

const updatedPhotos = [
  ...(job.photos || []),
  {
    url: publicUrl,
    caption: 'Before photo',
    timestamp: new Date().toISOString()
  }
];

await supabase
  .from('jobs')
  .update({ photos: updatedPhotos })
  .eq('id', 'job-id');
```

### Get Today's Jobs
```sql
SELECT
  j.*,
  c.name as customer_name,
  c.phone as customer_phone,
  c.address as customer_address,
  u.full_name as assigned_to_name
FROM jobs j
JOIN customers c ON c.id = j.customer_id
LEFT JOIN users u ON u.id = j.assigned_to
WHERE j.tenant_id = 'your-tenant-id'
AND j.scheduled_date = CURRENT_DATE
ORDER BY j.scheduled_time;
```

### Get Jobs Ready to Invoice
```sql
SELECT j.*, c.name as customer_name, c.phone as customer_phone
FROM jobs j
JOIN customers c ON c.id = j.customer_id
WHERE j.tenant_id = 'your-tenant-id'
AND j.status = 'complete'
ORDER BY j.completed_date;
```

---

## Invoices & Payments

### Create Invoice from Job
```javascript
const { data: job } = await supabase
  .from('jobs')
  .select('*, quote:quotes(*)')
  .eq('id', 'job-id')
  .single();

// Use quote line items if available, or create new
const lineItems = job.quote?.line_items || [
  { description: job.title, quantity: 1, unit_price: 1000 }
];

const subtotal = lineItems.reduce((sum, item) =>
  sum + (item.quantity * item.unit_price), 0
);
const vatAmount = subtotal * 0.15; // 15% VAT
const total = subtotal + vatAmount;

const { data: invoice } = await supabase
  .from('invoices')
  .insert({
    tenant_id: job.tenant_id,
    customer_id: job.customer_id,
    job_id: job.id,
    line_items: lineItems,
    subtotal,
    vat_amount: vatAmount,
    total,
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    status: 'draft'
    // invoice_number and public_link auto-generated
  })
  .select()
  .single();

// Job status automatically updated to 'invoiced' via trigger
```

### Send Invoice
```javascript
await supabase
  .from('invoices')
  .update({
    status: 'sent',
    sent_at: new Date().toISOString()
  })
  .eq('id', 'invoice-id');

// Generate WhatsApp message
const whatsappUrl = `https://wa.me/${customer.phone.replace(/\s/g, '')}?text=${encodeURIComponent(
  `Hi ${customer.name}, your invoice is ready: https://jobkaart.co.za/i/${invoice.public_link}\n\nAmount due: R${invoice.total.toFixed(2)}\nDue date: ${invoice.due_date}`
)}`;
```

### Record Payment
```javascript
// Record payment - triggers automatically update invoice status
await supabase
  .from('payments')
  .insert({
    tenant_id: currentUser.tenant_id,
    invoice_id: 'invoice-id',
    amount: 1500.00,
    payment_method: 'eft',
    payment_date: '2025-12-02',
    reference: 'FNB Ref: 123456789',
    recorded_by: currentUser.id
  });

// Invoice.amount_paid and invoice.status automatically updated via trigger
// If fully paid, job.status also updated to 'paid'
```

### Get Payment History for Invoice
```sql
SELECT
  p.*,
  u.full_name as recorded_by_name
FROM payments p
LEFT JOIN users u ON u.id = p.recorded_by
WHERE p.invoice_id = 'invoice-id'
ORDER BY p.payment_date DESC;
```

### Get Overdue Invoices
```sql
SELECT
  i.*,
  c.name as customer_name,
  c.phone as customer_phone,
  i.total - i.amount_paid as amount_outstanding,
  CURRENT_DATE - i.due_date as days_overdue
FROM invoices i
JOIN customers c ON c.id = i.customer_id
WHERE i.tenant_id = 'your-tenant-id'
AND i.status IN ('sent', 'viewed', 'partially_paid', 'overdue')
AND i.due_date < CURRENT_DATE
ORDER BY i.due_date;
```

### Generate Payment Reminder Message
```javascript
const { data: invoice } = await supabase
  .from('invoices')
  .select('*, customer:customers(*)')
  .eq('id', 'invoice-id')
  .single();

const daysOverdue = Math.floor(
  (new Date() - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24)
);

const message = `Hi ${invoice.customer.name}, friendly reminder that invoice ${invoice.invoice_number} for R${invoice.total.toFixed(2)} was due ${daysOverdue} days ago. Please arrange payment at your earliest convenience. View invoice: https://jobkaart.co.za/i/${invoice.public_link}`;

const whatsappUrl = `https://wa.me/${invoice.customer.phone.replace(/\s/g, '')}?text=${encodeURIComponent(message)}`;
```

---

## Dashboard Queries

### Get Dashboard Stats
```javascript
const { data: stats } = await supabase
  .rpc('get_dashboard_stats', {
    p_tenant_id: currentUser.tenant_id,
    p_month: '2025-12-01' // Optional
  });

console.log(stats);
// {
//   total_outstanding: 5000.00,
//   overdue_amount: 1200.00,
//   month_revenue: 8500.00,
//   jobs_completed_this_month: 12,
//   jobs_scheduled_today: 3,
//   ...
// }
```

### Action Items (Follow-ups, Jobs to Invoice, Overdue)
```sql
-- Quotes needing follow-up (3+ days, no response)
SELECT
  'quote_followup' as action_type,
  q.id,
  q.quote_number as reference,
  c.name as customer_name,
  c.phone as customer_phone,
  q.total as amount,
  EXTRACT(DAY FROM NOW() - q.sent_at) as days_waiting
FROM quotes q
JOIN customers c ON c.id = q.customer_id
WHERE q.tenant_id = 'your-tenant-id'
AND q.status IN ('sent', 'viewed')
AND q.sent_at < NOW() - INTERVAL '3 days'
AND (q.valid_until IS NULL OR q.valid_until >= CURRENT_DATE)

UNION ALL

-- Jobs to invoice
SELECT
  'job_to_invoice' as action_type,
  j.id,
  j.job_number as reference,
  c.name as customer_name,
  c.phone as customer_phone,
  0 as amount,
  EXTRACT(DAY FROM NOW() - j.completed_date::timestamp) as days_waiting
FROM jobs j
JOIN customers c ON c.id = j.customer_id
WHERE j.tenant_id = 'your-tenant-id'
AND j.status = 'complete'

UNION ALL

-- Overdue invoices
SELECT
  'overdue_invoice' as action_type,
  i.id,
  i.invoice_number as reference,
  c.name as customer_name,
  c.phone as customer_phone,
  i.total - i.amount_paid as amount,
  EXTRACT(DAY FROM CURRENT_DATE - i.due_date) as days_waiting
FROM invoices i
JOIN customers c ON c.id = i.customer_id
WHERE i.tenant_id = 'your-tenant-id'
AND i.status = 'overdue'

ORDER BY days_waiting DESC;
```

---

## Analytics

### Customer Lifetime Value
```javascript
const { data: ltv } = await supabase
  .rpc('get_customer_lifetime_value', {
    p_customer_id: 'customer-id'
  });

console.log(ltv);
// {
//   total_revenue: 47000.00,
//   total_outstanding: 2400.00,
//   invoice_count: 15,
//   job_count: 18,
//   first_job_date: '2023-03-15',
//   last_job_date: '2025-11-28'
// }
```

### Monthly Revenue Trend (Last 6 Months)
```sql
SELECT
  DATE_TRUNC('month', p.payment_date) as month,
  SUM(p.amount) as revenue,
  COUNT(DISTINCT p.invoice_id) as invoices_paid,
  COUNT(DISTINCT i.customer_id) as unique_customers
FROM payments p
JOIN invoices i ON i.id = p.invoice_id
WHERE i.tenant_id = 'your-tenant-id'
AND p.payment_date >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', p.payment_date)
ORDER BY month DESC;
```

### Top Customers by Revenue
```sql
SELECT
  c.id,
  c.name,
  c.phone,
  COUNT(DISTINCT i.id) as invoice_count,
  SUM(i.amount_paid) as total_paid,
  MAX(i.created_at) as last_invoice_date
FROM customers c
JOIN invoices i ON i.customer_id = c.id
WHERE c.tenant_id = 'your-tenant-id'
GROUP BY c.id, c.name, c.phone
ORDER BY total_paid DESC
LIMIT 10;
```

### Quote Acceptance Rate by Month
```sql
SELECT
  DATE_TRUNC('month', q.sent_at) as month,
  COUNT(*) as quotes_sent,
  COUNT(*) FILTER (WHERE q.status = 'accepted') as quotes_accepted,
  ROUND(100.0 * COUNT(*) FILTER (WHERE q.status = 'accepted') / COUNT(*), 1) as acceptance_rate
FROM quotes q
WHERE q.tenant_id = 'your-tenant-id'
AND q.sent_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', q.sent_at)
ORDER BY month DESC;
```

---

## Maintenance

### Run Scheduled Tasks Manually
```javascript
// Mark overdue invoices (normally runs via cron)
const { data: count } = await supabase.rpc('mark_overdue_invoices');
console.log(`Marked ${count} invoices as overdue`);

// Mark expired quotes
const { data: count } = await supabase.rpc('mark_expired_quotes');
console.log(`Marked ${count} quotes as expired`);
```

### Check RLS Policies
```sql
-- List all RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Verify Data Isolation (RLS Test)
```sql
-- Set tenant context
SET request.jwt.claims = '{"tenant_id": "11111111-1111-1111-1111-111111111111"}';

-- Should only see data for tenant 1
SELECT COUNT(*) FROM customers; -- Only tenant 1's customers

-- Switch tenant
SET request.jwt.claims = '{"tenant_id": "22222222-2222-2222-2222-222222222222"}';

-- Should only see data for tenant 2
SELECT COUNT(*) FROM customers; -- Only tenant 2's customers

-- No cross-tenant access possible!
```

### Clean Up Old View Tracking (Keep Last 90 Days)
```sql
DELETE FROM view_tracking
WHERE viewed_at < NOW() - INTERVAL '90 days';
```

### Backup Critical Data
```sql
-- Export all data for a tenant (for backup/migration)
COPY (
  SELECT * FROM customers WHERE tenant_id = 'your-tenant-id'
) TO '/tmp/customers_backup.csv' WITH CSV HEADER;

COPY (
  SELECT * FROM quotes WHERE tenant_id = 'your-tenant-id'
) TO '/tmp/quotes_backup.csv' WITH CSV HEADER;

-- Repeat for other tables...
```

---

## Tips & Tricks

### Use Database Functions for Complex Queries
Instead of multiple round-trips, use functions like `get_dashboard_stats()` and `get_customer_lifetime_value()` for complex calculations.

### Leverage Triggers
Let triggers handle status updates automatically (invoice payments, job status changes). Don't try to update statuses manually in application code.

### Index Usage
All queries above use existing indexes. If you add new query patterns, add appropriate indexes.

### Public Link Security
Always filter by `public_link` parameter only when showing public quotes/invoices. Never trust URL parameters for tenant_id or other sensitive data.

---

**Need more help?** See `README.md` for detailed documentation.
