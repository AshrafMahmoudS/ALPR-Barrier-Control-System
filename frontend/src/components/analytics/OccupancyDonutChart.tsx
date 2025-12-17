import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Card, CardHeader, CardBody } from '../common/Card'
import { PieChart as PieChartIcon, Car, CheckCircle } from 'lucide-react'
import { formatNumber, formatPercentage } from '../../utils/format'

interface OccupancyDonutChartProps {
  occupied: number
  available: number
  total: number
  occupancyRate: number
}

const OccupancyDonutChart: React.FC<OccupancyDonutChartProps> = ({
  occupied,
  available,
  total,
  occupancyRate
}) => {
  const data = [
    { name: 'Occupied', value: occupied, color: '#3b82f6' },
    { name: 'Available', value: available, color: '#22c55e' },
  ]

  return (
    <Card padding="md" hover>
      <CardHeader
        icon={<PieChartIcon className="w-6 h-6 text-primary-600" />}
        title="Parking Overview"
        subtitle="Current status"
      />

      <CardBody>
        <div className="h-64 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-4xl font-bold text-gradient-primary">
                {formatPercentage(occupancyRate, 0)}
              </p>
              <p className="text-sm text-secondary-500 mt-1">Occupied</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl border border-primary-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Car className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-secondary-700">Occupied</p>
                <p className="text-xs text-secondary-500">Currently parked</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary-600">{formatNumber(occupied)}</p>
              <p className="text-xs text-secondary-500">vehicles</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-success-50 to-success-100 rounded-xl border border-success-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <CheckCircle className="w-5 h-5 text-success-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-secondary-700">Available</p>
                <p className="text-xs text-secondary-500">Free spots</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-success-600">{formatNumber(available)}</p>
              <p className="text-xs text-secondary-500">spots</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-secondary-50 to-secondary-100 rounded-xl border border-secondary-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <PieChartIcon className="w-5 h-5 text-secondary-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-secondary-700">Total Capacity</p>
                <p className="text-xs text-secondary-500">Maximum spots</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-secondary-700">{formatNumber(total)}</p>
              <p className="text-xs text-secondary-500">spots</p>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

export default OccupancyDonutChart
