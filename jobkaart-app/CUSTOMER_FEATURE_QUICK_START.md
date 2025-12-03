# Customer Database Feature - Quick Start Guide

## For Developers

### Running the Feature

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to customers**:
   - Open browser: `http://localhost:3000/customers`
   - Login with your test account
   - You should see the customer list page

### File Structure

```
Customer Database Feature Files
├── API Routes (app/api/customers/)
│   ├── route.ts              # List & Create
│   └── [id]/route.ts         # Get, Update, Delete
│
├── Pages (app/(dashboard)/customers/)
│   ├── page.tsx              # /customers (list)
│   ├── new/page.tsx          # /customers/new (add)
│   ├── [id]/page.tsx         # /customers/:id (detail)
│   └── [id]/edit/page.tsx    # /customers/:id/edit (edit)
│
└── Components (components/features/customers/)
    ├── CustomerList.tsx      # Search & list display
    ├── CustomerCard.tsx      # Customer overview card
    ├── CustomerForm.tsx      # Add/edit form
    └── CustomerHistory.tsx   # Activity timeline
```

### Common Tasks

#### Add a New Field to Customer

1. **Update the database schema** (if needed):
   ```sql
   ALTER TABLE customers ADD COLUMN new_field TEXT;
   ```

2. **Update TypeScript types** (`types/index.ts`):
   ```typescript
   export interface Customer {
     // ... existing fields
     new_field?: string
   }
   ```

3. **Update the API routes**:
   - Add to POST/PATCH handlers in `app/api/customers/route.ts`
   - Add to GET response in `app/api/customers/[id]/route.ts`

4. **Update the form** (`components/features/customers/CustomerForm.tsx`):
   ```typescript
   const [formData, setFormData] = useState({
     // ... existing fields
     new_field: customer?.new_field || '',
   })
   ```

5. **Update the display** (`components/features/customers/CustomerCard.tsx`):
   ```tsx
   {customer.new_field && (
     <p>New Field: {customer.new_field}</p>
   )}
   ```

#### Customize WhatsApp Message

In `CustomerList.tsx` or `CustomerCard.tsx`:

```typescript
const handleWhatsApp = (phone: string, name: string) => {
  // Customize this message
  const message = encodeURIComponent(`Hi ${name}, this is [Your Business Name]...`)
  const cleanPhone = phone.replace(/\D/g, '')
  window.open(`https://wa.me/27${cleanPhone.substring(1)}?text=${message}`, '_blank')
}
```

#### Add Custom Search Filters

In `app/api/customers/route.ts`:

```typescript
// Add new query parameter
const city = searchParams.get('city')

// Add to query
if (city) {
  query = query.ilike('address', `%${city}%`)
}
```

In `CustomerList.tsx`:

```typescript
// Add city filter dropdown
const [city, setCity] = useState('')

// Update fetch call
const params = new URLSearchParams()
if (search) params.set('search', search)
if (city) params.set('city', city)
```

#### Change Pagination Limit

In `app/api/customers/route.ts`:

```typescript
// Change default from 50 to 100
const limit = parseInt(searchParams.get('limit') || '100')
```

### Testing

#### Manual Testing Checklist

```bash
# 1. Add a customer
- Go to /customers/new
- Fill in: Name, Phone (required)
- Click "Add Customer"
- Should redirect to customer detail page

# 2. Search for customer
- Go to /customers
- Type name in search box
- Should filter results instantly

# 3. Edit customer
- Click customer name
- Click "Edit" button
- Change details
- Click "Save Changes"
- Should redirect back to detail page

# 4. View customer history
- Click customer name
- View "Activity History" section
- Click tabs: All Activity, Quotes, Jobs, Invoices
- Should show correct counts

# 5. WhatsApp integration
- Click "WhatsApp" button
- Should open WhatsApp web/app
- Should pre-fill message with customer name

# 6. Delete customer
- Try to delete customer with quotes/jobs/invoices
- Should show error message
- Delete customer with no history
- Should succeed
```

#### API Testing with cURL

```bash
# List customers
curl http://localhost:3000/api/customers

# Search customers
curl "http://localhost:3000/api/customers?search=maria"

# Create customer
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "phone": "082 999 8888",
    "email": "test@example.com"
  }'

# Get customer with history
curl http://localhost:3000/api/customers/{id}

# Update customer
curl -X PATCH http://localhost:3000/api/customers/{id} \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name"}'

# Delete customer
curl -X DELETE http://localhost:3000/api/customers/{id}
```

### Common Issues & Solutions

#### Issue: "Customer not found" on detail page
**Solution**: Check that tenant_id matches. Verify customer exists in database for your tenant.

```sql
SELECT * FROM customers WHERE tenant_id = 'your-tenant-id';
```

#### Issue: WhatsApp button doesn't work
**Solution**: Check phone number format. Should be 10 digits starting with 0.

```typescript
// Debug in browser console
console.log(phone) // Should be: 082 123 4567 or 0821234567
```

#### Issue: Search returns no results
**Solution**: Check case sensitivity. The search uses `ilike` which should be case-insensitive.

```typescript
// In API route, verify the search query:
console.log('Search term:', search)
console.log('Query:', query.toString())
```

#### Issue: Duplicate phone error not showing
**Solution**: Check that the unique index exists on the database.

```sql
-- Verify index exists
SELECT indexname FROM pg_indexes
WHERE tablename = 'customers'
AND indexname = 'idx_customers_tenant_phone';
```

#### Issue: Customer lifetime value incorrect
**Solution**: Check invoice calculations. Ensure invoices.total and invoices.amount_paid are correct.

```typescript
// Debug in CustomerCard.tsx:
console.log('Invoices:', history.invoices)
console.log('Total Paid:', history.total_paid)
console.log('Outstanding:', history.total_outstanding)
```

### Performance Tips

1. **Pagination**: Don't load all customers at once
   - Default limit: 50
   - Add infinite scroll for better UX

2. **Debounce search**: Wait 300ms after typing stops
   ```typescript
   const [searchTerm, setSearchTerm] = useState('')

   useEffect(() => {
     const timer = setTimeout(() => {
       handleSearch(searchTerm)
     }, 300)

     return () => clearTimeout(timer)
   }, [searchTerm])
   ```

3. **Cache customer data**: Use React Query or SWR
   ```typescript
   import useSWR from 'swr'

   const { data, error } = useSWR('/api/customers', fetcher)
   ```

### Customization Examples

#### Custom Status Badge Colors

```typescript
// In CustomerHistory.tsx
const getCustomStatusColor = (status: string) => {
  return {
    urgent: 'bg-red-100 text-red-800',
    normal: 'bg-blue-100 text-blue-800',
    low: 'bg-gray-100 text-gray-800',
  }[status] || 'bg-gray-100 text-gray-800'
}
```

#### Add Customer Tags

```typescript
// In CustomerCard.tsx
{customer.tags && (
  <div className="flex gap-2 mt-2">
    {customer.tags.map(tag => (
      <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
        {tag}
      </span>
    ))}
  </div>
)}
```

#### Export to CSV

```typescript
// Add to CustomerList.tsx
const exportToCSV = () => {
  const csv = customers.map(c =>
    `${c.name},${c.phone},${c.email || ''},${c.address || ''}`
  ).join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'customers.csv'
  a.click()
}
```

### Next Steps

Once Customer Database is working:

1. **Add bulk operations**:
   - Bulk delete
   - Bulk export
   - Bulk import from CSV

2. **Add advanced filters**:
   - Filter by date added
   - Filter by has_outstanding_invoices
   - Filter by lifetime_value range

3. **Add customer insights**:
   - Most valuable customers
   - Customers with no recent activity
   - Overdue invoice alerts

4. **Integrate with other features**:
   - "New Quote" button pre-fills customer
   - "New Job" button pre-fills customer
   - Dashboard shows customer count

### Help & Documentation

- **Database Schema**: See `supabase/migrations/00001_init_schema.sql`
- **Type Definitions**: See `types/index.ts`
- **Utility Functions**: See `lib/utils.ts`
- **Project Overview**: See `CLAUDE.md`

### Support

If you need help:
1. Check the implementation guide: `CUSTOMER_DATABASE_IMPLEMENTATION.md`
2. Review the database schema in Supabase
3. Check browser console for errors
4. Review server logs for API errors

---

**Feature Status**: Complete and ready for testing
**Last Updated**: 2025-12-02
