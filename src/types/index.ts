// Shared types for the ZKTeco Employee Management System

export interface Employee {
  _id?: string
  employeeId: string
  name: string
  email?: string
  phone?: string
  department?: string
  position?: string
  monthlySalary: number
  hourlyRate?: number
  workSchedule?: {
    daysPerWeek: number
    hoursPerDay: number
    startTime: string
    endTime: string
  }
  fingerprintEnrolled: boolean
  deviceUserId?: string | null
  deviceSync?: {
    isRegistered: boolean
    lastSync?: string
    zktecoUserId?: string
  }
  status: 'active' | 'inactive'
  createdAt?: Date
  updatedAt?: Date
}

export interface AttendanceRecord {
  _id?: string
  employeeId: string
  deviceUserId: string
  timestamp: Date
  type: 'check-in' | 'check-out' | 'break-start' | 'break-end'
  date: string
  time: string
  verifyMode: number
  workCode: number
  deviceId?: string
  createdAt?: Date
}

export interface SalaryRecord {
  _id?: string
  employeeId: string
  month: number
  year: number
  regularHours: number
  overtimeHours: number
  totalHours: number
  regularPay: number
  overtimePay: number
  totalPay: number
  deductions?: number
  netPay: number
  calculatedAt: Date
  status: 'draft' | 'approved' | 'paid'
}

export interface ZKTecoUser {
  userId: string
  name?: string
  password?: string
  role?: number
  cardno?: string
  userSn?: number
  enabled?: boolean
  group?: number
  verificationMode?: number
}

export interface DeviceInfo {
  model?: string
  serialNumber?: string
  firmwareVersion?: string
  userCount?: number
  fingerprintCount?: number
  attendanceLogCount?: number
  faceCount?: number
  cardCount?: number
  connected: boolean
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ValidationError {
  field: string
  message: string
  value?: unknown
}

export interface ErrorResponse {
  success: false
  error: string
  details?: ValidationError[]
  timestamp: string
  path?: string
}

// Request/Response Types
export interface CreateEmployeeRequest {
  employeeId: string
  name: string
  email?: string
  phone?: string
  department?: string
  position?: string
  monthlySalary: number
  hourlyRate?: number
  workSchedule?: Employee['workSchedule']
}

export interface UpdateEmployeeRequest extends Partial<CreateEmployeeRequest> {
  status?: 'active' | 'inactive'
}

export interface FingerprintEnrollmentRequest {
  employeeId: string
  deviceUserId: string
  fingerprintIndex?: number
}

export interface AttendanceSyncRequest {
  startDate?: string
  endDate?: string
  employeeId?: string
}

export interface SalaryCalculationRequest {
  employeeId?: string
  month: number
  year: number
  overtimeThreshold?: number
}

// Environment Configuration Types
export interface AppConfig {
  database: {
    uri: string
    options: {
      maxPoolSize: number
      serverSelectionTimeoutMS: number
      socketTimeoutMS: number
    }
  }
  zkteco: {
    ip: string
    port: number
    timeout: number
    retries: number
  }
  security: {
    jwtSecret: string
    apiKeyRequired: boolean
    rateLimitWindow: number
    rateLimitRequests: number
  }
  app: {
    name: string
    version: string
    environment: 'development' | 'production' | 'test'
    logLevel: 'error' | 'warn' | 'info' | 'debug'
    port: number
  }
  features: {
    overtimeThreshold: number
    autoSync: boolean
    realTimeMonitoring: boolean
  }
}

// Utility Types
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>

// Database Connection State
export interface DatabaseConnectionState {
  isConnected: boolean
  lastConnectionTime?: Date
  connectionCount: number
  error?: string
}

// ZKTeco Connection State
export interface ZKTecoConnectionState {
  isConnected: boolean
  lastConnectionTime?: Date
  deviceInfo?: DeviceInfo
  error?: string
  retryCount: number
}