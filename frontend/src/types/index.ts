/**
 * Type definitions for the ALPR system
 */

// Vehicle types
export enum VehicleType {
  CAR = 'car',
  MOTORCYCLE = 'motorcycle',
  TRUCK = 'truck',
  VAN = 'van',
  SUV = 'suv',
  BUS = 'bus',
  OTHER = 'other',
}

export enum VehicleStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  EXPIRED = 'expired',
  PENDING = 'pending',
}

export interface Vehicle {
  id: string
  plate_number: string
  owner_name: string
  owner_contact?: string
  vehicle_type: VehicleType
  vehicle_make?: string
  vehicle_model?: string
  vehicle_color?: string
  registration_date: string
  expiry_date?: string
  status: VehicleStatus
  notes?: string
  created_at: string
  updated_at: string
}

// Event types
export enum EventType {
  ENTRY = 'entry',
  EXIT = 'exit',
}

export enum BarrierAction {
  OPENED = 'opened',
  DENIED = 'denied',
  MANUAL = 'manual',
  ERROR = 'error',
}

export interface Event {
  id: string
  vehicle_id?: string
  plate_number: string
  event_type: EventType
  timestamp: string
  camera_id: string
  confidence_score: number
  image_path?: string
  barrier_action: BarrierAction
  processing_time_ms?: number
  created_at: string
}

// Parking session
export interface ParkingSession {
  id: string
  vehicle_id: string
  entry_event_id: string
  exit_event_id?: string
  entry_time: string
  exit_time?: string
  duration_minutes?: number
  parking_lot_id?: string
  status: 'active' | 'completed'
  created_at: string
  updated_at: string
}

// Analytics types
export interface OccupancyStats {
  total_capacity: number
  occupied: number
  available: number
  occupancy_rate: number
}

export interface EventStats {
  total_events: number
  entries: number
  exits: number
  denied: number
  success_rate: number
}

export interface HourlyStats {
  hour: number
  entries: number
  exits: number
  total: number
}

export interface DailyStats {
  date: string
  entries: number
  exits: number
  unique_vehicles: number
}

export interface VehicleTypeStats {
  vehicle_type: VehicleType
  count: number
  percentage: number
}

export interface AverageParkingTime {
  average_minutes: number
  median_minutes: number
  min_minutes: number
  max_minutes: number
}

// Dashboard types
export interface DashboardStats {
  occupancy: OccupancyStats
  events: EventStats
  active_sessions: number
  recent_events: Event[]
}

// User types
export enum UserRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
}

export interface User {
  id: string
  username: string
  email: string
  full_name?: string
  role: UserRole
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at: string
}

// Authentication
export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'event' | 'occupancy' | 'camera_status' | 'barrier_status' | 'system_alert'
  data: any
  timestamp: string
}

// Camera status
export interface CameraStatus {
  camera_id: string
  name: string
  is_online: boolean
  frame_count: number
  error_count: number
  last_frame_time: number
}

// Barrier status
export interface BarrierStatus {
  barrier_id: string
  name: string
  state: 'closed' | 'opening' | 'open' | 'closing' | 'error' | 'unknown'
  is_operational: boolean
  operation_count: number
  error_count: number
}

// API response types
export interface ApiResponse<T> {
  data: T
  message?: string
  status: 'success' | 'error'
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// Form types
export interface VehicleFormData {
  plate_number: string
  owner_name: string
  owner_contact?: string
  vehicle_type: VehicleType
  vehicle_make?: string
  vehicle_model?: string
  vehicle_color?: string
  expiry_date?: string
  notes?: string
}

// Filter types
export interface EventFilters {
  event_type?: EventType
  barrier_action?: BarrierAction
  date_from?: string
  date_to?: string
  plate_number?: string
  camera_id?: string
}

export interface VehicleFilters {
  status?: VehicleStatus
  vehicle_type?: VehicleType
  search?: string
}
