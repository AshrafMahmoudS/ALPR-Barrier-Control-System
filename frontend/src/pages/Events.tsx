import React, { useState, useEffect } from 'react'
import { Search, Calendar, Download, X, Eye, Clock } from 'lucide-react'
import { Card, CardHeader, CardBody, Badge, Button, Table, Pagination, Modal, EmptyState } from '../components/common'
import { usePagination } from '../hooks/usePagination'
import { useDebounce } from '../hooks/useDebounce'
import { apiService } from '../services/api'
import { websocketService } from '../services/websocket'
import { toast } from 'react-hot-toast'

interface Event {
  id: string
  timestamp: string
  plate_number: string
  event_type: 'entry' | 'exit'
  camera_id: string
  confidence: number
  vehicle_found: boolean
  barrier_action: 'opened' | 'denied' | 'manual' | 'error'
  processing_time_ms: number
  image_path?: string
  vehicle_details?: {
    owner_name: string
    vehicle_type: string
    status: string
  }
}

interface EventStats {
  total: number
  entries: number
  exits: number
  denied: number
  success_rate: number
}

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)
  const [stats, setStats] = useState<EventStats>({
    total: 0,
    entries: 0,
    exits: 0,
    denied: 0,
    success_rate: 0
  })

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('')
  const [actionFilter, setActionFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Modals
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Pagination
  const pagination = usePagination({
    initialPage: 1,
    initialPageSize: 20,
    totalItems
  })

  // Fetch events
  const fetchEvents = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: pagination.currentPage,
        page_size: pagination.pageSize
      }

      if (debouncedSearch) params.search = debouncedSearch
      if (eventTypeFilter) params.event_type = eventTypeFilter
      if (actionFilter) params.barrier_action = actionFilter
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo

      const response = await apiService.getEvents(params)
      setEvents(response.items)
      setTotalItems(response.total)

      // Calculate stats
      const statsData: EventStats = {
        total: response.total,
        entries: response.items.filter((e: Event) => e.event_type === 'entry').length,
        exits: response.items.filter((e: Event) => e.event_type === 'exit').length,
        denied: response.items.filter((e: Event) => e.barrier_action === 'denied').length,
        success_rate: response.total > 0
          ? ((response.items.filter((e: Event) => e.barrier_action === 'opened').length / response.total) * 100)
          : 0
      }
      setStats(statsData)
    } catch (error) {
      console.error('Failed to fetch events:', error)
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  // WebSocket subscription for real-time updates
  useEffect(() => {
    const handleNewEvent = (event: Event) => {
      setEvents(prev => [event, ...prev.slice(0, pagination.pageSize - 1)])
      setStats(prev => ({
        ...prev,
        total: prev.total + 1,
        entries: event.event_type === 'entry' ? prev.entries + 1 : prev.entries,
        exits: event.event_type === 'exit' ? prev.exits + 1 : prev.exits,
        denied: event.barrier_action === 'denied' ? prev.denied + 1 : prev.denied
      }))
      toast.success(`New ${event.event_type} event: ${event.plate_number}`)
    }

    const unsubscribe = websocketService.subscribe((message) => {
      if (message.type === 'event') {
        handleNewEvent(message.data)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [pagination.pageSize])

  // Fetch events on filter/pagination change
  useEffect(() => {
    fetchEvents()
  }, [
    pagination.currentPage,
    pagination.pageSize,
    debouncedSearch,
    eventTypeFilter,
    actionFilter,
    dateFrom,
    dateTo
  ])

  // Handle view details
  const handleViewDetails = (event: Event) => {
    setSelectedEvent(event)
    setShowDetailsModal(true)
  }

  // Handle export
  const handleExport = async () => {
    try {
      const params: any = {}
      if (debouncedSearch) params.search = debouncedSearch
      if (eventTypeFilter) params.event_type = eventTypeFilter
      if (actionFilter) params.barrier_action = actionFilter
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo

      const response = await apiService.getEvents({ ...params, page_size: 10000 })
      const csvContent = convertToCSV(response.items)
      downloadCSV(csvContent, `events_${new Date().toISOString().split('T')[0]}.csv`)
      toast.success('Events exported successfully')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export events')
    }
  }

  const convertToCSV = (data: Event[]) => {
    const headers = ['Timestamp', 'Plate Number', 'Event Type', 'Camera', 'Confidence', 'Action', 'Processing Time (ms)', 'Owner', 'Vehicle Type']
    const rows = data.map(event => [
      event.timestamp,
      event.plate_number,
      event.event_type,
      event.camera_id,
      `${event.confidence}%`,
      event.barrier_action,
      event.processing_time_ms,
      event.vehicle_details?.owner_name || 'N/A',
      event.vehicle_details?.vehicle_type || 'N/A'
    ])
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setEventTypeFilter('')
    setActionFilter('')
    setDateFrom('')
    setDateTo('')
    pagination.goToFirstPage()
  }

  const hasActiveFilters = searchQuery || eventTypeFilter || actionFilter || dateFrom || dateTo

  // Format relative time
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date()
    const eventTime = new Date(timestamp)
    const diffMs = now.getTime() - eventTime.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  // Table columns
  const columns = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      sortable: true,
      render: (event: Event) => (
        <div className="flex flex-col">
          <span className="text-sm text-slate-200">
            {new Date(event.timestamp).toLocaleString()}
          </span>
          <span className="text-xs text-slate-500">
            {formatRelativeTime(event.timestamp)}
          </span>
        </div>
      )
    },
    {
      key: 'plate_number',
      label: 'Plate Number',
      sortable: true,
      render: (event: Event) => (
        <span className="font-mono font-semibold text-blue-400">
          {event.plate_number}
        </span>
      )
    },
    {
      key: 'event_type',
      label: 'Event Type',
      sortable: true,
      render: (event: Event) => (
        <Badge variant={event.event_type === 'entry' ? 'success' : 'info'}>
          {event.event_type.toUpperCase()}
        </Badge>
      )
    },
    {
      key: 'camera_id',
      label: 'Camera',
      sortable: true,
      render: (event: Event) => (
        <span className="text-sm text-slate-300">{event.camera_id}</span>
      )
    },
    {
      key: 'confidence',
      label: 'Confidence',
      sortable: true,
      render: (event: Event) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                event.confidence >= 90 ? 'bg-green-500' :
                event.confidence >= 70 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${event.confidence}%` }}
            />
          </div>
          <span className="text-xs text-slate-400 w-12">
            {event.confidence}%
          </span>
        </div>
      )
    },
    {
      key: 'barrier_action',
      label: 'Action',
      sortable: true,
      render: (event: Event) => {
        const variants: Record<string, 'success' | 'danger' | 'warning' | 'default'> = {
          opened: 'success',
          denied: 'danger',
          manual: 'warning',
          error: 'danger'
        }
        return (
          <Badge variant={variants[event.barrier_action] || 'default'}>
            {event.barrier_action.toUpperCase()}
          </Badge>
        )
      }
    },
    {
      key: 'processing_time_ms',
      label: 'Processing Time',
      sortable: true,
      render: (event: Event) => (
        <div className="flex items-center gap-1 text-sm text-slate-400">
          <Clock className="w-3 h-3" />
          <span>{event.processing_time_ms}ms</span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (event: Event) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleViewDetails(event)}
        >
          <Eye className="w-4 h-4" />
        </Button>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardBody>
            <div className="flex flex-col">
              <span className="text-sm text-slate-400">Total Events</span>
              <span className="text-2xl font-bold text-slate-100">{stats.total}</span>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex flex-col">
              <span className="text-sm text-slate-400">Entries</span>
              <span className="text-2xl font-bold text-green-400">{stats.entries}</span>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex flex-col">
              <span className="text-sm text-slate-400">Exits</span>
              <span className="text-2xl font-bold text-blue-400">{stats.exits}</span>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex flex-col">
              <span className="text-sm text-slate-400">Denied</span>
              <span className="text-2xl font-bold text-red-400">{stats.denied}</span>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex flex-col">
              <span className="text-sm text-slate-400">Success Rate</span>
              <span className="text-2xl font-bold text-purple-400">
                {stats.success_rate.toFixed(1)}%
              </span>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardBody>
          <div className="space-y-4">
            {/* Search and Export */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by plate number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <Button variant="secondary" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Event Type</label>
                <select
                  value={eventTypeFilter}
                  onChange={(e) => setEventTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="">All Types</option>
                  <option value="entry">Entry</option>
                  <option value="exit">Exit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Action</label>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="">All Actions</option>
                  <option value="opened">Opened</option>
                  <option value="denied">Denied</option>
                  <option value="manual">Manual</option>
                  <option value="error">Error</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="flex justify-end">
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-slate-100">Event History</h2>
        </CardHeader>
        <CardBody>
          {events.length === 0 && !loading ? (
            <EmptyState
              icon={Calendar}
              title="No Events Found"
              description="No events match your current filters. Try adjusting your search criteria."
            />
          ) : (
            <>
              <Table
                columns={columns}
                data={events}
                keyExtractor={(event) => event.id}
                loading={loading}
                emptyMessage="No events found"
              />

              <div className="mt-4">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  pageSize={pagination.pageSize}
                  totalItems={totalItems}
                  onPageChange={pagination.setPage}
                  onPageSizeChange={pagination.setPageSize}
                />
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* Event Details Modal */}
      {selectedEvent && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Event Details"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Event ID</label>
                <p className="text-slate-200 font-mono text-sm">{selectedEvent.id}</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Timestamp</label>
                <p className="text-slate-200">{new Date(selectedEvent.timestamp).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Plate Number</label>
                <p className="text-blue-400 font-mono font-semibold">{selectedEvent.plate_number}</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Event Type</label>
                <Badge variant={selectedEvent.event_type === 'entry' ? 'success' : 'info'}>
                  {selectedEvent.event_type.toUpperCase()}
                </Badge>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Camera ID</label>
                <p className="text-slate-200">{selectedEvent.camera_id}</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Confidence</label>
                <p className="text-slate-200">{selectedEvent.confidence}%</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Barrier Action</label>
                <Badge variant={
                  selectedEvent.barrier_action === 'opened' ? 'success' :
                  selectedEvent.barrier_action === 'denied' ? 'danger' :
                  'warning'
                }>
                  {selectedEvent.barrier_action.toUpperCase()}
                </Badge>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Processing Time</label>
                <p className="text-slate-200">{selectedEvent.processing_time_ms}ms</p>
              </div>
              {selectedEvent.vehicle_details && (
                <>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Owner Name</label>
                    <p className="text-slate-200">{selectedEvent.vehicle_details.owner_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Vehicle Type</label>
                    <p className="text-slate-200">{selectedEvent.vehicle_details.vehicle_type}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Vehicle Status</label>
                    <Badge variant={selectedEvent.vehicle_details.status === 'active' ? 'success' : 'danger'}>
                      {selectedEvent.vehicle_details.status.toUpperCase()}
                    </Badge>
                  </div>
                </>
              )}
            </div>

            {selectedEvent.image_path && (
              <div>
                <label className="block text-sm text-slate-400 mb-2">Captured Image</label>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-center h-64">
                  <img
                    src={selectedEvent.image_path}
                    alt="Event capture"
                    className="max-h-full max-w-full object-contain rounded"
                  />
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Events
