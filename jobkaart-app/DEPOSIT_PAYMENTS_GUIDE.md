# Deposit Payments Implementation Guide

## Overview

This guide explains how to use the deposit payment feature in JobKaart. The system supports three types of invoices:
- **Full Invoice**: Complete payment for a job (standard invoice)
- **Deposit Invoice**: Upfront payment before work begins (e.g., 50% deposit)
- **Balance Invoice**: Remaining payment after job completion (automatically deducts deposit)

## Database Schema

### New Fields in `invoices` Table

| Field | Type | Description |
|-------|------|-------------|
| `invoice_type` | ENUM | 'full', 'deposit', or 'balance' |
| `parent_invoice_id` | UUID | Links balance invoices to their deposit invoice |
| `deposit_percentage` | DECIMAL(5,2) | Percentage for deposit (e.g., 50.00 = 50%) |
| `deposit_amount` | DECIMAL(10,2) | Calculated deposit amount |

## Workflow

### Scenario: Job with 50% Deposit

**Step 1: Create Quote**
- Quote total: R10,000
- Customer accepts quote

**Step 2: Create Deposit Invoice (when scheduling job)**
```typescript
const depositInvoice = {
  customer_id: '<customer_id>',
  job_id: '<job_id>',
  invoice_type: 'deposit',
  deposit_percentage: 50.00,
  deposit_amount: 5000.00,
  total: 5000.00,
  line_items: [
    {
      description: 'Deposit for Plumbing Repair (50%)',
      quantity: 1,
      unit_price: 5000.00
    }
  ],
  // ... other fields
}
```

**Step 3: Customer Pays Deposit**
- Customer receives deposit invoice via WhatsApp
- Pays R5,000
- Invoice status → 'paid'

**Step 4: Complete Job**
- Work is done
- Job photos uploaded
- Job status → 'complete'

**Step 5: Create Balance Invoice**
```typescript
const balanceInvoice = {
  customer_id: '<customer_id>',
  job_id: '<job_id>',
  invoice_type: 'balance',
  parent_invoice_id: '<deposit_invoice_id>',
  total: 5000.00,  // Remaining amount
  line_items: [
    {
      description: 'Balance due for Plumbing Repair',
      quantity: 1,
      unit_price: 5000.00
    },
    {
      description: 'Less: Deposit paid (INV-2025-001)',
      quantity: 1,
      unit_price: -5000.00  // Negative to show deduction
    },
    {
      description: 'Final balance due',
      quantity: 1,
      unit_price: 5000.00
    }
  ],
  // ... other fields
}
```

**Step 6: Customer Pays Balance**
- Customer pays remaining R5,000
- Job status → 'paid'

## UI Components to Update

### 1. Job Detail Page - Add Deposit Invoice Button

```tsx
// In job detail page when status is 'scheduled'
{job.status === 'scheduled' && !hasDepositInvoice && (
  <Button onClick={() => setShowDepositModal(true)}>
    Request Deposit Payment
  </Button>
)}
```

### 2. Deposit Invoice Modal

```tsx
interface DepositModalProps {
  job: Job
  quote: Quote
  onCreateDeposit: (percentage: number) => Promise<void>
}

function DepositInvoiceModal({ job, quote, onCreateDeposit }: DepositModalProps) {
  const [percentage, setPercentage] = useState(50)
  const depositAmount = (quote.total * percentage) / 100

  return (
    <Modal>
      <h3>Request Deposit Payment</h3>

      <Label>Deposit Percentage</Label>
      <select value={percentage} onChange={(e) => setPercentage(Number(e.target.value))}>
        <option value={25}>25% (R{(quote.total * 0.25).toFixed(2)})</option>
        <option value={30}>30% (R{(quote.total * 0.30).toFixed(2)})</option>
        <option value={50}>50% (R{(quote.total * 0.50).toFixed(2)})</option>
        <option value={100}>100% (Full payment upfront)</option>
      </select>

      <div className="summary">
        <p>Quote Total: R{quote.total.toFixed(2)}</p>
        <p>Deposit Amount: R{depositAmount.toFixed(2)}</p>
        <p>Balance Due After: R{(quote.total - depositAmount).toFixed(2)}</p>
      </div>

      <Button onClick={() => onCreateDeposit(percentage)}>
        Create Deposit Invoice
      </Button>
    </Modal>
  )
}
```

### 3. Invoice List - Show Invoice Type Badge

```tsx
{invoice.invoice_type === 'deposit' && (
  <Badge color="blue">Deposit ({invoice.deposit_percentage}%)</Badge>
)}
{invoice.invoice_type === 'balance' && (
  <Badge color="green">Balance Payment</Badge>
)}
```

### 4. Job Completion - Auto-suggest Balance Invoice

```tsx
// When marking job as complete, check for deposit
if (hasDepositInvoice && depositInvoice.status === 'paid') {
  showBalanceInvoicePrompt({
    message: `This job had a R${depositInvoice.total} deposit paid. Create final balance invoice?`,
    totalRemaining: quote.total - depositInvoice.total
  })
}
```

## API Endpoints to Create

### POST `/api/invoices/deposit`

Creates a deposit invoice for a job.

**Request:**
```json
{
  "job_id": "uuid",
  "deposit_percentage": 50.00
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "invoice_id": "uuid",
    "invoice_number": "INV-2025-042",
    "deposit_amount": 5000.00,
    "total": 5000.00
  }
}
```

### POST `/api/invoices/balance`

Creates a balance invoice after job completion, automatically deducting deposit.

**Request:**
```json
{
  "job_id": "uuid",
  "deposit_invoice_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "invoice_id": "uuid",
    "invoice_number": "INV-2025-043",
    "deposit_deducted": 5000.00,
    "balance_due": 5000.00,
    "total": 5000.00
  }
}
```

## Database Queries

### Get all invoices for a job (including deposit + balance)

```sql
SELECT
  i.*,
  CASE
    WHEN i.invoice_type = 'deposit' THEN 'Deposit (' || i.deposit_percentage || '%)'
    WHEN i.invoice_type = 'balance' THEN 'Balance Payment'
    ELSE 'Full Payment'
  END as invoice_type_label
FROM invoices i
WHERE i.job_id = '<job_id>'
ORDER BY i.created_at ASC;
```

### Get deposit invoice for a balance invoice

```sql
SELECT d.*
FROM invoices d
JOIN invoices b ON b.parent_invoice_id = d.id
WHERE b.id = '<balance_invoice_id>';
```

### Calculate total paid for a job (deposit + balance)

```sql
SELECT
  SUM(i.amount_paid) as total_paid,
  SUM(i.total) as total_invoiced
FROM invoices i
WHERE i.job_id = '<job_id>';
```

## Invoice PDF Template Updates

When generating PDF for balance invoices, show deposit deduction:

```
INVOICE INV-2025-043
Balance Payment

Job: Plumbing Repair
Customer: John Smith

ITEMS:
- Final payment for services rendered    R10,000.00
- Less: Deposit paid (INV-2025-042)      -R 5,000.00
                                         ──────────
AMOUNT DUE:                              R 5,000.00
```

## Validation Rules

1. **Deposit invoices**:
   - `deposit_percentage` must be between 1 and 100
   - `deposit_amount` must be calculated as `(total * deposit_percentage / 100)`
   - `total` must equal `deposit_amount`
   - `invoice_type` must be 'deposit'

2. **Balance invoices**:
   - Must have a valid `parent_invoice_id` pointing to a deposit invoice
   - `invoice_type` must be 'balance'
   - `total` should be `(job_total - deposit_paid)`
   - Cannot create balance invoice if deposit isn't paid

3. **Full invoices**:
   - Default type when no deposit needed
   - `deposit_percentage`, `deposit_amount`, `parent_invoice_id` should all be NULL

## Migration

Run the migration to add deposit support:

```bash
# Run migration
supabase db push

# Or apply manually
psql -h <host> -U <user> -d <database> -f supabase/migrations/00014_add_deposit_invoice_support.sql
```

## Benefits

### For Tradies
- **Cash Flow**: Get money upfront before buying materials
- **Commitment**: Customers who pay deposits are less likely to cancel
- **Risk Reduction**: Less risk of doing work and not getting paid
- **Professional**: Shows organized business practices

### For Customers
- **Trust**: Clear breakdown of deposit vs final payment
- **Transparency**: See exactly what they're paying for
- **Flexibility**: Can pay in installments

## Common Use Cases

### 1. Large Job Requiring Materials (50% deposit)
- Plumber needs R10,000 in parts
- Asks for 50% deposit before ordering
- Customer pays R5,000 upfront
- Final R5,000 after job complete

### 2. Small Jobs (30% deposit)
- Electrician doing R3,000 repair
- Asks for 30% (R900) deposit to confirm booking
- Final R2,100 on completion

### 3. Very Large Projects (Milestone Payments)
- R50,000 renovation
- 30% (R15,000) deposit to start
- Can create multiple balance invoices for different phases
- Final invoice for remaining amount

## Next Steps

1. ✅ **Database Migration**: Run `00014_add_deposit_invoice_support.sql`
2. ✅ **TypeScript Types**: Updated with `InvoiceType` enum
3. ⏳ **API Endpoints**: Create `/api/invoices/deposit` and `/api/invoices/balance`
4. ⏳ **UI Components**: Add deposit modal and balance invoice creation
5. ⏳ **PDF Template**: Update to show deposit deduction on balance invoices
6. ⏳ **Job Workflow**: Integrate deposit requests into job scheduling

## Testing Checklist

- [ ] Create deposit invoice with 50% deposit
- [ ] Verify deposit amount calculates correctly
- [ ] Pay deposit invoice
- [ ] Create balance invoice after job completion
- [ ] Verify balance invoice shows deposit deduction
- [ ] Pay balance invoice
- [ ] Verify job shows as fully paid
- [ ] Test with different deposit percentages (25%, 30%, 100%)
- [ ] Test full invoice (no deposit) still works
- [ ] Verify PDF generation for both invoice types

---

**Document Version**: 1.0.0
**Date**: 2025-12-06
**Status**: Design Complete - Ready for Implementation
