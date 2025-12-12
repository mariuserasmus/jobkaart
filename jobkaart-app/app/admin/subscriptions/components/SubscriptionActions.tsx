'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
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
  const [mounted, setMounted] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate dropdown position when it opens
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.right + window.scrollX - 224, // 224px = width of dropdown (w-56)
      })
    }
  }, [isOpen])

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

  const canChangePlan = ['active', 'free'].includes(tenant.subscription_status)
  const canCancel = ['active'].includes(tenant.subscription_status)
  const canExtendTrial = false // No more trial period with FREE tier
  const canResetTrial = ['cancelled', 'overdue'].includes(tenant.subscription_status)
  const canActivate = ['cancelled', 'overdue'].includes(tenant.subscription_status)

  // Dropdown content that will be portaled
  const dropdownContent = isOpen && mounted && (
    <>
      {/* Backdrop to close dropdown */}
      <div
        className="fixed inset-0"
        style={{ zIndex: 9998 }}
        onClick={() => setIsOpen(false)}
      />

      {/* Dropdown Menu - using fixed positioning to break out of table overflow */}
      <div
        className="fixed w-56 bg-white rounded-md shadow-lg border border-gray-200"
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          zIndex: 9999
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
        )

  return (
    <>
      <div className="relative inline-block">
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Actions ▾
        </button>
      </div>

      {/* Render dropdown via portal outside table DOM */}
      {mounted && dropdownContent && createPortal(dropdownContent, document.body)}

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
