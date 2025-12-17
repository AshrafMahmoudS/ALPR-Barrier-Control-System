import React, { useState, useEffect } from 'react'
import { Car, Clock, MapPin, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import apiService from '../../services/api'
import websocketService, { WebSocketMessage } from '../../services/websocket'
import { formatTime, formatDuration } from '../../utils/format'
import Button from '../common/Button'
import toast from 'react-hot-toast'

interface ActiveSessionsProps {
  count: number
}

interface Session {
  id: number
  vehicle_id: number
  license_plate: string
  entry_time: string
  exit_time?: string
  duration_minutes?: number
  parking_fee?: number
  vehicle?: {
    license_plate: string
    vehicle_type?: string
    owner_name?: string
  }
}

const ActiveSessions: React.FC<ActiveSessionsProps> = ({ count }) => {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [endingSession, setEndingSession] = useState<number | null>(null)

  useEffect(() => {
    fetchSessions()

    // Subscribe to WebSocket for real-time session updates
    const unsubscribe = websocketService.subscribe((message: WebSocketMessage) => {
      if (message.type === 'session' || message.type === 'event') {
        fetchSessions()
      }
    })

    return () => unsubscribe()
  }, [])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const response = await apiService.getActiveSessions({ limit: 5 })
      setSessions(response.items || [])
    } catch (error) {
      console.error('Failed to fetch active sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEndSession = async (sessionId: number, licensePlate: string) => {
    setEndingSession(sessionId)
    try {
      await apiService.endSession(sessionId)
      toast.success(`Session ended for ${licensePlate}`)
      fetchSessions()
    } catch (error) {
      console.error('Failed to end session:', error)
      toast.error('Failed to end session')
    } finally {
      setEndingSession(null)
    }
  }

  const calculateDuration = (entryTime: string): string => {
    const entry = new Date(entryTime)
    const now = new Date()
    const diffMs = now.getTime() - entry.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    return formatDuration(diffMins)
  }

  const getDurationColor = (minutes: number) => {
    const hours = minutes / 60
    if (hours >= 4) return 'text-red-400 bg-red-500/20 border-red-500/30'
    if (hours >= 2) return 'text-orange-400 bg-orange-500/20 border-orange-500/30'
    return 'text-green-400 bg-green-500/20 border-green-500/30'
  }

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center h-48">
          <div className="spinner w-8 h-8"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 glass rounded-xl">
            <Car className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-200">Active Sessions</h3>
            <p className="text-sm text-slate-400">{sessions.length} vehicles currently parked</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/sessions')}
          className="text-sm text-blue-400 font-semibold hover:text-blue-300 transition-colors"
        >
          View All
        </button>
      </div>

      {/* Sessions List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {sessions.map((session, index) => {
          const duration = calculateDuration(session.entry_time)
          const durationMinutes = Math.floor((new Date().getTime() - new Date(session.entry_time).getTime()) / 60000)

          return (
            <div
              key={session.id}
              className="glass-strong rounded-xl p-4 transition-all duration-300 hover:transform hover:translate-y-[-2px] hover:shadow-lg animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 glass rounded-lg">
                    <Car className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-200 font-mono text-lg">
                      {session.vehicle?.license_plate || session.license_plate}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">
                        {session.vehicle?.vehicle_type || 'Vehicle'}
                      </span>
                      <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                      <span className="text-xs text-slate-500">
                        Entry: {formatTime(session.entry_time)}
                      </span>
                    </div>
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded-lg border text-xs font-semibold ${getDurationColor(
                    durationMinutes
                  )}`}
                >
                  {duration}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Parking Zone {String.fromCharCode(65 + (session.id % 3))}</span>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleEndSession(session.id, session.vehicle?.license_plate || session.license_plate)}
                  isLoading={endingSession === session.id}
                  leftIcon={<XCircle className="w-3 h-3" />}
                >
                  End
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty state (if no sessions) */}
      {sessions.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 glass rounded-full mb-4">
            <Car className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-300 font-medium mb-1">No active sessions</p>
          <p className="text-slate-500 text-sm">Parking lot is currently empty</p>
        </div>
      )}

      {/* Summary footer */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse"></div>
            <span className="text-slate-400">Live monitoring</span>
          </div>
          <span className="text-slate-500">Updated just now</span>
        </div>
      </div>
    </div>
  )
}

export default ActiveSessions
