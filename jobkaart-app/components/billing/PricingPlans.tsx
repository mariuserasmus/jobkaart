'use client';

/**
 * PricingPlans Component
 *
 * Displays pricing cards for JobKaart subscription plans
 * Handles plan selection and redirects to PayFast for payment
 */

import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { PLAN_DETAILS, type PlanType } from '@/lib/payfast';

interface PricingPlansProps {
  currentPlan?: PlanType | null;
  isInTrial?: boolean;
  subscriptionStatus?: 'free' | 'active' | 'cancelled' | 'expired' | 'overdue' | null;
  onSelectPlan?: (plan: PlanType) => void;
}

const planOrder: PlanType[] = ['free', 'starter', 'pro', 'team'];

export default function PricingPlans({ currentPlan, isInTrial, subscriptionStatus, onSelectPlan }: PricingPlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPlan = async (plan: PlanType) => {
    setSelectedPlan(plan);
    setError(null);

    if (onSelectPlan) {
      onSelectPlan(plan);
      return;
    }

    // Default behavior: submit to API and redirect to PayFast
    setIsLoading(true);

    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ planType: plan })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create subscription');
      }

      // Response is HTML form that auto-submits to PayFast
      const html = await response.text();

      // Replace current page with PayFast redirect form
      document.write(html);
    } catch (err) {
      console.error('Error creating subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to create subscription');
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Start FREE. No credit card required. Upgrade anytime.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 max-w-3xl mx-auto">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {planOrder.map((planType) => {
            const plan = PLAN_DETAILS[planType];
            const isCurrentPlan = currentPlan === planType;
            const isPopular = planType === 'pro';
            const isLoadingThisPlan = isLoading && selectedPlan === planType;

            // Determine button text based on status
            let buttonText = 'Get Started';
            if (planType === 'free') {
              buttonText = 'Start FREE';
            } else if (subscriptionStatus === 'free') {
              buttonText = 'Upgrade Now';
            } else if (subscriptionStatus === 'active' && !isCurrentPlan) {
              buttonText = 'Switch to This Plan';
            }

            return (
              <div
                key={planType}
                className={`relative bg-white rounded-lg shadow-lg border-2 transition-all ${
                  isPopular
                    ? 'border-orange-500 shadow-orange-100'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium shadow-md whitespace-nowrap">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-8">
                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {planType.charAt(0).toUpperCase() + planType.slice(1)}
                  </h3>

                  {/* Price */}
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      R{plan.price}
                    </span>
                    <span className="text-gray-600">/month</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  {isCurrentPlan ? (
                    <div className="text-center py-3 bg-gray-100 text-gray-700 font-medium rounded-lg">
                      Current Plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSelectPlan(planType)}
                      disabled={isLoading}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                        isPopular
                          ? 'bg-orange-500 text-white hover:bg-orange-600 disabled:bg-orange-300'
                          : 'bg-gray-800 text-white hover:bg-gray-900 disabled:bg-gray-400'
                      }`}
                    >
                      {isLoadingThisPlan ? (
                        <span className="flex items-center justify-center">
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        buttonText
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* FREE Tier Notice */}
        {subscriptionStatus === 'free' && (
          <div className="mt-12 max-w-3xl mx-auto">
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-6 py-4 rounded-lg">
              <p className="font-medium mb-1">You're on the FREE Plan</p>
              <p className="text-sm">
                Upgrade to a paid plan for unlimited quotes, jobs, and invoices plus additional users and premium support.
              </p>
            </div>
          </div>
        )}

        {/* FAQ / Notes */}
        <div className="mt-12 max-w-3xl mx-auto text-center text-gray-600 text-sm space-y-2">
          <p>
            <strong>Start FREE</strong> - No payment required. Upgrade anytime.
          </p>
          <p>
            All plans include: Customer database, Quote builder, Job tracker, Invoicing, Dashboard
          </p>
          <p>
            Need help choosing? <a href="mailto:hello@jobkaart.co.za" className="text-orange-500 hover:underline">Contact us</a>
          </p>
        </div>

        {/* ROI Calculator */}
        <div className="mt-16 max-w-4xl mx-auto bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            Why Upgrade from FREE?
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-gray-700 mb-2">Lost quotes per month</p>
              <p className="text-3xl font-bold text-orange-600">2-3</p>
            </div>
            <div>
              <p className="text-gray-700 mb-2">Average quote value</p>
              <p className="text-3xl font-bold text-orange-600">R4,000</p>
            </div>
            <div>
              <p className="text-gray-700 mb-2">Lost per month</p>
              <p className="text-3xl font-bold text-red-600">R8,000+</p>
            </div>
          </div>
          <p className="text-center mt-6 text-gray-700">
            <strong>Start FREE. When you're ready to scale, upgrade for unlimited quotes and jobs.</strong>
            <br />
            <span className="text-sm">If paid plans help you recover just ONE quote, you've paid for 13 months of Starter.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
