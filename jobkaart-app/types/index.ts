/**
 * Core TypeScript type definitions for JobKaart
 */

// Enums
export type SubscriptionTier = 'starter' | 'pro' | 'team'
export type SubscriptionStatus = 'active' | 'cancelled' | 'overdue'
export type UserRole = 'owner' | 'admin' | 'member'
export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired'
export type JobStatus = 'quoted' | 'scheduled' | 'in_progress' | 'complete' | 'invoiced' | 'paid'
export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'partially_paid' | 'paid' | 'overdue'
export type PaymentMethod = 'cash' | 'eft' | 'card' | 'other'
export type LinkType = 'quote' | 'invoice'

// Database Types
export interface Tenant {
  id: string
  business_name: string
  logo_url?: string
  vat_number?: string
  banking_details?: {
    bank_name: string
    account_holder: string
    account_number: string
    branch_code: string
  }
  subscription_tier: SubscriptionTier
  subscription_status: SubscriptionStatus
  created_at: string
}

export interface User {
  id: string
  tenant_id: string
  email: string
  full_name: string
  role: UserRole
  created_at: string
}

export interface Customer {
  id: string
  tenant_id: string
  name: string
  phone: string
  email?: string
  address?: string
  notes?: string
  created_at: string
}

export interface LineItem {
  description: string
  quantity: number
  unit_price: number
  total?: number
}

export interface Quote {
  id: string
  tenant_id: string
  customer_id: string
  quote_number: string
  line_items: LineItem[]
  subtotal: number
  vat_amount: number
  total: number
  status: QuoteStatus
  valid_until: string
  notes?: string
  terms_and_conditions?: string
  public_link: string
  viewed_at?: string
  sent_at?: string
  accepted_at?: string
  rejected_at?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface QuoteWithDetails extends Quote {
  customers?: Customer
}

export interface JobPhoto {
  url: string
  caption?: string
  timestamp: string
}

export interface Job {
  id: string
  tenant_id: string
  customer_id: string
  quote_id?: string
  job_number: string
  title: string
  description: string
  status: JobStatus
  scheduled_date?: string
  completed_date?: string
  photos?: JobPhoto[]
  assigned_to?: string
  created_at: string
}

export interface Invoice {
  id: string
  tenant_id: string
  customer_id: string
  job_id?: string
  invoice_number: string
  line_items: LineItem[]
  subtotal: number
  vat_amount: number
  total: number
  amount_paid: number
  status: InvoiceStatus
  due_date: string
  sent_at?: string
  paid_at?: string
  public_link: string
  created_at: string
}

export interface Payment {
  id: string
  tenant_id: string
  invoice_id: string
  amount: number
  payment_method: PaymentMethod
  payment_date: string
  reference?: string
  created_at: string
}

export interface QuoteTemplate {
  id: string
  tenant_id: string
  name: string
  description?: string
  line_items: LineItem[]
  default_subtotal?: number
  default_vat_amount?: number
  default_total?: number
  notes?: string
  terms?: string
  times_used: number
  last_used_at?: string
  created_at: string
  updated_at: string
}

export interface ViewTracking {
  id: string
  tenant_id: string
  link_type: LinkType
  link_id: string
  viewed_at: string
  ip_address?: string
  user_agent?: string
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

// Dashboard Types
export interface DashboardStats {
  revenue_collected: number
  jobs_completed: number
  quotes_sent: number
  quote_acceptance_rate: number
  customers_owe: number
  month_comparison: number
}

export interface ActionItem {
  id: string
  type: 'quote_followup' | 'job_to_invoice' | 'overdue_invoice'
  title: string
  description: string
  amount?: number
  date: string
}

export interface TodayJob {
  id: string
  customer_name: string
  address: string
  time?: string
  notes?: string
}

// Customer History Types
export interface CustomerHistory {
  quotes: Quote[]
  jobs: Job[]
  invoices: Invoice[]
  total_paid: number
  total_outstanding: number
}
