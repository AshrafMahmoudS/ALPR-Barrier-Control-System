import React, { useState, useEffect } from 'react'
import { Clock, ArrowUpCircle, ArrowDownCircle, XCircle, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import apiService from '../../services/api'
import websocketService, { WebSocketMessage } from '../../services/websocket'
import { formatRelativeTime } from '../../utils/format'
import Badge from '../common/Badge'

interface Event {
  id: number
  event_type: 'entry' | 'exit' | 'denied'
  license_plate: string
  timestamp: string
  camera_location: string
  confidence?: number
}

const RecentEvents: React.FC = () => {
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvents()

    // Subscribe to WebSocket for real-time event updates
    const unsubscribe = websocketService.subscribe((message: WebSocketMessage) => {
      if (message.type === 'event') {
        // Add new event to the top of the list
        setEvents((prevEvents) => [message.data, ...prevEvents.slice(0, 5)])
      }
    })

    return () => unsubscribe()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await apiService.getEvents({ limit: 6, offset: 0 })
      setEvents(response.items || [])
    } catch (error) {
      console.error('Failed to fetch recent events:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEventIcon = (type: Event['event_type']) => {
    switch (type) {
      case 'entry':
        return <ArrowUpCircle className="w-5 h-5 text-green-400" />
      case 'exit':
        return <ArrowDownCircle className="w-5 h-5 text-purple-400" />
      case 'denied':
        return <XCircle className="w-5 h-5 text-red-400" />
    }
  }

  const getEventBadge = (type: Event['event_type']) => {
    switch (type) {
      case 'entry':
        return <Badge variant="success" size="sm">Entry</Badge>
      case 'exit':
        return <Badge variant="primary" size="sm">Exit</Badge>
      case 'denied':
        return <Badge variant="danger" size="sm">Denied</Badge>
    }
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
            <Clock className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-200">Recent Events</h3>
            <p className="text-sm text-slate-400">Latest activity</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/events')}
          className="text-sm text-blue-400 font-semibold hover:text-blue-300 transition-colors"
        >
          View All
        </button>
      </div>

      {/* Events List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {events.map((event, index) => (
          <div
            key={event.id}
            className="glass-strong rounded-xl p-4 transition-all duration-300 hover:transform hover:translate-y-[-2px] hover:shadow-lg animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 glass rounded-lg">
                  {getEventIcon(event.event_type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-200 font-mono">{event.license_plate}</p>
                    {getEventBadge(event.event_type)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{event.camera_location}</p>
                </div>
              </div>
              {event.event_type !== 'denied' && (
                <CheckCircle className="w-5 h-5 text-green-400" />
              )}
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                <span>{formatRelativeTime(event.timestamp)}</span>
              </div>
              {event.confidence && (
                <span className="text-xs text-slate-400">
                  {(event.confidence * 100).toFixed(0)}% confidence
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty state (if no events) */}
      {events.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 glass rounded-full mb-4">
            <Clock className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-300 font-medium mb-1">No recent events</p>
          <p className="text-slate-500 text-sm">Events will appear here as they occur</p>
        </div>
      )}
    </div>
  )
}

export default RecentEvents
