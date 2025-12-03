-- ============================================================================
-- JobKaart Database Schema - Job Photos RLS Policies
-- ============================================================================
-- Description: Row Level Security policies for job_photos table
-- Version: 1.0.0
-- Date: 2025-12-03
-- ============================================================================

-- Enable RLS
ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: job_photos
-- ============================================================================

-- SELECT: Users can view photos from their own tenant's jobs
CREATE POLICY "Users can view their tenant's job photos"
    ON job_photos
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    );

-- INSERT: Users can upload photos to their tenant's jobs
CREATE POLICY "Users can upload photos to their tenant's jobs"
    ON job_photos
    FOR INSERT
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
        AND
        job_id IN (
            SELECT id FROM jobs WHERE tenant_id IN (
                SELECT tenant_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- DELETE: Users can delete photos from their tenant's jobs
CREATE POLICY "Users can delete their tenant's job photos"
    ON job_photos
    FOR DELETE
    USING (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    );

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
