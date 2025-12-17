import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number | string
  subtitle: string
  icon: React.ReactNode
  trend?: number
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red'
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-100',
    icon: 'text-blue-600',
    gradient: 'from-blue-500 to-blue-600',
    border: 'border-blue-200'
  },
  green: {
    bg: 'bg-green-100',
    icon: 'text-green-600',
    gradient: 'from-green-500 to-emerald-600',
    border: 'border-green-200'
  },
  purple: {
    bg: 'bg-purple-100',
    icon: 'text-purple-600',
    gradient: 'from-purple-500 to-purple-600',
    border: 'border-purple-200'
  },
  orange: {
    bg: 'bg-orange-100',
    icon: 'text-orange-600',
    gradient: 'from-orange-500 to-orange-600',
    border: 'border-orange-200'
  },
  red: {
    bg: 'bg-red-100',
    icon: 'text-red-600',
    gradient: 'from-red-500 to-red-600',
    border: 'border-red-200'
  }
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color
}) => {
  const colors = colorClasses[color]

  return (
    <div className={`bg-white rounded-2xl shadow-xl p-6 border ${colors.border} hover:shadow-2xl transition-all duration-300 hover:-translate-y-1`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-slate-600 text-sm font-medium mb-2">{title}</p>
          <div className="flex items-baseline gap-2 mb-1">
            <h3 className={`text-4xl font-bold bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent`}>
              {value}
            </h3>
            {trend !== undefined && (
              <span
                className={`flex items-center gap-1 text-sm font-semibold ${
                  trend >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {Math.abs(trend).toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-slate-500 text-xs">{subtitle}</p>
        </div>
        <div className={`p-3 ${colors.bg} rounded-xl`}>
          <div className={colors.icon}>{icon}</div>
        </div>
      </div>
    </div>
  )
}

export default StatCard
