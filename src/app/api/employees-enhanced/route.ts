import { NextRequest, NextResponse } from 'next/server'
import connectToMongoDB from '../../../lib/mongodb'
import Employee from '../../../models/Employee'
import { zktecoIntegration } from '../../../lib/zkteco-integration'

export async function GET() {
  try {
    await connectToMongoDB()
    const employees = await Employee.find({ status: { $ne: 'terminated' } })
      .sort({ createdAt: -1 })
    
    // Enhance with device sync status
    const enhancedEmployees = employees.map(emp => ({
      ...emp.toObject(),
      deviceStatusDisplay: emp.deviceStatusDisplay,
      needsDeviceSync: !emp.deviceUserId || emp.deviceSyncStatus !== 'synced'
    }))
    
    return NextResponse.json({ 
      employees: enhancedEmployees,
      total: enhancedEmployees.length,
      synced: enhancedEmployees.filter(e => e.deviceSyncStatus === 'synced').length
    })
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
    const body = await request.json()
    const { 
      name, 
      email, 
      phone, 
      department, 
      position, 
      hourlyRate,
      currency = 'USD',
      payrollSchedule = 'monthly',
      workSchedule,
      autoSyncToDevice = true
    } = body

    // Validate required fields
    if (!name || !email || !phone || !department || !position || !hourlyRate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (hourlyRate <= 0) {
      return NextResponse.json(
        { error: 'Hourly rate must be greater than 0' },
        { status: 400 }
      )
    }

    await connectToMongoDB()

    // Check if email already exists
    const existingEmployee = await Employee.findOne({ email })
    if (existingEmployee) {
      return NextResponse.json(
        { error: 'Employee with this email already exists' },
        { status: 409 }
      )
    }

    // Generate employee ID
    const employeeCount = await Employee.countDocuments()
    const employeeId = `EMP${String(employeeCount + 1).padStart(4, '0')}`

    // Create employee with enhanced data
    const employee = new Employee({
      employeeId,
      name,
      email,
      phone,
      department,
      position,
      hourlyRate,
      currency: currency.toUpperCase(),
      payrollSchedule,
      workSchedule: workSchedule || {
        monday: { start: '09:00', end: '17:00', enabled: true },
        tuesday: { start: '09:00', end: '17:00', enabled: true },
        wednesday: { start: '09:00', end: '17:00', enabled: true },
        thursday: { start: '09:00', end: '17:00', enabled: true },
        friday: { start: '09:00', end: '17:00', enabled: true },
        saturday: { start: '09:00', end: '17:00', enabled: false },
        sunday: { start: '09:00', end: '17:00', enabled: false }
      },
      status: 'active',
      deviceSyncStatus: 'pending'
    })

    await employee.save()

    // Auto-sync to device if requested
    let deviceSyncResult = null
    if (autoSyncToDevice) {
      try {
        console.log(`🔄 Auto-syncing employee ${name} to device...`)
        deviceSyncResult = await zktecoIntegration.createEmployeeOnDevice(employee)
        
        if (deviceSyncResult.success) {
          console.log(`✅ Employee ${name} successfully synced to device`)
        } else {
          console.warn(`⚠️ Failed to sync employee ${name} to device: ${deviceSyncResult.message}`)
        }
      } catch (error) {
        console.error('Error during auto-sync to device:', error)
        deviceSyncResult = {
          success: false,
          message: `Auto-sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }
    }

    return NextResponse.json({
      success: true,
      employee: {
        ...employee.toObject(),
        deviceStatusDisplay: employee.deviceStatusDisplay
      },
      deviceSync: deviceSyncResult,
      message: `Employee ${name} created successfully${deviceSyncResult?.success ? ' and synced to device' : ''}`
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating employee:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create employee',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      employeeId, 
      updateDeviceSync = false,
      ...updateData 
    } = body

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      )
    }

    await connectToMongoDB()

    const employee = await Employee.findById(employeeId)
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Update employee data
    Object.assign(employee, updateData)
    await employee.save()

    // Sync to device if requested and employee has device ID
    let deviceSyncResult = null
    if (updateDeviceSync && employee.deviceUserId) {
      try {
        const syncSuccess = await zktecoIntegration.syncEmployeeToDevice(employeeId)
        deviceSyncResult = {
          success: syncSuccess,
          message: syncSuccess ? 'Employee synced to device' : 'Failed to sync to device'
        }
      } catch (error) {
        deviceSyncResult = {
          success: false,
          message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }
    }

    return NextResponse.json({
      success: true,
      employee: {
        ...employee.toObject(),
        deviceStatusDisplay: employee.deviceStatusDisplay
      },
      deviceSync: deviceSyncResult,
      message: 'Employee updated successfully'
    })

  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update employee',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('id')
    const removeFromDevice = searchParams.get('removeFromDevice') === 'true'

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      )
    }

    await connectToMongoDB()

    const employee = await Employee.findById(employeeId)
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Remove from device if requested and has device ID
    let deviceRemovalResult = null
    if (removeFromDevice && employee.deviceUserId) {
      try {
        const removeSuccess = await zktecoIntegration.deleteEmployeeFromDevice(employee.deviceUserId)
        deviceRemovalResult = {
          success: removeSuccess,
          message: removeSuccess ? 'Employee removed from device' : 'Failed to remove from device'
        }
      } catch (error) {
        deviceRemovalResult = {
          success: false,
          message: `Device removal failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }
    }

    // Mark as terminated instead of deleting
    employee.status = 'terminated'
    employee.deviceUserId = undefined
    employee.fingerprintEnrolled = false
    employee.deviceSyncStatus = 'pending'
    await employee.save()

    return NextResponse.json({
      success: true,
      message: 'Employee terminated successfully',
      deviceRemoval: deviceRemovalResult
    })

  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete employee',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}