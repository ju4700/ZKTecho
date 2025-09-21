import mongoose from 'mongoose'

export interface IEmployee extends mongoose.Document {
  _id: string
  employeeId: string
  name: string
  email: string
  phone: string
  department: string
  position: string
  hireDate: Date
  
  // ZKTeco Device Integration
  deviceUserId?: string
  fingerprintEnrolled: boolean
  deviceSyncStatus: 'pending' | 'synced' | 'error'
  lastDeviceSync?: Date
  
  // Salary Information
  hourlyRate: number
  currency: string
  payrollSchedule: 'weekly' | 'biweekly' | 'monthly'
  
  // Work Schedule
  workSchedule: {
    monday: { start: string; end: string; enabled: boolean }
    tuesday: { start: string; end: string; enabled: boolean }
    wednesday: { start: string; end: string; enabled: boolean }
    thursday: { start: string; end: string; enabled: boolean }
    friday: { start: string; end: string; enabled: boolean }
    saturday: { start: string; end: string; enabled: boolean }
    sunday: { start: string; end: string; enabled: boolean }
  }
  
  // Status
  status: 'active' | 'inactive' | 'terminated'
  
  // Metadata
  createdAt: Date
  updatedAt: Date
}

const workDaySchema = new mongoose.Schema({
  start: { type: String, default: '09:00' },
  end: { type: String, default: '17:00' },
  enabled: { type: Boolean, default: true }
})

const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  hireDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // ZKTeco Device Integration
  deviceUserId: {
    type: String,
    sparse: true,
    index: true
  },
  fingerprintEnrolled: {
    type: Boolean,
    default: false
  },
  deviceSyncStatus: {
    type: String,
    enum: ['pending', 'synced', 'error'],
    default: 'pending'
  },
  lastDeviceSync: {
    type: Date
  },
  
  // Salary Information
  hourlyRate: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  payrollSchedule: {
    type: String,
    enum: ['weekly', 'biweekly', 'monthly'],
    default: 'monthly'
  },
  
  // Work Schedule
  workSchedule: {
    monday: { type: workDaySchema, default: () => ({}) },
    tuesday: { type: workDaySchema, default: () => ({}) },
    wednesday: { type: workDaySchema, default: () => ({}) },
    thursday: { type: workDaySchema, default: () => ({}) },
    friday: { type: workDaySchema, default: () => ({}) },
    saturday: { type: workDaySchema, default: () => ({ enabled: false }) },
    sunday: { type: workDaySchema, default: () => ({ enabled: false }) }
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'terminated'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Virtual for full name display
employeeSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.employeeId})`
})

// Virtual for device sync status display
employeeSchema.virtual('deviceStatusDisplay').get(function() {
  if (!this.deviceUserId) return 'Not Synced'
  if (!this.fingerprintEnrolled) return 'Awaiting Fingerprint'
  return 'Fully Synced'
})

// Index for efficient queries
employeeSchema.index({ status: 1 })
employeeSchema.index({ department: 1 })
employeeSchema.index({ deviceSyncStatus: 1 })

export default mongoose.models.Employee || mongoose.model<IEmployee>('Employee', employeeSchema)
