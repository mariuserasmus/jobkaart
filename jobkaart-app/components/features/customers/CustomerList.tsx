'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatPhoneNumber, getRelativeTime } from '@/lib/utils'
import { Customer } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface CustomerListProps {
  initialCustomers: Customer[]
  initialTotal: number
}

export function CustomerList({ initialCustomers, initialTotal }: CustomerListProps) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSearch = async (value: string) => {
    setSearch(value)
    setLoading(true)

    try {
      const params = new URLSearchParams()
      if (value) params.set('search', value)

      const response = await fetch(`/api/customers?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setCustomers(result.data.customers)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsApp = (phone: string, name: string) => {
    const message = encodeURIComponent(`Hi ${name}`)
    const cleanPhone = phone.replace(/\D/g, '')
    window.open(`https://wa.me/27${cleanPhone.substring(1)}?text=${message}`, '_blank')
  }

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`
  }

  return (
    <div className="space-y-6">
      {/* Search and Add */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 max-w-md">
          <Input
            type="search"
            placeholder="Search by name, phone, or address..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <Link href="/customers/new">
          <Button size="lg" className="w-full sm:w-auto">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Customer
          </Button>
        </Link>
      </div>

      {/* Customer Count */}
      <div className="text-sm text-gray-600">
        {loading ? (
          'Searching...'
        ) : (
          <>
            {customers.length} customer{customers.length !== 1 ? 's' : ''}
            {search && ` matching "${search}"`}
          </>
        )}
      </div>

      {/* Customer List */}
      {customers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {search ? 'No customers found' : 'No customers yet'}
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            {search
              ? 'Try a different search term'
              : 'Get started by adding your first customer'}
          </p>
          {!search && (
            <div className="mt-6">
              <Link href="/customers/new">
                <Button>Add Your First Customer</Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                {/* Customer Info */}
                <Link
                  href={`/customers/${customer.id}`}
                  className="flex-1 min-w-0"
                >
                  <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                    {customer.name}
                  </h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Phone:</span>{' '}
                      {formatPhoneNumber(customer.phone)}
                    </p>
                    {customer.email && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Email:</span> {customer.email}
                      </p>
                    )}
                    {customer.address && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Address:</span> {customer.address}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Added {getRelativeTime(customer.created_at)}
                    </p>
                  </div>
                </Link>

                {/* Actions */}
                <div className="flex gap-2 sm:flex-col">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleWhatsApp(customer.phone, customer.name)}
                    className="flex-1 sm:flex-none"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCall(customer.phone)}
                    className="flex-1 sm:flex-none"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    Call
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
