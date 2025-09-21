import { NextRequest, NextResponse } from 'next/server'
import { getEnhancedZKTecoService } from '@/lib/zkteco-enhanced'
import connectDB from '@/lib/mongodb'
import Employee from '@/models/Employee'

interface UserData {
  password?: string
  role?: number
}

// GET - Fetch all users from device
export async function GET() {
  try {
    console.log('🔍 Fetching users directly from ZKTeco device...')
    
    const zkService = getEnhancedZKTecoService()
    const users = await zkService.getUsers()
    
    // Also get device info for context
    const deviceInfo = await zkService.getDeviceInfo()
    
    return NextResponse.json({
      success: true,
      total: users.length,
      users: users.map(user => ({
        id: user.userId,
        name: user.name,
        role: user.role,
        cardno: user.cardno,
        userSn: user.userSn,
        enabled: user.enabled,
        group: user.group,
        verificationMode: user.verificationMode,
        source: 'device'
      })),
      deviceInfo,
      message: `Found ${users.length} users on device`
    })
    
  } catch (error) {
    console.error('Error fetching device users:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch users from device'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    const { employeeId, action, userId, name, ...userData } = body

    switch (action) {
      case 'create':
        return await createUserOnDevice(userId, name)
      case 'delete':
        return await deleteUserFromDevice(userId)
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

async function createUserOnDevice(userId: string, name: string) {
  try {
    if (!userId || !name) {
      return NextResponse.json({
        success: false,
        error: 'userId and name are required'
      }, { status: 400 })
    }
    
    console.log(`👤 Creating user ${userId} (${name}) on ZKTeco device...`)
    
    const zkService = getEnhancedZKTecoService()
    const success = await zkService.addUser(userId, name)
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: `Successfully created user ${userId} on device`,
        user: { userId, name }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: `Failed to create user ${userId} on device`
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Error creating device user:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user on device'
    }, { status: 500 })
  }
}

async function deleteUserFromDevice(userId: string) {
  try {
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId is required'
      }, { status: 400 })
    }
    
    console.log(`🗑️ Deleting user ${userId} from ZKTeco device...`)
    
    const zkService = getEnhancedZKTecoService()
    const success = await zkService.deleteUser(userId)
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: `Successfully deleted user ${userId} from device`
      })
    } else {
      return NextResponse.json({
        success: false,
        error: `Failed to delete user ${userId} from device`
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Error deleting device user:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user from device'
    }, { status: 500 })
  }
}

async function syncUserToDevice(employeeId: string) {
  try {
    const employee = await Employee.findOne({ employeeId })
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    if (!employee.deviceUserId) {
      return NextResponse.json({ 
        error: 'Employee does not have a device user ID assigned' 
      }, { status: 400 })
    }

    console.log(`🔄 Syncing employee ${employeeId} to device as user ${employee.deviceUserId}...`)
    
    const zkService = getEnhancedZKTecoService()
    const success = await zkService.addUser(employee.deviceUserId, employee.name)
    
    if (success) {
      employee.lastSyncedAt = new Date()
      await employee.save()
      
      return NextResponse.json({
        success: true,
        message: `Successfully synced ${employee.name} to device`,
        deviceUserId: employee.deviceUserId
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to sync user to device'
      }, { status: 500 })
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
    const employee = await Employee.findOne({ employeeId })
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    if (!employee.deviceUserId) {
      return NextResponse.json({ 
        error: 'Employee must have a device user ID assigned before fingerprint enrollment' 
      }, { status: 400 })
    }

    console.log(`👆 Initiating fingerprint enrollment for ${employee.name} (device ID: ${employee.deviceUserId})...`)
    
    const zkService = getEnhancedZKTecoService()
    const success = await zkService.startFingerprintEnrollment(employee.deviceUserId, 0)
    
    if (success) {
      employee.fingerprintEnrolled = true
      employee.fingerprintDate = new Date()
      await employee.save()
      
      return NextResponse.json({
        success: true,
        message: `Fingerprint enrollment initiated for ${employee.name}. Please complete on device.`,
        deviceUserId: employee.deviceUserId
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to initiate fingerprint enrollment'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Error enrolling fingerprint:', error)
    return NextResponse.json({ 
      error: 'Failed to enroll fingerprint' 
    }, { status: 500 })
  }
}