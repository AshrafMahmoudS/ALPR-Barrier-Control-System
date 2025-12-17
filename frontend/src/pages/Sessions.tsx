import React, { useState, useEffect } from 'react'
import { Search, Clock, Download, X, Eye, StopCircle, Calendar, Filter } from 'lucide-react'
import { Card, CardHeader, CardBody, Badge, Button, Table, Pagination, Modal, ModalFooter, EmptyState, ConfirmDialog } from '../components/common'
import { usePagination } from '../hooks/usePagination'
import { useDebounce } from '../hooks/useDebounce'
import { apiService } from '../services/api'
import { websocketService } from '../services/websocket'
import { toast } from 'react-hot-toast'

interface Session {
  id: string
  vehicle_id: string
  plate_number: string
  entry_time: string
  exit_time: string | null
  duration_minutes: number | null
  entry_camera_id: string
  exit_camera_id: string | null
  status: 'active' | 'completed' | 'expired'
  vehicle_details?: {
    owner_name: string
    vehicle_type: string
    vehicle_make?: string
    vehicle_model?: string
  }
  entry_confidence: number
  exit_confidence: number | null
}

interface SessionStats {
  total: number
  active: number
  completed: number
  avg_duration: number
}

const Sessions: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)
  const [stats, setStats] = useState<SessionStats>({
    total: 0,
    active: 0,
    completed: 0,
    avg_duration: 0
  })

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Modals
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEndSessionDialog, setShowEndSessionDialog] = useState(false)
  const [endingSession, setEndingSession] = useState(false)

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Pagination
  const pagination = usePagination({
    initialPage: 1,
    initialPageSize: 20,
    totalItems
  })

  // Fetch sessions
  const fetchSessions = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: pagination.currentPage,
        page_size: pagination.pageSize
      }

      if (debouncedSearch) params.search = debouncedSearch
      if (statusFilter) params.status = statusFilter
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo

      const response = await apiService.getSessions(params)
      setSessions(response.items)
      setTotalItems(response.total)

      // Calculate stats
      const statsData: SessionStats = {
        total: response.total,
        active: response.items.filter((s: Session) => s.status === 'active').length,
        completed: response.items.filter((s: Session) => s.status === 'completed').length,
        avg_duration: response.items
          .filter((s: Session) => s.duration_minutes)
          .reduce((sum: number, s: Session) => sum + (s.duration_minutes || 0), 0) /
          response.items.filter((s: Session) => s.duration_minutes).length || 0
      }
      setStats(statsData)
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
      toast.error('Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  // WebSocket subscription for real-time updates
  useEffect(() => {
    const handleSessionUpdate = (session: Session) => {
      setSessions(prev => {
        const index = prev.findIndex(s => s.id === session.id)
        if (index >= 0) {
          const updated = [...prev]
          updated[index] = session
          return updated
        }
        return [session, ...prev.slice(0, pagination.pageSize - 1)]
      })
      toast.success(`Session updated: ${session.plate_number}`)
    }

    websocketService.on('session_update', handleSessionUpdate)
    return () => {
      websocketService.off('session_update', handleSessionUpdate)
    }
  }, [pagination.pageSize])

  // Fetch sessions on filter/pagination change
  useEffect(() => {
    fetchSessions()
  }, [
    pagination.currentPage,
    pagination.pageSize,
    debouncedSearch,
    statusFilter,
    dateFrom,
    dateTo
  ])

  // Handle view details
  const handleViewDetails = (session: Session) => {
    setSelectedSession(session)
    setShowDetailsModal(true)
  }

  // Handle end session
  const handleEndSession = async () => {
    if (!selectedSession) return

    try {
      setEndingSession(true)
      await apiService.endSession(selectedSession.id)
      toast.success('Session ended successfully')
      setShowEndSessionDialog(false)
      setShowDetailsModal(false)
      fetchSessions()
    } catch (error) {
      console.error('Failed to end session:', error)
      toast.error('Failed to end session')
    } finally {
      setEndingSession(false)
    }
  }

  // Handle export
  const handleExport = async () => {
    try {
      const params: any = {}
      if (debouncedSearch) params.search = debouncedSearch
      if (statusFilter) params.status = statusFilter
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo

      const response = await apiService.getSessions({ ...params, page_size: 10000 })
      const csvContent = convertToCSV(response.items)
      downloadCSV(csvContent, `sessions_${new Date().toISOString().split('T')[0]}.csv`)
      toast.success('Sessions exported successfully')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export sessions')
    }
  }

  const convertToCSV = (data: Session[]) => {
    const headers = ['Session ID', 'Plate Number', 'Owner', 'Entry Time', 'Exit Time', 'Duration (min)', 'Status', 'Entry Camera', 'Exit Camera']
    const rows = data.map(session => [
      session.id,
      session.plate_number,
      session.vehicle_details?.owner_name || 'N/A',
      session.entry_time,
      session.exit_time || 'N/A',
      session.duration_minutes?.toString() || 'N/A',
      session.status,
      session.entry_camera_id,
      session.exit_camera_id || 'N/A'
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
    setStatusFilter('')
    setDateFrom('')
    setDateTo('')
    pagination.goToFirstPage()
  }

  const hasActiveFilters = searchQuery || statusFilter || dateFrom || dateTo

  // Format duration
  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  // Format relative time
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
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
      key: 'plate_number',
      label: 'Plate Number',
      sortable: true,
      render: (session: Session) => (
        <div className="flex flex-col">
          <span className="font-mono font-semibold text-blue-400">
            {session.plate_number}
          </span>
          {session.vehicle_details && (
            <span className="text-xs text-slate-500">
              {session.vehicle_details.owner_name}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'entry_time',
      label: 'Entry Time',
      sortable: true,
      render: (session: Session) => (
        <div className="flex flex-col">
          <span className="text-sm text-slate-200">
            {new Date(session.entry_time).toLocaleString()}
          </span>
          <span className="text-xs text-slate-500">
            {formatRelativeTime(session.entry_time)}
          </span>
        </div>
      )
    },
    {
      key: 'exit_time',
      label: 'Exit Time',
      sortable: true,
      render: (session: Session) => (
        <div className="flex flex-col">
          {session.exit_time ? (
            <>
              <span className="text-sm text-slate-200">
                {new Date(session.exit_time).toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">
                {formatRelativeTime(session.exit_time)}
              </span>
            </>
          ) : (
            <span className="text-sm text-slate-500">Active</span>
          )}
        </div>
      )
    },
    {
      key: 'duration',
      label: 'Duration',
      sortable: true,
      render: (session: Session) => (
        <div className="flex items-center gap-1 text-sm text-slate-300">
          <Clock className="w-3 h-3" />
          <span>{formatDuration(session.duration_minutes)}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (session: Session) => {
        const variants: Record<string, 'success' | 'warning' | 'default'> = {
          active: 'success',
          completed: 'default',
          expired: 'warning'
        }
        return (
          <Badge variant={variants[session.status] || 'default'}>
            {session.status.toUpperCase()}
          </Badge>
        )
      }
    },
    {
      key: 'cameras',
      label: 'Cameras',
      render: (session: Session) => (
        <div className="flex flex-col text-sm text-slate-400">
          <span>In: {session.entry_camera_id}</span>
          <span>Out: {session.exit_camera_id || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (session: Session) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleViewDetails(session)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          {session.status === 'active' && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setSelectedSession(session)
                setShowEndSessionDialog(true)
              }}
            >
              <StopCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex flex-col">
              <span className="text-sm text-slate-400">Total Sessions</span>
              <span className="text-2xl font-bold text-slate-100">{stats.total}</span>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex flex-col">
              <span className="text-sm text-slate-400">Active Sessions</span>
              <span className="text-2xl font-bold text-green-400">{stats.active}</span>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex flex-col">
              <span className="text-sm text-slate-400">Completed</span>
              <span className="text-2xl font-bold text-blue-400">{stats.completed}</span>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex flex-col">
              <span className="text-sm text-slate-400">Avg Duration</span>
              <span className="text-2xl font-bold text-purple-400">
                {formatDuration(Math.round(stats.avg_duration))}
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
                  placeholder="Search by plate number or owner..."
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="expired">Expired</option>
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

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-slate-100">Parking Sessions</h2>
        </CardHeader>
        <CardBody>
          {sessions.length === 0 && !loading ? (
            <EmptyState
              icon={Calendar}
              title="No Sessions Found"
              description="No parking sessions match your current filters."
            />
          ) : (
            <>
              <Table
                columns={columns}
                data={sessions}
                keyExtractor={(session) => session.id}
                loading={loading}
                emptyMessage="No sessions found"
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

      {/* Session Details Modal */}
      {selectedSession && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Session Details"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Session ID</label>
                <p className="text-slate-200 font-mono text-sm">{selectedSession.id}</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Status</label>
                <Badge variant={
                  selectedSession.status === 'active' ? 'success' :
                  selectedSession.status === 'expired' ? 'warning' :
                  'default'
                }>
                  {selectedSession.status.toUpperCase()}
                </Badge>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Plate Number</label>
                <p className="text-blue-400 font-mono font-semibold">{selectedSession.plate_number}</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Duration</label>
                <p className="text-slate-200">{formatDuration(selectedSession.duration_minutes)}</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Entry Time</label>
                <p className="text-slate-200">{new Date(selectedSession.entry_time).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Exit Time</label>
                <p className="text-slate-200">
                  {selectedSession.exit_time ? new Date(selectedSession.exit_time).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Entry Camera</label>
                <p className="text-slate-200">{selectedSession.entry_camera_id}</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Exit Camera</label>
                <p className="text-slate-200">{selectedSession.exit_camera_id || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Entry Confidence</label>
                <p className="text-slate-200">{selectedSession.entry_confidence}%</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Exit Confidence</label>
                <p className="text-slate-200">{selectedSession.exit_confidence ? `${selectedSession.exit_confidence}%` : 'N/A'}</p>
              </div>
              {selectedSession.vehicle_details && (
                <>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Owner Name</label>
                    <p className="text-slate-200">{selectedSession.vehicle_details.owner_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Vehicle Type</label>
                    <p className="text-slate-200">{selectedSession.vehicle_details.vehicle_type}</p>
                  </div>
                  {selectedSession.vehicle_details.vehicle_make && (
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Make & Model</label>
                      <p className="text-slate-200">
                        {selectedSession.vehicle_details.vehicle_make} {selectedSession.vehicle_details.vehicle_model || ''}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {selectedSession.status === 'active' && (
            <ModalFooter className="mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setShowDetailsModal(false)
                  setShowEndSessionDialog(true)
                }}
              >
                <StopCircle className="w-4 h-4 mr-2" />
                End Session
              </Button>
            </ModalFooter>
          )}
        </Modal>
      )}

      {/* End Session Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showEndSessionDialog}
        onClose={() => setShowEndSessionDialog(false)}
        onConfirm={handleEndSession}
        title="End Session"
        message={`Are you sure you want to manually end the parking session for ${selectedSession?.plate_number}? This action cannot be undone.`}
        confirmText="End Session"
        cancelText="Cancel"
        variant="warning"
        loading={endingSession}
      />
    </div>
  )
}

export default Sessions
