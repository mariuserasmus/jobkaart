import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getTenantId, getCurrentUser } from '@/lib/db/supabase-server'

/**
 * GET /api/jobs/[id]/photos
 * List all photos for a job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params
    const tenantId = await getTenantId()

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createServerClient()

    // Verify job belongs to tenant
    const { data: job } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', jobId)
      .eq('tenant_id', tenantId)
      .single()

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    // Fetch all photos for the job
    const { data: photos, error } = await supabase
      .from('job_photos')
      .select('*')
      .eq('job_id', jobId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching photos:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch photos' },
        { status: 500 }
      )
    }

    // Generate fresh signed URLs for all photos (since they expire after 24 hours)
    const photosWithSignedUrls = await Promise.all(
      (photos || []).map(async (photo) => {
        // Extract the file path from the stored URL
        // The photo_url contains the old signed URL, we need to extract the path
        // Format: tenantId/jobId/filename
        const urlParts = photo.photo_url.split('/job-photos/')
        if (urlParts.length > 1) {
          const pathParts = urlParts[1].split('?')[0] // Remove query params
          const filePath = decodeURIComponent(pathParts)

          const { data: signedData } = await supabase.storage
            .from('job-photos')
            .createSignedUrl(filePath, 86400) // 24 hours

          if (signedData) {
            return { ...photo, photo_url: signedData.signedUrl }
          }
        }
        return photo
      })
    )

    return NextResponse.json({
      success: true,
      data: photosWithSignedUrls,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/jobs/[id]/photos
 * Upload a photo for a job
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params
    const tenantId = await getTenantId()
    const user = await getCurrentUser()

    if (!tenantId || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createServerClient()

    // Verify job belongs to tenant
    const { data: job } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', jobId)
      .eq('tenant_id', tenantId)
      .single()

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    // Check photo count limit (max 10 per job)
    const { count } = await supabase
      .from('job_photos')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', jobId)
      .eq('tenant_id', tenantId)

    if (count && count >= 10) {
      return NextResponse.json(
        { success: false, error: 'Maximum 10 photos per job' },
        { status: 400 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const caption = formData.get('caption') as string | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only JPG, PNG, and WEBP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const fileName = `${timestamp}-${randomStr}.${fileExt}`
    const filePath = `${tenantId}/${jobId}/${fileName}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('job-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { success: false, error: 'Failed to upload photo' },
        { status: 500 }
      )
    }

    // Get signed URL (24 hour expiration for private bucket)
    const { data: urlData, error: urlError } = await supabase.storage
      .from('job-photos')
      .createSignedUrl(filePath, 86400) // 24 hours

    if (urlError || !urlData) {
      console.error('Error creating signed URL:', urlError)
      // Clean up uploaded file
      await supabase.storage.from('job-photos').remove([filePath])
      return NextResponse.json(
        { success: false, error: 'Failed to generate photo URL' },
        { status: 500 }
      )
    }

    // Save photo metadata to database
    const { data: photoRecord, error: dbError } = await supabase
      .from('job_photos')
      .insert({
        tenant_id: tenantId,
        job_id: jobId,
        photo_url: urlData.signedUrl,
        caption: caption || null,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      // Clean up uploaded file
      await supabase.storage.from('job-photos').remove([filePath])
      return NextResponse.json(
        { success: false, error: 'Failed to save photo record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: photoRecord,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
