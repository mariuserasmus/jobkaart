'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
    >
      Print Invoice
    </button>
  )
}
