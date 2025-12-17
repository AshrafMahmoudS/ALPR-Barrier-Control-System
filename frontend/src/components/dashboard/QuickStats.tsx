import React from 'react'
import { PieChart, Car, CheckCircle, XCircle } from 'lucide-react'

interface QuickStatsProps {
  stats: any
}

const QuickStats: React.FC<QuickStatsProps> = ({ stats }) => {
  const occupied = stats?.occupancy.occupied || 0
  const available = stats?.occupancy.available || 0
  const total = stats?.occupancy.total_capacity || 100
  const occupancyRate = stats?.occupancy.occupancy_rate || 0

  // Calculate angles for donut chart
  const occupiedAngle = (occupied / total) * 360
  const availableAngle = (available / total) * 360

  // Create SVG path for donut segments
  const createDonutSegment = (startAngle: number, endAngle: number, radius: number, thickness: number) => {
    const innerRadius = radius - thickness
    const start = polarToCartesian(50, 50, radius, endAngle)
    const end = polarToCartesian(50, 50, radius, startAngle)
    const innerStart = polarToCartesian(50, 50, innerRadius, endAngle)
    const innerEnd = polarToCartesian(50, 50, innerRadius, startAngle)

    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1

    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} L ${innerEnd.x} ${innerEnd.y} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${innerStart.x} ${innerStart.y} Z`
  }

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl">
          <PieChart className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Parking Overview</h3>
          <p className="text-sm text-slate-500">Current status</p>
        </div>
      </div>

      {/* Donut Chart */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-48 h-48">
          <svg viewBox="0 0 100 100" className="transform -rotate-90">
            {/* Available segment */}
            <path
              d={createDonutSegment(0, availableAngle, 45, 12)}
              fill="url(#availableGradient)"
              className="transition-all duration-500"
            />
            {/* Occupied segment */}
            <path
              d={createDonutSegment(availableAngle, 360, 45, 12)}
              fill="url(#occupiedGradient)"
              className="transition-all duration-500"
            />

            {/* Gradients */}
            <defs>
              <linearGradient id="occupiedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
              <linearGradient id="availableGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-center">
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {occupancyRate.toFixed(0)}%
              </p>
              <p className="text-xs text-slate-500 mt-1">Occupied</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Car className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Occupied</p>
              <p className="text-xs text-slate-500">Currently parked</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-600">{occupied}</p>
            <p className="text-xs text-slate-500">vehicles</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Available</p>
              <p className="text-xs text-slate-500">Free spots</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">{available}</p>
            <p className="text-xs text-slate-500">spots</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <XCircle className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Total Capacity</p>
              <p className="text-xs text-slate-500">Maximum spots</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-700">{total}</p>
            <p className="text-xs text-slate-500">spots</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuickStats
