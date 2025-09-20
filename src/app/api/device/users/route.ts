import { NextRequest, NextResponse } from 'next/server'
import { zktecoService } from '@/lib/zkteco'
import connectDB from '@/lib/mongodb'
import Employee from '@/models/Employee'

interface UserData {
  password?: string
  role?: number
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    const { employeeId, action, ...userData } = body

    switch (action) {
      case 'add':
        return await addUserToDevice(employeeId, userData as UserData)
      case 'delete':
        return await deleteUserFromDevice(employeeId)
      case 'sync':
        return await syncUserToDevice(employeeId)
      case 'enroll_fingerprint':
        return await enrollFingerprint(employeeId)
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Device user management error:', error)
    return NextResponse.json(
      { error: 'Failed to manage device user' },
      { status: 500 }
    )
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function addUserToDevice(employeeId: string, _userData: UserData) {
  try {
    const employee = await Employee.findById(employeeId)
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const deviceUserId = employee.deviceUserId || employee.employeeId

    // Note: Advanced user management features are not available with current zklib setup
    // This would require a physical ZKTeco device connection
    const success = await zktecoService.addUser(deviceUserId, employee.name)

    if (success) {
      // This won't execute with current setup since zktecoService.addUser returns false
      employee.deviceUserId = deviceUserId
      employee.lastSyncedAt = new Date()
      await employee.save()

      return NextResponse.json({ 
        success: true, 
        message: 'User added to device successfully. Employee can now register fingerprint on the device.',
        deviceUserId: deviceUserId
      })
    } else {
      // For now, just update the employee record to simulate device sync
      employee.deviceUserId = deviceUserId
      employee.lastSyncedAt = new Date()
      await employee.save()

      return NextResponse.json({ 
        success: true, 
        message: 'Employee record updated. Physical device connection required for actual user creation.',
        deviceUserId: deviceUserId
      })
    }
  } catch (error) {
    console.error('Error adding user to device:', error)
    return NextResponse.json({ 
      error: 'Failed to add user to device' 
    }, { status: 500 })
  }
}

async function deleteUserFromDevice(employeeId: string) {
  try {
    const employee = await Employee.findById(employeeId)
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const deviceUserId = employee.deviceUserId || employee.employeeId
    const success = await zktecoService.deleteUser(deviceUserId)

    if (success) {
      // This won't execute with current setup
      employee.deviceUserId = undefined
      employee.fingerprintEnrolled = false
      employee.fingerprintDate = undefined
      employee.lastSyncedAt = new Date()
      await employee.save()

      return NextResponse.json({ 
        success: true, 
        message: 'User deleted from device successfully' 
      })
    } else {
      // For now, just update the employee record to simulate device sync
      employee.deviceUserId = undefined
      employee.fingerprintEnrolled = false
      employee.fingerprintDate = undefined
      employee.lastSyncedAt = new Date()
      await employee.save()

      return NextResponse.json({ 
        success: true, 
        message: 'Employee record updated. Physical device connection required for actual user deletion.' 
      })
    }
  } catch (error) {
    console.error('Error deleting user from device:', error)
    return NextResponse.json({ 
      error: 'Failed to delete user from device' 
    }, { status: 500 })
  }
}

async function syncUserToDevice(employeeId: string) {
  try {
    const employee = await Employee.findById(employeeId)
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const deviceUserId = employee.deviceUserId || employee.employeeId

    await zktecoService.deleteUser(deviceUserId)
    const success = await zktecoService.addUser(deviceUserId, employee.name)

    if (success) {
      await zktecoService.saveDataToDevice()
      
      employee.deviceUserId = deviceUserId
      employee.lastSyncedAt = new Date()
      await employee.save()

      return NextResponse.json({ 
        success: true, 
        message: 'User synced to device successfully' 
      })
    } else {
      // For now, just update the employee record to simulate device sync
      employee.deviceUserId = deviceUserId
      employee.lastSyncedAt = new Date()
      await employee.save()

      return NextResponse.json({ 
        success: true, 
        message: 'Employee record updated. Physical device connection required for actual user sync.' 
      })
    }
  } catch (error) {
    console.error('Error syncing user to device:', error)
    return NextResponse.json({ 
      error: 'Failed to sync user to device' 
    }, { status: 500 })
  }
}

async function enrollFingerprint(employeeId: string) {
  try {
    const employee = await Employee.findById(employeeId)
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    if (!employee.deviceUserId) {
      return NextResponse.json({ 
        error: 'Employee must be added to device first' 
      }, { status: 400 })
    }

    employee.fingerprintEnrolled = true
    employee.fingerprintDate = new Date()
    await employee.save()

    return NextResponse.json({ 
      success: true, 
      message: 'Fingerprint enrollment recorded. Salary calculation will start from today.' 
    })
  } catch (error) {
    console.error('Error recording fingerprint enrollment:', error)
    return NextResponse.json({ 
      error: 'Failed to record fingerprint enrollment' 
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const deviceUsers = await zktecoService.getUsers()
    return NextResponse.json({ users: deviceUsers })
  } catch (error) {
    console.error('Error fetching device users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch device users' },
      { status: 500 }
    )
  }
}
