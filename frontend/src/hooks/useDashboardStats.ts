import { useState, useEffect } from 'react'

export interface DashboardStats {
  occupancy: {
    total_capacity: number
    occupied: number
    available: number
    occupancy_rate: number
  }
  events: {
    total: number
    entries: number
    exits: number
    denied: number
    success_rate: number
  }
  active_sessions: number
  trend: {
    entries_change: number
    exits_change: number
  }
  hourly_data: Array<{
    hour: string
    entries: number
    exits: number
    occupancy: number
  }>
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        // TODO: Replace with actual API call
        // const response = await fetch('/api/v1/dashboard/stats')
        // const data = await response.json()

        // Mock data for now
        await new Promise(resolve => setTimeout(resolve, 500))

        setStats({
          occupancy: {
            total_capacity: 100,
            occupied: 67,
            available: 33,
            occupancy_rate: 67
          },
          events: {
            total: 194,
            entries: 102,
            exits: 87,
            denied: 5,
            success_rate: 97.4
          },
          active_sessions: 67,
          trend: {
            entries_change: 12.5,
            exits_change: -8.3
          },
          hourly_data: [
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
        })
        setError(null)
      } catch (err) {
        setError('Failed to fetch dashboard stats')
        console.error('Error fetching stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const refetch = () => {
    setLoading(true)
    fetchStats()
  }

  return { stats, loading, error, refetch }
}
