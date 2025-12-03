'use client';

/**
 * Billing Cancel Page
 *
 * Shown when user cancels PayFast payment
 */

import React from 'react';
import { XCircle } from 'lucide-react';
import Link from 'next/link';

export default function BillingCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Cancel Icon */}
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <XCircle className="h-10 w-10 text-yellow-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Cancelled
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          You cancelled the payment process. Your subscription has not been activated.
        </p>

        {/* Info */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-blue-800">
            <strong>No worries!</strong> You can start a subscription anytime from the Billing
            page. Your account remains active during your trial period.
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/billing"
          className="block w-full px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
        >
          Try Again
        </Link>

        <Link
          href="/dashboard"
          className="block w-full mt-3 px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
