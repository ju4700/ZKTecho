import mongoose from 'mongoose'

export interface IAttendance extends mongoose.Document {
  _id: string
  employeeId: string
  deviceUserId: string
  date: Date
  clockIn?: Date
  clockOut?: Date
  
  // Calculated fields
  hoursWorked: number
  regularHours: number
  overtimeHours: number
  
  // Device data
  deviceLogs: Array<{
    timestamp: Date
    type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end'
    deviceId: string
    verificationMethod: 'fingerprint' | 'card' | 'password'
    rawData?: object
  }>
  
  // Status and validation
  status: 'incomplete' | 'complete' | 'reviewed' | 'approved'
  anomalies: Array<{
    type: 'missing_clock_out' | 'long_shift' | 'short_shift' | 'unusual_hours'
    description: string
    severity: 'low' | 'medium' | 'high'
  }>
  
  // Manual adjustments
  adjustments: Array<{
    field: string
    originalValue: any
    newValue: any
    reason: string
    adjustedBy: string
    adjustedAt: Date
  }>
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  syncedFromDevice: boolean
  lastDeviceSync?: Date
}

const deviceLogSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true },
  type: { 
    type: String, 
    enum: ['clock_in', 'clock_out', 'break_start', 'break_end'],
    required: true 
  },
  deviceId: { type: String, required: true },
  verificationMethod: {
    type: String,
    enum: ['fingerprint', 'card', 'password'],
    default: 'fingerprint'
  },
  rawData: { type: mongoose.Schema.Types.Mixed }
})

const anomalySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['missing_clock_out', 'long_shift', 'short_shift', 'unusual_hours'],
    required: true
  },
  description: { type: String, required: true },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
})

const adjustmentSchema = new mongoose.Schema({
  field: { type: String, required: true },
  originalValue: { type: mongoose.Schema.Types.Mixed },
  newValue: { type: mongoose.Schema.Types.Mixed },
  reason: { type: String, required: true },
  adjustedBy: { type: String, required: true },
  adjustedAt: { type: Date, default: Date.now }
})

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    index: true
  },
  deviceUserId: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  clockIn: {
    type: Date,
    index: true
  },
  clockOut: {
    type: Date,
    index: true
  },
  
  // Calculated fields
  hoursWorked: {
    type: Number,
    default: 0,
    min: 0
  },
  regularHours: {
    type: Number,
    default: 0,
    min: 0
  },
  overtimeHours: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Device data
  deviceLogs: [deviceLogSchema],
  
  // Status and validation
  status: {
    type: String,
    enum: ['incomplete', 'complete', 'reviewed', 'approved'],
    default: 'incomplete'
  },
  anomalies: [anomalySchema],
  adjustments: [adjustmentSchema],
  
  // Metadata
  syncedFromDevice: {
    type: Boolean,
    default: false
  },
  lastDeviceSync: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Virtual for daily earnings calculation
attendanceSchema.virtual('dailyEarnings').get(function() {
  // This will be calculated based on employee's hourly rate
  return this.hoursWorked * 0 // Will be populated with actual rate
})

// Virtual for formatted work duration
attendanceSchema.virtual('workDuration').get(function() {
  if (!this.clockIn || !this.clockOut) return 'Incomplete'
  const hours = Math.floor(this.hoursWorked)
  const minutes = Math.round((this.hoursWorked - hours) * 60)
  return `${hours}h ${minutes}m`
})

// Compound indexes for efficient queries
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true })
attendanceSchema.index({ deviceUserId: 1, date: 1 })
attendanceSchema.index({ date: 1, status: 1 })
attendanceSchema.index({ syncedFromDevice: 1, lastDeviceSync: 1 })

// Pre-save middleware to calculate hours
attendanceSchema.pre('save', function() {
  if (this.clockIn && this.clockOut) {
    const diffMs = this.clockOut.getTime() - this.clockIn.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    
    this.hoursWorked = Math.round(diffHours * 100) / 100 // Round to 2 decimals
    
    // Calculate regular vs overtime (assuming 8 hours standard)
    const standardHours = 8
    this.regularHours = Math.min(this.hoursWorked, standardHours)
    this.overtimeHours = Math.max(0, this.hoursWorked - standardHours)
    
    // Update status
    this.status = 'complete'
  }
})

export default mongoose.models.AttendanceNew || mongoose.model<IAttendance>('AttendanceNew', attendanceSchema)