-- ============================================================================
-- JobKaart Database Schema - Storage Setup for Job Photos
-- ============================================================================
-- Description: Creates storage bucket and policies for job photos
-- Version: 1.0.0
-- Date: 2025-12-03
-- ============================================================================

-- Note: This file contains SQL for reference, but storage buckets are typically
-- created via Supabase Dashboard or CLI. The policies below should be applied
-- after creating the 'job-photos' bucket.

-- ============================================================================
-- STORAGE BUCKET CONFIGURATION (via Dashboard or CLI)
-- ============================================================================
-- Bucket name: job-photos
-- Public: false
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp
-- ============================================================================

-- Storage policies MUST be created via Dashboard > Storage > job-photos > Policies
-- Direct SQL INSERT into storage.policies table is NOT supported by Supabase

-- ============================================================================
-- MANUAL SETUP INSTRUCTIONS (REQUIRED)
-- ============================================================================
/*
1. Go to Supabase Dashboard > Storage
2. Click "Create bucket"
3. Name: job-photos
4. Set as Private (not public)
5. File size limit: 5242880 (5MB)
6. Allowed MIME types: image/jpeg,image/png,image/webp

7. Click on the bucket > Policies > New Policy > Custom

Policy 1: Upload (INSERT)
--------------------------
Name: Users can upload to their tenant folder
Allowed operation: INSERT
Policy definition:
```
bucket_id = 'job-photos'
AND (storage.foldername(name))[1] IN (
  SELECT tenant_id::text FROM users WHERE id = auth.uid()
)
```

Policy 2: Read (SELECT)
-----------------------
Name: Users can read their tenant's photos
Allowed operation: SELECT
Policy definition:
```
bucket_id = 'job-photos'
AND (storage.foldername(name))[1] IN (
  SELECT tenant_id::text FROM users WHERE id = auth.uid()
)
```

Policy 3: Delete (DELETE)
-------------------------
Name: Users can delete their tenant's photos
Allowed operation: DELETE
Policy definition:
```
bucket_id = 'job-photos'
AND (storage.foldername(name))[1] IN (
  SELECT tenant_id::text FROM users WHERE id = auth.uid()
)
```
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
