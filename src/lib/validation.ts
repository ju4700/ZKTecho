import { ValidationError } from '@/types'

/**
 * Input Validation and Sanitization System
 * Provides comprehensive validation for all API inputs
 */

export class ValidationException extends Error {
  public readonly errors: ValidationError[]

  constructor(errors: ValidationError[]) {
    super('Validation failed')
    this.name = 'ValidationException'
    this.errors = errors
  }
}

export class Validator {
  private errors: ValidationError[] = []

  public reset(): Validator {
    this.errors = []
    return this
  }

  public getErrors(): ValidationError[] {
    return [...this.errors]
  }

  public isValid(): boolean {
    return this.errors.length === 0
  }

  public throwIfInvalid(): void {
    if (!this.isValid()) {
      throw new ValidationException(this.errors)
    }
  }

  private addError(field: string, message: string, value?: unknown): void {
    this.errors.push({ field, message, value })
  }

  // String validations
  public string(field: string, value: unknown, options: {
    required?: boolean
    minLength?: number
    maxLength?: number
    pattern?: RegExp
    trim?: boolean
  } = {}): string | undefined {
    const { required = false, minLength, maxLength, pattern, trim = true } = options

    if (value === undefined || value === null) {
      if (required) {
        this.addError(field, `${field} is required`)
      }
      return undefined
    }

    if (typeof value !== 'string') {
      this.addError(field, `${field} must be a string`, value)
      return undefined
    }

    const processedValue = trim ? value.trim() : value

    if (required && processedValue.length === 0) {
      this.addError(field, `${field} cannot be empty`)
      return undefined
    }

    if (minLength !== undefined && processedValue.length < minLength) {
      this.addError(field, `${field} must be at least ${minLength} characters long`)
    }

    if (maxLength !== undefined && processedValue.length > maxLength) {
      this.addError(field, `${field} must be at most ${maxLength} characters long`)
    }

    if (pattern && !pattern.test(processedValue)) {
      this.addError(field, `${field} format is invalid`)
    }

    return processedValue
  }

  // Number validations
  public number(field: string, value: unknown, options: {
    required?: boolean
    min?: number
    max?: number
    integer?: boolean
  } = {}): number | undefined {
    const { required = false, min, max, integer = false } = options

    if (value === undefined || value === null) {
      if (required) {
        this.addError(field, `${field} is required`)
      }
      return undefined
    }

    let numValue: number

    if (typeof value === 'string') {
      numValue = parseFloat(value)
    } else if (typeof value === 'number') {
      numValue = value
    } else {
      this.addError(field, `${field} must be a number`, value)
      return undefined
    }

    if (isNaN(numValue)) {
      this.addError(field, `${field} must be a valid number`, value)
      return undefined
    }

    if (integer && !Number.isInteger(numValue)) {
      this.addError(field, `${field} must be an integer`)
    }

    if (min !== undefined && numValue < min) {
      this.addError(field, `${field} must be at least ${min}`)
    }

    if (max !== undefined && numValue > max) {
      this.addError(field, `${field} must be at most ${max}`)
    }

    return numValue
  }

  // Email validation
  public email(field: string, value: unknown, required = false): string | undefined {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return this.string(field, value, {
      required,
      pattern: emailPattern,
      maxLength: 254
    })
  }

  // Phone validation
  public phone(field: string, value: unknown, required = false): string | undefined {
    // Basic international phone pattern
    const phonePattern = /^\+?[\d\s\-\(\)]{7,20}$/
    return this.string(field, value, {
      required,
      pattern: phonePattern,
      minLength: 7,
      maxLength: 20
    })
  }

  // Employee ID validation
  public employeeId(field: string, value: unknown, required = true): string | undefined {
    const employeeIdPattern = /^[A-Z0-9]{3,20}$/
    return this.string(field, value, {
      required,
      pattern: employeeIdPattern,
      minLength: 3,
      maxLength: 20
    })
  }

  // Date validation
  public date(field: string, value: unknown, required = false): Date | undefined {
    if (value === undefined || value === null) {
      if (required) {
        this.addError(field, `${field} is required`)
      }
      return undefined
    }

    let dateValue: Date

    if (value instanceof Date) {
      dateValue = value
    } else if (typeof value === 'string') {
      dateValue = new Date(value)
    } else {
      this.addError(field, `${field} must be a valid date`, value)
      return undefined
    }

    if (isNaN(dateValue.getTime())) {
      this.addError(field, `${field} must be a valid date`, value)
      return undefined
    }

    return dateValue
  }

  // Boolean validation
  public boolean(field: string, value: unknown, required = false): boolean | undefined {
    if (value === undefined || value === null) {
      if (required) {
        this.addError(field, `${field} is required`)
      }
      return undefined
    }

    if (typeof value === 'boolean') {
      return value
    }

    if (typeof value === 'string') {
      const lower = value.toLowerCase()
      if (lower === 'true' || lower === '1') return true
      if (lower === 'false' || lower === '0') return false
    }

    if (typeof value === 'number') {
      if (value === 1) return true
      if (value === 0) return false
    }

    this.addError(field, `${field} must be a boolean`, value)
    return undefined
  }

  // Array validation
  public array<T>(field: string, value: unknown, options: {
    required?: boolean
    minLength?: number
    maxLength?: number
    itemValidator?: (item: unknown, index: number) => T
  } = {}): T[] | undefined {
    const { required = false, minLength, maxLength, itemValidator } = options

    if (value === undefined || value === null) {
      if (required) {
        this.addError(field, `${field} is required`)
      }
      return undefined
    }

    if (!Array.isArray(value)) {
      this.addError(field, `${field} must be an array`, value)
      return undefined
    }

    if (minLength !== undefined && value.length < minLength) {
      this.addError(field, `${field} must have at least ${minLength} items`)
    }

    if (maxLength !== undefined && value.length > maxLength) {
      this.addError(field, `${field} must have at most ${maxLength} items`)
    }

    if (itemValidator) {
      const validatedItems: T[] = []
      for (let i = 0; i < value.length; i++) {
        try {
          const validatedItem = itemValidator(value[i], i)
          validatedItems.push(validatedItem)
        } catch {
          this.addError(`${field}[${i}]`, `Invalid item at index ${i}`, value[i])
        }
      }
      return validatedItems
    }

    return value as T[]
  }

  // Object validation
  public object<T>(field: string, value: unknown, required = false): T | undefined {
    if (value === undefined || value === null) {
      if (required) {
        this.addError(field, `${field} is required`)
      }
      return undefined
    }

    if (typeof value !== 'object' || Array.isArray(value)) {
      this.addError(field, `${field} must be an object`, value)
      return undefined
    }

    return value as T
  }

  // MongoDB ObjectId validation
  public objectId(field: string, value: unknown, required = false): string | undefined {
    const objectIdPattern = /^[0-9a-fA-F]{24}$/
    return this.string(field, value, {
      required,
      pattern: objectIdPattern,
      minLength: 24,
      maxLength: 24
    })
  }
}

// Convenience functions for common validations
export function validateEmployeeData(data: unknown): {
  employeeId: string
  name: string
  email?: string
  phone?: string
  department?: string
  position?: string
  hourlyRate: number
} {
  const validator = new Validator()

  const employeeId = validator.employeeId('employeeId', (data as Record<string, unknown>)?.employeeId, true)!
  const name = validator.string('name', (data as Record<string, unknown>)?.name, { required: true, minLength: 2, maxLength: 100 })!
  const email = validator.email('email', (data as Record<string, unknown>)?.email)
  const phone = validator.phone('phone', (data as Record<string, unknown>)?.phone)
  const department = validator.string('department', (data as Record<string, unknown>)?.department, { maxLength: 50 })
  const position = validator.string('position', (data as Record<string, unknown>)?.position, { maxLength: 50 })
  const hourlyRate = validator.number('hourlyRate', (data as Record<string, unknown>)?.hourlyRate, { required: true, min: 0 })!

  validator.throwIfInvalid()

  return {
    employeeId,
    name,
    email,
    phone,
    department,
    position,
    hourlyRate
  }
}

export function validatePaginationParams(searchParams: URLSearchParams): {
  page: number
  limit: number
  offset: number
} {
  const validator = new Validator()

  const page = validator.number('page', searchParams.get('page'), { min: 1, integer: true }) || 1
  const limit = validator.number('limit', searchParams.get('limit'), { min: 1, max: 100, integer: true }) || 10

  validator.throwIfInvalid()

  return {
    page,
    limit,
    offset: (page - 1) * limit
  }
}