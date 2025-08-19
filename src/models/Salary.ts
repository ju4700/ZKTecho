import mongoose, { Schema, Document } from 'mongoose'

export interface ISalary extends Document {
  _id: string
  employeeId: string
  month: number
  year: number
  monthlySalary: number
  totalWorkingDays: number
  actualWorkingDays: number
  calculatedSalary: number
  bonuses: number
  deductions: number
  finalSalary: number
  isPaid: boolean
  paidDate?: Date
  createdAt: Date
  updatedAt: Date
}

const SalarySchema = new Schema<ISalary>({
  employeeId: {
    type: String,
    required: true,
    ref: 'Employee'
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  monthlySalary: {
    type: Number,
    required: true,
    min: 0
  },
  totalWorkingDays: {
    type: Number,
    required: true,
    min: 0
  },
  actualWorkingDays: {
    type: Number,
    required: true,
    min: 0
  },
  calculatedSalary: {
    type: Number,
    required: true,
    min: 0
  },
  bonuses: {
    type: Number,
    default: 0,
    min: 0
  },
  deductions: {
    type: Number,
    default: 0,
    min: 0
  },
  finalSalary: {
    type: Number,
    required: true,
    min: 0
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  paidDate: {
    type: Date
  }
}, {
  timestamps: true
})

// Indexes
SalarySchema.index({ employeeId: 1, year: -1, month: -1 })
SalarySchema.index({ isPaid: 1 })

export default mongoose.models.Salary || mongoose.model<ISalary>('Salary', SalarySchema)
