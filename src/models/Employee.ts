import mongoose, { Schema, Document } from 'mongoose'

export interface IEmployee extends Document {
  _id: string
  employeeId: string
  name: string
  phone?: string
  monthlySalary: number
  isActive: boolean
  deviceUserId?: string
  fingerprintEnrolled: boolean
  fingerprintDate?: Date
  lastSyncedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const EmployeeSchema = new Schema<IEmployee>({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  monthlySalary: {
    type: Number,
    required: true,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  deviceUserId: {
    type: String,
    trim: true
  },
  fingerprintEnrolled: {
    type: Boolean,
    default: false
  },
  fingerprintDate: {
    type: Date
  },
  lastSyncedAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Only keep necessary indexes to avoid duplicates
EmployeeSchema.index({ deviceUserId: 1 })
EmployeeSchema.index({ isActive: 1 })

export default mongoose.models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema)
