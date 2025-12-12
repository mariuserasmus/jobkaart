'use client';

/**
 * UsageMeter Component
 *
 * Displays current month's usage for quotes, jobs, and invoices
 * Shows progress bars with color coding (green -> yellow -> red as limit approaches)
 * Shows warning when >= 80% of limit reached
 * Links to /billing for upgrades
 */

import React, { useEffect, useState } from 'react';
import { AlertTriangle, BarChart3, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface UsageData {
  quotes: {
    used: number;
    limit: number | null;
  };
  jobs: {
    used: number;
    limit: number | null;
  };
  invoices: {
    used: number;
    limit: number | null;
  };
  period: {
    start: string;
    end: string;
  };
}

interface UsageMeterProps {
  className?: string;
  compact?: boolean;
}

export default function UsageMeter({ className = '', compact = false }: UsageMeterProps) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/usage/current');

      if (!response.ok) {
        throw new Error('Failed to fetch usage data');
      }

      const data = await response.json();
      setUsage(data);
    } catch (err) {
      console.error('Error fetching usage:', err);
      setError(err instanceof Error ? err.message : 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getProgressBarColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-100';
    if (percentage >= 80) return 'bg-yellow-100';
    return 'bg-green-100';
  };

  const calculatePercentage = (used: number, limit: number | null): number => {
    if (limit === null) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const hasWarnings = (): boolean => {
    if (!usage) return false;

    return (
      (usage.quotes.limit !== null && calculatePercentage(usage.quotes.used, usage.quotes.limit) >= 80) ||
      (usage.jobs.limit !== null && calculatePercentage(usage.jobs.used, usage.jobs.limit) >= 80) ||
      (usage.invoices.limit !== null && calculatePercentage(usage.invoices.used, usage.invoices.limit) >= 80)
    );
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  if (!usage) {
    return null;
  }

  const renderUsageItem = (
    label: string,
    used: number,
    limit: number | null,
    icon: React.ReactNode
  ) => {
    const percentage = calculatePercentage(used, limit);
    const isUnlimited = limit === null;
    const isNearLimit = !isUnlimited && percentage >= 80;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium text-gray-700">{label}</span>
          </div>
          <span className={`font-medium ${isNearLimit ? 'text-red-600' : 'text-gray-900'}`}>
            {used} / {isUnlimited ? 'Unlimited' : limit}
          </span>
        </div>

        {!isUnlimited && (
          <div className="relative">
            <div className={`h-2 rounded-full ${getProgressBarColor(percentage)}`}>
              <div
                className={`h-2 rounded-full ${getProgressColor(percentage)} transition-all duration-300`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        )}

        {isNearLimit && (
          <p className="text-xs text-yellow-700">
            You're using {percentage.toFixed(0)}% of your {label.toLowerCase()} limit
          </p>
        )}
      </div>
    );
  };

  if (compact) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Usage This Month</h3>
          {hasWarnings() && (
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          )}
        </div>
        <div className="space-y-3">
          {renderUsageItem('Quotes', usage.quotes.used, usage.quotes.limit, <BarChart3 className="h-4 w-4 text-gray-400" />)}
          {renderUsageItem('Jobs', usage.jobs.used, usage.jobs.limit, <TrendingUp className="h-4 w-4 text-gray-400" />)}
          {renderUsageItem('Invoices', usage.invoices.used, usage.invoices.limit, <BarChart3 className="h-4 w-4 text-gray-400" />)}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Usage This Month</h3>
          <p className="text-sm text-gray-600 mt-1">
            {new Date(usage.period.start).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })} -{' '}
            {new Date(usage.period.end).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}
          </p>
        </div>
        {hasWarnings() && (
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm font-medium">Near Limit</span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {renderUsageItem('Quotes', usage.quotes.used, usage.quotes.limit, <BarChart3 className="h-5 w-5 text-gray-400" />)}
        {renderUsageItem('Jobs', usage.jobs.used, usage.jobs.limit, <TrendingUp className="h-5 w-5 text-gray-400" />)}
        {renderUsageItem('Invoices', usage.invoices.used, usage.invoices.limit, <BarChart3 className="h-5 w-5 text-gray-400" />)}
      </div>

      {/* Warning Banner */}
      {hasWarnings() && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800 mb-1">
                Approaching Usage Limit
              </h4>
              <p className="text-sm text-yellow-700 mb-3">
                You're running low on your monthly quota. Consider upgrading to a higher plan for unlimited access.
              </p>
              <Link
                href="/billing"
                className="inline-flex items-center text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
              >
                Upgrade Plan
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Unlimited Notice */}
      {usage.quotes.limit === null && usage.jobs.limit === null && usage.invoices.limit === null && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            You have unlimited usage on your current plan. No monthly limits!
          </p>
        </div>
      )}
    </div>
  );
}
