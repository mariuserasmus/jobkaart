-- ============================================================================
-- JobKaart Database Schema - Initial Migration
-- ============================================================================
-- Description: Creates all core tables for multi-tenant job management system
-- Version: 1.0.0
-- Date: 2025-12-02
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Subscription tiers
CREATE TYPE subscription_tier AS ENUM ('starter', 'pro', 'team');

-- Subscription status
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'overdue', 'trial');

-- User roles within a tenant
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'member');

-- Quote status lifecycle
CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired');

-- Job status lifecycle
CREATE TYPE job_status AS ENUM ('quoted', 'scheduled', 'in_progress', 'complete', 'invoiced', 'paid');

-- Invoice status lifecycle
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue');

-- Payment methods
CREATE TYPE payment_method AS ENUM ('cash', 'eft', 'card', 'other');

-- Link tracking types
CREATE TYPE link_type AS ENUM ('quote', 'invoice');

-- ============================================================================
-- TABLE: tenants
-- ============================================================================
-- Purpose: Stores business/organization information (multi-tenant root)
-- Notes: This is the top-level entity - all other tables link to tenant_id
-- ============================================================================

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name TEXT NOT NULL,
    logo_url TEXT,
    vat_number TEXT,
    vat_registered BOOLEAN DEFAULT FALSE,

    -- Banking details stored as JSONB for flexibility
    -- Example: {"bank": "FNB", "account_holder": "John Plumbing", "account_number": "62123456789", "branch_code": "250655", "account_type": "Business Cheque"}
    banking_details JSONB,

    -- Contact information
    phone TEXT,
    email TEXT,
    address TEXT,

    -- Subscription management
    subscription_tier subscription_tier NOT NULL DEFAULT 'starter',
    subscription_status subscription_status NOT NULL DEFAULT 'trial',
    subscription_started_at TIMESTAMP WITH TIME ZONE,
    subscription_ends_at TIMESTAMP WITH TIME ZONE,

    -- PayFast integration
    payfast_subscription_token TEXT,

    -- Usage limits (enforced by application logic)
    monthly_job_limit INTEGER, -- NULL = unlimited

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tenants_subscription_status ON tenants(subscription_status);
CREATE INDEX idx_tenants_created_at ON tenants(created_at DESC);

-- Comments
COMMENT ON TABLE tenants IS 'Top-level tenant/organization table for multi-tenancy';
COMMENT ON COLUMN tenants.banking_details IS 'JSONB: bank, account_holder, account_number, branch_code, account_type';
COMMENT ON COLUMN tenants.monthly_job_limit IS 'NULL means unlimited (Pro/Team plans)';

-- ============================================================================
-- TABLE: users
-- ============================================================================
-- Purpose: Stores user accounts linked to tenants
-- Notes: Links to Supabase auth.users via id. Users belong to one tenant.
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- User information
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,

    -- Role within the tenant
    role user_role NOT NULL DEFAULT 'member',

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Constraints
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);

-- Comments
COMMENT ON TABLE users IS 'User accounts linked to tenants (auth.users foreign key)';
COMMENT ON COLUMN users.id IS 'References Supabase auth.users(id)';
COMMENT ON COLUMN users.role IS 'owner: full access, admin: most features, member: limited';

-- ============================================================================
-- TABLE: customers
-- ============================================================================
-- Purpose: Stores end-customer information for each tenant
-- Notes: Each tenant has their own isolated customer list
-- ============================================================================

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Customer information
    name TEXT NOT NULL,
    phone TEXT NOT NULL, -- Primary contact method for SA tradies
    email TEXT,
    address TEXT,
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX idx_customers_name ON customers(tenant_id, name); -- Search by name within tenant
CREATE INDEX idx_customers_phone ON customers(tenant_id, phone); -- Search by phone within tenant
CREATE INDEX idx_customers_created_at ON customers(tenant_id, created_at DESC);

-- Constraints
-- Prevent duplicate phone numbers within same tenant
CREATE UNIQUE INDEX idx_customers_tenant_phone ON customers(tenant_id, phone);

-- Comments
COMMENT ON TABLE customers IS 'End-customers for each tenant (plumbers customers, electricians customers, etc.)';
COMMENT ON COLUMN customers.phone IS 'Primary contact method - required for WhatsApp integration';

-- ============================================================================
-- TABLE: quote_templates
-- ============================================================================
-- Purpose: Reusable quote templates for common jobs
-- Notes: Helps tradies create quotes faster (e.g., "Standard Bathroom Repair")
-- ============================================================================

CREATE TABLE quote_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Template information
    name TEXT NOT NULL, -- e.g., "Standard Bathroom Repair", "3-Bedroom House Electrical COC"
    description TEXT,

    -- Line items stored as JSONB array
    -- Example: [{"description": "Labour", "quantity": 1, "unit_price": 500}, {"description": "Parts", "quantity": 1, "unit_price": 300}]
    line_items JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Pre-calculated totals (optional, for display)
    default_subtotal DECIMAL(10, 2),
    default_vat_amount DECIMAL(10, 2),
    default_total DECIMAL(10, 2),

    -- Usage tracking
    times_used INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_quote_templates_tenant_id ON quote_templates(tenant_id);
CREATE INDEX idx_quote_templates_name ON quote_templates(tenant_id, name);
CREATE INDEX idx_quote_templates_times_used ON quote_templates(tenant_id, times_used DESC);

-- Comments
COMMENT ON TABLE quote_templates IS 'Reusable quote templates for common jobs';
COMMENT ON COLUMN quote_templates.line_items IS 'JSONB array: [{"description": "...", "quantity": 1, "unit_price": 500}]';

-- ============================================================================
-- TABLE: quotes
-- ============================================================================
-- Purpose: Customer quotes (estimates)
-- Notes: Core feature - quotes sent via WhatsApp, tracked for views/acceptance
-- ============================================================================

CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,

    -- Quote identification
    quote_number TEXT NOT NULL, -- e.g., "Q-2025-001" (auto-generated per tenant)

    -- Line items stored as JSONB array
    -- Example: [{"description": "Labour - Bathroom repair", "quantity": 4, "unit_price": 500}, {"description": "Parts", "quantity": 1, "unit_price": 350}]
    line_items JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Financial calculations
    subtotal DECIMAL(10, 2) NOT NULL,
    vat_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,

    -- Quote metadata
    status quote_status NOT NULL DEFAULT 'draft',
    valid_until DATE, -- Quote expiry date
    notes TEXT, -- Internal notes (not shown to customer)
    terms TEXT, -- Terms & conditions (shown on PDF)

    -- Public sharing (WhatsApp integration)
    public_link TEXT UNIQUE NOT NULL, -- e.g., "abc123xyz" → jobkaart.co.za/q/abc123xyz

    -- Tracking
    viewed_at TIMESTAMP WITH TIME ZONE, -- When customer first viewed
    sent_at TIMESTAMP WITH TIME ZONE, -- When sent via WhatsApp
    accepted_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,

    -- Audit
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_quotes_tenant_id ON quotes(tenant_id);
CREATE INDEX idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX idx_quotes_status ON quotes(tenant_id, status);
CREATE INDEX idx_quotes_quote_number ON quotes(tenant_id, quote_number);
CREATE INDEX idx_quotes_created_at ON quotes(tenant_id, created_at DESC);
CREATE INDEX idx_quotes_public_link ON quotes(public_link); -- For public quote views
CREATE INDEX idx_quotes_valid_until ON quotes(tenant_id, valid_until) WHERE status IN ('sent', 'viewed');

-- Constraints
CREATE UNIQUE INDEX idx_quotes_tenant_quote_number ON quotes(tenant_id, quote_number);

-- Comments
COMMENT ON TABLE quotes IS 'Customer quotes/estimates - sent via WhatsApp, tracked for views';
COMMENT ON COLUMN quotes.quote_number IS 'Auto-generated per tenant (e.g., Q-2025-001)';
COMMENT ON COLUMN quotes.public_link IS 'Unique short code for public URL (jobkaart.co.za/q/xxx)';
COMMENT ON COLUMN quotes.line_items IS 'JSONB array: [{"description": "...", "quantity": 1, "unit_price": 500}]';

-- ============================================================================
-- TABLE: jobs
-- ============================================================================
-- Purpose: Tracks jobs through their lifecycle (quote → scheduled → in progress → complete → invoiced → paid)
-- Notes: Core feature - visual pipeline for job tracking
-- ============================================================================

CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL, -- Nullable: can create job without quote

    -- Job identification
    job_number TEXT NOT NULL, -- e.g., "J-2025-001" (auto-generated per tenant)

    -- Job details
    title TEXT NOT NULL,
    description TEXT,
    status job_status NOT NULL DEFAULT 'quoted',

    -- Scheduling
    scheduled_date DATE,
    scheduled_time TIME,
    estimated_duration_hours DECIMAL(4, 1), -- e.g., 2.5 hours

    -- Completion
    completed_date DATE,

    -- Photos (proof of work)
    -- Example: [{"url": "https://...", "caption": "Before", "timestamp": "2025-12-02T10:30:00Z"}, ...]
    photos JSONB DEFAULT '[]'::jsonb,

    -- Assignment
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Internal notes
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_jobs_tenant_id ON jobs(tenant_id);
CREATE INDEX idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX idx_jobs_quote_id ON jobs(quote_id);
CREATE INDEX idx_jobs_status ON jobs(tenant_id, status);
CREATE INDEX idx_jobs_job_number ON jobs(tenant_id, job_number);
CREATE INDEX idx_jobs_scheduled_date ON jobs(tenant_id, scheduled_date) WHERE scheduled_date IS NOT NULL;
CREATE INDEX idx_jobs_assigned_to ON jobs(assigned_to);
CREATE INDEX idx_jobs_created_at ON jobs(tenant_id, created_at DESC);

-- Constraints
CREATE UNIQUE INDEX idx_jobs_tenant_job_number ON jobs(tenant_id, job_number);

-- Comments
COMMENT ON TABLE jobs IS 'Job tracking through lifecycle: quoted → scheduled → in_progress → complete → invoiced → paid';
COMMENT ON COLUMN jobs.job_number IS 'Auto-generated per tenant (e.g., J-2025-001)';
COMMENT ON COLUMN jobs.photos IS 'JSONB array: [{"url": "...", "caption": "...", "timestamp": "..."}]';
COMMENT ON COLUMN jobs.status IS 'quoted → scheduled → in_progress → complete → invoiced → paid';

-- ============================================================================
-- TABLE: invoices
-- ============================================================================
-- Purpose: Customer invoices (sent after job completion)
-- Notes: Tracks payment status, supports partial payments
-- ============================================================================

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL, -- Nullable: can create invoice without job

    -- Invoice identification
    invoice_number TEXT NOT NULL, -- e.g., "INV-2025-001" (auto-generated per tenant)

    -- Line items stored as JSONB array (usually copied from quote/job)
    line_items JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Financial calculations
    subtotal DECIMAL(10, 2) NOT NULL,
    vat_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Sum of all payments

    -- Invoice metadata
    status invoice_status NOT NULL DEFAULT 'draft',
    due_date DATE NOT NULL,
    notes TEXT, -- Internal notes
    terms TEXT, -- Payment terms (shown on PDF)

    -- Public sharing (WhatsApp/Email integration)
    public_link TEXT UNIQUE NOT NULL, -- e.g., "xyz789abc" → jobkaart.co.za/i/xyz789abc

    -- Tracking
    viewed_at TIMESTAMP WITH TIME ZONE, -- When customer first viewed
    sent_at TIMESTAMP WITH TIME ZONE, -- When sent via WhatsApp/Email
    paid_at TIMESTAMP WITH TIME ZONE, -- When fully paid

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_job_id ON invoices(job_id);
CREATE INDEX idx_invoices_status ON invoices(tenant_id, status);
CREATE INDEX idx_invoices_invoice_number ON invoices(tenant_id, invoice_number);
CREATE INDEX idx_invoices_due_date ON invoices(tenant_id, due_date) WHERE status IN ('sent', 'viewed', 'partially_paid');
CREATE INDEX idx_invoices_public_link ON invoices(public_link); -- For public invoice views
CREATE INDEX idx_invoices_created_at ON invoices(tenant_id, created_at DESC);

-- Constraints
CREATE UNIQUE INDEX idx_invoices_tenant_invoice_number ON invoices(tenant_id, invoice_number);

-- Comments
COMMENT ON TABLE invoices IS 'Customer invoices - sent via WhatsApp/Email, tracks payments';
COMMENT ON COLUMN invoices.invoice_number IS 'Auto-generated per tenant (e.g., INV-2025-001)';
COMMENT ON COLUMN invoices.public_link IS 'Unique short code for public URL (jobkaart.co.za/i/xxx)';
COMMENT ON COLUMN invoices.amount_paid IS 'Sum of all payments (updated via trigger)';
COMMENT ON COLUMN invoices.line_items IS 'JSONB array: [{"description": "...", "quantity": 1, "unit_price": 500}]';

-- ============================================================================
-- TABLE: payments
-- ============================================================================
-- Purpose: Tracks payments against invoices (supports partial payments)
-- Notes: Multiple payments can be recorded per invoice
-- ============================================================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

    -- Payment details
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    payment_method payment_method NOT NULL DEFAULT 'eft',
    payment_date DATE NOT NULL,
    reference TEXT, -- e.g., bank reference, receipt number
    notes TEXT,

    -- Audit
    recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_payment_date ON payments(tenant_id, payment_date DESC);

-- Comments
COMMENT ON TABLE payments IS 'Payment records against invoices (supports partial payments)';
COMMENT ON COLUMN payments.amount IS 'Payment amount (must be > 0)';

-- ============================================================================
-- TABLE: view_tracking
-- ============================================================================
-- Purpose: Tracks when customers view quotes/invoices via public links
-- Notes: Helps tradies know when to follow up
-- ============================================================================

CREATE TABLE view_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- What was viewed
    link_type link_type NOT NULL,
    link_id UUID NOT NULL, -- quote.id or invoice.id

    -- When and from where
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,

    -- Location data (optional, from IP geolocation)
    country_code TEXT,
    city TEXT
);

-- Indexes
CREATE INDEX idx_view_tracking_tenant_id ON view_tracking(tenant_id);
CREATE INDEX idx_view_tracking_link ON view_tracking(link_type, link_id);
CREATE INDEX idx_view_tracking_viewed_at ON view_tracking(viewed_at DESC);

-- Comments
COMMENT ON TABLE view_tracking IS 'Tracks quote/invoice views via public links';
COMMENT ON COLUMN view_tracking.link_type IS 'quote or invoice';
COMMENT ON COLUMN view_tracking.link_id IS 'References quotes.id or invoices.id';

-- ============================================================================
-- TRIGGERS: updated_at timestamps
-- ============================================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quote_templates_updated_at BEFORE UPDATE ON quote_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INDEXES: Performance optimization for common queries
-- ============================================================================

-- Composite indexes for dashboard queries
CREATE INDEX idx_quotes_status_valid_until ON quotes(tenant_id, status, valid_until)
    WHERE status IN ('sent', 'viewed');

CREATE INDEX idx_jobs_status_scheduled ON jobs(tenant_id, status, scheduled_date)
    WHERE status IN ('scheduled', 'in_progress');

CREATE INDEX idx_invoices_status_due_date ON invoices(tenant_id, status, due_date)
    WHERE status IN ('sent', 'viewed', 'partially_paid', 'overdue');

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
