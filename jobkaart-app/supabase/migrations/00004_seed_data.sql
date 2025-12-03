-- ============================================================================
-- JobKaart Database Schema - Seed Data (Development/Testing)
-- ============================================================================
-- Description: Sample data for development and testing
-- Version: 1.0.0
-- Date: 2025-12-02
-- ============================================================================
-- WARNING: This seed data is for DEVELOPMENT ONLY
-- DO NOT run in production - it creates test users with known passwords
-- ============================================================================

-- ============================================================================
-- TENANT 1: Johan's Plumbing (Solo Plumber)
-- ============================================================================

-- Create tenant
INSERT INTO tenants (
    id,
    business_name,
    vat_number,
    vat_registered,
    banking_details,
    phone,
    email,
    address,
    subscription_tier,
    subscription_status,
    subscription_started_at,
    monthly_job_limit
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Johan''s Plumbing',
    '4123456789',
    true,
    '{"bank": "FNB", "account_holder": "Johan Plumbing (Pty) Ltd", "account_number": "62123456789", "branch_code": "250655", "account_type": "Business Cheque"}'::jsonb,
    '082 345 6789',
    'johan@johansplumbing.co.za',
    '123 Main Road, Randburg, 2194',
    'starter',
    'active',
    NOW() - INTERVAL '2 months',
    50
) ON CONFLICT (id) DO NOTHING;

-- Create user for Johan (owner)
-- NOTE: In real app, this would be created via Supabase Auth signup
-- For seed data, we just create the users table entry
INSERT INTO users (
    id,
    tenant_id,
    email,
    full_name,
    phone,
    role,
    is_active
) VALUES (
    '11111111-1111-1111-1111-111111111101',
    '11111111-1111-1111-1111-111111111111',
    'johan@johansplumbing.co.za',
    'Johan van der Merwe',
    '082 345 6789',
    'owner',
    true
) ON CONFLICT (id) DO NOTHING;

-- Create user for Johan's wife (admin)
INSERT INTO users (
    id,
    tenant_id,
    email,
    full_name,
    phone,
    role,
    is_active
) VALUES (
    '11111111-1111-1111-1111-111111111102',
    '11111111-1111-1111-1111-111111111111',
    'susan@johansplumbing.co.za',
    'Susan van der Merwe',
    '082 456 7890',
    'admin',
    true
) ON CONFLICT (id) DO NOTHING;

-- Create customers for Johan
INSERT INTO customers (id, tenant_id, name, phone, email, address, notes) VALUES
    ('c1111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111111', 'Tannie Maria Botha', '082 123 4567', 'maria.botha@gmail.com', '45 Oak Street, Linden, Johannesburg', 'Regular customer - very friendly, always pays on time'),
    ('c1111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111111', 'Mr. David Smith', '083 234 5678', 'david.smith@gmail.com', '78 Maple Avenue, Parkhurst, Johannesburg', 'New customer - referred by Maria'),
    ('c1111111-1111-1111-1111-111111111103', '11111111-1111-1111-1111-111111111111', 'Mrs. Sarah Johnson', '084 345 6789', NULL, '12 Pine Road, Blairgowrie, Randburg', 'No email - prefers WhatsApp'),
    ('c1111111-1111-1111-1111-111111111104', '11111111-1111-1111-1111-111111111111', 'Oupa Piet Swanepoel', '082 456 7890', 'piet.swanepoel@telkomsa.net', '23 Church Street, Northcliff, Johannesburg', 'Retired - home most days, can schedule anytime')
ON CONFLICT (id) DO NOTHING;

-- Create quote templates for Johan
INSERT INTO quote_templates (id, tenant_id, name, description, line_items, default_subtotal, default_vat_amount, default_total, times_used) VALUES
    (
        'qt111111-1111-1111-1111-111111111101',
        '11111111-1111-1111-1111-111111111111',
        'Standard Bathroom Geyser Replacement',
        'Replace 150L geyser including labour and materials',
        '[
            {"description": "150L Geyser (Kwikot)", "quantity": 1, "unit_price": 3500},
            {"description": "Installation labour (4 hours)", "quantity": 4, "unit_price": 450},
            {"description": "Copper piping and fittings", "quantity": 1, "unit_price": 650},
            {"description": "Pressure valve and drain cock", "quantity": 1, "unit_price": 350}
        ]'::jsonb,
        4950.00,
        742.50,
        5692.50,
        8
    ),
    (
        'qt111111-1111-1111-1111-111111111102',
        '11111111-1111-1111-1111-111111111111',
        'Blocked Drain Clearing',
        'Clear blocked drains using drain snake',
        '[
            {"description": "Call-out fee", "quantity": 1, "unit_price": 450},
            {"description": "Drain clearing labour (2 hours)", "quantity": 2, "unit_price": 500},
            {"description": "Drain cleaning chemicals", "quantity": 1, "unit_price": 180}
        ]'::jsonb,
        1130.00,
        169.50,
        1299.50,
        15
    ),
    (
        'qt111111-1111-1111-1111-111111111103',
        '11111111-1111-1111-1111-111111111111',
        'Kitchen Sink & Tap Installation',
        'Install new kitchen sink and taps',
        '[
            {"description": "Kitchen sink (stainless steel)", "quantity": 1, "unit_price": 1200},
            {"description": "Kitchen mixer tap (chrome)", "quantity": 1, "unit_price": 850},
            {"description": "Installation labour (3 hours)", "quantity": 3, "unit_price": 450},
            {"description": "Piping and connectors", "quantity": 1, "unit_price": 350}
        ]'::jsonb,
        2750.00,
        412.50,
        3162.50,
        5
    )
ON CONFLICT (id) DO NOTHING;

-- Create quotes for Johan
INSERT INTO quotes (
    id, tenant_id, customer_id, quote_number, line_items, subtotal, vat_amount, total,
    status, valid_until, notes, public_link, viewed_at, sent_at, created_by, created_at
) VALUES
    (
        'q1111111-1111-1111-1111-111111111101',
        '11111111-1111-1111-1111-111111111111',
        'c1111111-1111-1111-1111-111111111101',
        'Q-2025-001',
        '[
            {"description": "150L Geyser (Kwikot)", "quantity": 1, "unit_price": 3500},
            {"description": "Installation labour (4 hours)", "quantity": 4, "unit_price": 450},
            {"description": "Copper piping and fittings", "quantity": 1, "unit_price": 650},
            {"description": "Pressure valve and drain cock", "quantity": 1, "unit_price": 350}
        ]'::jsonb,
        4950.00,
        742.50,
        5692.50,
        'accepted',
        CURRENT_DATE + INTERVAL '7 days',
        'Tannie Maria needs this urgently - geyser burst last night',
        'a1b2c3d4',
        NOW() - INTERVAL '2 days 3 hours',
        NOW() - INTERVAL '3 days',
        '11111111-1111-1111-1111-111111111101',
        NOW() - INTERVAL '3 days'
    ),
    (
        'q1111111-1111-1111-1111-111111111102',
        '11111111-1111-1111-1111-111111111111',
        'c1111111-1111-1111-1111-111111111102',
        'Q-2025-002',
        '[
            {"description": "Kitchen sink (stainless steel)", "quantity": 1, "unit_price": 1200},
            {"description": "Kitchen mixer tap (chrome)", "quantity": 1, "unit_price": 850},
            {"description": "Installation labour (3 hours)", "quantity": 3, "unit_price": 450},
            {"description": "Piping and connectors", "quantity": 1, "unit_price": 350}
        ]'::jsonb,
        2750.00,
        412.50,
        3162.50,
        'viewed',
        CURRENT_DATE + INTERVAL '5 days',
        NULL,
        'e5f6g7h8',
        NOW() - INTERVAL '1 day 5 hours',
        NOW() - INTERVAL '2 days',
        '11111111-1111-1111-1111-111111111101',
        NOW() - INTERVAL '2 days'
    ),
    (
        'q1111111-1111-1111-1111-111111111103',
        '11111111-1111-1111-1111-111111111111',
        'c1111111-1111-1111-1111-111111111103',
        'Q-2025-003',
        '[
            {"description": "Call-out fee", "quantity": 1, "unit_price": 450},
            {"description": "Toilet cistern repair (2 hours)", "quantity": 2, "unit_price": 500},
            {"description": "Replacement float valve", "quantity": 1, "unit_price": 180}
        ]'::jsonb,
        1130.00,
        169.50,
        1299.50,
        'sent',
        CURRENT_DATE + INTERVAL '10 days',
        'Follow up on Friday if no response',
        'i9j0k1l2',
        NULL,
        NOW() - INTERVAL '1 day',
        '11111111-1111-1111-1111-111111111101',
        NOW() - INTERVAL '1 day'
    )
ON CONFLICT (id) DO NOTHING;

-- Create jobs for Johan
INSERT INTO jobs (
    id, tenant_id, customer_id, quote_id, job_number, title, description,
    status, scheduled_date, scheduled_time, completed_date, assigned_to, created_at
) VALUES
    (
        'j1111111-1111-1111-1111-111111111101',
        '11111111-1111-1111-1111-111111111111',
        'c1111111-1111-1111-1111-111111111101',
        'q1111111-1111-1111-1111-111111111101',
        'J-2025-001',
        'Geyser Replacement - Tannie Maria',
        '150L geyser burst - needs urgent replacement',
        'scheduled',
        CURRENT_DATE + INTERVAL '1 day',
        '09:00:00',
        NULL,
        '11111111-1111-1111-1111-111111111101',
        NOW() - INTERVAL '2 days'
    ),
    (
        'j1111111-1111-1111-1111-111111111102',
        '11111111-1111-1111-1111-111111111111',
        'c1111111-1111-1111-1111-111111111104',
        NULL,
        'J-2025-002',
        'Bathroom Tap Replacement - Oupa Piet',
        'Replace leaking bathroom basin tap',
        'complete',
        CURRENT_DATE - INTERVAL '3 days',
        '14:00:00',
        CURRENT_DATE - INTERVAL '3 days',
        '11111111-1111-1111-1111-111111111101',
        NOW() - INTERVAL '5 days'
    ),
    (
        'j1111111-1111-1111-1111-111111111103',
        '11111111-1111-1111-1111-111111111111',
        'c1111111-1111-1111-1111-111111111101',
        NULL,
        'J-2025-003',
        'Kitchen Pipe Repair - Tannie Maria',
        'Leaking pipe under kitchen sink',
        'paid',
        CURRENT_DATE - INTERVAL '10 days',
        '10:30:00',
        CURRENT_DATE - INTERVAL '10 days',
        '11111111-1111-1111-1111-111111111101',
        NOW() - INTERVAL '12 days'
    )
ON CONFLICT (id) DO NOTHING;

-- Create invoices for Johan
INSERT INTO invoices (
    id, tenant_id, customer_id, job_id, invoice_number, line_items,
    subtotal, vat_amount, total, amount_paid, status, due_date,
    public_link, sent_at, created_at
) VALUES
    (
        'i1111111-1111-1111-1111-111111111101',
        '11111111-1111-1111-1111-111111111111',
        'c1111111-1111-1111-1111-111111111104',
        'j1111111-1111-1111-1111-111111111102',
        'INV-2025-001',
        '[
            {"description": "Call-out fee", "quantity": 1, "unit_price": 450},
            {"description": "Tap replacement labour (1.5 hours)", "quantity": 1.5, "unit_price": 500},
            {"description": "Basin tap (chrome)", "quantity": 1, "unit_price": 680}
        ]'::jsonb,
        1880.00,
        282.00,
        2162.00,
        0,
        'sent',
        CURRENT_DATE + INTERVAL '7 days',
        'm3n4o5p6',
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '2 days'
    ),
    (
        'i1111111-1111-1111-1111-111111111102',
        '11111111-1111-1111-1111-111111111111',
        'c1111111-1111-1111-1111-111111111101',
        'j1111111-1111-1111-1111-111111111103',
        'INV-2025-002',
        '[
            {"description": "Call-out fee", "quantity": 1, "unit_price": 450},
            {"description": "Pipe repair labour (2 hours)", "quantity": 2, "unit_price": 500},
            {"description": "Copper piping and connectors", "quantity": 1, "unit_price": 350}
        ]'::jsonb,
        1800.00,
        270.00,
        2070.00,
        2070.00,
        'paid',
        CURRENT_DATE - INTERVAL '3 days',
        'q7r8s9t0',
        NOW() - INTERVAL '9 days',
        NOW() - INTERVAL '9 days'
    )
ON CONFLICT (id) DO NOTHING;

-- Create payments for Johan
INSERT INTO payments (
    id, tenant_id, invoice_id, amount, payment_method, payment_date, reference, recorded_by
) VALUES
    (
        'p1111111-1111-1111-1111-111111111101',
        '11111111-1111-1111-1111-111111111111',
        'i1111111-1111-1111-1111-111111111102',
        2070.00,
        'eft',
        CURRENT_DATE - INTERVAL '6 days',
        'FNB Ref: 123456789',
        '11111111-1111-1111-1111-111111111102'
    )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TENANT 2: Sipho's Electrical (Small Team)
-- ============================================================================

-- Create tenant
INSERT INTO tenants (
    id,
    business_name,
    vat_number,
    vat_registered,
    banking_details,
    phone,
    email,
    address,
    subscription_tier,
    subscription_status,
    subscription_started_at,
    monthly_job_limit
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    'Sipho''s Electrical Solutions',
    '4234567890',
    true,
    '{"bank": "Standard Bank", "account_holder": "Sipho Electrical (Pty) Ltd", "account_number": "021234567", "branch_code": "051001", "account_type": "Business Current"}'::jsonb,
    '083 456 7890',
    'info@siphoselectrical.co.za',
    '456 High Street, Sandton, 2196',
    'pro',
    'active',
    NOW() - INTERVAL '1 month',
    NULL -- Unlimited jobs on Pro plan
) ON CONFLICT (id) DO NOTHING;

-- Create users for Sipho's team
INSERT INTO users (id, tenant_id, email, full_name, phone, role, is_active) VALUES
    (
        '22222222-2222-2222-2222-222222222201',
        '22222222-2222-2222-2222-222222222222',
        'sipho@siphoselectrical.co.za',
        'Sipho Ndlovu',
        '083 456 7890',
        'owner',
        true
    ),
    (
        '22222222-2222-2222-2222-222222222202',
        '22222222-2222-2222-2222-222222222222',
        'thabo@siphoselectrical.co.za',
        'Thabo Mkhize',
        '084 567 8901',
        'member',
        true
    ),
    (
        '22222222-2222-2222-2222-222222222203',
        '22222222-2222-2222-2222-222222222222',
        'linda@siphoselectrical.co.za',
        'Linda Ndlovu',
        '082 678 9012',
        'admin',
        true
    )
ON CONFLICT (id) DO NOTHING;

-- Create customers for Sipho
INSERT INTO customers (id, tenant_id, name, phone, email, address, notes) VALUES
    ('c2222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222222', 'Sandton Properties (Pty) Ltd', '011 234 5678', 'maintenance@sandtonprops.co.za', '123 Rivonia Road, Sandton, 2196', 'Property management company - regular maintenance contracts'),
    ('c2222222-2222-2222-2222-222222222202', '22222222-2222-2222-2222-222222222222', 'Mr. John Williams', '082 789 0123', 'john.williams@gmail.com', '45 Oxford Road, Rosebank, 2196', 'New house - needs full electrical certificate'),
    ('c2222222-2222-2222-2222-222222222203', '22222222-2222-2222-2222-222222222222', 'ABC Manufacturing', '011 345 6789', 'facilities@abcmfg.co.za', '78 Industrial Drive, Midrand, 1685', 'Factory maintenance - emergency callouts')
ON CONFLICT (id) DO NOTHING;

-- Create quote template for Sipho
INSERT INTO quote_templates (id, tenant_id, name, description, line_items, default_subtotal, default_vat_amount, default_total, times_used) VALUES
    (
        'qt222222-2222-2222-2222-222222222201',
        '22222222-2222-2222-2222-222222222222',
        'Electrical Certificate of Compliance (3-Bedroom)',
        'Full electrical inspection and COC for 3-bedroom house',
        '[
            {"description": "Electrical inspection (full house)", "quantity": 1, "unit_price": 1500},
            {"description": "Testing and certification", "quantity": 1, "unit_price": 800},
            {"description": "COC documentation", "quantity": 1, "unit_price": 450}
        ]'::jsonb,
        2750.00,
        412.50,
        3162.50,
        12
    )
ON CONFLICT (id) DO NOTHING;

-- Create quote for Sipho
INSERT INTO quotes (
    id, tenant_id, customer_id, quote_number, line_items, subtotal, vat_amount, total,
    status, valid_until, public_link, sent_at, created_by, created_at
) VALUES
    (
        'q2222222-2222-2222-2222-222222222201',
        '22222222-2222-2222-2222-222222222222',
        'c2222222-2222-2222-2222-222222222202',
        'Q-2025-001',
        '[
            {"description": "Electrical inspection (full house)", "quantity": 1, "unit_price": 1500},
            {"description": "Testing and certification", "quantity": 1, "unit_price": 800},
            {"description": "COC documentation", "quantity": 1, "unit_price": 450}
        ]'::jsonb,
        2750.00,
        412.50,
        3162.50,
        'sent',
        CURRENT_DATE + INTERVAL '14 days',
        'u1v2w3x4',
        NOW() - INTERVAL '1 day',
        '22222222-2222-2222-2222-222222222201',
        NOW() - INTERVAL '1 day'
    )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VIEW TRACKING DATA (Sample)
-- ============================================================================

INSERT INTO view_tracking (tenant_id, link_type, link_id, viewed_at, ip_address, country_code, city) VALUES
    ('11111111-1111-1111-1111-111111111111', 'quote', 'q1111111-1111-1111-1111-111111111101', NOW() - INTERVAL '2 days 3 hours', '196.207.123.45', 'ZA', 'Johannesburg'),
    ('11111111-1111-1111-1111-111111111111', 'quote', 'q1111111-1111-1111-1111-111111111102', NOW() - INTERVAL '1 day 5 hours', '196.207.124.56', 'ZA', 'Johannesburg'),
    ('11111111-1111-1111-1111-111111111111', 'invoice', 'i1111111-1111-1111-1111-111111111102', NOW() - INTERVAL '8 days', '196.207.125.67', 'ZA', 'Johannesburg')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES (For testing)
-- ============================================================================

-- Uncomment these to verify seed data after migration:

-- Check tenant count
-- SELECT COUNT(*) as tenant_count FROM tenants;

-- Check Johan's data
-- SELECT
--     (SELECT COUNT(*) FROM customers WHERE tenant_id = '11111111-1111-1111-1111-111111111111') as customers,
--     (SELECT COUNT(*) FROM quotes WHERE tenant_id = '11111111-1111-1111-1111-111111111111') as quotes,
--     (SELECT COUNT(*) FROM jobs WHERE tenant_id = '11111111-1111-1111-1111-111111111111') as jobs,
--     (SELECT COUNT(*) FROM invoices WHERE tenant_id = '11111111-1111-1111-1111-111111111111') as invoices;

-- Test dashboard stats function
-- SELECT get_dashboard_stats('11111111-1111-1111-1111-111111111111');

-- Test customer lifetime value function
-- SELECT get_customer_lifetime_value('c1111111-1111-1111-1111-111111111101');

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================
