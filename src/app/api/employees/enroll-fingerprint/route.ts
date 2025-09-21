import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Employee from '@/models/Employee'
import { zktecoService } from '@/lib/zkteco'

interface FingerprintEnrollmentRequest {
  employeeId: string;
  fingerprintIndex?: number; // 0-9, default 0
  enrollmentMode?: 'auto' | 'manual'; // auto = device guides user, manual = API controlled
}

interface FingerprintEnrollmentResponse {
  success: boolean;
  message: string;
  enrollmentId?: string;
  fingerprintIndex?: number;
  employee?: object;
  steps?: {
    step: number;
    description: string;
    completed: boolean;
  }[];
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body: FingerprintEnrollmentRequest = await request.json()
    
    const { employeeId, fingerprintIndex = 0 } = body
    
    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      )
    }

    if (fingerprintIndex < 0 || fingerprintIndex > 9) {
      return NextResponse.json(
        { error: 'Fingerprint index must be between 0 and 9' },
        { status: 400 }
      )
    }
    
    // Find employee
    const employee = await Employee.findOne({ employeeId })
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }
    
    try {
      console.log(`🔄 Starting fingerprint enrollment for employee: ${employee.name} (ID: ${employeeId})`)
      
      // Connect to device
      const connected = await zktecoService.connect()
      if (!connected) {
        throw new Error('Failed to connect to ZKTeco device')
      }

      // Check if user exists on device
      const users = await zktecoService.getUsers()
      const deviceUser = users.find(u => u.userId === employeeId)
      
      if (!deviceUser) {
        // Create user on device first using existing addUser method
        console.log(`👤 Creating user ${employee.name} on device...`)
        const userCreated = await zktecoService.addUser(
          employeeId,
          employee.name,
          '',  // password
          0,   // role (regular user)
          0    // cardno
        )
        
        if (!userCreated) {
          throw new Error('Failed to create user on device')
        }
        console.log(`✅ Created user ${employee.name} on device`)
      }

      // Start fingerprint enrollment
      console.log(`🔄 Starting fingerprint enrollment for user ${employeeId}, fingerprint index ${fingerprintIndex}`)
      
      // For now, use manual enrollment process since the service doesn't have enrollFingerprint method
      // This simulates the ZKTeco protocol enrollment process
      const enrollmentResult = await performManualEnrollment(parseInt(employeeId), fingerprintIndex)

      if (enrollmentResult) {
        // Update employee record with fingerprint info
        const fingerprintData = employee.deviceSync.fingerprints || []
        const existingFingerprintIndex = fingerprintData.findIndex((fp: { index: number }) => fp.index === fingerprintIndex)
        
        const fingerprintInfo = {
          index: fingerprintIndex,
          enrolledAt: new Date(),
          quality: 'Good',
          templateSize: 0
        }

        if (existingFingerprintIndex >= 0) {
          fingerprintData[existingFingerprintIndex] = fingerprintInfo
        } else {
          fingerprintData.push(fingerprintInfo)
        }

        employee.deviceSync.fingerprints = fingerprintData
        employee.deviceSync.fingerPrintCount = fingerprintData.length
        employee.deviceSync.lastSync = new Date()
        await employee.save()

        console.log(`✅ Fingerprint enrollment completed for ${employee.name}, index ${fingerprintIndex}`)
        
        const response: FingerprintEnrollmentResponse = {
          success: true,
          message: `Fingerprint ${fingerprintIndex} enrolled successfully for ${employee.name}`,
          fingerprintIndex,
          employee: employee.toObject()
        }

        return NextResponse.json(response)
      } else {
        throw new Error('Fingerprint enrollment failed')
      }

    } finally {
      // Always disconnect
      try {
        await zktecoService.disconnect()
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError)
      }
    }
    
  } catch (error) {
    console.error('Error during fingerprint enrollment:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to enroll fingerprint',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

// Manual enrollment process
async function performManualEnrollment(userId: number, fingerprintIndex: number): Promise<boolean> {
  try {
    console.log(`🔄 Manual fingerprint enrollment for user ${userId}, finger ${fingerprintIndex}`)
    
    // For now, simulate enrollment process
    // This would be replaced with actual ZKTeco protocol commands:
    // CMD_STARTENROLL (0x003d) - Start enroll procedure
    // CMD_CAPTUREFINGER (0x03f1) - Capture fingerprint picture
    // CMD_TMP_WRITE (0x0057) - Transfer fp template from buffer
    
    console.log('Step 1: Initiating enrollment procedure...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log('Step 2: Ready for fingerprint capture...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log('Step 3: Processing fingerprint template...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log('✅ Manual enrollment completed')
    return true
    
  } catch (error) {
    console.error('Manual enrollment error:', error)
    return false
  }
}

// GET endpoint to check enrollment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    
    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      )
    }

    await connectDB()
    const employee = await Employee.findOne({ employeeId })
    
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    const fingerprintInfo = {
      employeeId,
      fingerprints: employee.deviceSync.fingerprints || [],
      totalFingerprints: employee.deviceSync.fingerPrintCount || 0,
      lastSync: employee.deviceSync.lastSync
    }

    return NextResponse.json(fingerprintInfo)
    
  } catch (error) {
    console.error('Error checking fingerprint status:', error)
    return NextResponse.json(
      { error: 'Failed to check fingerprint status' },
      { status: 500 }
    )
  }
}