import { NextResponse } from 'next/server'
import { ErrorResponse, ApiResponse } from '@/types'
import { ValidationException } from './validation'
import logger from './logger'

/**
 * Centralized Error Handling System
 * Provides consistent error responses and logging
 */

export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly context?: Record<string, unknown>

  constructor(
    message: string,
    statusCode = 500,
    isOperational = true,
    context?: Record<string, unknown>
  ) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.context = context

    Error.captureStackTrace(this, this.constructor)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`
    super(message, 404, true, { resource, id })
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 400, true, context)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401, true)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403, true)
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 409, true, context)
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, true)
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, 500, true, { originalError: originalError?.message })
  }
}

export class ZKTecoError extends AppError {
  constructor(message: string, operation?: string, deviceIp?: string) {
    super(message, 503, true, { operation, deviceIp })
  }
}

/**
 * Error Handler Class
 * Handles different types of errors and creates appropriate responses
 */
export class ErrorHandler {
  public static createErrorResponse(
    error: Error,
    requestId?: string,
    path?: string
  ): NextResponse<ErrorResponse> {
    const timestamp = new Date().toISOString()

    // Log the error
    logger.error('Request error', {
      error: error.message,
      stack: error.stack,
      path,
      requestId
    }, error, requestId)

    // Handle validation errors
    if (error instanceof ValidationException) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
          timestamp,
          path
        },
        { status: 400 }
      )
    }

    // Handle application errors
    if (error instanceof AppError) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: error.message,
          timestamp,
          path
        },
        { status: error.statusCode }
      )
    }

    // Handle known Node.js errors
    if (error.name === 'MongoError' || error.name === 'MongooseError') {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Database operation failed',
          timestamp,
          path
        },
        { status: 500 }
      )
    }

    if (error.name === 'CastError') {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Invalid ID format',
          timestamp,
          path
        },
        { status: 400 }
      )
    }

    // Handle generic errors (don't expose internal details in production)
    const isProduction = process.env.NODE_ENV === 'production'
    const errorMessage = isProduction ? 'Internal server error' : error.message

    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: errorMessage,
        timestamp,
        path
      },
      { status: 500 }
    )
  }

  public static createSuccessResponse<T>(
    data: T,
    message?: string,
    statusCode = 200
  ): NextResponse<ApiResponse<T>> {
    return NextResponse.json<ApiResponse<T>>(
      {
        success: true,
        data,
        message,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    )
  }
}

/**
 * Async error wrapper for API routes
 * Automatically catches and handles errors in async route handlers
 */
export function withErrorHandling<T extends unknown[], R>(
  handler: (...args: T) => Promise<NextResponse<R>>
) {
  return async (...args: T): Promise<NextResponse<R | ErrorResponse>> => {
    try {
      return await handler(...args)
    } catch (error) {
      return ErrorHandler.createErrorResponse(
        error instanceof Error ? error : new Error('Unknown error'),
        undefined, // requestId would need to be extracted from request
        undefined  // path would need to be extracted from request
      )
    }
  }
}

/**
 * Request wrapper that adds logging and error handling
 */
export function withRequestHandling<T extends unknown[], R>(
  handler: (requestId: string, ...args: T) => Promise<NextResponse<R>>
) {
  return async (...args: T): Promise<NextResponse<R | ErrorResponse>> => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2)}`
    const startTime = Date.now()

    try {
      const result = await handler(requestId, ...args)
      const duration = Date.now() - startTime
      
      logger.api.response('API', 'unknown', result.status, duration, requestId)
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      const err = error instanceof Error ? error : new Error('Unknown error')
      
      logger.api.error('API', 'unknown', err, requestId, { duration })
      
      return ErrorHandler.createErrorResponse(err, requestId)
    }
  }
}

/**
 * Database operation wrapper
 */
export async function withDatabaseOperation<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now()
  
  try {
    logger.database.query(operation, 'unknown', undefined, { startTime: new Date().toISOString() })
    
    const result = await fn()
    const duration = Date.now() - startTime
    
    logger.database.query(operation, 'unknown', duration)
    
    return result
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown database error')
    logger.database.error(operation, err)
    throw new DatabaseError(`Database ${operation} failed: ${err.message}`, err)
  }
}

/**
 * ZKTeco operation wrapper
 */
export async function withDeviceOperation<T>(
  operation: string,
  deviceIp: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    logger.device.operation(operation, true, { deviceIp, startTime: new Date().toISOString() })
    
    const result = await fn()
    
    logger.device.operation(operation, true, { deviceIp })
    
    return result
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown device error')
    logger.device.error(operation, err, { deviceIp })
    throw new ZKTecoError(`Device ${operation} failed: ${err.message}`, operation, deviceIp)
  }
}

export default ErrorHandler