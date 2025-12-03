'use client';

/**
 * Billing Success Page
 *
 * Shown after successful PayFast payment
 */

import React from 'react';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function BillingSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Subscription Activated!
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          Your PayFast subscription has been successfully set up. Your first payment will be
          processed at the end of your 14-day free trial.
        </p>

        {/* Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-gray-900 mb-2">What happens next?</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Your 14-day free trial is now active</li>
            <li>• Full access to all features included in your plan</li>
            <li>• First payment will be collected automatically after trial</li>
            <li>• You can cancel anytime from the Billing page</li>
          </ul>
        </div>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="block w-full px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
        >
          Go to Dashboard
        </Link>

        <Link
          href="/billing"
          className="block w-full mt-3 px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
        >
          View Billing Details
        </Link>
      </div>
    </div>
  );
}
