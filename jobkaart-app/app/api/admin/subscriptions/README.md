# Super Admin Subscription Management API

This directory contains API routes for managing tenant subscriptions as a super admin. All routes require super admin authentication and log actions to the audit log.

## Authentication

All routes require:
- Valid Supabase session
- User must have `is_super_admin = true` in the `users` table
- Returns `403 Forbidden` if not authenticated as super admin

## Routes

### GET /api/admin/subscriptions/list

List all tenants with subscription details, including pagination, search, and filtering.

**Query Parameters:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Number of results per page
- `search` (optional) - Search by business name, email, or phone
- `status` (optional) - Filter by subscription status (active, trial, cancelled, overdue)
- `tier` (optional) - Filter by subscription tier (starter, pro, team)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "business_name": "John's Plumbing",
      "email": "john@example.com",
      "phone": "+27123456789",
      "subscription_tier": "starter",
      "subscription_status": "active",
      "trial_ends_at": null,
      "subscription_started_at": "2025-12-01T10:00:00Z",
      "subscription_ends_at": null,
      "created_at": "2025-11-01T10:00:00Z",
      "user_count": 2,
      "active_user_count": 2,
      "total_quotes": 45,
      "total_jobs": 38,
      "total_invoices": 35,
      "last_activity_at": "2025-12-03T08:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

**Example Usage:**
```bash
# List all tenants
curl -X GET "https://jobkaart.co.za/api/admin/subscriptions/list?page=1&limit=10" \
  -H "Cookie: sb-access-token=..."

# Search for specific tenant
curl -X GET "https://jobkaart.co.za/api/admin/subscriptions/list?search=John's%20Plumbing" \
  -H "Cookie: sb-access-token=..."

# Filter by status
curl -X GET "https://jobkaart.co.za/api/admin/subscriptions/list?status=trial" \
  -H "Cookie: sb-access-token=..."
```

---

### POST /api/admin/subscriptions/reset-trial

Reset a tenant's subscription to a 14-day trial period.

**Request Body:**
```json
{
  "tenantId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tenantId": "uuid",
    "trialEndsAt": "2025-12-17T10:00:00Z",
    "message": "Trial reset successfully to 14 days"
  }
}
```

**Actions Performed:**
- Sets `subscription_status` to 'trial'
- Sets `trial_ends_at` to NOW + 14 days
- Logs event to `subscription_events` table
- Logs admin action to `admin_audit_logs` table

**Example Usage:**
```bash
curl -X POST "https://jobkaart.co.za/api/admin/subscriptions/reset-trial" \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{"tenantId": "123e4567-e89b-12d3-a456-426614174000"}'
```

---

### POST /api/admin/subscriptions/change-plan

Change a tenant's subscription tier (starter, pro, or team).

**Request Body:**
```json
{
  "tenantId": "uuid",
  "newTier": "pro"
}
```

**Valid Tiers:**
- `starter` - R299/month (2 users, 50 jobs/month)
- `pro` - R499/month (5 users, unlimited jobs)
- `team` - R799/month (10 users, unlimited jobs)

**Response:**
```json
{
  "success": true,
  "data": {
    "tenantId": "uuid",
    "oldTier": "starter",
    "newTier": "pro",
    "message": "Plan changed from starter to pro"
  }
}
```

**Actions Performed:**
- Updates `subscription_tier` in `tenants` table
- Updates `plan_type` and `amount` in `subscriptions` table
- Logs event to `subscription_events` table
- Logs admin action to `admin_audit_logs` table

**Example Usage:**
```bash
curl -X POST "https://jobkaart.co.za/api/admin/subscriptions/change-plan" \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "tenantId": "123e4567-e89b-12d3-a456-426614174000",
    "newTier": "pro"
  }'
```

---

### POST /api/admin/subscriptions/activate

Manually activate a subscription without requiring payment (useful for testing, special cases, or comped accounts).

**Request Body:**
```json
{
  "tenantId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tenantId": "uuid",
    "previousStatus": "trial",
    "newStatus": "active",
    "message": "Subscription activated successfully"
  }
}
```

**Actions Performed:**
- Sets `subscription_status` to 'active'
- Sets `subscription_started_at` to NOW
- Clears `trial_ends_at` (sets to null)
- Creates/updates subscription record with `next_billing_date` = NOW + 1 month
- Logs event to `subscription_events` table
- Logs admin action to `admin_audit_logs` table

**Example Usage:**
```bash
curl -X POST "https://jobkaart.co.za/api/admin/subscriptions/activate" \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{"tenantId": "123e4567-e89b-12d3-a456-426614174000"}'
```

---

### POST /api/admin/subscriptions/cancel

Manually cancel a subscription (immediate cancellation).

**Request Body:**
```json
{
  "tenantId": "uuid",
  "reason": "Customer requested cancellation"
}
```

**Fields:**
- `tenantId` (required) - UUID of the tenant
- `reason` (optional) - Reason for cancellation (stored in audit logs)

**Response:**
```json
{
  "success": true,
  "data": {
    "tenantId": "uuid",
    "previousStatus": "active",
    "newStatus": "cancelled",
    "reason": "Customer requested cancellation",
    "endDate": "2025-12-03T10:00:00Z",
    "message": "Subscription cancelled successfully"
  }
}
```

**Actions Performed:**
- Sets `subscription_status` to 'cancelled'
- Sets `subscription_ends_at` to NOW
- Updates subscription record with `cancelled_at`, `cancellation_reason`, and `end_date`
- Logs event to `subscription_events` table
- Logs admin action to `admin_audit_logs` table

**Example Usage:**
```bash
curl -X POST "https://jobkaart.co.za/api/admin/subscriptions/cancel" \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "tenantId": "123e4567-e89b-12d3-a456-426614174000",
    "reason": "Non-payment"
  }'
```

---

### POST /api/admin/subscriptions/extend-trial

Extend a tenant's trial period by a specified number of days.

**Request Body:**
```json
{
  "tenantId": "uuid",
  "days": 7
}
```

**Fields:**
- `tenantId` (required) - UUID of the tenant
- `days` (required) - Number of days to extend (1-365)

**Response:**
```json
{
  "success": true,
  "data": {
    "tenantId": "uuid",
    "previousTrialEndsAt": "2025-12-10T10:00:00Z",
    "newTrialEndsAt": "2025-12-17T10:00:00Z",
    "daysExtended": 7,
    "message": "Trial extended by 7 days"
  }
}
```

**Actions Performed:**
- Adds `days` to `trial_ends_at` (or sets to NOW + days if null)
- Sets `subscription_status` to 'trial'
- Updates subscription record with new `trial_ends_at`
- Logs event to `subscription_events` table
- Logs admin action to `admin_audit_logs` table

**Example Usage:**
```bash
curl -X POST "https://jobkaart.co.za/api/admin/subscriptions/extend-trial" \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "tenantId": "123e4567-e89b-12d3-a456-426614174000",
    "days": 7
  }'
```

---

## Error Responses

All routes return consistent error responses:

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Unauthorized: Super admin access required"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": "Unauthorized or internal error"
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "error": "tenantId is required"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "Tenant not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "Failed to update subscription"
}
```

---

## Audit Logging

All actions are logged to two tables:

### admin_audit_logs
Tracks who performed what action:
```sql
admin_user_id UUID    -- Who did it
action TEXT           -- What action (e.g., 'reset_trial')
target_type TEXT      -- Type of target ('tenant')
target_id UUID        -- Tenant UUID
metadata JSONB        -- Additional details
created_at TIMESTAMP
```

### subscription_events
Tracks subscription lifecycle events:
```sql
tenant_id UUID
subscription_id UUID
event_type TEXT       -- e.g., 'trial_reset', 'plan_changed', 'activated'
event_data JSONB      -- Event-specific details
created_at TIMESTAMP
```

---

## Database Tables Affected

### tenants
- `subscription_tier` - Subscription level (starter, pro, team)
- `subscription_status` - Status (active, trial, cancelled, overdue)
- `trial_ends_at` - When trial ends (NULL if not on trial)
- `subscription_started_at` - When subscription became active
- `subscription_ends_at` - When subscription ends (NULL if active)
- `current_subscription_id` - Reference to active subscription record

### subscriptions
- `plan_type` - Subscription tier
- `status` - Subscription status
- `trial_ends_at` - Trial end date
- `start_date` - Subscription start date
- `next_billing_date` - Next billing date
- `amount` - Monthly amount
- `cancelled_at` - Cancellation timestamp
- `cancellation_reason` - Why cancelled

---

## Common Use Cases

### 1. Onboard a New Customer (Comp Account)
```bash
# Activate their subscription without payment
curl -X POST ".../activate" -d '{"tenantId": "..."}'
```

### 2. Customer Wants to Upgrade
```bash
# Change from starter to pro
curl -X POST ".../change-plan" -d '{"tenantId": "...", "newTier": "pro"}'
```

### 3. Trial About to Expire, Customer Needs More Time
```bash
# Extend trial by 7 days
curl -X POST ".../extend-trial" -d '{"tenantId": "...", "days": 7}'
```

### 4. Customer Wants to Test Again After Cancelling
```bash
# Reset to fresh 14-day trial
curl -X POST ".../reset-trial" -d '{"tenantId": "..."}'
```

### 5. Customer Stops Paying
```bash
# Cancel subscription with reason
curl -X POST ".../cancel" -d '{"tenantId": "...", "reason": "Non-payment"}'
```

### 6. Find All Trial Accounts About to Expire
```bash
# List all trial accounts
curl -X GET ".../list?status=trial&limit=100"
# Then filter by trial_ends_at in your application
```

---

## Security Notes

1. **Super Admin Only**: All routes check `is_super_admin` flag. Regular users cannot access these routes.

2. **Audit Logging**: Every action is logged with:
   - Who performed the action (admin_user_id)
   - What was done (action)
   - When it happened (created_at)
   - Additional context (metadata)

3. **No Destructive Actions**: None of these routes permanently delete data. Cancellations can be reversed by activating or resetting trial.

4. **Rate Limiting**: Consider implementing rate limiting to prevent abuse.

5. **HTTPS Only**: These routes should only be accessible over HTTPS in production.

---

## Testing

Use the following test flow:

1. **Create a test super admin user**:
   ```sql
   UPDATE users SET is_super_admin = TRUE WHERE email = 'admin@jobkaart.co.za';
   ```

2. **Test list endpoint**:
   ```bash
   curl -X GET "http://localhost:3000/api/admin/subscriptions/list"
   ```

3. **Test subscription management**:
   ```bash
   # Get a tenant ID from the list
   TENANT_ID="..."

   # Reset trial
   curl -X POST "http://localhost:3000/api/admin/subscriptions/reset-trial" \
     -H "Content-Type: application/json" \
     -d "{\"tenantId\": \"$TENANT_ID\"}"

   # Extend trial
   curl -X POST "http://localhost:3000/api/admin/subscriptions/extend-trial" \
     -H "Content-Type: application/json" \
     -d "{\"tenantId\": \"$TENANT_ID\", \"days\": 7}"

   # Activate
   curl -X POST "http://localhost:3000/api/admin/subscriptions/activate" \
     -H "Content-Type: application/json" \
     -d "{\"tenantId\": \"$TENANT_ID\"}"

   # Change plan
   curl -X POST "http://localhost:3000/api/admin/subscriptions/change-plan" \
     -H "Content-Type: application/json" \
     -d "{\"tenantId\": \"$TENANT_ID\", \"newTier\": \"pro\"}"

   # Cancel
   curl -X POST "http://localhost:3000/api/admin/subscriptions/cancel" \
     -H "Content-Type: application/json" \
     -d "{\"tenantId\": \"$TENANT_ID\", \"reason\": \"Test cancellation\"}"
   ```

4. **Verify audit logs**:
   ```sql
   SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT 10;
   SELECT * FROM subscription_events ORDER BY created_at DESC LIMIT 10;
   ```

---

## Next Steps

### Frontend UI
Create a subscription management dashboard that uses these APIs:
- Table view with search/filter (uses `/list`)
- Action buttons for each tenant (activate, cancel, extend, etc.)
- Modal dialogs for confirmation
- Real-time status updates

### Notifications
Add email/SMS notifications when:
- Trial is extended
- Subscription is activated/cancelled
- Plan is changed

### Webhooks
Integrate with PayFast webhooks to automatically:
- Activate subscriptions on successful payment
- Cancel on failed payment
- Record payment events

---

## Support

For questions or issues with these APIs, contact the development team or create an issue in the project repository.
