'use client';

/**
 * Billing Overdue Page
 *
 * Shown when subscription payment is overdue
 */

import React from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function BillingOverduePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Alert Icon */}
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Overdue
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          Your subscription payment is overdue. Please update your payment method to continue
          using JobKaart.
        </p>

        {/* Instructions */}
        <div className="bg-yellow-50 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-gray-900 mb-2">How to resolve:</h3>
          <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
            <li>Log in to your PayFast account</li>
            <li>Update your payment method or retry the payment</li>
            <li>Your JobKaart access will resume automatically</li>
          </ol>
        </div>

        {/* CTA */}
        <a
          href="https://www.payfast.co.za/login"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
        >
          Go to PayFast
          <ExternalLink className="h-4 w-4 ml-2" />
        </a>

        <Link
          href="/billing"
          className="block w-full mt-3 px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
        >
          View Billing Details
        </Link>

        {/* Support */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Need help? Contact us at{' '}
            <a href="mailto:hello@jobkaart.co.za" className="text-orange-500 hover:underline">
              hello@jobkaart.co.za
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
