'use client';

/**
 * Billing Expired Page
 *
 * Shown when trial has expired and no active subscription
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function BillingExpiredPage() {
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
          Trial Period Ended
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          Your 14-day free trial has ended. To continue using JobKaart, please subscribe to
          one of our plans.
        </p>

        {/* Info */}
        <div className="bg-orange-50 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-gray-900 mb-2">Why Subscribe?</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Stop losing R8,000+ per month in forgotten quotes</li>
            <li>• Professional quotes and invoices</li>
            <li>• Track jobs from quote to payment</li>
            <li>• Know exactly who owes you money</li>
            <li>• Cancel anytime</li>
          </ul>
        </div>

        {/* Pricing */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-2">Plans start at</p>
          <p className="text-3xl font-bold text-gray-900">R299<span className="text-lg text-gray-600">/month</span></p>
          <p className="text-xs text-gray-500 mt-1">Recover just 1 quote = 13 months paid</p>
        </div>

        {/* CTA */}
        <Link
          href="/billing"
          className="block w-full px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
        >
          View Plans & Subscribe
        </Link>

        <p className="text-sm text-gray-500 mt-4">
          Questions? <a href="mailto:hello@jobkaart.co.za" className="text-orange-500 hover:underline">Contact us</a>
        </p>
      </div>
    </div>
  );
}
