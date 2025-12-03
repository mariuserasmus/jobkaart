import { NextResponse } from 'next/server'
import { createServerClient, getTenantId } from '@/lib/db/supabase-server'
import sharp from 'sharp'

/**
 * POST /api/tenants/[id]/logo
 * Upload tenant logo
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantId()
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const params = await context.params
    const requestedTenantId = params.id

    // Ensure user can only upload for their own tenant
    if (requestedTenantId !== tenantId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Please upload JPEG, PNG, WebP, or SVG' },
        { status: 400 }
      )
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 2MB' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Optimize image (resize and compress)
    // SVG files are vector-based and don't need raster optimization
    let optimizedBuffer: Buffer
    let finalContentType: string
    let finalExtension: string

    if (file.type === 'image/svg+xml') {
      // Keep SVG as-is (already vector, no need to resize)
      optimizedBuffer = buffer
      finalContentType = 'image/svg+xml'
      finalExtension = 'svg'
    } else {
      // For raster images (JPEG, PNG, WebP), optimize to WebP
      try {
        optimizedBuffer = await sharp(buffer)
          .resize(600, 600, {
            fit: 'inside', // Maintain aspect ratio, fit within 600x600
            withoutEnlargement: true, // Don't upscale smaller images
          })
          .webp({
            quality: 90, // Higher quality for better clarity
            effort: 4, // Compression effort (0-6, higher = smaller file but slower)
          })
          .toBuffer()

        finalContentType = 'image/webp'
        finalExtension = 'webp'
      } catch (optimizeError) {
        // If optimization fails (e.g., corrupted image), reject the upload
        console.error('Error optimizing image:', optimizeError)
        return NextResponse.json(
          { success: false, error: 'Failed to process image. Please ensure the file is a valid image.' },
          { status: 400 }
        )
      }
    }

    // Validate optimized file size (2MB max)
    // This applies the limit to the compressed version
    if (optimizedBuffer.length > maxSize) {
      return NextResponse.json(
        { success: false, error: 'Image too large even after compression. Please use a smaller image.' },
        { status: 400 }
      )
    }

    const fileName = `logo.${finalExtension}`
    const filePath = `${tenantId}/${fileName}`

    // Upload optimized image to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('tenant-logos')
      .upload(filePath, optimizedBuffer, {
        contentType: finalContentType,
        upsert: true, // Replace if exists
      })

    if (uploadError) {
      console.error('Error uploading logo:', uploadError)
      return NextResponse.json(
        { success: false, error: 'Failed to upload logo' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('tenant-logos')
      .getPublicUrl(filePath)

    const logoUrl = urlData.publicUrl

    // Update tenant record with new logo URL
    const { error: updateError } = await supabase
      .from('tenants')
      .update({
        logo_url: logoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId)

    if (updateError) {
      console.error('Error updating tenant logo URL:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to save logo URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        logo_url: logoUrl,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/tenants/[id]/logo:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
