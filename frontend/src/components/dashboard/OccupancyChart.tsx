import React from 'react'
import { BarChart3 } from 'lucide-react'

interface OccupancyChartProps {
  stats: any
}

const OccupancyChart: React.FC<OccupancyChartProps> = ({ stats }) => {
  // Mock data for the chart - replace with real data from API
  const hourlyData = [
    { hour: '00:00', entries: 2, exits: 3, occupancy: 45 },
    { hour: '02:00', entries: 1, exits: 2, occupancy: 44 },
    { hour: '04:00', entries: 0, exits: 1, occupancy: 43 },
    { hour: '06:00', entries: 8, exits: 3, occupancy: 48 },
    { hour: '08:00', entries: 25, exits: 5, occupancy: 68 },
    { hour: '10:00', entries: 15, exits: 8, occupancy: 75 },
    { hour: '12:00', entries: 12, exits: 18, occupancy: 69 },
    { hour: '14:00', entries: 18, exits: 10, occupancy: 77 },
    { hour: '16:00', entries: 10, exits: 15, occupancy: 72 },
    { hour: '18:00', entries: 8, exits: 25, occupancy: 55 },
    { hour: '20:00', entries: 5, exits: 12, occupancy: 48 },
    { hour: '22:00', entries: 3, exits: 8, occupancy: 43 }
  ]

  const maxValue = Math.max(...hourlyData.map(d => Math.max(d.entries, d.exits, d.occupancy)))

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Occupancy Statistics</h3>
            <p className="text-sm text-slate-500">Last 24 hours activity</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
            <span className="text-slate-600">Entries</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
            <span className="text-slate-600">Exits</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
            <span className="text-slate-600">Occupancy</span>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="relative h-64">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-slate-400 w-8">
          <span>{maxValue}</span>
          <span>{Math.round(maxValue * 0.75)}</span>
          <span>{Math.round(maxValue * 0.5)}</span>
          <span>{Math.round(maxValue * 0.25)}</span>
          <span>0</span>
        </div>

        {/* Chart bars */}
        <div className="absolute left-10 right-0 top-0 bottom-8 flex items-end justify-between gap-1">
          {hourlyData.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-1 group">
              {/* Bars container */}
              <div className="w-full flex items-end justify-center gap-0.5 h-full">
                {/* Entries bar */}
                <div className="relative flex-1 flex flex-col justify-end">
                  <div
                    className="w-full bg-gradient-to-t from-green-500 to-emerald-500 rounded-t-sm transition-all duration-300 group-hover:opacity-80"
                    style={{ height: `${(data.entries / maxValue) * 100}%` }}
                  >
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      {data.entries}
                    </span>
                  </div>
                </div>

                {/* Exits bar */}
                <div className="relative flex-1 flex flex-col justify-end">
                  <div
                    className="w-full bg-gradient-to-t from-purple-500 to-pink-500 rounded-t-sm transition-all duration-300 group-hover:opacity-80"
                    style={{ height: `${(data.exits / maxValue) * 100}%` }}
                  >
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      {data.exits}
                    </span>
                  </div>
                </div>

                {/* Occupancy bar */}
                <div className="relative flex-1 flex flex-col justify-end">
                  <div
                    className="w-full bg-gradient-to-t from-blue-500 to-indigo-500 rounded-t-sm transition-all duration-300 group-hover:opacity-80"
                    style={{ height: `${(data.occupancy / maxValue) * 100}%` }}
                  >
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      {data.occupancy}
                    </span>
                  </div>
                </div>
              </div>

              {/* X-axis label */}
              <span className="text-xs text-slate-500 mt-2">{data.hour}</span>
            </div>
          ))}
        </div>

        {/* Grid lines */}
        <div className="absolute left-10 right-0 top-0 bottom-8 pointer-events-none">
          {[0, 0.25, 0.5, 0.75, 1].map((percent) => (
            <div
              key={percent}
              className="absolute w-full border-t border-slate-100"
              style={{ bottom: `${percent * 100}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default OccupancyChart
