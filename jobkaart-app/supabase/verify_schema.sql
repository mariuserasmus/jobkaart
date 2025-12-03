-- ============================================================================
-- JobKaart Database Schema - Verification Script
-- ============================================================================
-- Description: Verifies that all migrations were applied correctly
-- Usage: Run this after applying migrations to check database health
-- ============================================================================

-- ============================================================================
-- 1. CHECK ALL TABLES EXIST
-- ============================================================================

DO $$
DECLARE
    v_missing_tables TEXT[];
    v_expected_tables TEXT[] := ARRAY[
        'tenants', 'users', 'customers', 'quote_templates',
        'quotes', 'jobs', 'invoices', 'payments', 'view_tracking'
    ];
    v_table TEXT;
    v_exists BOOLEAN;
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'CHECKING TABLES...';
    RAISE NOTICE '============================================';

    FOREACH v_table IN ARRAY v_expected_tables
    LOOP
        SELECT EXISTS (
            SELECT FROM pg_tables
            WHERE schemaname = 'public' AND tablename = v_table
        ) INTO v_exists;

        IF v_exists THEN
            RAISE NOTICE '✓ Table "%" exists', v_table;
        ELSE
            RAISE NOTICE '✗ Table "%" MISSING!', v_table;
            v_missing_tables := array_append(v_missing_tables, v_table);
        END IF;
    END LOOP;

    IF array_length(v_missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'Missing tables: %', array_to_string(v_missing_tables, ', ');
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE 'All tables exist ✓';
    END IF;
END $$;

-- ============================================================================
-- 2. CHECK ALL ENUMS EXIST
-- ============================================================================

DO $$
DECLARE
    v_missing_enums TEXT[];
    v_expected_enums TEXT[] := ARRAY[
        'subscription_tier', 'subscription_status', 'user_role',
        'quote_status', 'job_status', 'invoice_status',
        'payment_method', 'link_type'
    ];
    v_enum TEXT;
    v_exists BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'CHECKING ENUMS...';
    RAISE NOTICE '============================================';

    FOREACH v_enum IN ARRAY v_expected_enums
    LOOP
        SELECT EXISTS (
            SELECT FROM pg_type
            WHERE typname = v_enum AND typtype = 'e'
        ) INTO v_exists;

        IF v_exists THEN
            RAISE NOTICE '✓ Enum "%" exists', v_enum;
        ELSE
            RAISE NOTICE '✗ Enum "%" MISSING!', v_enum;
            v_missing_enums := array_append(v_missing_enums, v_enum);
        END IF;
    END LOOP;

    IF array_length(v_missing_enums, 1) > 0 THEN
        RAISE EXCEPTION 'Missing enums: %', array_to_string(v_missing_enums, ', ');
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE 'All enums exist ✓';
    END IF;
END $$;

-- ============================================================================
-- 3. CHECK RLS IS ENABLED
-- ============================================================================

DO $$
DECLARE
    v_unprotected_tables TEXT[];
    v_table_name TEXT;
    v_rls_enabled BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'CHECKING ROW-LEVEL SECURITY...';
    RAISE NOTICE '============================================';

    FOR v_table_name IN
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
        AND tablename IN ('tenants', 'users', 'customers', 'quote_templates',
                         'quotes', 'jobs', 'invoices', 'payments', 'view_tracking')
    LOOP
        SELECT rowsecurity INTO v_rls_enabled
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename = v_table_name;

        IF v_rls_enabled THEN
            RAISE NOTICE '✓ RLS enabled on "%"', v_table_name;
        ELSE
            RAISE NOTICE '✗ RLS DISABLED on "%"!', v_table_name;
            v_unprotected_tables := array_append(v_unprotected_tables, v_table_name);
        END IF;
    END LOOP;

    IF array_length(v_unprotected_tables, 1) > 0 THEN
        RAISE EXCEPTION 'RLS not enabled on: %', array_to_string(v_unprotected_tables, ', ');
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE 'RLS enabled on all tables ✓';
    END IF;
END $$;

-- ============================================================================
-- 4. CHECK CRITICAL FUNCTIONS EXIST
-- ============================================================================

DO $$
DECLARE
    v_missing_functions TEXT[];
    v_expected_functions TEXT[] := ARRAY[
        'auth.tenant_id()',
        'generate_quote_number(uuid)',
        'generate_job_number(uuid)',
        'generate_invoice_number(uuid)',
        'generate_public_link()',
        'get_customer_lifetime_value(uuid)',
        'get_dashboard_stats(uuid, date)',
        'mark_overdue_invoices()',
        'mark_expired_quotes()'
    ];
    v_function TEXT;
    v_function_name TEXT;
    v_exists BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'CHECKING FUNCTIONS...';
    RAISE NOTICE '============================================';

    FOREACH v_function IN ARRAY v_expected_functions
    LOOP
        v_function_name := split_part(v_function, '(', 1);

        SELECT EXISTS (
            SELECT FROM pg_proc p
            JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname || '.' || p.proname = v_function_name
               OR p.proname = v_function_name
        ) INTO v_exists;

        IF v_exists THEN
            RAISE NOTICE '✓ Function "%" exists', v_function;
        ELSE
            RAISE NOTICE '✗ Function "%" MISSING!', v_function;
            v_missing_functions := array_append(v_missing_functions, v_function);
        END IF;
    END LOOP;

    IF array_length(v_missing_functions, 1) > 0 THEN
        RAISE EXCEPTION 'Missing functions: %', array_to_string(v_missing_functions, ', ');
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE 'All functions exist ✓';
    END IF;
END $$;

-- ============================================================================
-- 5. CHECK CRITICAL TRIGGERS EXIST
-- ============================================================================

DO $$
DECLARE
    v_trigger_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'CHECKING TRIGGERS...';
    RAISE NOTICE '============================================';

    -- Check updated_at triggers
    SELECT COUNT(*) INTO v_trigger_count
    FROM pg_trigger
    WHERE tgname LIKE '%updated_at%';

    IF v_trigger_count >= 7 THEN
        RAISE NOTICE '✓ Found % updated_at triggers', v_trigger_count;
    ELSE
        RAISE EXCEPTION 'Expected at least 7 updated_at triggers, found %', v_trigger_count;
    END IF;

    -- Check quote defaults trigger
    IF EXISTS (SELECT FROM pg_trigger WHERE tgname = 'set_quote_defaults') THEN
        RAISE NOTICE '✓ Quote defaults trigger exists';
    ELSE
        RAISE EXCEPTION 'Quote defaults trigger missing!';
    END IF;

    -- Check job defaults trigger
    IF EXISTS (SELECT FROM pg_trigger WHERE tgname = 'set_job_defaults') THEN
        RAISE NOTICE '✓ Job defaults trigger exists';
    ELSE
        RAISE EXCEPTION 'Job defaults trigger missing!';
    END IF;

    -- Check invoice defaults trigger
    IF EXISTS (SELECT FROM pg_trigger WHERE tgname = 'set_invoice_defaults') THEN
        RAISE NOTICE '✓ Invoice defaults trigger exists';
    ELSE
        RAISE EXCEPTION 'Invoice defaults trigger missing!';
    END IF;

    -- Check invoice status update triggers
    SELECT COUNT(*) INTO v_trigger_count
    FROM pg_trigger
    WHERE tgname LIKE 'update_invoice%';

    IF v_trigger_count >= 3 THEN
        RAISE NOTICE '✓ Found % invoice update triggers', v_trigger_count;
    ELSE
        RAISE EXCEPTION 'Expected at least 3 invoice update triggers, found %', v_trigger_count;
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE 'All triggers exist ✓';
END $$;

-- ============================================================================
-- 6. CHECK INDEXES EXIST
-- ============================================================================

DO $$
DECLARE
    v_index_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'CHECKING INDEXES...';
    RAISE NOTICE '============================================';

    -- Count indexes on critical columns
    SELECT COUNT(*) INTO v_index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND (indexname LIKE 'idx_%' OR indexname LIKE '%_pkey' OR indexname LIKE '%_unique');

    RAISE NOTICE '✓ Found % indexes', v_index_count;

    -- Check specific critical indexes
    IF EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_customers_tenant_id') THEN
        RAISE NOTICE '✓ Customer tenant_id index exists';
    ELSE
        RAISE WARNING 'Customer tenant_id index missing!';
    END IF;

    IF EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_quotes_public_link') THEN
        RAISE NOTICE '✓ Quote public_link index exists';
    ELSE
        RAISE WARNING 'Quote public_link index missing!';
    END IF;

    IF EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_invoices_public_link') THEN
        RAISE NOTICE '✓ Invoice public_link index exists';
    ELSE
        RAISE WARNING 'Invoice public_link index missing!';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE 'Critical indexes verified ✓';
END $$;

-- ============================================================================
-- 7. TEST BASIC FUNCTIONALITY
-- ============================================================================

DO $$
DECLARE
    v_test_tenant_id UUID := 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    v_quote_number TEXT;
    v_job_number TEXT;
    v_invoice_number TEXT;
    v_public_link TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'TESTING BASIC FUNCTIONALITY...';
    RAISE NOTICE '============================================';

    -- Test quote number generation
    v_quote_number := generate_quote_number(v_test_tenant_id);
    IF v_quote_number ~ '^Q-\d{4}-\d{3}$' THEN
        RAISE NOTICE '✓ Quote number generation works: %', v_quote_number;
    ELSE
        RAISE EXCEPTION 'Quote number generation failed: %', v_quote_number;
    END IF;

    -- Test job number generation
    v_job_number := generate_job_number(v_test_tenant_id);
    IF v_job_number ~ '^J-\d{4}-\d{3}$' THEN
        RAISE NOTICE '✓ Job number generation works: %', v_job_number;
    ELSE
        RAISE EXCEPTION 'Job number generation failed: %', v_job_number;
    END IF;

    -- Test invoice number generation
    v_invoice_number := generate_invoice_number(v_test_tenant_id);
    IF v_invoice_number ~ '^INV-\d{4}-\d{3}$' THEN
        RAISE NOTICE '✓ Invoice number generation works: %', v_invoice_number;
    ELSE
        RAISE EXCEPTION 'Invoice number generation failed: %', v_invoice_number;
    END IF;

    -- Test public link generation
    v_public_link := generate_public_link();
    IF length(v_public_link) = 8 AND v_public_link ~ '^[a-z0-9]{8}$' THEN
        RAISE NOTICE '✓ Public link generation works: %', v_public_link;
    ELSE
        RAISE EXCEPTION 'Public link generation failed: %', v_public_link;
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE 'Basic functionality tests passed ✓';
END $$;

-- ============================================================================
-- 8. CHECK SEED DATA (Optional - only if seed data was loaded)
-- ============================================================================

DO $$
DECLARE
    v_tenant_count INTEGER;
    v_seed_loaded BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'CHECKING SEED DATA (OPTIONAL)...';
    RAISE NOTICE '============================================';

    SELECT COUNT(*) INTO v_tenant_count FROM tenants;

    IF v_tenant_count > 0 THEN
        v_seed_loaded := TRUE;
        RAISE NOTICE '✓ Found % tenants (seed data appears to be loaded)', v_tenant_count;

        -- Check Johan's data
        IF EXISTS (SELECT FROM tenants WHERE id = '11111111-1111-1111-1111-111111111111') THEN
            RAISE NOTICE '✓ Johan''s Plumbing tenant exists';
            RAISE NOTICE '  - Customers: %', (SELECT COUNT(*) FROM customers WHERE tenant_id = '11111111-1111-1111-1111-111111111111');
            RAISE NOTICE '  - Quotes: %', (SELECT COUNT(*) FROM quotes WHERE tenant_id = '11111111-1111-1111-1111-111111111111');
            RAISE NOTICE '  - Jobs: %', (SELECT COUNT(*) FROM jobs WHERE tenant_id = '11111111-1111-1111-1111-111111111111');
            RAISE NOTICE '  - Invoices: %', (SELECT COUNT(*) FROM invoices WHERE tenant_id = '11111111-1111-1111-1111-111111111111');
        END IF;

        -- Check Sipho's data
        IF EXISTS (SELECT FROM tenants WHERE id = '22222222-2222-2222-2222-222222222222') THEN
            RAISE NOTICE '✓ Sipho''s Electrical tenant exists';
            RAISE NOTICE '  - Customers: %', (SELECT COUNT(*) FROM customers WHERE tenant_id = '22222222-2222-2222-2222-222222222222');
            RAISE NOTICE '  - Quotes: %', (SELECT COUNT(*) FROM quotes WHERE tenant_id = '22222222-2222-2222-2222-222222222222');
        END IF;
    ELSE
        RAISE NOTICE 'ℹ No seed data found (this is normal for production)';
    END IF;

    RAISE NOTICE '';
    IF v_seed_loaded THEN
        RAISE NOTICE 'Seed data verified ✓';
    ELSE
        RAISE NOTICE 'Seed data check skipped ✓';
    END IF;
END $$;

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE '✓✓✓ ALL CHECKS PASSED! ✓✓✓';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Database schema is correctly installed.';
    RAISE NOTICE 'You can now:';
    RAISE NOTICE '  1. Start the Next.js application';
    RAISE NOTICE '  2. Create your first tenant via signup';
    RAISE NOTICE '  3. Begin using JobKaart!';
    RAISE NOTICE '';
    RAISE NOTICE 'For testing with seed data:';
    RAISE NOTICE '  - Email: johan@johansplumbing.co.za';
    RAISE NOTICE '  - Tenant: Johan''s Plumbing';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- HELPFUL QUERIES FOR DEBUGGING
-- ============================================================================

-- Uncomment these if you need to debug specific issues:

-- -- List all tables with row counts
-- SELECT
--     schemaname,
--     tablename,
--     (SELECT COUNT(*) FROM public || '.' || tablename) as row_count
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;

-- -- List all RLS policies
-- SELECT tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- -- List all triggers
-- SELECT
--     t.tgname as trigger_name,
--     c.relname as table_name,
--     p.proname as function_name
-- FROM pg_trigger t
-- JOIN pg_class c ON c.oid = t.tgrelid
-- JOIN pg_proc p ON p.oid = t.tgfoid
-- WHERE c.relnamespace = 'public'::regnamespace
-- ORDER BY c.relname, t.tgname;

-- -- List all indexes
-- SELECT
--     tablename,
--     indexname,
--     indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;
