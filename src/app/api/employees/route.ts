import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Employee from '@/models/Employee'

export async function GET() {
  try {
    await connectDB()
    const employees = await Employee.find({}).sort({ createdAt: -1 })
    return NextResponse.json(employees)
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    
    const { employeeId, name, phone, monthlySalary } = body
    
    // Validate required fields
    if (!employeeId || !name || !monthlySalary) {
      return NextResponse.json(
        { error: 'Employee ID, name, and monthly salary are required' },
        { status: 400 }
      )
    }
    
    // Check if employee ID already exists
    const existingEmployee = await Employee.findOne({ employeeId })
    if (existingEmployee) {
      return NextResponse.json(
        { error: 'Employee ID already exists' },
        { status: 400 }
      )
    }
    
    const employee = new Employee({
      employeeId,
      name,
      phone: phone || undefined,
      monthlySalary: parseFloat(monthlySalary)
    })
    
    await employee.save()
    
    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    console.error('Error creating employee:', error)
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    )
  }
}
