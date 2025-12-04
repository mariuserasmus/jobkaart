'use client'

import { useState } from 'react'
import type { TenantSubscription, SubscriptionTier } from '../types'
import { ChangePlanModal } from './ChangePlanModal'
import { CancelModal } from './CancelModal'
import { ExtendTrialModal } from './ExtendTrialModal'
import { ConfirmationModal } from './ConfirmationModal'

interface SubscriptionActionsProps {
  tenant: TenantSubscription
  onActionComplete: () => void
}

export function SubscriptionActions({ tenant, onActionComplete }: SubscriptionActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showChangePlan, setShowChangePlan] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [showExtendTrial, setShowExtendTrial] = useState(false)
  const [showResetTrial, setShowResetTrial] = useState(false)
  const [showActivate, setShowActivate] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAction = async (
    endpoint: string,
    body: any,
    successMessage: string
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Action failed')
      }

      // Show success notification
      alert(successMessage)

      // Close all modals
      setShowChangePlan(false)
      setShowCancel(false)
      setShowExtendTrial(false)
      setShowResetTrial(false)
      setShowActivate(false)

      // Refresh data
      onActionComplete()
    } catch (err: any) {
      setError(err.message)
      alert(`Error: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePlan = async (newTier: SubscriptionTier) => {
    await handleAction(
      '/api/admin/subscriptions/change-plan',
      { tenantId: tenant.tenant_id, newTier },
      `Successfully changed plan to ${newTier}`
    )
  }

  const handleCancelSubscription = async (reason: string) => {
    await handleAction(
      '/api/admin/subscriptions/cancel',
      { tenantId: tenant.tenant_id, reason },
      'Subscription cancelled successfully'
    )
  }

  const handleExtendTrial = async (days: number) => {
    await handleAction(
      '/api/admin/subscriptions/extend-trial',
      { tenantId: tenant.tenant_id, days },
      `Trial extended by ${days} days`
    )
  }

  const handleResetTrial = async () => {
    await handleAction(
      '/api/admin/subscriptions/reset-trial',
      { tenantId: tenant.tenant_id },
      'Trial reset to 14 days'
    )
  }

  const handleActivate = async () => {
    await handleAction(
      '/api/admin/subscriptions/activate',
      { tenantId: tenant.tenant_id },
      'Subscription activated successfully'
    )
  }

  const canChangePlan = ['active', 'trial'].includes(tenant.subscription_status)
  const canCancel = ['active', 'trial'].includes(tenant.subscription_status)
  const canExtendTrial = tenant.subscription_status === 'trial'
  const canResetTrial = ['cancelled', 'overdue'].includes(tenant.subscription_status)
  const canActivate = ['cancelled', 'overdue'].includes(tenant.subscription_status)

  return (
    <>
      <div className="relative inline-block">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          id={`actions-button-${tenant.tenant_id}`}
        >
          Actions ▾
        </button>

        {isOpen && (
          <>
            {/* Backdrop to close dropdown */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Menu - using fixed positioning to break out of table overflow */}
            <div
              className="fixed w-56 bg-white rounded-md shadow-lg border border-gray-200 z-20"
              style={{
                top: `${typeof document !== 'undefined' ? (document.getElementById(`actions-button-${tenant.tenant_id}`)?.getBoundingClientRect().bottom || 0) + 8 : 0}px`,
                right: `${typeof window !== 'undefined' ? window.innerWidth - (document.getElementById(`actions-button-${tenant.tenant_id}`)?.getBoundingClientRect().right || 0) : 0}px`
              }}
            >
              <div className="py-1">
                {canChangePlan && (
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      setShowChangePlan(true)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Change Plan
                  </button>
                )}

                {canExtendTrial && (
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      setShowExtendTrial(true)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Extend Trial
                  </button>
                )}

                {canResetTrial && (
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      setShowResetTrial(true)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Reset to Trial
                  </button>
                )}

                {canActivate && (
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      setShowActivate(true)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                  >
                    Activate Subscription
                  </button>
                )}

                {canCancel && (
                  <>
                    <div className="border-t border-gray-200 my-1" />
                    <button
                      onClick={() => {
                        setIsOpen(false)
                        setShowCancel(true)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                    >
                      Cancel Subscription
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <ChangePlanModal
        isOpen={showChangePlan}
        onClose={() => setShowChangePlan(false)}
        onConfirm={handleChangePlan}
        currentTier={tenant.subscription_tier}
        businessName={tenant.business_name}
        isLoading={isLoading}
      />

      <CancelModal
        isOpen={showCancel}
        onClose={() => setShowCancel(false)}
        onConfirm={handleCancelSubscription}
        businessName={tenant.business_name}
        isLoading={isLoading}
      />

      <ExtendTrialModal
        isOpen={showExtendTrial}
        onClose={() => setShowExtendTrial(false)}
        onConfirm={handleExtendTrial}
        businessName={tenant.business_name}
        currentTrialEndsAt={tenant.trial_ends_at}
        isLoading={isLoading}
      />

      <ConfirmationModal
        isOpen={showResetTrial}
        onClose={() => setShowResetTrial(false)}
        onConfirm={handleResetTrial}
        title="Reset to Trial"
        message={`Reset ${tenant.business_name} to a 14-day trial period?`}
        confirmText="Reset Trial"
        isLoading={isLoading}
      />

      <ConfirmationModal
        isOpen={showActivate}
        onClose={() => setShowActivate(false)}
        onConfirm={handleActivate}
        title="Activate Subscription"
        message={`Activate subscription for ${tenant.business_name}?`}
        confirmText="Activate"
        isLoading={isLoading}
      />
    </>
  )
}
