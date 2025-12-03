# JobKaart Database - Visual Schema Diagram

## Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MULTI-TENANT ARCHITECTURE                         │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                              TENANTS                                │   │
│  │  (Root table - businesses/organizations)                            │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  • id (uuid, PK)                                                    │   │
│  │  • business_name                                                    │   │
│  │  • vat_number, vat_registered                                       │   │
│  │  • banking_details (jsonb)                                          │   │
│  │  • subscription_tier (enum: starter, pro, team)                     │   │
│  │  • subscription_status (enum: active, cancelled, overdue, trial)    │   │
│  │  • monthly_job_limit                                                │   │
│  └────────────────────────┬────────────────────────────────────────────┘   │
│                           │ (All tables link via tenant_id)                 │
│         ┌─────────────────┼─────────────────┬──────────────────┐           │
│         │                 │                 │                  │           │
│         ▼                 ▼                 ▼                  ▼           │
│  ┌────────────┐   ┌─────────────┐   ┌──────────────┐   ┌─────────────┐   │
│  │   USERS    │   │  CUSTOMERS  │   │    QUOTE     │   │    VIEW     │   │
│  │            │   │             │   │  TEMPLATES   │   │  TRACKING   │   │
│  └────────────┘   └─────────────┘   └──────────────┘   └─────────────┘   │
│                           │                                                 │
│                           │ (Customer is central to workflow)               │
│         ┌─────────────────┼─────────────────┐                              │
│         │                 │                 │                              │
│         ▼                 ▼                 ▼                              │
│  ┌────────────┐   ┌─────────────┐   ┌──────────────┐                      │
│  │   QUOTES   │   │    JOBS     │   │   INVOICES   │                      │
│  └────────────┘   └─────────────┘   └──────────────┘                      │
│         │                 │                 │                              │
│         └─────────────────┼─────────────────┘                              │
│                           │                                                 │
│                           ▼                                                 │
│                    ┌─────────────┐                                          │
│                    │  PAYMENTS   │                                          │
│                    └─────────────┘                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Table Relationships

### 1. TENANTS (Root Multi-Tenant Table)

```
┌─────────────────────────────┐
│         TENANTS             │
├─────────────────────────────┤
│ PK  id                      │
│     business_name           │
│     vat_number              │
│     vat_registered          │
│     banking_details (jsonb) │  ← Flexible: bank, account_number, etc.
│     phone, email, address   │
│     subscription_tier       │  ← Enum: starter, pro, team
│     subscription_status     │  ← Enum: active, cancelled, overdue, trial
│     monthly_job_limit       │  ← NULL = unlimited (pro/team)
│     created_at, updated_at  │
└─────────────────────────────┘
         │
         │ One-to-Many
         ▼
    (All other tables have FK: tenant_id)
```

---

### 2. USERS (Team Members)

```
┌─────────────────────────────┐
│           USERS             │
├─────────────────────────────┤
│ PK  id (references auth.users)
│ FK  tenant_id → tenants.id  │
│     email (unique)          │
│     full_name               │
│     phone                   │
│     role                    │  ← Enum: owner, admin, member
│     is_active               │
│     created_at, updated_at  │
│     last_login_at           │
└─────────────────────────────┘

NOTE: Links to Supabase auth.users via id
```

---

### 3. CUSTOMERS (End Customers)

```
┌─────────────────────────────┐
│         CUSTOMERS           │
├─────────────────────────────┤
│ PK  id                      │
│ FK  tenant_id → tenants.id  │
│     name                    │
│     phone (unique per tenant)
│     email                   │
│     address                 │
│     notes                   │
│     created_at, updated_at  │
└─────────────────────────────┘
         │
         │ One-to-Many
         ├──────────┬──────────┐
         ▼          ▼          ▼
     QUOTES      JOBS      INVOICES
```

---

### 4. QUOTE TEMPLATES (Reusable Templates)

```
┌─────────────────────────────┐
│      QUOTE_TEMPLATES        │
├─────────────────────────────┤
│ PK  id                      │
│ FK  tenant_id → tenants.id  │
│     name                    │  ← e.g., "Standard Bathroom Repair"
│     description             │
│     line_items (jsonb)      │  ← Array of {description, qty, price}
│     default_subtotal        │
│     default_vat_amount      │
│     default_total           │
│     times_used              │  ← Usage tracking
│     last_used_at            │
│     created_at, updated_at  │
└─────────────────────────────┘

JSONB Structure:
[
  {
    "description": "Labour",
    "quantity": 4,
    "unit_price": 500
  },
  {
    "description": "Parts",
    "quantity": 1,
    "unit_price": 350
  }
]
```

---

### 5. QUOTES (Customer Quotes/Estimates)

```
┌─────────────────────────────┐
│           QUOTES            │
├─────────────────────────────┤
│ PK  id                      │
│ FK  tenant_id → tenants.id  │
│ FK  customer_id → customers.id
│     quote_number            │  ← Auto-generated: Q-2025-001
│     line_items (jsonb)      │  ← Same structure as template
│     subtotal, vat_amount    │
│     total                   │
│     status                  │  ← Enum: draft, sent, viewed, accepted, rejected, expired
│     valid_until (date)      │
│     notes, terms            │
│     public_link (unique)    │  ← For public URL: /q/abc123
│     viewed_at, sent_at      │
│     accepted_at, rejected_at│
│ FK  created_by → users.id   │
│     created_at, updated_at  │
└─────────────────────────────┘
         │
         │ Can convert to Job
         ▼
     ┌───────┐
     │  JOBS │
     └───────┘

STATUS FLOW:
draft → sent → viewed → accepted/rejected
                     ↓
                  (expired if past valid_until)
```

---

### 6. JOBS (Job Lifecycle Tracking)

```
┌─────────────────────────────┐
│            JOBS             │
├─────────────────────────────┤
│ PK  id                      │
│ FK  tenant_id → tenants.id  │
│ FK  customer_id → customers.id
│ FK  quote_id → quotes.id    │  ← Nullable (can create job without quote)
│     job_number              │  ← Auto-generated: J-2025-001
│     title, description      │
│     status                  │  ← Enum: quoted, scheduled, in_progress,
│                             │          complete, invoiced, paid
│     scheduled_date (date)   │
│     scheduled_time (time)   │
│     estimated_duration_hours│
│     completed_date (date)   │
│     photos (jsonb)          │  ← Array of {url, caption, timestamp}
│ FK  assigned_to → users.id  │
│     notes                   │
│     created_at, updated_at  │
└─────────────────────────────┘
         │
         │ One-to-One (usually)
         ▼
     ┌──────────┐
     │ INVOICES │
     └──────────┘

STATUS FLOW:
quoted → scheduled → in_progress → complete → invoiced → paid
                                      ▲           │         ▲
                                      └───────────┴─────────┘
                                     (Auto-updated by triggers)

PHOTOS JSONB Structure:
[
  {
    "url": "https://...",
    "caption": "Before photo",
    "timestamp": "2025-12-02T10:30:00Z"
  }
]
```

---

### 7. INVOICES (Customer Invoices)

```
┌─────────────────────────────┐
│          INVOICES           │
├─────────────────────────────┤
│ PK  id                      │
│ FK  tenant_id → tenants.id  │
│ FK  customer_id → customers.id
│ FK  job_id → jobs.id        │  ← Nullable
│     invoice_number          │  ← Auto-generated: INV-2025-001
│     line_items (jsonb)      │  ← Usually copied from quote/job
│     subtotal, vat_amount    │
│     total                   │
│     amount_paid             │  ← Auto-updated by payments trigger
│     status                  │  ← Enum: draft, sent, viewed,
│                             │          partially_paid, paid, overdue
│     due_date (date)         │
│     notes, terms            │
│     public_link (unique)    │  ← For public URL: /i/xyz789
│     viewed_at, sent_at      │
│     paid_at                 │
│     created_at, updated_at  │
└─────────────────────────────┘
         │
         │ One-to-Many
         ▼
     ┌──────────┐
     │ PAYMENTS │
     └──────────┘

STATUS FLOW:
draft → sent → viewed → partially_paid → paid
                     ↓
                  (overdue if past due_date)

AUTOMATIC STATUS UPDATES:
• When payment recorded: status → partially_paid or paid
• When fully paid: paid_at timestamp set, job.status → paid
• Daily cron job: if due_date < today → overdue
```

---

### 8. PAYMENTS (Payment Records)

```
┌─────────────────────────────┐
│          PAYMENTS           │
├─────────────────────────────┤
│ PK  id                      │
│ FK  tenant_id → tenants.id  │
│ FK  invoice_id → invoices.id│
│     amount                  │  ← Must be > 0
│     payment_method          │  ← Enum: cash, eft, card, other
│     payment_date (date)     │
│     reference               │  ← e.g., bank reference
│     notes                   │
│ FK  recorded_by → users.id  │
│     created_at              │
└─────────────────────────────┘

TRIGGERS:
• After INSERT: Update invoice.amount_paid, invoice.status
• After UPDATE: Recalculate invoice.amount_paid, invoice.status
• After DELETE: Recalculate invoice.amount_paid, invoice.status

EXAMPLE:
Invoice total: R5000
Payment 1:    R2000 → status: partially_paid
Payment 2:    R3000 → status: paid, paid_at set, job.status → paid
```

---

### 9. VIEW_TRACKING (Quote/Invoice View Analytics)

```
┌─────────────────────────────┐
│        VIEW_TRACKING        │
├─────────────────────────────┤
│ PK  id                      │
│ FK  tenant_id → tenants.id  │
│     link_type               │  ← Enum: quote, invoice
│     link_id                 │  ← quote.id or invoice.id
│     viewed_at (timestamp)   │
│     ip_address (inet)       │
│     user_agent (text)       │
│     country_code            │  ← From IP geolocation
│     city                    │
└─────────────────────────────┘

PURPOSE:
• Track when customers view quotes/invoices
• Know when to follow up ("Tannie Maria viewed your quote 2 hours ago")
• Analytics on customer engagement
```

---

## Data Flow Diagrams

### Quote → Job → Invoice → Payment Flow

```
1. CREATE QUOTE
   ┌─────────────────┐
   │ Quote Template  │ (Optional)
   └────────┬────────┘
            │ Use template
            ▼
   ┌─────────────────┐
   │ Create Quote    │
   │ • Auto: quote_number (Q-2025-001)
   │ • Auto: public_link (abc123)
   │ • Status: draft
   └────────┬────────┘
            │
            ▼
2. SEND QUOTE
   ┌─────────────────┐
   │ Send via WhatsApp│
   │ • Link: /q/abc123
   │ • Status: sent
   │ • sent_at: NOW()
   └────────┬────────┘
            │
            ▼
3. CUSTOMER VIEWS
   ┌─────────────────┐
   │ Customer clicks │
   │ • Insert view_tracking
   │ • Status: viewed
   │ • viewed_at: NOW()
   └────────┬────────┘
            │
            ▼
4. ACCEPT QUOTE
   ┌─────────────────┐
   │ Convert to Job  │
   │ • Create job record
   │ • Auto: job_number (J-2025-001)
   │ • Link: quote_id
   │ • Quote status: accepted
   │ • Job status: quoted
   └────────┬────────┘
            │
            ▼
5. SCHEDULE JOB
   ┌─────────────────┐
   │ Set schedule    │
   │ • scheduled_date
   │ • scheduled_time
   │ • assigned_to
   │ • Status: scheduled
   └────────┬────────┘
            │
            ▼
6. WORK ON JOB
   ┌─────────────────┐
   │ Start work      │
   │ • Status: in_progress
   │ • Upload photos
   └────────┬────────┘
            │
            ▼
7. COMPLETE JOB
   ┌─────────────────┐
   │ Mark complete   │
   │ • Status: complete
   │ • completed_date: TODAY
   └────────┬────────┘
            │
            ▼
8. CREATE INVOICE
   ┌─────────────────┐
   │ Create Invoice  │
   │ • Auto: invoice_number (INV-2025-001)
   │ • Auto: public_link (xyz789)
   │ • Copy line_items from quote
   │ • Status: draft
   │ • TRIGGER: Job status → invoiced
   └────────┬────────┘
            │
            ▼
9. SEND INVOICE
   ┌─────────────────┐
   │ Send to customer│
   │ • Link: /i/xyz789
   │ • Status: sent
   │ • sent_at: NOW()
   └────────┬────────┘
            │
            ▼
10. CUSTOMER PAYS
   ┌─────────────────┐
   │ Record Payment  │
   │ • payment_date
   │ • amount
   │ • payment_method
   │ • TRIGGER: Invoice amount_paid += amount
   │ • TRIGGER: Invoice status → partially_paid or paid
   │ • TRIGGER: If paid, job status → paid
   └─────────────────┘
```

---

## Row-Level Security (RLS) Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     USER AUTHENTICATES                      │
│                  (via Supabase Auth)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              JWT TOKEN GENERATED                            │
│  {                                                          │
│    "sub": "user-uuid",                                      │
│    "tenant_id": "tenant-uuid",   ← SET DURING SIGNUP/LOGIN │
│    "role": "authenticated"                                  │
│  }                                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              USER QUERIES DATABASE                          │
│  SELECT * FROM customers;                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              RLS POLICY INTERCEPTS                          │
│  USING (tenant_id = auth.tenant_id())                       │
│         ▲                                                   │
│         └─── Extracts tenant_id from JWT                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              QUERY REWRITTEN AUTOMATICALLY                  │
│  SELECT * FROM customers                                    │
│  WHERE tenant_id = 'user-tenant-uuid';  ← ADDED BY RLS     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              RESULTS RETURNED                               │
│  Only customers belonging to user's tenant                  │
│  NO WAY to access other tenants' data                       │
└─────────────────────────────────────────────────────────────┘

SECURITY GUARANTEE:
Even if user tries:
  SELECT * FROM customers WHERE tenant_id = 'other-tenant-id'

RLS still filters:
  SELECT * FROM customers
  WHERE tenant_id = 'other-tenant-id'
  AND tenant_id = 'user-tenant-uuid'   ← RLS adds this

Result: Empty set (no data returned)
```

---

## Auto-Number Generation Flow

```
INSERT INTO quotes (tenant_id, customer_id, ...)
       ↓
  TRIGGER: set_quote_defaults
       ↓
  ┌─────────────────────────────┐
  │ 1. Check if quote_number    │
  │    is NULL or empty         │
  └─────────────┬───────────────┘
                │ Yes
                ▼
  ┌─────────────────────────────┐
  │ 2. Call generate_quote_number│
  │    (tenant_id)              │
  └─────────────┬───────────────┘
                │
                ▼
  ┌─────────────────────────────┐
  │ 3. Get current year         │
  │    year = 2025              │
  └─────────────┬───────────────┘
                │
                ▼
  ┌─────────────────────────────┐
  │ 4. Find max number for year │
  │    SELECT MAX(             │
  │      CAST(SPLIT_PART(       │
  │        quote_number, '-', 3│
  │      ) AS INTEGER)          │
  │    ) FROM quotes            │
  │    WHERE tenant_id = ...    │
  │    AND quote_number LIKE    │
  │      'Q-2025-%'             │
  └─────────────┬───────────────┘
                │ Returns: 3 (last was Q-2025-003)
                ▼
  ┌─────────────────────────────┐
  │ 5. Increment: 3 + 1 = 4     │
  └─────────────┬───────────────┘
                │
                ▼
  ┌─────────────────────────────┐
  │ 6. Format with leading zeros│
  │    'Q-' || '2025' || '-' || │
  │    LPAD('4', 3, '0')        │
  │    = 'Q-2025-004'           │
  └─────────────┬───────────────┘
                │
                ▼
  ┌─────────────────────────────┐
  │ 7. Set NEW.quote_number     │
  │    = 'Q-2025-004'           │
  └─────────────┬───────────────┘
                │
                ▼
  ┌─────────────────────────────┐
  │ 8. Generate public_link     │
  │    LOOP until unique        │
  │    = 'a7f4k2m9'             │
  └─────────────┬───────────────┘
                │
                ▼
       INSERT completes
       Quote saved with:
       • quote_number: Q-2025-004
       • public_link: a7f4k2m9

SAME FLOW FOR:
• Jobs: J-2025-NNN
• Invoices: INV-2025-NNN
```

---

## Invoice Payment Automation Flow

```
INSERT INTO payments (invoice_id, amount, ...)
       ↓
  TRIGGER: update_invoice_on_payment_insert
       ↓
  ┌─────────────────────────────┐
  │ 1. Get invoice details      │
  │    SELECT total, due_date   │
  │    FROM invoices            │
  │    WHERE id = invoice_id    │
  └─────────────┬───────────────┘
                │
                ▼
  ┌─────────────────────────────┐
  │ 2. Calculate total paid     │
  │    SELECT SUM(amount)       │
  │    FROM payments            │
  │    WHERE invoice_id = ...   │
  └─────────────┬───────────────┘
                │ Returns: total_paid
                ▼
  ┌─────────────────────────────┐
  │ 3. Determine new status     │
  │    IF total_paid = 0:       │
  │      IF due_date < today:   │
  │        status = 'overdue'   │
  │      ELSE:                  │
  │        status = 'sent'      │
  │    ELSIF total_paid >= total:│
  │      status = 'paid'        │
  │    ELSE:                    │
  │      status = 'partially_paid'│
  └─────────────┬───────────────┘
                │
                ▼
  ┌─────────────────────────────┐
  │ 4. Update invoice           │
  │    UPDATE invoices SET      │
  │      amount_paid = total_paid│
  │      status = new_status    │
  │      paid_at = (if fully paid)│
  └─────────────┬───────────────┘
                │
                ▼ IF status = 'paid'
  ┌─────────────────────────────┐
  │ 5. TRIGGER: update_job_on_invoice_paid│
  │    UPDATE jobs SET          │
  │      status = 'paid'        │
  │    WHERE id = invoice.job_id│
  └─────────────────────────────┘

EXAMPLE:
Invoice total: R5,000

Payment 1: R2,000
  → amount_paid: R2,000
  → status: partially_paid

Payment 2: R1,500
  → amount_paid: R3,500
  → status: partially_paid

Payment 3: R1,500
  → amount_paid: R5,000
  → status: paid
  → paid_at: NOW()
  → job.status: paid
```

---

## Indexes Strategy

### Primary Indexes (Automatic)
- Primary keys on all tables (id)
- Unique constraints (public_link, email, etc.)

### Foreign Key Indexes
```sql
-- Every FK gets an index
idx_users_tenant_id
idx_customers_tenant_id
idx_quotes_tenant_id
idx_quotes_customer_id
idx_jobs_tenant_id
idx_jobs_customer_id
idx_invoices_tenant_id
idx_invoices_customer_id
idx_payments_invoice_id
... (40+ total)
```

### Performance Indexes (Composite)
```sql
-- Dashboard queries (tenant + status)
idx_quotes_status (tenant_id, status)
idx_jobs_status (tenant_id, status)
idx_invoices_status (tenant_id, status)

-- Search queries (tenant + name/phone)
idx_customers_name (tenant_id, name)
idx_customers_phone (tenant_id, phone)

-- Date range queries
idx_jobs_scheduled_date (tenant_id, scheduled_date)
idx_invoices_due_date (tenant_id, due_date)

-- Public access (fast lookup)
idx_quotes_public_link (public_link)
idx_invoices_public_link (public_link)
```

### Partial Indexes (Filtered)
```sql
-- Only index active/pending records
CREATE INDEX idx_quotes_status_valid_until
ON quotes (tenant_id, status, valid_until)
WHERE status IN ('sent', 'viewed');

CREATE INDEX idx_invoices_status_due_date
ON invoices (tenant_id, status, due_date)
WHERE status IN ('sent', 'viewed', 'partially_paid', 'overdue');
```

**Result**: Fast queries even with 100,000+ records per tenant

---

## Summary

- **9 Tables**: Multi-tenant architecture with complete RLS
- **8 Enums**: Type-safe status management
- **40+ Indexes**: Optimized for common query patterns
- **15+ Triggers**: Automatic business logic
- **9 Functions**: Complex calculations and automation
- **45+ RLS Policies**: Bulletproof security

**Next Steps**: Use this schema to build the JobKaart application!
