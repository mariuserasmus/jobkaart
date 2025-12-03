import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTenantId } from '@/lib/db/supabase-server'
import { InvoiceForm } from '@/components/features/invoices/InvoiceForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Create Invoice | JobKaart',
  description: 'Create a new invoice',
}

interface NewInvoicePageProps {
  searchParams: Promise<{ jobId?: string }>
}

export default async function NewInvoicePage({ searchParams }: NewInvoicePageProps) {
  const tenantId = await getTenantId()

  if (!tenantId) {
    redirect('/auth/login')
  }

  const params = await searchParams
  const jobId = params.jobId

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/invoices" className="hover:text-blue-600 transition-colors">
            Invoices
          </Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium">Create New</span>
        </nav>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {jobId ? 'Create Invoice from Job' : 'Create New Invoice'}
        </h1>
        <p className="text-gray-600 mt-2">
          {jobId
            ? 'Generate a professional invoice from your completed job'
            : 'Create a professional invoice in under 2 minutes'
          }
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceForm mode="create" jobId={jobId} />
        </CardContent>
      </Card>

      {/* Tips */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex gap-3">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-900">Quick Tips</p>
            <ul className="mt-2 text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Be clear and specific in line item descriptions</li>
              <li>Set a due date (default is 30 days from today)</li>
              <li>Include VAT if you're VAT registered</li>
              <li>Add payment terms or instructions in the notes section</li>
              <li>Send the invoice to your customer via WhatsApp or Email</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
