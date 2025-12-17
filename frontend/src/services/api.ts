import axios, { AxiosInstance, AxiosError } from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

class ApiService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken')
          sessionStorage.removeItem('authToken')
          localStorage.removeItem('user')
          sessionStorage.removeItem('user')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  // Authentication
  async login(credentials: { username: string; password: string }) {
    try {
      const response = await this.api.post('/auth/login', credentials)
      return response.data
    } catch (error: any) {
      console.error('Login error:', error)
      throw error
    }
  }

  async logout() {
    try {
      await this.api.post('/auth/logout')
      localStorage.removeItem('authToken')
      sessionStorage.removeItem('authToken')
      localStorage.removeItem('user')
      sessionStorage.removeItem('user')
      toast.success('Logged out successfully')
    } catch (error: any) {
      console.error('Logout error:', error)
      // Clear tokens even if API call fails
      localStorage.removeItem('authToken')
      sessionStorage.removeItem('authToken')
      localStorage.removeItem('user')
      sessionStorage.removeItem('user')
      throw error
    }
  }

  setAuthToken(token: string) {
    // This method allows setting the token for subsequent requests
    // The token is already stored in localStorage/sessionStorage by the Login component
    // This is just to ensure consistency
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user')
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch (error) {
        console.error('Error parsing user data:', error)
        return null
      }
    }
    return null
  }

  // Dashboard Stats
  async getDashboardStats() {
    try {
      const response = await this.api.get('/dashboard/stats')
      return response.data
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      throw error
    }
  }

  // Vehicles
  async getVehicles(params?: { page?: number; limit?: number; search?: string }) {
    try {
      const response = await this.api.get('/vehicles', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      throw error
    }
  }

  async getVehicleByPlate(licensePlate: string) {
    try {
      const response = await this.api.get(`/vehicles/${licensePlate}`)
      return response.data
    } catch (error) {
      console.error('Error fetching vehicle:', error)
      throw error
    }
  }

  async registerVehicle(data: { plate_number: string; owner_name?: string; vehicle_type?: string }) {
    try {
      const response = await this.api.post('/vehicles', data)
      toast.success('Vehicle registered successfully!')
      return response.data
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to register vehicle')
      throw error
    }
  }

  async updateVehicle(licensePlate: string, data: any) {
    try {
      const response = await this.api.put(`/vehicles/${licensePlate}`, data)
      toast.success('Vehicle updated successfully!')
      return response.data
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update vehicle')
      throw error
    }
  }

  async deleteVehicle(licensePlate: string) {
    try {
      const response = await this.api.delete(`/vehicles/${licensePlate}`)
      toast.success('Vehicle deleted successfully!')
      return response.data
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete vehicle')
      throw error
    }
  }

  // Events
  async getEvents(params?: { page?: number; limit?: number; event_type?: string }) {
    try {
      const response = await this.api.get('/events', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching events:', error)
      throw error
    }
  }

  async getRecentEvents(limit: number = 10) {
    try {
      const response = await this.api.get('/events/recent', { params: { limit } })
      return response.data
    } catch (error) {
      console.error('Error fetching recent events:', error)
      throw error
    }
  }

  async getEventById(eventId: string) {
    try {
      const response = await this.api.get(`/events/${eventId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching event:', error)
      throw error
    }
  }

  // Sessions
  async getActiveSessions(params?: { limit?: number }) {
    try {
      const response = await this.api.get('/sessions/active', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching active sessions:', error)
      throw error
    }
  }

  async endSession(sessionId: number | string) {
    try {
      const response = await this.api.post(`/sessions/${sessionId}/end`)
      toast.success('Session ended successfully!')
      return response.data
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to end session')
      throw error
    }
  }

  // Barrier Control
  async openEntryBarrier() {
    try {
      const response = await this.api.post('/barrier/entry/open')
      toast.success('Entry barrier opened!')
      return response.data
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to open entry barrier')
      throw error
    }
  }

  async closeEntryBarrier() {
    try {
      const response = await this.api.post('/barrier/entry/close')
      toast.success('Entry barrier closed!')
      return response.data
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to close entry barrier')
      throw error
    }
  }

  async openExitBarrier() {
    try {
      const response = await this.api.post('/barrier/exit/open')
      toast.success('Exit barrier opened!')
      return response.data
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to open exit barrier')
      throw error
    }
  }

  async closeExitBarrier() {
    try {
      const response = await this.api.post('/barrier/exit/close')
      toast.success('Exit barrier closed!')
      return response.data
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to close exit barrier')
      throw error
    }
  }

  // Analytics
  async getAnalytics(params?: { start_date?: string; end_date?: string }) {
    try {
      const response = await this.api.get('/analytics', { params })
      return response.data
    } catch (error: any) {
      // Don't log 404 errors - endpoint not implemented yet
      if (error.response?.status !== 404) {
        console.error('Error fetching analytics:', error)
      }
      throw error
    }
  }

  // System Status
  async getSystemStatus() {
    try {
      const response = await this.api.get('/system/status')
      return response.data
    } catch (error) {
      console.error('Error fetching system status:', error)
      throw error
    }
  }

  // Settings
  async getSettings() {
    try {
      const response = await this.api.get('/settings')
      return response.data
    } catch (error: any) {
      // Don't log 404 errors - endpoint not implemented yet
      if (error.response?.status !== 404) {
        console.error('Error fetching settings:', error)
      }
      throw error
    }
  }

  async updateSettings(data: any) {
    try {
      const response = await this.api.put('/settings', data)
      toast.success('Settings updated successfully!')
      return response.data
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update settings')
      throw error
    }
  }
}

export const apiService = new ApiService()
export default apiService
