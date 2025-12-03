'use client'

import { JobStatus } from '@/types'

interface JobStatusBadgeProps {
  status: JobStatus
}

export function JobStatusBadge({ status }: JobStatusBadgeProps) {
  const getStatusConfig = (status: JobStatus) => {
    switch (status) {
      case 'quoted':
        return {
          label: 'Quoted',
          className: 'bg-yellow-100 text-yellow-800',
        }
      case 'scheduled':
        return {
          label: 'Scheduled',
          className: 'bg-blue-100 text-blue-800',
        }
      case 'in_progress':
        return {
          label: 'In Progress',
          className: 'bg-orange-100 text-orange-800',
        }
      case 'complete':
        return {
          label: 'Complete',
          className: 'bg-green-100 text-green-800',
        }
      case 'invoiced':
        return {
          label: 'Invoiced',
          className: 'bg-purple-100 text-purple-800',
        }
      case 'paid':
        return {
          label: 'Paid',
          className: 'bg-gray-100 text-gray-800',
        }
      default:
        return {
          label: status,
          className: 'bg-gray-100 text-gray-800',
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}
