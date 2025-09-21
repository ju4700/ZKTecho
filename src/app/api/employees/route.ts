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
    
    if (!employeeId || !name || !monthlySalary) {
      return NextResponse.json(
        { error: 'Employee ID, name, and monthly salary are required' },
        { status: 400 }
      )
    }
    
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
      monthlySalary: parseFloat(monthlySalary),
      fingerprintEnrolled: false,
      deviceUserId: null // Will be assigned later through fingerprint assignment
    })
    
    await employee.save()
    
    console.log(`✅ Employee ${name} created successfully (ID: ${employeeId})`)
    
    return NextResponse.json({
      ...employee.toObject(),
      message: 'Employee created successfully. You can now assign a fingerprint from the ZKTeco device.',
      nextStep: 'Navigate to fingerprint assignment to link this employee with an enrolled fingerprint.'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating employee:', error)
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    )
  }
}
