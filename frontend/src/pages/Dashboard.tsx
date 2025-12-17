import React, { useEffect, useState } from 'react'
import {
  Car,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  CheckCircle,
  BarChart3,
  Lock,
  Unlock,
} from 'lucide-react'
import { useDashboardStats } from '../hooks/useDashboardStats'
import OccupancyLineChart from '../components/analytics/OccupancyLineChart'
import OccupancyDonutChart from '../components/analytics/OccupancyDonutChart'
import RecentEvents from '../components/dashboard/RecentEvents'
import ActiveSessions from '../components/dashboard/ActiveSessions'
import { Card, CardHeader, CardBody } from '../components/common/Card'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'
import { formatNumber, formatPercentage } from '../utils/format'
import { cn } from '../utils/cn'
import apiService from '../services/api'
import websocketService, { WebSocketMessage } from '../services/websocket'
import toast from 'react-hot-toast'

interface StatCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon: React.ReactNode
  trend?: number
  colorClass: string
  iconBgClass: string
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  colorClass,
  iconBgClass,
}) => {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-400 mb-2">{title}</p>
          <h3 className={cn('text-4xl font-bold mb-1', colorClass)}>
            {typeof value === 'number' ? formatNumber(value) : value}
          </h3>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className={cn('p-3 rounded-xl', iconBgClass)}>
          {icon}
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-4 flex items-center gap-2">
          {trend >= 0 ? (
            <>
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold text-green-400">
                +{formatPercentage(trend)}
              </span>
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />
              <span className="text-sm font-semibold text-red-400">
                {formatPercentage(trend)}
              </span>
            </>
          )}
          <span className="text-xs text-slate-500">vs last period</span>
        </div>
      )}
    </div>
  )
}

const Dashboard: React.FC = () => {
  const { stats, loading, error, refetch } = useDashboardStats()
  const [isEntryBarrierOpen, setIsEntryBarrierOpen] = useState(false)
  const [isExitBarrierOpen, setIsExitBarrierOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // WebSocket subscription for real-time updates
  useEffect(() => {
    const unsubscribe = websocketService.subscribe((message: WebSocketMessage) => {
      if (message.type === 'stats' || message.type === 'event') {
        // Refresh dashboard stats when new data arrives
        refetch()
      }
    })

    return () => {
      unsubscribe()
    }
  }, [refetch])

  // Barrier control functions
  const handleOpenEntryBarrier = async () => {
    setActionLoading('entry-open')
    try {
      await apiService.openEntryBarrier()
      setIsEntryBarrierOpen(true)
      // Auto-close after 10 seconds
      setTimeout(() => {
        setIsEntryBarrierOpen(false)
      }, 10000)
    } catch (error) {
      console.error('Failed to open entry barrier:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleOpenExitBarrier = async () => {
    setActionLoading('exit-open')
    try {
      await apiService.openExitBarrier()
      setIsExitBarrierOpen(true)
      // Auto-close after 10 seconds
      setTimeout(() => {
        setIsExitBarrierOpen(false)
      }, 10000)
    } catch (error) {
      console.error('Failed to open exit barrier:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleViewAllEvents = () => {
    window.location.href = '/events'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner w-16 h-16"></div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-400 font-semibold mb-2">Error Loading Dashboard</p>
          <p className="text-slate-400">{error || 'Failed to load statistics'}</p>
          <button
            onClick={() => refetch()}
            className="btn btn-primary mt-4"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gradient-blue mb-2">
            Dashboard
          </h1>
          <p className="text-slate-400 text-lg">
            Overview of parking system performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="success" size="lg" dot>
            All Systems Operational
          </Badge>
          <Badge variant="primary" size="lg">
            {websocketService.isConnected() ? 'Live' : 'Offline'}
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Occupied"
          value={stats.occupancy.occupied}
          subtitle={`${formatPercentage(stats.occupancy.occupancy_rate, 0)} capacity`}
          icon={<Car className="w-6 h-6 text-blue-400" />}
          trend={stats.trend.entries_change}
          colorClass="text-gradient-blue"
          iconBgClass="glass"
        />

        <StatCard
          title="New Entries"
          value={stats.events.entries}
          subtitle="Today's entries"
          icon={<ArrowUpRight className="w-6 h-6 text-green-400" />}
          trend={stats.trend.entries_change}
          colorClass="text-gradient-green"
          iconBgClass="glass"
        />

        <StatCard
          title="New Exits"
          value={stats.events.exits}
          subtitle="Today's exits"
          icon={<ArrowDownRight className="w-6 h-6 text-purple-400" />}
          trend={stats.trend.exits_change}
          colorClass="text-gradient-purple"
          iconBgClass="glass"
        />

        <StatCard
          title="Available Spots"
          value={stats.occupancy.available}
          subtitle={`of ${stats.occupancy.total_capacity} total`}
          icon={<CheckCircle className="w-6 h-6 text-orange-400" />}
          colorClass="text-orange-400"
          iconBgClass="glass"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <OccupancyLineChart data={stats.hourly_data} />
        <OccupancyDonutChart
          occupied={stats.occupancy.occupied}
          available={stats.occupancy.available}
          total={stats.occupancy.total_capacity}
          occupancyRate={stats.occupancy.occupancy_rate}
        />
      </div>

      {/* Secondary Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentEvents />
        <ActiveSessions count={stats.active_sessions} />
      </div>

      {/* Bottom Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* System Status */}
        <Card padding="md">
          <CardHeader
            icon={<CheckCircle className="w-6 h-6 text-green-400" />}
            title="System Status"
            subtitle="All systems operational"
          />
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Entry Camera</span>
                <Badge variant="success" size="sm" dot>Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Exit Camera</span>
                <Badge variant="warning" size="sm">Standby</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">ALPR Engine</span>
                <Badge variant="success" size="sm" dot>Running</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Database</span>
                <Badge variant="success" size="sm" dot>Connected</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">WebSocket</span>
                <Badge variant={websocketService.isConnected() ? "success" : "danger"} size="sm" dot>
                  {websocketService.isConnected() ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Performance Metrics */}
        <Card padding="md">
          <CardHeader
            icon={<BarChart3 className="w-6 h-6 text-blue-400" />}
            title="Performance"
            subtitle="Recognition accuracy"
          />
          <CardBody>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-300">Success Rate</span>
                  <span className="text-sm font-semibold text-green-400">
                    {formatPercentage(stats.events.success_rate)}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${stats.events.success_rate}%`,
                      background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)'
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-300">System Uptime</span>
                  <span className="text-sm font-semibold text-blue-400">99.9%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: '99.9%',
                      background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)'
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-300">Avg Response</span>
                  <span className="text-sm font-semibold text-purple-400">1.2s</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: '85%',
                      background: 'linear-gradient(90deg, #a855f7 0%, #9333ea 100%)'
                    }}
                  />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <Card padding="md">
          <CardHeader
            icon={<Activity className="w-6 h-6 text-indigo-400" />}
            title="Quick Actions"
            subtitle="Barrier controls"
          />
          <CardBody>
            <div className="space-y-3">
              <Button
                variant="primary"
                fullWidth
                onClick={handleOpenEntryBarrier}
                isLoading={actionLoading === 'entry-open'}
                leftIcon={isEntryBarrierOpen ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              >
                {isEntryBarrierOpen ? 'Entry Open' : 'Open Entry Barrier'}
              </Button>

              <Button
                variant="success"
                fullWidth
                onClick={handleOpenExitBarrier}
                isLoading={actionLoading === 'exit-open'}
                leftIcon={isExitBarrierOpen ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              >
                {isExitBarrierOpen ? 'Exit Open' : 'Open Exit Barrier'}
              </Button>

              <Button
                variant="ghost"
                fullWidth
                onClick={handleViewAllEvents}
              >
                View All Events
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
