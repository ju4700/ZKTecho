import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Employee from '@/models/Employee'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    
    const { employeeId, zktecoId } = body
    
    if (!employeeId || !zktecoId) {
      return NextResponse.json(
        { error: 'Employee ID and ZKTeco ID are required' },
        { status: 400 }
      )
    }
    
    // Check if employee exists
    const employee = await Employee.findOne({ employeeId })
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }
    
    // Check if ZKTeco ID is already assigned to another employee
    const existingAssignment = await Employee.findOne({ 
      deviceUserId: zktecoId,
      employeeId: { $ne: employeeId } // Exclude current employee
    })
    
    if (existingAssignment) {
      return NextResponse.json(
        { error: `ZKTeco ID ${zktecoId} is already assigned to ${existingAssignment.name}` },
        { status: 400 }
      )
    }
    
    // Assign ZKTeco ID to employee
    employee.deviceUserId = zktecoId
    employee.fingerprintEnrolled = true
    employee.fingerprintDate = new Date()
    employee.lastSyncedAt = new Date()
    await employee.save()
    
    console.log(`✅ Successfully assigned ZKTeco ID ${zktecoId} to employee ${employee.name}`)
    
    return NextResponse.json({
      success: true,
      message: `Successfully assigned fingerprint ID ${zktecoId} to ${employee.name}`,
      employee: employee.toObject()
    })
    
  } catch (error) {
    console.error('Error assigning fingerprint:', error)
    return NextResponse.json(
      { error: 'Failed to assign fingerprint to employee' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    
    const { employeeId } = body
    
    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      )
    }
    
    // Find employee and remove ZKTeco assignment
    const employee = await Employee.findOne({ employeeId })
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }
    
    const previousZktecoId = employee.deviceUserId
    
    employee.deviceUserId = null
    employee.fingerprintEnrolled = false
    employee.fingerprintDate = null
    employee.lastSyncedAt = new Date()
    await employee.save()
    
    console.log(`✅ Successfully unassigned ZKTeco ID ${previousZktecoId} from employee ${employee.name}`)
    
    return NextResponse.json({
      success: true,
      message: `Successfully removed fingerprint assignment from ${employee.name}`,
      employee: employee.toObject(),
      freedZktecoId: previousZktecoId
    })
    
  } catch (error) {
    console.error('Error removing fingerprint assignment:', error)
    return NextResponse.json(
      { error: 'Failed to remove fingerprint assignment' },
      { status: 500 }
    )
  }
}