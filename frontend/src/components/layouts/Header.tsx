import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Search,
  Calendar,
  Clock,
  User,
  LogOut,
  Settings,
  X,
  Car,
  Activity,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react'
import { formatDate, formatTime } from '../../utils/format'
import apiService from '../../services/api'
import { useDebounce } from '../../hooks/useDebounce'
import { toast } from 'react-hot-toast'

interface SearchResult {
  type: 'vehicle' | 'event'
  id: string
  title: string
  subtitle: string
  timestamp?: string
}

interface Notification {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message: string
  timestamp: string
  read: boolean
}

const Header: React.FC = () => {
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const notificationRef = useRef<HTMLDivElement>(null)

  // User dropdown state
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [user, setUser] = useState<any>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Load user data
  useEffect(() => {
    const currentUser = apiService.getCurrentUser()
    setUser(currentUser)
  }, [])

  // Load notifications
  useEffect(() => {
    fetchNotifications()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  // Perform search
  useEffect(() => {
    if (debouncedSearch.trim()) {
      performSearch(debouncedSearch)
    } else {
      setSearchResults([])
    }
  }, [debouncedSearch])

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    try {
      // Mock notifications for now - replace with real API call when available
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'success',
          title: 'Vehicle Registered',
          message: 'ABC-1234 has been successfully registered',
          timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
          read: false
        },
        {
          id: '2',
          type: 'warning',
          title: 'Unauthorized Entry Attempt',
          message: 'Unknown vehicle XYZ-5678 attempted entry',
          timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
          read: false
        },
        {
          id: '3',
          type: 'info',
          title: 'Session Completed',
          message: 'Vehicle DEF-9012 exited successfully',
          timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
          read: true
        },
        {
          id: '4',
          type: 'error',
          title: 'Camera Error',
          message: 'Entry camera connection lost',
          timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
          read: true
        }
      ]

      setNotifications(mockNotifications)
      setUnreadCount(mockNotifications.filter(n => !n.read).length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const performSearch = async (query: string) => {
    setSearchLoading(true)
    try {
      const results: SearchResult[] = []

      // Search vehicles
      const vehicleResponse = await apiService.getVehicles({
        search: query,
        page: 1,
        limit: 5
      })

      if (vehicleResponse.items) {
        vehicleResponse.items.forEach((vehicle: any) => {
          results.push({
            type: 'vehicle',
            id: vehicle.license_plate,
            title: vehicle.license_plate,
            subtitle: vehicle.owner_name || 'Unknown Owner'
          })
        })
      }

      // Search events
      const eventResponse = await apiService.getEvents({
        search: query,
        page: 1,
        limit: 5
      })

      if (eventResponse.items) {
        eventResponse.items.forEach((event: any) => {
          results.push({
            type: 'event',
            id: event.id,
            title: `${event.event_type.toUpperCase()}: ${event.plate_number}`,
            subtitle: `${event.barrier_action} - ${event.confidence}% confidence`,
            timestamp: event.timestamp
          })
        })
      }

      setSearchResults(results)
      setShowSearchResults(true)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSearchResultClick = (result: SearchResult) => {
    if (result.type === 'vehicle') {
      navigate(`/vehicles?search=${result.id}`)
    } else {
      navigate(`/events?search=${result.id}`)
    }
    setShowSearchResults(false)
    setSearchQuery('')
  }

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
    toast.success('All notifications marked as read')
  }

  const handleLogout = async () => {
    try {
      await apiService.logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Still navigate to login even if API call fails
      navigate('/login')
    }
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />
      default:
        return <Activity className="w-5 h-5 text-blue-400" />
    }
  }

  const getRelativeTime = (timestamp: string) => {
    const now = new Date()
    const past = new Date(timestamp)
    const diffMs = now.getTime() - past.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  return (
    <header className="fixed top-0 left-64 right-0 h-20 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 px-8 flex items-center justify-between shadow-lg z-40">
      {/* Search Bar */}
      <div className="flex-1 max-w-2xl" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
            placeholder="Search vehicles, events, or license plates..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
          />
          {searchLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <svg className="animate-spin h-5 w-5 text-slate-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}-${index}`}
                    onClick={() => handleSearchResultClick(result)}
                    className="w-full px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-b-0"
                  >
                    {result.type === 'vehicle' ? (
                      <Car className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Activity className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-200 truncate">{result.title}</div>
                      <div className="text-xs text-slate-400 truncate">{result.subtitle}</div>
                      {result.timestamp && (
                        <div className="text-xs text-slate-500 mt-0.5">{getRelativeTime(result.timestamp)}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {showSearchResults && searchQuery && searchResults.length === 0 && !searchLoading && (
            <div className="absolute top-full mt-2 w-full bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-4">
              <p className="text-sm text-slate-400 text-center">No results found for "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4 ml-8">
        {/* Date and Time */}
        <div className="flex items-center gap-4 px-6 py-3 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 text-slate-300">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">{formatDate(currentTime)}</span>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex items-center gap-2 text-blue-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-semibold font-mono">{formatTime(currentTime)}</span>
          </div>
        </div>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
          >
            <Bell className="w-5 h-5 text-slate-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Panel */}
          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-96 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">No notifications</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors ${
                        !notification.read ? 'bg-white/[0.02]' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="text-sm font-medium text-slate-200">{notification.title}</h4>
                            {!notification.read && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"
                                title="Mark as read"
                              />
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mb-2">{notification.message}</p>
                          <span className="text-xs text-slate-500">{getRelativeTime(notification.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 border-t border-white/10 text-center">
                  <button
                    onClick={() => {
                      navigate('/events')
                      setShowNotifications(false)
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    View all events
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-slate-200">{user?.name || user?.username || 'Admin'}</div>
              <div className="text-xs text-slate-400">{user?.role || 'Administrator'}</div>
            </div>
          </button>

          {/* User Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <div className="font-medium text-slate-200">{user?.name || user?.username || 'Admin'}</div>
                <div className="text-sm text-slate-400 mt-1">{user?.email || 'admin@alpr.local'}</div>
              </div>

              <div className="p-2">
                <button
                  onClick={() => {
                    navigate('/settings')
                    setShowUserMenu(false)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">Settings</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors text-left mt-1"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-400">Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
