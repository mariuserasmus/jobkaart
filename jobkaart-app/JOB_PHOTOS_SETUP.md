# Job Photos Feature - Setup Guide

## Overview
This feature allows users to upload, view, and delete proof-of-work photos for jobs. Photos are stored in Supabase Storage with metadata tracked in the database.

## Features Implemented
- Upload up to 10 photos per job (5MB max per photo)
- Drag-and-drop file upload with progress indicator
- Photo gallery with thumbnail grid view
- Full-screen lightbox with navigation
- Photo captions and metadata
- Delete confirmation in lightbox
- Multi-tenant security (RLS + storage policies)
- Mobile-responsive design

---

## Files Created

### 1. Database Migrations
- `supabase/migrations/00005_create_job_photos_table.sql` - Job photos table schema
- `supabase/migrations/00006_job_photos_rls.sql` - Row Level Security policies
- `supabase/migrations/00007_storage_setup.sql` - Storage bucket setup instructions

### 2. API Routes
- `app/api/jobs/[id]/photos/route.ts` - GET (list photos) and POST (upload photo)
- `app/api/jobs/[id]/photos/[photoId]/route.ts` - DELETE (remove photo)

### 3. React Components
- `components/features/jobs/JobPhotosSection.tsx` - Main container with state management
- `components/features/jobs/JobPhotoUpload.tsx` - Upload form with drag-drop
- `components/features/jobs/JobPhotoGallery.tsx` - Photo grid and lightbox viewer

### 4. Updated Files
- `app/(dashboard)/jobs/[id]/page.tsx` - Added JobPhotosSection to job detail page

---

## Setup Instructions

### Step 1: Run Database Migrations

Run the migration files in order:

```bash
# If using Supabase CLI
supabase db push

# Or apply manually via Supabase Dashboard > SQL Editor
# Run the following files in order:
# 1. 00005_create_job_photos_table.sql
# 2. 00006_job_photos_rls.sql
```

### Step 2: Create Supabase Storage Bucket

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to **Supabase Dashboard > Storage**
2. Click **"Create bucket"**
3. Configure:
   - **Name**: `job-photos`
   - **Public**: ❌ (Keep private)
   - **File size limit**: `5242880` bytes (5MB)
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp`

4. Click **Create bucket**

**Option B: Via Supabase CLI**

```bash
supabase storage create job-photos --private
```

### Step 3: Configure Storage Policies

Go to **Storage > job-photos bucket > Policies** and create three policies:

#### Policy 1: Upload (INSERT)
```
Name: Users can upload to their tenant folder
Allowed operation: INSERT
Policy definition:

bucket_id = 'job-photos'
AND (storage.foldername(name))[1] IN (
  SELECT tenant_id::text FROM users WHERE id = auth.uid()
)
```

#### Policy 2: Read (SELECT)
```
Name: Users can read their tenant's photos
Allowed operation: SELECT
Policy definition:

bucket_id = 'job-photos'
AND (storage.foldername(name))[1] IN (
  SELECT tenant_id::text FROM users WHERE id = auth.uid()
)
```

#### Policy 3: Delete (DELETE)
```
Name: Users can delete their tenant's photos
Allowed operation: DELETE
Policy definition:

bucket_id = 'job-photos'
AND (storage.foldername(name))[1] IN (
  SELECT tenant_id::text FROM users WHERE id = auth.uid()
)
```

### Step 4: Verify Setup

1. Start your development server:
```bash
npm run dev
```

2. Log in to your application
3. Navigate to any job detail page: `/jobs/[id]`
4. You should see the "Job Photos" section
5. Try uploading a photo

---

## Testing Guide

### Test Case 1: Upload Photo
1. Go to a job detail page
2. Click "Upload Photo" button
3. Add optional caption
4. Drag and drop an image or click to browse
5. Verify:
   - Upload progress shows
   - Photo appears in gallery
   - Photo count badge updates

### Test Case 2: View Photos
1. Click on any thumbnail in the gallery
2. Verify:
   - Lightbox opens with full-size image
   - Caption and metadata display
   - Navigation arrows work (if multiple photos)
   - ESC key closes lightbox

### Test Case 3: Delete Photo
1. Open photo in lightbox
2. Click "Delete" button
3. Click "Confirm"
4. Verify:
   - Photo removed from gallery
   - Photo count updates
   - Storage file deleted

### Test Case 4: Upload Limits
1. Try uploading 11th photo (should fail with error)
2. Try uploading 10MB file (should fail)
3. Try uploading .pdf file (should fail)
4. Verify error messages display correctly

### Test Case 5: Multi-Tenant Security
1. Create two test accounts in different tenants
2. Upload photos as User A
3. Log in as User B
4. Verify User B cannot see User A's photos
5. Try accessing storage URLs directly (should be blocked)

---

## API Documentation

### GET /api/jobs/[id]/photos
List all photos for a job.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "job_id": "uuid",
      "tenant_id": "uuid",
      "photo_url": "https://...",
      "caption": "Before repair",
      "file_size": 1234567,
      "mime_type": "image/jpeg",
      "created_at": "2025-12-03T10:30:00Z"
    }
  ]
}
```

### POST /api/jobs/[id]/photos
Upload a photo for a job.

**Request (multipart/form-data):**
- `file`: Image file (required)
- `caption`: Photo caption (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "photo_url": "https://...",
    "caption": "After repair",
    "created_at": "2025-12-03T10:35:00Z"
  }
}
```

**Errors:**
- `400` - No file provided / Invalid file type / File too large / Max photos reached
- `401` - Unauthorized
- `404` - Job not found
- `500` - Upload failed

### DELETE /api/jobs/[id]/photos/[photoId]
Delete a photo from a job.

**Response:**
```json
{
  "success": true,
  "message": "Photo deleted successfully"
}
```

**Errors:**
- `401` - Unauthorized
- `404` - Photo not found
- `500` - Delete failed

---

## Storage Structure

Photos are stored in the following path structure:

```
job-photos/
  {tenant_id}/
    {job_id}/
      {timestamp}-{random}.jpg
      {timestamp}-{random}.png
      {timestamp}-{random}.webp
```

**Example:**
```
job-photos/
  abc123-tenant-uuid/
    def456-job-uuid/
      1733223456789-a4b8c2.jpg
      1733223678901-d3e7f1.png
```

This structure ensures:
- Multi-tenant isolation
- Easy bulk operations (delete all photos for a job)
- Unique filenames (no collisions)

---

## Security Considerations

### Database (RLS)
- Users can only view photos from jobs in their tenant
- Users can only upload photos to jobs in their tenant
- Users can only delete photos from their tenant

### Storage (Bucket Policies)
- All files are private (not publicly accessible)
- Users can only upload to their tenant folder
- Users can only read/delete their tenant's files
- File paths enforce tenant isolation

### File Validation
- File type: Only JPEG, PNG, WEBP allowed
- File size: 5MB maximum per file
- Photo count: 10 photos maximum per job
- Validation happens on both client and server

---

## Troubleshooting

### Photos Not Uploading
1. Check browser console for errors
2. Verify Supabase storage bucket exists
3. Verify storage policies are configured
4. Check file size (must be < 5MB)
5. Check file type (must be JPG, PNG, or WEBP)

### Photos Not Displaying
1. Check if photos exist in database:
   ```sql
   SELECT * FROM job_photos WHERE job_id = 'your-job-id';
   ```
2. Verify storage URL is accessible
3. Check browser network tab for 403/404 errors
4. Verify RLS policies are active

### Storage Quota Issues
Supabase Free tier includes 1GB storage. To check usage:
1. Go to **Dashboard > Settings > Usage**
2. Monitor "Storage" section
3. Consider implementing automatic image compression
4. Set up cleanup policies for old jobs

---

## Future Enhancements

Potential improvements for this feature:

1. **Image Compression**
   - Auto-resize images before upload (e.g., max 1920x1080)
   - Use browser-side compression to reduce file sizes
   - Reduce storage costs and improve load times

2. **Photo Reordering**
   - Add drag-and-drop reordering in gallery
   - Store order in database (`display_order` column)

3. **Bulk Upload**
   - Allow selecting multiple files at once
   - Show upload progress for each file

4. **Photo Editing**
   - Basic crop/rotate functionality
   - Annotations/markup for highlighting issues

5. **Before/After Mode**
   - Tag photos as "before" or "after"
   - Display side-by-side comparison view

6. **PDF Export**
   - Include photos in invoice/quote PDFs
   - Generate standalone photo report

7. **Mobile Camera Integration**
   - Direct camera capture on mobile devices
   - GPS metadata for location tracking

---

## Performance Notes

- Photos are loaded on-demand (lazy loading)
- Thumbnails use CSS `object-cover` (no server-side thumbnails yet)
- Gallery uses responsive grid (2-4 columns based on screen size)
- Lightbox prevents body scroll when open
- Delete operations clean up both DB and storage

---

## Support

For issues or questions:
1. Check this documentation
2. Review browser console errors
3. Check Supabase logs (Dashboard > Logs)
4. Verify all migrations ran successfully
5. Test with small image file first

---

**Last Updated**: 2025-12-03
**Version**: 1.0.0
