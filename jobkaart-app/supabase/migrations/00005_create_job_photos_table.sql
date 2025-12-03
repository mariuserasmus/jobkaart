-- ============================================================================
-- JobKaart Database Schema - Job Photos Table
-- ============================================================================
-- Description: Creates job_photos table for storing proof-of-work photos
-- Version: 1.0.0
-- Date: 2025-12-03
-- ============================================================================

-- ============================================================================
-- TABLE: job_photos
-- ============================================================================
-- Purpose: Stores individual job photos (proof of work)
-- Notes: Photos stored in Supabase Storage, this table tracks metadata
-- ============================================================================

CREATE TABLE job_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,

    -- Photo metadata
    photo_url TEXT NOT NULL, -- Full URL to photo in Supabase Storage
    caption TEXT, -- Optional caption/description
    file_size INTEGER, -- Size in bytes
    mime_type TEXT, -- e.g., image/jpeg, image/png

    -- Uploaded by
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_job_photos_tenant_id ON job_photos(tenant_id);
CREATE INDEX idx_job_photos_job_id ON job_photos(job_id);
CREATE INDEX idx_job_photos_created_at ON job_photos(job_id, created_at DESC);

-- Comments
COMMENT ON TABLE job_photos IS 'Job photos for proof of work (up to 10 per job)';
COMMENT ON COLUMN job_photos.photo_url IS 'Full URL to photo in Supabase Storage: job-photos/{tenantId}/{jobId}/{filename}';
COMMENT ON COLUMN job_photos.file_size IS 'File size in bytes (max 5MB enforced at application level)';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
