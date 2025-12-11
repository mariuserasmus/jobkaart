'use client'

import { formatPhoneNumber, formatCurrency, formatPhoneForWhatsApp } from '@/lib/utils'
import { Customer, CustomerHistory } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface CustomerCardProps {
  customer: Customer
  history: CustomerHistory
}

export function CustomerCard({ customer, history }: CustomerCardProps) {
  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Hi ${customer.name}`)
    const formattedPhone = formatPhoneForWhatsApp(customer.phone)
    window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank')
  }

  const handleCall = () => {
    window.location.href = `tel:${customer.phone}`
  }

  const handleEmail = () => {
    if (customer.email) {
      window.location.href = `mailto:${customer.email}`
    }
  }

  const totalLifetimeValue = history.total_paid + history.total_outstanding

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-2xl mb-2">{customer.name}</CardTitle>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-600">
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
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span className="font-medium">{formatPhoneNumber(customer.phone)}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-2 text-gray-600">
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
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-2 text-gray-600">
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
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>{customer.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 sm:flex-col">
            <Button
              variant="default"
              size="sm"
              onClick={handleWhatsApp}
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
              onClick={handleCall}
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
            {customer.email && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEmail}
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
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Email
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Lifetime Value Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600 mb-1">Lifetime Value</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalLifetimeValue)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Paid</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(history.total_paid)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Outstanding</p>
            <p className={`text-2xl font-bold ${history.total_outstanding > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
              {formatCurrency(history.total_outstanding)}
            </p>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-3xl font-bold text-yellow-700">{history.quotes.length}</p>
            <p className="text-sm text-yellow-600 mt-1">Quotes</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-3xl font-bold text-blue-700">{history.jobs.length}</p>
            <p className="text-sm text-blue-600 mt-1">Jobs</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-3xl font-bold text-purple-700">{history.invoices.length}</p>
            <p className="text-sm text-purple-600 mt-1">Invoices</p>
          </div>
        </div>

        {/* Notes */}
        {customer.notes && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-1">Notes</p>
            <p className="text-sm text-blue-800 whitespace-pre-wrap">{customer.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
