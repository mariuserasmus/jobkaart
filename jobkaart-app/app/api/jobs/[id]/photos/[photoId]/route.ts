import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getTenantId } from '@/lib/db/supabase-server'

/**
 * DELETE /api/jobs/[id]/photos/[photoId]
 * Delete a photo from a job
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const { id: jobId, photoId } = await params
    const tenantId = await getTenantId()

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createServerClient()

    // Fetch photo record to get storage path
    const { data: photo, error: fetchError } = await supabase
      .from('job_photos')
      .select('*')
      .eq('id', photoId)
      .eq('job_id', jobId)
      .eq('tenant_id', tenantId)
      .single()

    if (fetchError || !photo) {
      return NextResponse.json(
        { success: false, error: 'Photo not found' },
        { status: 404 }
      )
    }

    // Extract file path from photo URL
    // URL format: https://{project}.supabase.co/storage/v1/object/public/job-photos/{tenantId}/{jobId}/{filename}
    const url = new URL(photo.photo_url)
    const pathParts = url.pathname.split('/job-photos/')
    const filePath = pathParts[1] // {tenantId}/{jobId}/{filename}

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('job-photos')
      .remove([filePath])

    if (storageError) {
      console.error('Storage delete error:', storageError)
      // Continue anyway - maybe file was already deleted
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('job_photos')
      .delete()
      .eq('id', photoId)
      .eq('tenant_id', tenantId)

    if (dbError) {
      console.error('Database delete error:', dbError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete photo record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Photo deleted successfully',
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
