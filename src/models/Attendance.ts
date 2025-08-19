import mongoose, { Schema, Document } from 'mongoose'

export interface IAttendance extends Document {
  _id: string
  employeeId: string
  deviceUserId: string
  timestamp: Date
  type: 'CHECK_IN' | 'CHECK_OUT'
  deviceId?: string
  createdAt: Date
}

const AttendanceSchema = new Schema<IAttendance>({
  employeeId: {
    type: String,
    required: true,
    ref: 'Employee'
  },
  deviceUserId: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['CHECK_IN', 'CHECK_OUT'],
    required: true
  },
  deviceId: {
    type: String
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
})

// Indexes for better query performance
AttendanceSchema.index({ employeeId: 1, timestamp: -1 })
AttendanceSchema.index({ deviceUserId: 1, timestamp: -1 })
AttendanceSchema.index({ timestamp: -1 })

export default mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema)
