'use client'

export function PrintButton() {
  return (
    <div className="mt-8 text-center print:hidden">
      <button
        onClick={() => window.print()}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Print Quote
      </button>
    </div>
  )
}
