'use client'

import { LineItem } from '@/types'

interface QuoteLineItemsProps {
  items: LineItem[]
  subtotal: number
  vatAmount: number
  total: number
  showVAT?: boolean
}

export function QuoteLineItems({
  items,
  subtotal,
  vatAmount,
  total,
  showVAT = true,
}: QuoteLineItemsProps) {
  const formatCurrency = (amount: number) => {
    if (amount === undefined || amount === null) return 'R0.00'
    return `R${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  }

  return (
    <div className="space-y-4">
      {/* Line Items Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                Description
              </th>
              <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">
                Qty
              </th>
              <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">
                Unit Price
              </th>
              <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-3 px-2 text-sm text-gray-900">
                  {item.description}
                </td>
                <td className="py-3 px-2 text-sm text-gray-900 text-right">
                  {item.quantity}
                </td>
                <td className="py-3 px-2 text-sm text-gray-900 text-right">
                  {formatCurrency(item.unit_price)}
                </td>
                <td className="py-3 px-2 text-sm font-medium text-gray-900 text-right">
                  {formatCurrency(item.total || item.quantity * item.unit_price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="border-t-2 border-gray-200 pt-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Subtotal:</span>
          <span className="text-lg font-semibold text-gray-900">
            {formatCurrency(subtotal)}
          </span>
        </div>

        {showVAT && vatAmount > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">VAT (15%):</span>
            <span className="text-lg font-semibold text-gray-900">
              {formatCurrency(vatAmount)}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <span className="text-base font-bold text-gray-900">Total:</span>
          <span className="text-2xl font-bold text-blue-600">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </div>
  )
}
