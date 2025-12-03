import { QuoteStatus } from '@/types'

interface QuoteStatusBadgeProps {
  status: QuoteStatus
  className?: string
}

export function QuoteStatusBadge({ status, className = '' }: QuoteStatusBadgeProps) {
  const statusConfig: Record<QuoteStatus, { label: string; bgColor: string; textColor: string; borderColor: string }> = {
    draft: {
      label: 'Draft',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      borderColor: 'border-gray-200',
    },
    sent: {
      label: 'Sent',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-200',
    },
    viewed: {
      label: 'Viewed',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-800',
      borderColor: 'border-purple-200',
    },
    accepted: {
      label: 'Accepted',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-200',
    },
    rejected: {
      label: 'Rejected',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      borderColor: 'border-red-200',
    },
    expired: {
      label: 'Expired',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800',
      borderColor: 'border-orange-200',
    },
  }

  const config = statusConfig[status]

  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border
        ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}
      `}
    >
      {config.label}
    </span>
  )
}
