import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTenantId } from '@/lib/db/supabase-server'
import { CustomerForm } from '@/components/features/customers/CustomerForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Add Customer | JobKaart',
  description: 'Add a new customer',
}

export default async function NewCustomerPage() {
  const tenantId = await getTenantId()

  if (!tenantId) {
    redirect('/auth/login')
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/customers" className="hover:text-blue-600 transition-colors">
            Customers
          </Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium">Add New</span>
        </nav>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Add New Customer</h1>
        <p className="text-gray-600 mt-2">
          Create a new customer record in under 10 seconds
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerForm mode="create" />
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
              <li>Phone number is required for WhatsApp integration</li>
              <li>Address helps you remember job locations</li>
              <li>Use notes for important details (e.g., gate code, dogs, preferred times)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
