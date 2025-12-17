import React, { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Eye, Download, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { Table, Pagination, Modal, ModalFooter, Button, Badge, ConfirmDialog, EmptyState } from '../components/common'
import { useDebounce } from '../hooks/useDebounce'
import { usePagination } from '../hooks/usePagination'
import apiService from '../services/api'
import type { Column } from '../components/common/Table'

interface Vehicle {
  id: string
  plate_number: string
  owner_name: string
  owner_contact?: string
  vehicle_type: string
  vehicle_make?: string
  vehicle_model?: string
  vehicle_color?: string
  status: 'active' | 'suspended' | 'expired'
  registration_date: string
  expiry_date?: string
  notes?: string
}

const VehiclesComplete: React.FC = () => {
  // State
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [totalItems, setTotalItems] = useState(0)

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    plate_number: '',
    owner_name: '',
    owner_contact: '',
    vehicle_type: 'car',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_color: '',
    notes: ''
  })
  const [formLoading, setFormLoading] = useState(false)

  // Pagination
  const debouncedSearch = useDebounce(searchQuery, 300)
  const pagination = usePagination({
    initialPage: 1,
    initialPageSize: 20,
    totalItems
  })

  // Fetch vehicles
  const fetchVehicles = async () => {
    try {
      setLoading(true)
      const params = {
        page: pagination.currentPage,
        page_size: pagination.pageSize,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        vehicle_type: typeFilter || undefined
      }

      const response = await apiService.getVehicles(params)
      setVehicles(response.items || [])
      setTotalItems(response.total || 0)
    } catch (error) {
      toast.error('Failed to load vehicles')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVehicles()
  }, [pagination.currentPage, pagination.pageSize, debouncedSearch, statusFilter, typeFilter])

  // Table columns
  const columns: Column<Vehicle>[] = [
    {
      key: 'plate_number',
      title: 'Plate Number',
      sortable: true,
      render: (value) => (
        <span className="font-mono font-bold text-blue-400">{value}</span>
      )
    },
    {
      key: 'owner_name',
      title: 'Owner',
      sortable: true
    },
    {
      key: 'vehicle_type',
      title: 'Type',
      render: (value) => (
        <span className="capitalize text-slate-300">{value}</span>
      )
    },
    {
      key: 'vehicle_make',
      title: 'Make/Model',
      render: (_, row) => (
        <span className="text-slate-300">
          {row.vehicle_make && row.vehicle_model
            ? `${row.vehicle_make} ${row.vehicle_model}`
            : row.vehicle_make || row.vehicle_model || '-'}
        </span>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (value) => {
        const variants: Record<string, 'success' | 'warning' | 'danger'> = {
          active: 'success',
          suspended: 'warning',
          expired: 'danger'
        }
        return (
          <Badge variant={variants[value] || 'default'}>
            {value}
          </Badge>
        )
      }
    },
    {
      key: 'registration_date',
      title: 'Registered',
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '150px',
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleView(row)
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-blue-400"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleEdit(row)
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-green-400"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteClick(row)
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-red-400"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ]

  // Handlers
  const handleView = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setIsViewModalOpen(true)
  }

  const handleEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setFormData({
      plate_number: vehicle.plate_number,
      owner_name: vehicle.owner_name,
      owner_contact: vehicle.owner_contact || '',
      vehicle_type: vehicle.vehicle_type,
      vehicle_make: vehicle.vehicle_make || '',
      vehicle_model: vehicle.vehicle_model || '',
      vehicle_color: vehicle.vehicle_color || '',
      notes: vehicle.notes || ''
    })
    setIsEditModalOpen(true)
  }

  const handleDeleteClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedVehicle) return

    try {
      setDeleteLoading(true)
      await apiService.deleteVehicle(selectedVehicle.plate_number)
      toast.success('Vehicle deleted successfully')
      fetchVehicles()
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast.error('Failed to delete vehicle')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.plate_number || !formData.owner_name) {
      toast.error('Plate number and owner name are required')
      return
    }

    try {
      setFormLoading(true)

      if (isEditModalOpen && selectedVehicle) {
        await apiService.updateVehicle(selectedVehicle.plate_number, formData)
        toast.success('Vehicle updated successfully')
      } else {
        await apiService.registerVehicle(formData)
        toast.success('Vehicle registered successfully')
      }

      fetchVehicles()
      handleCloseModals()
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Operation failed'
      toast.error(message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleCloseModals = () => {
    setIsAddModalOpen(false)
    setIsEditModalOpen(false)
    setIsViewModalOpen(false)
    setSelectedVehicle(null)
    setFormData({
      plate_number: '',
      owner_name: '',
      owner_contact: '',
      vehicle_type: 'car',
      vehicle_make: '',
      vehicle_model: '',
      vehicle_color: '',
      notes: ''
    })
  }

  const handleExport = () => {
    // Simple CSV export
    const headers = ['Plate Number', 'Owner', 'Type', 'Make', 'Model', 'Status', 'Registered']
    const rows = vehicles.map(v => [
      v.plate_number,
      v.owner_name,
      v.vehicle_type,
      v.vehicle_make || '',
      v.vehicle_model || '',
      v.status,
      new Date(v.registration_date).toLocaleDateString()
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vehicles-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Vehicles exported successfully')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Vehicles</h1>
          <p className="text-slate-400 mt-1">Manage registered vehicles</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={handleExport}
            leftIcon={<Download className="w-4 h-4" />}
            disabled={vehicles.length === 0}
          >
            Export
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by plate or owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="expired">Expired</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="car">Car</option>
            <option value="motorcycle">Motorcycle</option>
            <option value="truck">Truck</option>
            <option value="van">Van</option>
            <option value="suv">SUV</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="glass rounded-lg p-8">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-white/10 rounded" />
            ))}
          </div>
        </div>
      ) : vehicles.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No vehicles found"
          description={
            searchQuery || statusFilter || typeFilter
              ? 'Try adjusting your filters'
              : 'Get started by adding your first vehicle'
          }
          actionLabel={!searchQuery && !statusFilter && !typeFilter ? 'Add Vehicle' : undefined}
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <>
          <Table
            columns={columns}
            data={vehicles}
            keyExtractor={(row) => row.id}
            loading={loading}
            emptyMessage="No vehicles found"
          />

          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={totalItems}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={handleCloseModals}
        title={isEditModalOpen ? 'Edit Vehicle' : 'Add New Vehicle'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Plate Number *
              </label>
              <input
                type="text"
                value={formData.plate_number}
                onChange={(e) => setFormData({ ...formData, plate_number: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isEditModalOpen}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Owner Name *
              </label>
              <input
                type="text"
                value={formData.owner_name}
                onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Contact
              </label>
              <input
                type="text"
                value={formData.owner_contact}
                onChange={(e) => setFormData({ ...formData, owner_contact: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Vehicle Type
              </label>
              <select
                value={formData.vehicle_type}
                onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="car">Car</option>
                <option value="motorcycle">Motorcycle</option>
                <option value="truck">Truck</option>
                <option value="van">Van</option>
                <option value="suv">SUV</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Make
              </label>
              <input
                type="text"
                value={formData.vehicle_make}
                onChange={(e) => setFormData({ ...formData, vehicle_make: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Model
              </label>
              <input
                type="text"
                value={formData.vehicle_model}
                onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Color
              </label>
              <input
                type="text"
                value={formData.vehicle_color}
                onChange={(e) => setFormData({ ...formData, vehicle_color: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
            </div>
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModals}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={formLoading}
            >
              {isEditModalOpen ? 'Update' : 'Add'} Vehicle
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* View Modal */}
      {selectedVehicle && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Vehicle Details"
          size="md"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-400">Plate Number</p>
                <p className="text-lg font-mono font-bold text-blue-400">
                  {selectedVehicle.plate_number}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Status</p>
                <Badge variant={
                  selectedVehicle.status === 'active' ? 'success' :
                  selectedVehicle.status === 'suspended' ? 'warning' : 'danger'
                }>
                  {selectedVehicle.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-slate-400">Owner</p>
                <p className="text-slate-200">{selectedVehicle.owner_name}</p>
              </div>
              {selectedVehicle.owner_contact && (
                <div>
                  <p className="text-sm text-slate-400">Contact</p>
                  <p className="text-slate-200">{selectedVehicle.owner_contact}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-slate-400">Type</p>
                <p className="text-slate-200 capitalize">{selectedVehicle.vehicle_type}</p>
              </div>
              {selectedVehicle.vehicle_color && (
                <div>
                  <p className="text-sm text-slate-400">Color</p>
                  <p className="text-slate-200">{selectedVehicle.vehicle_color}</p>
                </div>
              )}
              {(selectedVehicle.vehicle_make || selectedVehicle.vehicle_model) && (
                <div className="col-span-2">
                  <p className="text-sm text-slate-400">Make / Model</p>
                  <p className="text-slate-200">
                    {selectedVehicle.vehicle_make} {selectedVehicle.vehicle_model}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-slate-400">Registered</p>
                <p className="text-slate-200">
                  {new Date(selectedVehicle.registration_date).toLocaleString()}
                </p>
              </div>
              {selectedVehicle.expiry_date && (
                <div>
                  <p className="text-sm text-slate-400">Expiry</p>
                  <p className="text-slate-200">
                    {new Date(selectedVehicle.expiry_date).toLocaleString()}
                  </p>
                </div>
              )}
              {selectedVehicle.notes && (
                <div className="col-span-2">
                  <p className="text-sm text-slate-400">Notes</p>
                  <p className="text-slate-200">{selectedVehicle.notes}</p>
                </div>
              )}
            </div>
          </div>

          <ModalFooter>
            <Button
              variant="secondary"
              onClick={() => setIsViewModalOpen(false)}
            >
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setIsViewModalOpen(false)
                handleEdit(selectedVehicle)
              }}
              leftIcon={<Edit className="w-4 h-4" />}
            >
              Edit
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Vehicle"
        message={`Are you sure you want to delete vehicle "${selectedVehicle?.plate_number}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  )
}

export default VehiclesComplete
