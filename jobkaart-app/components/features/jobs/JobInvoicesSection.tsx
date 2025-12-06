'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { DepositInvoiceModal } from '../invoices/DepositInvoiceModal'
import { ProgressOrBalanceModal } from '../invoices/ProgressOrBalanceModal'

interface Invoice {
  id: string
  invoice_number: string
  invoice_type: 'full' | 'deposit' | 'progress' | 'balance'
  total: number
  amount_paid: number
  status: string
  deposit_percentage?: number
}

interface JobInvoicesSectionProps {
  jobId: string
  jobTitle: string
  jobStatus: string
  quoteTotal?: number
}

export function JobInvoicesSection({
  jobId,
  jobTitle,
  jobStatus,
  quoteTotal,
}: JobInvoicesSectionProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showProgressBalanceModal, setShowProgressBalanceModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [forceDelete, setForceDelete] = useState(false)

  useEffect(() => {
    fetchInvoices()
  }, [jobId])

  const fetchInvoices = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/invoices`)
      const result = await response.json()

      if (result.success) {
        setInvoices(result.data || [])
      }
    } catch (err) {
      console.error('Error fetching invoices:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteInvoice = async (invoiceId: string) => {
    setDeletingInvoiceId(invoiceId)
    setError(null)

    try {
      const url = forceDelete
        ? `/api/invoices/${invoiceId}?force=true`
        : `/api/invoices/${invoiceId}`

      const response = await fetch(url, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Failed to delete invoice')
        setDeletingInvoiceId(null)
        // Don't close the confirm dialog so they can try force delete
        return
      }

      // Refresh invoices list
      await fetchInvoices()
      setShowDeleteConfirm(null)
      setForceDelete(false)
    } catch (err) {
      console.error('Error deleting invoice:', err)
      setError('Failed to delete invoice')
    } finally {
      setDeletingInvoiceId(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return `R${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  }

  const depositInvoice = invoices.find(inv => inv.invoice_type === 'deposit')
  const balanceInvoice = invoices.find(inv => inv.invoice_type === 'balance')
  const hasDepositInvoice = !!depositInvoice
  const depositIsPaid = depositInvoice?.status === 'paid'
  const canRequestDeposit = (jobStatus === 'scheduled' || jobStatus === 'quoted') && !hasDepositInvoice && quoteTotal

  // Allow creating progress/balance invoice if:
  // - Deposit is paid
  // - No balance invoice exists yet
  // - Job is in any active status (scheduled, in_progress, complete, or paid)
  const canCreateProgressOrBalance = depositIsPaid && !balanceInvoice &&
    (jobStatus === 'scheduled' || jobStatus === 'in_progress' || jobStatus === 'complete' || jobStatus === 'paid')

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-sm text-gray-500">Loading invoices...</p>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoices</h2>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Deposit Invoice Section */}
      {canRequestDeposit && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900">Request Deposit Payment</h3>
              <p className="text-xs text-blue-700 mt-1">
                Get paid upfront before starting work. Common for materials or commitment.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowDepositModal(true)}
              className="ml-4"
            >
              Request Deposit
            </Button>
          </div>
        </div>
      )}

      {/* Existing Invoices List */}
      {invoices.length > 0 ? (
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="relative">
              {showDeleteConfirm === invoice.id ? (
                <div className="p-4 bg-red-50 border border-red-300 rounded-lg">
                  <p className="text-sm font-medium text-red-900 mb-2">
                    Delete {invoice.invoice_number}?
                  </p>
                  <p className="text-xs text-red-700 mb-3">
                    This will permanently delete this invoice and update the job status.
                  </p>

                  {/* Force Delete Checkbox */}
                  <label className="flex items-center gap-2 mb-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={forceDelete}
                      onChange={(e) => setForceDelete(e.target.checked)}
                      className="w-4 h-4 text-red-600 border-red-300 rounded focus:ring-red-500"
                    />
                    <span className="text-xs text-red-800">
                      Force delete (removes payments and ignores order)
                    </span>
                  </label>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleDeleteInvoice(invoice.id)}
                      disabled={deletingInvoiceId === invoice.id}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      size="sm"
                    >
                      {deletingInvoiceId === invoice.id ? 'Deleting...' : forceDelete ? 'Force Delete' : 'Yes, Delete'}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowDeleteConfirm(null)
                        setForceDelete(false)
                      }}
                      disabled={deletingInvoiceId === invoice.id}
                      variant="outline"
                      className="flex-1"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href={`/invoices/${invoice.id}`}
                    className="flex-1 flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-blue-600">
                          {invoice.invoice_number}
                        </p>
                        {invoice.invoice_type === 'deposit' && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            Deposit ({invoice.deposit_percentage}%)
                          </span>
                        )}
                        {invoice.invoice_type === 'progress' && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                            Progress ({invoice.deposit_percentage}%)
                          </span>
                        )}
                        {invoice.invoice_type === 'balance' && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Final Balance
                          </span>
                        )}
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'partially_paid' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {invoice.status === 'paid' ? 'Paid' :
                           invoice.status === 'partially_paid' ? 'Partial' :
                           invoice.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-sm text-gray-600">
                          {formatCurrency(invoice.total)}
                        </p>
                        {invoice.amount_paid > 0 && invoice.status !== 'paid' && (
                          <p className="text-xs text-gray-500">
                            Paid: {formatCurrency(invoice.amount_paid)}
                          </p>
                        )}
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      setShowDeleteConfirm(invoice.id)
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete invoice"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No invoices yet</p>
      )}

      {/* Progress or Balance Invoice Creation */}
      {canCreateProgressOrBalance && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900">Ready to Invoice</h3>
              <p className="text-xs text-blue-700 mt-1">
                Create a progress payment or final balance invoice
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowProgressBalanceModal(true)}
              className="ml-4"
            >
              Create Invoice
            </Button>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {quoteTotal && (
        <DepositInvoiceModal
          isOpen={showDepositModal}
          onClose={() => {
            setShowDepositModal(false)
            fetchInvoices() // Refresh list when modal closes
          }}
          jobId={jobId}
          jobTitle={jobTitle}
          quoteTotal={quoteTotal}
        />
      )}

      {/* Progress or Balance Invoice Modal */}
      {quoteTotal && (
        <ProgressOrBalanceModal
          isOpen={showProgressBalanceModal}
          onClose={() => {
            setShowProgressBalanceModal(false)
            fetchInvoices() // Refresh list when modal closes
          }}
          jobId={jobId}
          jobTitle={jobTitle}
          quoteTotal={quoteTotal}
        />
      )}
    </div>
  )
}
