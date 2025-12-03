'use client';

/**
 * SubscriptionStatus Component
 *
 * Displays current subscription status, plan details, and trial information
 * Shows upgrade/cancel options
 */

import React from 'react';
import { AlertCircle, CheckCircle, Clock, CreditCard, Users } from 'lucide-react';
import { type PlanType, PLAN_DETAILS } from '@/lib/payfast';

interface SubscriptionStatusProps {
  tenant: {
    id: string;
    business_name: string;
    subscription_tier: PlanType;
    subscription_status: 'active' | 'trial' | 'cancelled' | 'overdue';
    monthly_job_limit: number | null;
  };
  trial: {
    is_in_trial: boolean;
    ends_at: string | null;
    days_remaining: number;
  };
  subscription: {
    id: string;
    plan_type: PlanType;
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

export default function SubscriptionStatus({
  tenant,
  trial,
  subscription,
  access
}: SubscriptionStatusProps) {
  const plan = PLAN_DETAILS[tenant.subscription_tier];
  const isActive = tenant.subscription_status === 'active';
  const isInTrial = trial.is_in_trial;
  const isOverdue = tenant.subscription_status === 'overdue';
  const isCancelled = tenant.subscription_status === 'cancelled';

  // Status badge
  const getStatusBadge = () => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-4 w-4 mr-1" />
          Active
        </span>
      );
    }
    if (isInTrial) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          <Clock className="h-4 w-4 mr-1" />
          Trial ({trial.days_remaining} days left)
        </span>
      );
    }
    if (isOverdue) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <AlertCircle className="h-4 w-4 mr-1" />
          Payment Overdue
        </span>
      );
    }
    if (isCancelled) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
          <AlertCircle className="h-4 w-4 mr-1" />
          Cancelled
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Current Plan</h3>
          {getStatusBadge()}
        </div>

        <div className="space-y-4">
          {/* Plan Details */}
          <div>
            <p className="text-3xl font-bold text-gray-900">
              {tenant.subscription_tier.charAt(0).toUpperCase() +
                tenant.subscription_tier.slice(1)} Plan
            </p>
            <p className="text-gray-600 mt-1">
              {isActive && subscription && (
                <>
                  R{subscription.amount}/month - Next billing:{' '}
                  {subscription.next_billing_date
                    ? new Date(subscription.next_billing_date).toLocaleDateString('en-ZA')
                    : 'N/A'}
                </>
              )}
              {isInTrial && (
                <>Trial ends: {trial.ends_at ? new Date(trial.ends_at).toLocaleDateString('en-ZA') : 'N/A'}</>
              )}
              {isCancelled && subscription?.cancelled_at && (
                <>Cancelled on: {new Date(subscription.cancelled_at).toLocaleDateString('en-ZA')}</>
              )}
            </p>
          </div>

          {/* Plan Features */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div className="flex items-center text-gray-700">
              <Users className="h-5 w-5 mr-2 text-gray-400" />
              <span>{plan.users} users</span>
            </div>
            <div className="flex items-center text-gray-700">
              <CreditCard className="h-5 w-5 mr-2 text-gray-400" />
              <span>
                {plan.jobLimit === null ? 'Unlimited' : `${plan.jobLimit}`} jobs/month
              </span>
            </div>
          </div>

          {/* Features List */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Included features:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              {plan.features.map((feature, index) => (
                <li key={index}>• {feature}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Trial Warning */}
      {isInTrial && trial.days_remaining <= 7 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800 mb-1">
                Trial Ending Soon
              </h4>
              <p className="text-sm text-yellow-700">
                Your free trial ends in {trial.days_remaining} day{trial.days_remaining !== 1 ? 's' : ''}.
                Subscribe to a plan to continue using JobKaart after your trial ends.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overdue Warning */}
      {isOverdue && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800 mb-1">Payment Overdue</h4>
              <p className="text-sm text-red-700">
                Your subscription payment is overdue. Please update your payment method to
                continue using JobKaart.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cancelled Info */}
      {isCancelled && !isInTrial && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-gray-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-gray-800 mb-1">
                Subscription Cancelled
              </h4>
              <p className="text-sm text-gray-700">
                Your subscription has been cancelled. You can reactivate by selecting a plan
                below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Info (if active) */}
      {isActive && subscription && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="text-gray-900 font-medium">PayFast Subscription</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="text-gray-900 font-medium">
                R{subscription.amount} {subscription.currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Billing Frequency:</span>
              <span className="text-gray-900 font-medium">Monthly</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Next Billing Date:</span>
              <span className="text-gray-900 font-medium">
                {subscription.next_billing_date
                  ? new Date(subscription.next_billing_date).toLocaleDateString('en-ZA')
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Manage Subscription Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> To update your payment method or manage your PayFast subscription,
          please visit your{' '}
          <a
            href="https://www.payfast.co.za/login"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-900"
          >
            PayFast account
          </a>
          .
        </p>
      </div>
    </div>
  );
}
