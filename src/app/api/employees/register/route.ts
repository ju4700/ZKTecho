import { NextRequest } from 'next/server'
import connectDB from '@/lib/mongodb'
import Employee from '@/models/Employee'
import { getEnhancedZKTecoService } from '@/lib/zkteco-enhanced'
import { ErrorHandler } from '@/lib/errors'
import logger from '@/lib/logger'

interface RegistrationStep {
  id: string
  label: string
  status: 'pending' | 'in-progress' | 'completed' | 'error'
  message?: string
  data?: unknown
}

interface EmployeeRegistrationRequest {
  employeeId: string
  name: string
  email: string
  phone: string
  department: string
  position: string
  hourlyRate: number
  password?: string
  privilege?: number // ZKTeco user privilege level
}

export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2)}`
  
  try {
    await connectDB()
    
    const body: EmployeeRegistrationRequest = await request.json()
    logger.forRequest(requestId).info('Starting employee registration', { employeeId: body.employeeId, name: body.name })
    
    const steps: RegistrationStep[] = [
      { id: 'validation', label: 'Validate Employee Data', status: 'pending' },
      { id: 'database', label: 'Save to Database', status: 'pending' },
      { id: 'device-user', label: 'Create ZKTeco Device User', status: 'pending' },
      { id: 'device-link', label: 'Link Employee to Device User', status: 'pending' },
      { id: 'fingerprint-init', label: 'Initialize Fingerprint Enrollment', status: 'pending' }
    ]

    const updateStep = (stepId: string, status: RegistrationStep['status'], message?: string, data?: unknown) => {
      const step = steps.find(s => s.id === stepId)
      if (step) {
        step.status = status
        step.message = message
        step.data = data
      }
    }

    // Step 1: Validation
    updateStep('validation', 'in-progress')
    
    // Validate required fields
    const requiredFields = ['employeeId', 'name', 'email', 'phone', 'department', 'position', 'hourlyRate']
    const missingFields = requiredFields.filter(field => !body[field as keyof EmployeeRegistrationRequest])
    
    if (missingFields.length > 0) {
      updateStep('validation', 'error', `Missing required fields: ${missingFields.join(', ')}`)
      return ErrorHandler.createErrorResponse(
        new Error(`Missing required fields: ${missingFields.join(', ')}`),
        requestId,
        '/api/employees/register'
      )
    }

    // Check for existing employee
    const existingEmployee = await Employee.findOne({ 
      $or: [
        { employeeId: body.employeeId },
        { email: body.email }
      ]
    })

    if (existingEmployee) {
      const conflict = existingEmployee.employeeId === body.employeeId ? 'Employee ID' : 'Email'
      updateStep('validation', 'error', `${conflict} already exists`)
      return ErrorHandler.createErrorResponse(
        new Error(`${conflict} already exists`),
        requestId,
        '/api/employees/register'
      )
    }

    updateStep('validation', 'completed', 'Employee data validated successfully')

    // Step 2: Save to Database
    updateStep('database', 'in-progress')
    
    try {
      const employee = new Employee({
        employeeId: body.employeeId,
        name: body.name,
        email: body.email,
        phone: body.phone,
        department: body.department,
        position: body.position,
        hourlyRate: body.hourlyRate,
        hireDate: new Date(),
        status: 'active',
        fingerprintEnrolled: false,
        deviceSyncStatus: 'pending',
        currency: 'USD',
        payrollSchedule: 'monthly',
        workSchedule: {
          monday: { start: '09:00', end: '17:00', enabled: true },
          tuesday: { start: '09:00', end: '17:00', enabled: true },
          wednesday: { start: '09:00', end: '17:00', enabled: true },
          thursday: { start: '09:00', end: '17:00', enabled: true },
          friday: { start: '09:00', end: '17:00', enabled: true },
          saturday: { start: '09:00', end: '17:00', enabled: false },
          sunday: { start: '09:00', end: '17:00', enabled: false }
        }
      })

      const savedEmployee = await employee.save()
      updateStep('database', 'completed', 'Employee saved to database', { _id: savedEmployee._id })
      
      logger.forRequest(requestId).info('Employee saved to database', { 
        employeeId: body.employeeId, 
        dbId: savedEmployee._id 
      })

    } catch (dbError) {
      updateStep('database', 'error', `Database error: ${dbError}`)
      logger.forRequest(requestId).error('Database save failed', {}, dbError instanceof Error ? dbError : new Error('Unknown DB error'))
      return ErrorHandler.createErrorResponse(
        new Error(`Database save failed: ${dbError}`),
        requestId,
        '/api/employees/register'
      )
    }

    // Step 3: Create ZKTeco Device User
    updateStep('device-user', 'in-progress')
    
    let deviceUserId: string | null = null
    const zkService = getEnhancedZKTecoService()
    
    try {
      // Connect to device
      const connected = await zkService.connect()
      if (!connected) {
        throw new Error('Failed to connect to ZKTeco device')
      }

      // Use employee ID as device user ID (simpler approach)
      // ZKTeco supports string user IDs
      deviceUserId = body.employeeId

      // Create user on device
      const userCreated = await zkService.createUser({
        userId: deviceUserId,
        name: body.name,
        password: body.password || '',
        privilege: body.privilege || 0, // 0 = normal user
        cardNumber: 0,
        groupNumber: 1,
        enabled: true
      })

      if (!userCreated) {
        throw new Error('Failed to create user on ZKTeco device')
      }

      updateStep('device-user', 'completed', `Device user created with ID: ${deviceUserId}`, { deviceUserId })
      
      logger.forRequest(requestId).info('ZKTeco device user created', { 
        employeeId: body.employeeId, 
        deviceUserId 
      })

    } catch (deviceError) {
      updateStep('device-user', 'error', `Device error: ${deviceError}`)
      logger.forRequest(requestId).error('ZKTeco device user creation failed', {}, deviceError instanceof Error ? deviceError : new Error('Unknown device error'))
      
      // Continue with partial success - employee is in database
      return ErrorHandler.createSuccessResponse({
        success: true,
        message: 'Employee saved to database but device user creation failed',
        steps,
        employeeId: body.employeeId,
        partialSuccess: true
      }, 'Partial registration completed', 207) // 207 = Multi-Status
    }

    // Step 4: Link Employee to Device User
    updateStep('device-link', 'in-progress')
    
    try {
      await Employee.findOneAndUpdate(
        { employeeId: body.employeeId },
        { 
          deviceUserId: deviceUserId,
          deviceSyncStatus: 'synced',
          lastDeviceSync: new Date()
        }
      )

      updateStep('device-link', 'completed', 'Employee linked to device user')
      
      logger.forRequest(requestId).info('Employee linked to device user', { 
        employeeId: body.employeeId, 
        deviceUserId 
      })

    } catch (linkError) {
      updateStep('device-link', 'error', `Link error: ${linkError}`)
      logger.forRequest(requestId).error('Employee-device linking failed', {}, linkError instanceof Error ? linkError : new Error('Unknown link error'))
    }

    // Step 5: Initialize Fingerprint Enrollment
    updateStep('fingerprint-init', 'in-progress')
    
    try {
      // Prepare for fingerprint enrollment
      // In a real implementation, this would initiate the enrollment process
      // For now, we'll mark it as ready for enrollment
      
      updateStep('fingerprint-init', 'completed', 'Ready for fingerprint enrollment', {
        deviceUserId,
        enrollmentUrl: `/api/employees/${body.employeeId}/enroll-fingerprint`,
        instructions: 'Use the fingerprint enrollment interface to complete the process'
      })
      
      logger.forRequest(requestId).info('Fingerprint enrollment initialized', { 
        employeeId: body.employeeId, 
        deviceUserId 
      })

    } catch (fingerprintError) {
      updateStep('fingerprint-init', 'error', `Fingerprint init error: ${fingerprintError}`)
      logger.forRequest(requestId).error('Fingerprint enrollment initialization failed', {}, fingerprintError instanceof Error ? fingerprintError : new Error('Unknown fingerprint error'))
    } finally {
      // Always disconnect from device
      try {
        await zkService.disconnect()
      } catch (disconnectError) {
        logger.forRequest(requestId).warn('Device disconnect warning', { error: disconnectError })
      }
    }

    // Final response
    const allCompleted = steps.every(step => step.status === 'completed')
    const hasErrors = steps.some(step => step.status === 'error')

    logger.forRequest(requestId).info('Employee registration completed', { 
      employeeId: body.employeeId,
      deviceUserId,
      allCompleted,
      hasErrors
    })

    return ErrorHandler.createSuccessResponse({
      success: true,
      message: allCompleted ? 'Employee registration completed successfully' : 'Employee registration completed with some issues',
      steps,
      employeeId: body.employeeId,
      deviceUserId,
      nextStep: allCompleted ? 'fingerprint-enrollment' : 'review-errors'
    }, 'Employee registration processed', allCompleted ? 201 : 207)

  } catch (error) {
    logger.forRequest(requestId).error('Employee registration failed', {}, error instanceof Error ? error : new Error('Unknown error'))
    return ErrorHandler.createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error during registration'),
      requestId,
      '/api/employees/register'
    )
  }
}