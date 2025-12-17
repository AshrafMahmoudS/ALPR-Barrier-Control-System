import React, { useState, useEffect } from 'react'
import { Calendar, Download, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { Card, CardHeader, CardBody, Button } from '../components/common'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { apiService } from '../services/api'
import { toast } from 'react-hot-toast'

interface AnalyticsData {
  traffic_by_hour: Array<{ hour: string; entries: number; exits: number }>
  events_by_type: Array<{ name: string; value: number }>
  vehicle_types: Array<{ name: string; value: number }>
  daily_stats: Array<{ date: string; total: number; entries: number; exits: number; denied: number }>
  success_rate: Array<{ date: string; rate: number }>
  avg_processing_time: Array<{ date: string; time: number }>
}

interface Stats {
  total_events: number
  total_entries: number
  total_exits: number
  total_denied: number
  success_rate: number
  avg_processing_time: number
  trend_percentage: number
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('7d')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange, dateFrom, dateTo])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const params: any = {}

      if (dateFrom && dateTo) {
        params.date_from = dateFrom
        params.date_to = dateTo
      } else {
        params.range = dateRange
      }

      const response = await apiService.getAnalytics(params)
      setAnalyticsData(response.data)
      setStats(response.stats)
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      toast.success('Exporting analytics report...')
      // Export logic would go here
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export analytics')
    }
  }

  if (loading || !analyticsData || !stats) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Analytics</h1>
            <p className="text-slate-400 mt-1">Comprehensive parking statistics and insights</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardBody>
                <div className="animate-pulse">
                  <div className="h-4 bg-white/10 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-white/10 rounded w-3/4"></div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Analytics</h1>
          <p className="text-slate-400 mt-1">Comprehensive parking statistics and insights</p>
        </div>
        <Button variant="secondary" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Date Range Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm text-slate-400 mb-2">Quick Range</label>
              <div className="flex gap-2">
                {(['7d', '30d', '90d', 'all'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setDateRange(range)
                      setDateFrom('')
                      setDateTo('')
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      dateRange === range && !dateFrom && !dateTo
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {range === '7d' ? 'Last 7 Days' :
                     range === '30d' ? 'Last 30 Days' :
                     range === '90d' ? 'Last 90 Days' :
                     'All Time'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Total Events</p>
                <p className="text-3xl font-bold text-slate-100">{stats.total_events}</p>
                <div className="flex items-center gap-1 mt-2">
                  {stats.trend_percentage >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`text-sm ${stats.trend_percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {Math.abs(stats.trend_percentage).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Total Entries</p>
                <p className="text-3xl font-bold text-green-400">{stats.total_entries}</p>
                <p className="text-xs text-slate-500 mt-2">Vehicles entered</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Total Exits</p>
                <p className="text-3xl font-bold text-blue-400">{stats.total_exits}</p>
                <p className="text-xs text-slate-500 mt-2">Vehicles exited</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <TrendingDown className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Success Rate</p>
                <p className="text-3xl font-bold text-purple-400">{stats.success_rate.toFixed(1)}%</p>
                <p className="text-xs text-slate-500 mt-2">Denied: {stats.total_denied}</p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Activity className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Traffic by Hour */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-slate-100">Traffic by Hour</h2>
          <p className="text-sm text-slate-400">Peak hours analysis</p>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData.traffic_by_hour}>
              <defs>
                <linearGradient id="colorEntries" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="hour" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#e2e8f0'
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="entries"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorEntries)"
                name="Entries"
              />
              <Area
                type="monotone"
                dataKey="exits"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorExits)"
                name="Exits"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Daily Trends */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-slate-100">Daily Trends</h2>
          <p className="text-sm text-slate-400">Events breakdown over time</p>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.daily_stats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#e2e8f0'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="entries" stroke="#10b981" strokeWidth={2} name="Entries" />
              <Line type="monotone" dataKey="exits" stroke="#3b82f6" strokeWidth={2} name="Exits" />
              <Line type="monotone" dataKey="denied" stroke="#ef4444" strokeWidth={2} name="Denied" />
            </LineChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Event Types Distribution */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-slate-100">Event Distribution</h2>
            <p className="text-sm text-slate-400">By event type</p>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.events_by_type}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.events_by_type.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#e2e8f0'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Vehicle Types */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-slate-100">Vehicle Types</h2>
            <p className="text-sm text-slate-400">Distribution by type</p>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.vehicle_types}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#e2e8f0'
                  }}
                />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Success Rate Trend */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-slate-100">Success Rate Trend</h2>
            <p className="text-sm text-slate-400">Barrier operation success</p>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.success_rate}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#e2e8f0'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="#8b5cf6"
                  fillOpacity={1}
                  fill="url(#colorRate)"
                  name="Success Rate %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Processing Time */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-slate-100">Average Processing Time</h2>
            <p className="text-sm text-slate-400">ALPR processing performance (ms)</p>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.avg_processing_time}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#e2e8f0'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="time"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Avg Time (ms)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Additional Stats */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-slate-100">Performance Metrics</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-slate-400 mb-2">Average Processing Time</p>
              <p className="text-3xl font-bold text-slate-100">{stats.avg_processing_time.toFixed(0)}<span className="text-lg text-slate-400">ms</span></p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-400 mb-2">Peak Hour Traffic</p>
              <p className="text-3xl font-bold text-slate-100">
                {Math.max(...analyticsData.traffic_by_hour.map(h => h.entries + h.exits))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-400 mb-2">Total Denied Access</p>
              <p className="text-3xl font-bold text-red-400">{stats.total_denied}</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

export default Analytics
