'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, TrendingUp } from 'lucide-react'

interface UsageData {
  month: string
  quotes_created: number
  jobs_created: number
  invoices_created: number
}

interface UsageMeterProps {
  subscriptionStatus: string
  subscriptionTier: string
}

export default function UsageMeter({ subscriptionStatus, subscriptionTier }: UsageMeterProps) {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  // Only show for FREE tier users
  if (subscriptionStatus !== 'free') {
    return null
  }

  useEffect(() => {
    fetchUsage()
  }, [])

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/usage/current')
      if (response.ok) {
        const data = await response.json()
        setUsage(data)
      }
    } catch (error) {
      console.error('Error fetching usage:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !usage) {
    return null
  }

  const limit = 5 // FREE tier limit
  const quotesRemaining = Math.max(0, limit - usage.quotes_created)
  const jobsRemaining = Math.max(0, limit - usage.jobs_created)
  const invoicesRemaining = Math.max(0, limit - usage.invoices_created)

  const getProgressColor = (used: number, limit: number) => {
    const percentage = (used / limit) * 100
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 80) return 'bg-orange-500'
    if (percentage >= 60) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getTextColor = (used: number, limit: number) => {
    const percentage = (used / limit) * 100
    if (percentage >= 100) return 'text-red-600'
    if (percentage >= 80) return 'text-orange-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-green-600'
  }

  const totalRemaining = quotesRemaining + jobsRemaining + invoicesRemaining
  const isNearLimit = totalRemaining <= 5

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">FREE Tier Usage</h3>
          <p className="text-sm text-gray-600">Resets on the 1st of each month</p>
        </div>
        {isNearLimit && (
          <AlertCircle className="h-6 w-6 text-orange-500" />
        )}
      </div>

      {/* Usage Bars */}
      <div className="space-y-4">
        {/* Quotes */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Quotes</span>
            <span className={`text-sm font-bold ${getTextColor(usage.quotes_created, limit)}`}>
              {usage.quotes_created} / {limit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${getProgressColor(usage.quotes_created, limit)}`}
              style={{ width: `${Math.min((usage.quotes_created / limit) * 100, 100)}%` }}
            ></div>
          </div>
          {quotesRemaining === 0 && (
            <p className="text-xs text-red-600 mt-1">Limit reached for this month</p>
          )}
        </div>

        {/* Jobs */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Jobs</span>
            <span className={`text-sm font-bold ${getTextColor(usage.jobs_created, limit)}`}>
              {usage.jobs_created} / {limit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${getProgressColor(usage.jobs_created, limit)}`}
              style={{ width: `${Math.min((usage.jobs_created / limit) * 100, 100)}%` }}
            ></div>
          </div>
          {jobsRemaining === 0 && (
            <p className="text-xs text-red-600 mt-1">Limit reached for this month</p>
          )}
        </div>

        {/* Invoices */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Invoices</span>
            <span className={`text-sm font-bold ${getTextColor(usage.invoices_created, limit)}`}>
              {usage.invoices_created} / {limit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${getProgressColor(usage.invoices_created, limit)}`}
              style={{ width: `${Math.min((usage.invoices_created / limit) * 100, 100)}%` }}
            ></div>
          </div>
          {invoicesRemaining === 0 && (
            <p className="text-xs text-red-600 mt-1">Limit reached for this month</p>
          )}
        </div>
      </div>

      {/* Upgrade CTA */}
      {isNearLimit && (
        <div className="mt-6 bg-white border border-blue-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-gray-900 mb-1">
                Running low? Upgrade for unlimited usage
              </h4>
              <p className="text-xs text-gray-600 mb-3">
                Get unlimited quotes, jobs, and invoices from just R299/month
              </p>
              <a
                href="/billing"
                className="inline-block text-sm font-semibold text-blue-600 hover:text-blue-700 underline"
              >
                View upgrade options →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Month Display */}
      <p className="text-xs text-gray-500 text-center mt-4">
        Usage for {new Date(usage.month + '-01').toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}
      </p>
    </div>
  )
}
