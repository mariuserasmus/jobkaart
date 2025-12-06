'use client'

import { useState } from 'react'

export default function HelpSection() {
  const [loading, setLoading] = useState(false)

  const handleReplayTour = () => {
    setLoading(true)

    // Call the global restart function
    if (window.restartOnboardingTour) {
      window.restartOnboardingTour()
    } else {
      alert('Tour not available. Please refresh the page and try again.')
    }

    // Reset loading after a short delay
    setTimeout(() => setLoading(false), 500)
  }

  const handleWhatsAppSupport = () => {
    const phoneNumber = '27825522848'
    const message = encodeURIComponent('Hi, I need help with JobKaart')
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank')
  }

  return (
    <div className="space-y-8">
      {/* Getting Started */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Getting Started
        </h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-2xl">
                🎓
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Onboarding Tour
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                New to JobKaart? Take a quick 2-minute tour to learn how to create quotes,
                track jobs, and get paid faster.
              </p>
              <button
                onClick={handleReplayTour}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Starting...
                  </>
                ) : (
                  <>
                    ▶ Start Tutorial
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Support */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Need Help?
        </h2>
        <div className="space-y-4">
          {/* WhatsApp Support */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center text-2xl">
                  💬
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  WhatsApp Support
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Stuck? We're here to help! Send us a message on WhatsApp and we'll get back to you quickly.
                </p>
                <button
                  onClick={handleWhatsAppSupport}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  💬 WhatsApp Us
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Guides */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Guides
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* How to Create a Quote */}
          <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              📄 How to Create a Quote
            </h3>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Go to <strong>Customers</strong> and add a customer</li>
              <li>Click <strong>Quotes</strong> → <strong>Create Quote</strong></li>
              <li>Select customer and add line items</li>
              <li>Click <strong>Send via WhatsApp</strong></li>
            </ol>
          </div>

          {/* How to Track Jobs */}
          <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              🔧 How to Track Jobs
            </h3>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Quote accepted? Convert to <strong>Job</strong></li>
              <li>Update status as work progresses</li>
              <li>Mark <strong>Complete</strong> when done</li>
              <li>Create invoice from job</li>
            </ol>
          </div>

          {/* How to Create Invoices */}
          <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              💰 How to Create Invoices
            </h3>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Go to a completed <strong>Job</strong></li>
              <li>Click <strong>Create Invoice</strong></li>
              <li>Review details and send via WhatsApp</li>
              <li>Mark as paid when payment received</li>
            </ol>
          </div>

          {/* Progress Billing */}
          <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              📊 Progress Billing
            </h3>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Create <strong>Deposit Invoice</strong> for upfront payment</li>
              <li>Add <strong>Progress Invoices</strong> as work continues</li>
              <li>Create <strong>Balance Invoice</strong> for final payment</li>
              <li>System auto-calculates remaining balance</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Tips & Tricks */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          💡 Tips & Tricks
        </h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-yellow-600">✓</span>
            <p className="text-sm text-gray-700">
              <strong>Follow up on quotes:</strong> Dashboard shows quotes waiting 3+ days. Follow up to win more jobs!
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-yellow-600">✓</span>
            <p className="text-sm text-gray-700">
              <strong>Don't forget to invoice:</strong> Mark jobs "Complete" and create invoices immediately to get paid faster.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-yellow-600">✓</span>
            <p className="text-sm text-gray-700">
              <strong>Track view status:</strong> When customers view your quotes/invoices, call them while it's fresh in their mind!
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-yellow-600">✓</span>
            <p className="text-sm text-gray-700">
              <strong>Use quote templates:</strong> Save time by creating templates for common jobs (plumbing, electrical, etc.).
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-yellow-600">✓</span>
            <p className="text-sm text-gray-700">
              <strong>Upload your logo:</strong> Professional branding builds trust. Add your logo in VAT & Branding settings.
            </p>
          </div>
        </div>
      </div>

      {/* Version Info */}
      <div className="pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          JobKaart v1.0 • Built for SA Tradespeople
        </p>
      </div>
    </div>
  )
}
