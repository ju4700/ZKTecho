import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Employee from '@/models/Employee'
import Attendance from '@/models/Attendance'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    await connectDB()
    const { id } = await context.params
    
    const employee = await Employee.findById(id)
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Get recent attendance records
    const attendances = await Attendance.find({ 
      employeeId: id 
    }).sort({ timestamp: -1 }).limit(50)

    return NextResponse.json({
      ...employee.toObject(),
      attendances
    })
  } catch (error) {
    console.error('Error fetching employee:', error)
    return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteParams
) {
  try {
    await connectDB()
    const { id } = await context.params
    const data = await request.json()

    const employee = await Employee.findByIdAndUpdate(
      id,
      {
        name: data.name,
        phone: data.phone,
        monthlySalary: parseFloat(data.monthlySalary),
        isActive: data.isActive
      },
      { new: true }
    )

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    return NextResponse.json(employee)
  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteParams
) {
  try {
    await connectDB()
    const { id } = await context.params

    const employee = await Employee.findByIdAndDelete(id)
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Also delete related attendance records
    await Attendance.deleteMany({ employeeId: id })

    return NextResponse.json({ message: 'Employee deleted successfully' })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 })
  }
}
