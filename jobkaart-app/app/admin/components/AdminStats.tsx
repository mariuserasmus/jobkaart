interface StatCardProps {
  title: string
  value: string | number
  icon: string
  iconBgColor: string
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function StatCard({
  title,
  value,
  icon,
  iconBgColor,
  description,
  trend,
}: StatCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div
              className={`flex items-center justify-center h-12 w-12 rounded-md ${iconBgColor} text-white text-2xl font-bold`}
            >
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {trend && (
                  <div
                    className={`ml-2 flex items-baseline text-sm font-semibold ${
                      trend.isPositive ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                  </div>
                )}
              </dd>
              {description && (
                <dd className="mt-1 text-xs text-gray-600">{description}</dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
