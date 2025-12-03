# JobKaart - Technical Architecture

## Overview
This document defines the technical architecture for JobKaart MVP, including all layers, technologies, and specialist agent responsibilities.

---

## Tech Stack Summary

| Layer | Technology | Justification |
|-------|-----------|---------------|
| **Frontend** | Next.js 14 (App Router) + React | Server components, built-in API routes, optimal for SEO |
| **UI Framework** | Tailwind CSS + shadcn/ui | Rapid development, mobile-first, professional components |
| **Backend** | Next.js API Routes (Node.js) | Unified codebase, easier deployment, type safety with TypeScript |
| **Database** | PostgreSQL (via Supabase) | Relational data, free tier, row-level security for multi-tenancy |
| **Auth** | Supabase Auth | Built-in, JWT tokens, multi-tenant support |
| **Storage** | Supabase Storage | PDF storage, logo uploads |
| **Payments** | PayFast API | SA-specific, supports EFT + cards |
| **PDF Generation** | @react-pdf/renderer | React components → PDF, customizable templates |
| **Email** | SendGrid | Free tier (100/day), reliable delivery |
| **Hosting** | Afrihost | SA-based hosting, local support |
| **Version Control** | Git + GitHub | Standard |

---

## Specialist Agent Responsibilities

### 1️⃣ Frontend Agent (React/Next.js)
**Responsibilities:**
- Build all user-facing pages and components
- Implement responsive, mobile-first layouts
- Create reusable UI components
- Handle client-side state management
- Implement forms with validation
- Optimize for SA tradie usability (large buttons, clear labels)

**Key Files/Folders:**
- `app/` - Next.js app router pages
- `components/` - Reusable React components
- `hooks/` - Custom React hooks
- `lib/client-utils.ts` - Client-side utilities

**Technologies:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui components

---

### 2️⃣ Backend Agent (API/Business Logic)
**Responsibilities:**
- Design and build RESTful API endpoints
- Implement business logic (quote calculations, job status transitions)
- Handle third-party integrations (PayFast, SendGrid)
- Implement data validation and error handling
- Create API middleware (auth, logging, rate limiting)

**Key Files/Folders:**
- `app/api/` - Next.js API routes
- `lib/services/` - Business logic services
- `lib/integrations/` - Third-party API wrappers
- `lib/validations/` - Zod schemas for validation

**Technologies:**
- Next.js API Routes
- TypeScript
- Zod (validation)
- PayFast SDK
- SendGrid SDK

---

### 3️⃣ Database Agent (Schema & Data)
**Responsibilities:**
- Design multi-tenant database schema
- Create migrations and seed data
- Implement row-level security (RLS) policies
- Optimize queries and indexes
- Design data relationships and constraints

**Key Files/Folders:**
- `supabase/migrations/` - Database migrations
- `supabase/seed.sql` - Sample data for development
- `lib/db/` - Database query utilities
- `types/database.types.ts` - TypeScript types from DB

**Technologies:**
- PostgreSQL 15
- Supabase (managed Postgres)
- Prisma (optional, for type-safe queries)

---

### 4️⃣ UI/UX Agent (Design & Components)
**Responsibilities:**
- Design user flows for each feature
- Create component library (buttons, forms, cards, modals)
- Ensure mobile-first, tradie-friendly design
- Implement color-coded job statuses
- Design PDF templates (quotes, invoices)

**Key Files/Folders:**
- `components/ui/` - shadcn/ui base components
- `components/features/` - Feature-specific components
- `styles/` - Global styles, theme configuration
- `templates/` - PDF templates

**Technologies:**
- shadcn/ui
- Tailwind CSS
- Radix UI (primitives)
- Lucide React (icons)
- @react-pdf/renderer

---

### 5️⃣ DevOps/Infrastructure Agent
**Responsibilities:**
- Set up project structure and configuration
- Configure Afrihost deployment
- Set up Supabase project and environment variables
- Implement CI/CD pipelines
- Configure domains and SSL
- Set up monitoring and error tracking

**Key Files/Folders:**
- `ecosystem.config.js` - PM2 configuration for Node.js deployment
- `.env.local` - Local environment variables
- `.env.production` - Production env vars (on Afrihost server)
- `package.json` - Dependencies and scripts
- `.github/workflows/` - GitHub Actions for CI/CD

**Technologies:**
- Afrihost hosting
- PM2 (process manager)
- Supabase CLI
- GitHub
- Environment variable management

---

### 6️⃣ Integration Agent (Third-Party Services)
**Responsibilities:**
- PayFast payment integration (subscription billing)
- WhatsApp click-to-chat implementation
- SendGrid email sending
- PDF generation and storage
- Link tracking for quote views

**Key Files/Folders:**
- `lib/integrations/payfast.ts` - PayFast API wrapper
- `lib/integrations/sendgrid.ts` - Email service
- `lib/integrations/whatsapp.ts` - WhatsApp link generator
- `lib/pdf/` - PDF generation utilities

**Technologies:**
- PayFast API
- SendGrid API
- @react-pdf/renderer
- Supabase Storage

---

## Database Schema (Multi-Tenant)

### Core Principle: Row-Level Security (RLS)
Every table has a `tenant_id` (except `tenants` table itself). All queries filter by tenant_id automatically via RLS policies.

### Tables Overview

```sql
-- TENANTS (Organizations/Businesses)
tenants
  - id (uuid, pk)
  - business_name (text)
  - logo_url (text, nullable)
  - vat_number (text, nullable)
  - banking_details (jsonb)
  - subscription_tier (enum: starter, pro, team)
  - subscription_status (enum: active, cancelled, overdue)
  - created_at (timestamp)

-- USERS (Tenant members)
users
  - id (uuid, pk, references auth.users)
  - tenant_id (uuid, fk → tenants.id)
  - email (text)
  - full_name (text)
  - role (enum: owner, admin, member)
  - created_at (timestamp)

-- CUSTOMERS (End customers)
customers
  - id (uuid, pk)
  - tenant_id (uuid, fk → tenants.id)
  - name (text)
  - phone (text)
  - email (text, nullable)
  - address (text, nullable)
  - notes (text, nullable)
  - created_at (timestamp)

-- QUOTES
quotes
  - id (uuid, pk)
  - tenant_id (uuid, fk → tenants.id)
  - customer_id (uuid, fk → customers.id)
  - quote_number (text, unique per tenant)
  - line_items (jsonb) -- [{ description, quantity, unit_price }]
  - subtotal (decimal)
  - vat_amount (decimal)
  - total (decimal)
  - status (enum: draft, sent, viewed, accepted, rejected)
  - valid_until (date)
  - public_link (text, unique) -- For WhatsApp sharing
  - viewed_at (timestamp, nullable)
  - sent_at (timestamp, nullable)
  - created_by (uuid, fk → users.id)
  - created_at (timestamp)

-- JOBS
jobs
  - id (uuid, pk)
  - tenant_id (uuid, fk → tenants.id)
  - customer_id (uuid, fk → customers.id)
  - quote_id (uuid, fk → quotes.id, nullable)
  - job_number (text, unique per tenant)
  - title (text)
  - description (text)
  - status (enum: quoted, scheduled, in_progress, complete, invoiced, paid)
  - scheduled_date (date, nullable)
  - completed_date (date, nullable)
  - photos (jsonb) -- [{ url, caption, timestamp }]
  - assigned_to (uuid, fk → users.id, nullable)
  - created_at (timestamp)

-- INVOICES
invoices
  - id (uuid, pk)
  - tenant_id (uuid, fk → tenants.id)
  - customer_id (uuid, fk → customers.id)
  - job_id (uuid, fk → jobs.id, nullable)
  - invoice_number (text, unique per tenant)
  - line_items (jsonb)
  - subtotal (decimal)
  - vat_amount (decimal)
  - total (decimal)
  - amount_paid (decimal, default 0)
  - status (enum: draft, sent, viewed, partially_paid, paid, overdue)
  - due_date (date)
  - sent_at (timestamp, nullable)
  - paid_at (timestamp, nullable)
  - public_link (text, unique)
  - created_at (timestamp)

-- PAYMENTS (Track partial payments)
payments
  - id (uuid, pk)
  - tenant_id (uuid, fk → tenants.id)
  - invoice_id (uuid, fk → invoices.id)
  - amount (decimal)
  - payment_method (enum: cash, eft, card, other)
  - payment_date (date)
  - reference (text, nullable)
  - created_at (timestamp)

-- QUOTE_TEMPLATES
quote_templates
  - id (uuid, pk)
  - tenant_id (uuid, fk → tenants.id)
  - name (text) -- e.g., "Standard Bathroom Repair"
  - line_items (jsonb)
  - created_at (timestamp)

-- VIEW_TRACKING (Track when quotes/invoices are viewed)
view_tracking
  - id (uuid, pk)
  - tenant_id (uuid, fk → tenants.id)
  - link_type (enum: quote, invoice)
  - link_id (uuid) -- quote.id or invoice.id
  - viewed_at (timestamp)
  - ip_address (text, nullable)
  - user_agent (text, nullable)
```

---

## API Endpoints Structure

### Authentication
- `POST /api/auth/signup` - Register new tenant + owner
- `POST /api/auth/login` - Login (handled by Supabase)
- `POST /api/auth/logout` - Logout

### Customers
- `GET /api/customers` - List all customers (paginated)
- `GET /api/customers/:id` - Get customer details + history
- `POST /api/customers` - Create customer
- `PATCH /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Quotes
- `GET /api/quotes` - List quotes (filter by status)
- `GET /api/quotes/:id` - Get quote details
- `POST /api/quotes` - Create quote
- `PATCH /api/quotes/:id` - Update quote
- `POST /api/quotes/:id/send` - Send via WhatsApp
- `GET /api/quotes/:id/pdf` - Generate PDF
- `POST /api/quotes/:id/accept` - Convert to job
- `GET /q/:public_link` - Public quote view (tracks view)

### Jobs
- `GET /api/jobs` - List jobs (filter by status, date)
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs` - Create job manually
- `PATCH /api/jobs/:id` - Update job (status, notes, etc.)
- `POST /api/jobs/:id/photos` - Upload photos
- `DELETE /api/jobs/:id` - Delete job

### Invoices
- `GET /api/invoices` - List invoices (filter by status)
- `GET /api/invoices/:id` - Get invoice details
- `POST /api/invoices` - Create invoice from job
- `PATCH /api/invoices/:id` - Update invoice
- `POST /api/invoices/:id/send` - Send via WhatsApp/email
- `GET /api/invoices/:id/pdf` - Generate PDF
- `POST /api/invoices/:id/payments` - Record payment
- `GET /i/:public_link` - Public invoice view (tracks view)

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard metrics
- `GET /api/dashboard/today` - Jobs scheduled for today
- `GET /api/dashboard/actions` - Action items (follow-ups, overdue)

### Templates
- `GET /api/templates` - List quote templates
- `POST /api/templates` - Create template
- `DELETE /api/templates/:id` - Delete template

### Payments (Subscriptions)
- `POST /api/payments/subscribe` - Initiate PayFast subscription
- `POST /api/payments/webhook` - PayFast webhook (ITN)
- `GET /api/payments/status` - Check subscription status

---

## Folder Structure

```
jobkaart/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Auth routes (login, signup)
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/              # Main app (requires auth)
│   │   ├── dashboard/
│   │   ├── customers/
│   │   ├── quotes/
│   │   ├── jobs/
│   │   ├── invoices/
│   │   └── settings/
│   ├── api/                      # API routes
│   │   ├── auth/
│   │   ├── customers/
│   │   ├── quotes/
│   │   ├── jobs/
│   │   ├── invoices/
│   │   ├── dashboard/
│   │   └── payments/
│   ├── q/[link]/                 # Public quote view
│   ├── i/[link]/                 # Public invoice view
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
│
├── components/
│   ├── ui/                       # shadcn/ui base components
│   ├── features/                 # Feature-specific components
│   │   ├── customers/
│   │   ├── quotes/
│   │   ├── jobs/
│   │   ├── invoices/
│   │   └── dashboard/
│   └── layout/                   # Layout components (nav, sidebar)
│
├── lib/
│   ├── db/                       # Database utilities
│   │   └── supabase.ts
│   ├── services/                 # Business logic
│   │   ├── quotes.service.ts
│   │   ├── jobs.service.ts
│   │   ├── invoices.service.ts
│   │   └── customers.service.ts
│   ├── integrations/             # Third-party APIs
│   │   ├── payfast.ts
│   │   ├── sendgrid.ts
│   │   └── whatsapp.ts
│   ├── pdf/                      # PDF generation
│   │   ├── quote-template.tsx
│   │   └── invoice-template.tsx
│   ├── validations/              # Zod schemas
│   └── utils.ts                  # General utilities
│
├── supabase/
│   ├── migrations/               # Database migrations
│   └── seed.sql                  # Sample data
│
├── types/
│   ├── database.types.ts         # Generated from Supabase
│   └── index.ts                  # Custom types
│
├── public/                       # Static assets
│   └── logo.png
│
├── styles/
│   └── globals.css               # Global styles + Tailwind
│
├── .env.local                    # Local environment variables
├── .env.production               # Production env (on Afrihost)
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── ecosystem.config.js           # PM2 config for Afrihost
└── package.json
```

---

## Development Workflow

### Phase 1: Setup (Week 1)
1. **DevOps Agent**: Initialize Next.js project, install dependencies
2. **DevOps Agent**: Set up Supabase project, configure auth
3. **Database Agent**: Create database schema and migrations
4. **UI Agent**: Install shadcn/ui, configure Tailwind, create base components

### Phase 2: Authentication (Week 1-2)
1. **Backend Agent**: Implement auth API routes
2. **Frontend Agent**: Build login/signup pages
3. **Database Agent**: Set up RLS policies for multi-tenancy

### Phase 3: Core Features (Week 2-6)
**For each feature (Customer DB, Quotes, Jobs, Invoices, Dashboard):**
1. **Database Agent**: Ensure tables and relationships are correct
2. **Backend Agent**: Build API endpoints and business logic
3. **Frontend Agent**: Build UI pages and forms
4. **UI Agent**: Design components and user flows
5. **Integration Agent**: Add third-party integrations as needed

### Phase 4: Integrations (Week 6-7)
1. **Integration Agent**: PayFast subscription setup
2. **Integration Agent**: PDF generation for quotes/invoices
3. **Integration Agent**: WhatsApp click-to-chat implementation
4. **Integration Agent**: SendGrid email setup

### Phase 5: Testing & Deployment (Week 7-8)
1. **All Agents**: Bug fixes and refinements
2. **DevOps Agent**: Deploy to Afrihost, configure production environment
3. **DevOps Agent**: Set up monitoring and error tracking

---

## Environment Variables

### Development (.env.local)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# PayFast (Sandbox)
PAYFAST_MERCHANT_ID=sandbox-merchant-id
PAYFAST_MERCHANT_KEY=sandbox-merchant-key
PAYFAST_PASSPHRASE=sandbox-passphrase
NEXT_PUBLIC_PAYFAST_URL=https://sandbox.payfast.co.za/eng/process

# SendGrid
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=hello@jobkaart.co.za

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production (.env.production on Afrihost)
Same variables but with production values.

---

## Afrihost Deployment Setup

### Server Requirements
- Node.js 18+ (LTS)
- PM2 (process manager)
- Nginx (reverse proxy)
- SSL certificate (Let's Encrypt)

### PM2 Configuration (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'jobkaart',
    script: 'npm',
    args: 'start',
    cwd: '/home/jobkaart/app',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name jobkaart.co.za www.jobkaart.co.za;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name jobkaart.co.za www.jobkaart.co.za;

    ssl_certificate /etc/letsencrypt/live/jobkaart.co.za/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jobkaart.co.za/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Deployment Process
1. Push code to GitHub
2. SSH into Afrihost server
3. Pull latest changes: `git pull origin main`
4. Install dependencies: `npm install --production`
5. Build application: `npm run build`
6. Restart PM2: `pm2 restart jobkaart`
7. Check status: `pm2 status`

### Automated Deployment (Optional)
Set up GitHub Actions to auto-deploy on push to main:
```yaml
# .github/workflows/deploy.yml
name: Deploy to Afrihost
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.AFRIHOST_HOST }}
          username: ${{ secrets.AFRIHOST_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /home/jobkaart/app
            git pull origin main
            npm install --production
            npm run build
            pm2 restart jobkaart
```

---

## Multi-Tenant Security (RLS)

### Row-Level Security (RLS) Policies

Every table must have RLS enabled with these policies:

```sql
-- Example for customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tenant's customers
CREATE POLICY "Users can view own tenant customers"
ON customers FOR SELECT
USING (tenant_id = auth.jwt() ->> 'tenant_id');

-- Users can only insert customers for their own tenant
CREATE POLICY "Users can insert own tenant customers"
ON customers FOR INSERT
WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');

-- Similar policies for UPDATE and DELETE
```

### How It Works:
1. User logs in via Supabase Auth
2. JWT token includes `tenant_id` claim
3. All database queries automatically filter by `tenant_id`
4. No way for one tenant to access another tenant's data

---

## Key Design Decisions

### Why Next.js (not separate React + Node.js)?
- **Unified codebase**: One repo, one deployment
- **Type safety**: Share types between frontend and backend
- **Simpler deployment**: Single application to deploy to Afrihost
- **Built-in API routes**: No need for separate Express server
- **Server components**: Better performance, less client JS

### Why Supabase (not raw PostgreSQL)?
- **Free tier**: Perfect for MVP
- **Built-in auth**: Save weeks of work
- **Row-level security**: Multi-tenancy handled at DB level
- **File storage**: For PDFs and logos
- **Realtime (future)**: Can add live updates later

### Why PayFast (not Stripe)?
- **SA-specific**: Supports EFT, SA cards
- **Lower fees**: Better for SA market
- **Local support**: Easier for SA customers

### Why shadcn/ui (not MUI or Chakra)?
- **Copy-paste components**: Own the code, customize freely
- **Tailwind-based**: Consistent with project styling
- **No runtime overhead**: Just React + Tailwind
- **Beautiful defaults**: Looks professional out of the box

### Why Afrihost (not Vercel/Netlify)?
- **SA-based**: Local hosting for SA market
- **Full control**: Access to server, PM2, Nginx
- **Cost-effective**: Flat hosting fee vs per-function pricing
- **Local support**: Afrihost support team in SA timezone

---

## Success Metrics

### Technical Metrics
- **Page load time**: < 2 seconds on 3G
- **Time to first quote**: < 5 minutes for new user
- **API response time**: < 200ms for most endpoints
- **Mobile usability score**: > 90 (Google Lighthouse)
- **Uptime**: > 99.5%

### Business Metrics (tracked in dashboard)
- **Quote-to-job conversion rate**: Target > 40%
- **Average days quote → job**: Target < 7 days
- **Average days invoice → payment**: Target < 14 days
- **User retention**: > 80% after 3 months

---

## Next Steps

1. **DevOps Agent**: Initialize project structure
2. **Database Agent**: Create Supabase project and initial schema
3. **UI Agent**: Set up component library and design system
4. **Backend Agent**: Build authentication system
5. **Frontend Agent**: Build first feature (Customer Database)

---

**Document Owner**: Architecture Team
**Last Updated**: December 2025
**Status**: Draft → Ready for Implementation
