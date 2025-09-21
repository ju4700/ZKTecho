import { NextRequest } from 'next/server'
import connectDB from '@/lib/mongodb'
import Employee from '@/models/Employee'
import { validateEmployeeData, validatePaginationParams, ValidationException } from '@/lib/validation'
import { ErrorHandler, withRequestHandling, withDatabaseOperation, ConflictError } from '@/lib/errors'
import { withRateLimit } from '@/lib/rate-limit'
import logger from '@/lib/logger'
import { Employee as EmployeeType } from '@/types'

export const GET = withRequestHandling(async (requestId: string, request: NextRequest) => {
  await connectDB()
  
  const url = new URL(request.url)
  const { page, limit, offset } = validatePaginationParams(url.searchParams)
  const search = url.searchParams.get('search') || ''
  const status = url.searchParams.get('status') as 'active' | 'inactive' | null

  const query: Record<string, unknown> = {}
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ]
  }
  
  if (status) {
    query.status = status
  }

  const [employees, total] = await Promise.all([
    withDatabaseOperation('find employees', () => 
      Employee.find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean()
    ),
    withDatabaseOperation('count employees', () => Employee.countDocuments(query))
  ])

  logger.forRequest(requestId).info('Employees retrieved', {
    total,
    page,
    limit,
    search,
    status
  })

  return ErrorHandler.createSuccessResponse({
    success: true,
    data: employees as unknown as EmployeeType[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    timestamp: new Date().toISOString()
  })
})

export const POST = withRateLimit(withRequestHandling(async (requestId: string, request: NextRequest) => {
  try {
    await connectDB()
    
    const body = await request.json()
    const validatedData = validateEmployeeData(body)
    
    // Check for existing employee
    const existingEmployee = await withDatabaseOperation('check existing employee', () =>
      Employee.findOne({ employeeId: validatedData.employeeId })
    )
    
    if (existingEmployee) {
      throw new ConflictError('Employee ID already exists', { employeeId: validatedData.employeeId })
    }

    // Create new employee
    const employee = new Employee({
      ...validatedData,
      status: 'active',
      fingerprintEnrolled: false,
      deviceUserId: null
    })

    const savedEmployee = await withDatabaseOperation('save employee', () => employee.save()) as unknown as EmployeeType & { toObject: () => EmployeeType }

    logger.forRequest(requestId).info('Employee created successfully', {
      employeeId: savedEmployee.employeeId,
      name: savedEmployee.name
    })

    return ErrorHandler.createSuccessResponse(
      {
        success: true,
        data: savedEmployee.toObject() as EmployeeType,
        message: 'Employee created successfully',
        timestamp: new Date().toISOString()
      },
      'Employee created successfully',
      201
    )

  } catch (error) {
    if (error instanceof ValidationException) {
      logger.forRequest(requestId).warn('Employee creation validation failed', {
        errors: error.errors
      })
    } else {
      logger.forRequest(requestId).error('Employee creation failed', {}, error instanceof Error ? error : new Error('Unknown error'))
    }
    throw error
  }
}))
