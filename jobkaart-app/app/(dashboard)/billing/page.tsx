'use client';

/**
 * Billing Management Page
 *
 * Main page for managing subscription, viewing plan details, and upgrading/cancelling
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Loader2 } from 'lucide-react';
import PricingPlans from '@/components/billing/PricingPlans';
import SubscriptionStatus from '@/components/billing/SubscriptionStatus';

interface SubscriptionData {
  tenant: {
    id: string;
    business_name: string;
    subscription_tier: 'free' | 'starter' | 'pro' | 'team';
    subscription_status: 'active' | 'free' | 'cancelled' | 'overdue';
    monthly_job_limit: number | null;
  };
  trial: {
    is_in_trial: boolean;
    ends_at: string | null;
    days_remaining: number;
  };
  subscription: {
    id: string;
    plan_type: 'free' | 'starter' | 'pro' | 'team';
    status: string;
    amount: number;
    currency: string;
    start_date: string;
    next_billing_date: string | null;
    cancelled_at: string | null;
  } | null;
  access: {
    has_access: boolean;
    reason: string;
  };
}

export default function BillingPage() {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Fetch subscription status
  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/subscriptions/status');

      if (!response.ok) {
        throw new Error('Failed to fetch subscription status');
      }

      const data = await response.json();
      setSubscriptionData(data);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setIsCancelling(true);

      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: cancelReason || 'User requested cancellation' })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      const result = await response.json();

      // Refresh subscription status
      await fetchSubscriptionStatus();

      // Close modal
      setShowCancelModal(false);
      setCancelReason('');

      // Show success message
      alert(result.message || 'Subscription cancelled successfully');
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      alert(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 mb-4"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>

        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 mt-8">
          <div className="flex items-start mb-4">
            <AlertCircle className="h-6 w-6 text-red-500 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Billing</h3>
              <p className="text-gray-600">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchSubscriptionStatus}
            className="w-full mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!subscriptionData) {
    return null;
  }

  const isActive = subscriptionData.tenant.subscription_status === 'active';
  const isFree = subscriptionData.tenant.subscription_status === 'free';
  const canCancel = isActive && !isFree;

  return (
    <div>
      {/* Back Button & Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 mb-4"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
            <p className="text-gray-600 mt-1">
              Manage your subscription, view billing history, and upgrade your plan
            </p>
          </div>
          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-300 rounded-lg transition-colors"
            >
              Cancel Subscription
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Subscription Status (Left Column) */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Subscription Details</h2>
          <SubscriptionStatus
            tenant={subscriptionData.tenant}
            trial={subscriptionData.trial}
            subscription={subscriptionData.subscription}
            access={subscriptionData.access}
          />
        </div>

        {/* Pricing Plans (Right Column) */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {subscriptionData.tenant.subscription_status === 'active'
              ? 'Upgrade Your Plan'
              : 'Choose a Plan'}
          </h2>
          <PricingPlans
            currentPlan={subscriptionData.tenant.subscription_tier}
            isInTrial={subscriptionData.trial.is_in_trial}
            subscriptionStatus={subscriptionData.tenant.subscription_status}
          />
        </div>
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Cancel Subscription</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel your subscription? Your access will continue until
              the end of your current billing period.
            </p>

            {/* Optional reason */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancelling (optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Help us improve by letting us know why you're cancelling..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                disabled={isCancelling}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isCancelling}
                className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Yes, Cancel'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
