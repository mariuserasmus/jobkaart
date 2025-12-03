-- Migration: Create tenant-logos storage bucket
-- This migration sets up storage for tenant business logos

-- Create the storage bucket for tenant logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('tenant-logos', 'tenant-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload logos (only to their own tenant folder)
CREATE POLICY "Users can upload logos for their tenant"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'tenant-logos'
    AND (storage.foldername(name))[1] = (
        SELECT tenant_id::text
        FROM users
        WHERE id = auth.uid()
    )
);

-- Allow authenticated users to update logos (only their own tenant folder)
CREATE POLICY "Users can update logos for their tenant"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'tenant-logos'
    AND (storage.foldername(name))[1] = (
        SELECT tenant_id::text
        FROM users
        WHERE id = auth.uid()
    )
);

-- Allow authenticated users to delete logos (only their own tenant folder)
CREATE POLICY "Users can delete logos for their tenant"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'tenant-logos'
    AND (storage.foldername(name))[1] = (
        SELECT tenant_id::text
        FROM users
        WHERE id = auth.uid()
    )
);

-- Allow public read access to all logos (needed for displaying on quotes/invoices)
CREATE POLICY "Anyone can view tenant logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'tenant-logos');
