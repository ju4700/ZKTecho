import config from './config'

/**
 * Professional Logging System
 * Replaces console.log with structured, leveled logging
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LogEntry {
  timestamp: string
  level: string
  message: string
  context?: Record<string, unknown>
  error?: Error
  requestId?: string
}

class Logger {
  private logLevel: LogLevel
  private appName: string

  constructor() {
    const appConfig = config.get('app')
    this.appName = appConfig.name
    this.logLevel = this.getLogLevel(appConfig.logLevel)
  }

  private getLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'error': return LogLevel.ERROR
      case 'warn': return LogLevel.WARN
      case 'info': return LogLevel.INFO
      case 'debug': return LogLevel.DEBUG
      default: return LogLevel.INFO
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel
  }

  private formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, message, context, error, requestId } = entry
    
    let logMessage = `[${timestamp}] [${level}] [${this.appName}]`
    
    if (requestId) {
      logMessage += ` [${requestId}]`
    }
    
    logMessage += ` ${message}`

    if (context && Object.keys(context).length > 0) {
      logMessage += ` | Context: ${JSON.stringify(context)}`
    }

    if (error) {
      logMessage += ` | Error: ${error.message}`
      if (error.stack && this.logLevel >= LogLevel.DEBUG) {
        logMessage += `\nStack: ${error.stack}`
      }
    }

    return logMessage
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error, requestId?: string): void {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      context,
      error,
      requestId
    }

    const formattedMessage = this.formatLogEntry(entry)

    // In production, you would send to external logging service
    // For now, use console with proper levels
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage)
        break
      case LogLevel.WARN:
        console.warn(formattedMessage)
        break
      case LogLevel.INFO:
        console.info(formattedMessage)
        break
      case LogLevel.DEBUG:
        console.debug(formattedMessage)
        break
    }
  }

  public error(message: string, context?: Record<string, unknown>, error?: Error, requestId?: string): void {
    this.log(LogLevel.ERROR, message, context, error, requestId)
  }

  public warn(message: string, context?: Record<string, unknown>, requestId?: string): void {
    this.log(LogLevel.WARN, message, context, undefined, requestId)
  }

  public info(message: string, context?: Record<string, unknown>, requestId?: string): void {
    this.log(LogLevel.INFO, message, context, undefined, requestId)
  }

  public debug(message: string, context?: Record<string, unknown>, requestId?: string): void {
    this.log(LogLevel.DEBUG, message, context, undefined, requestId)
  }

  // Request-specific loggers with automatic request ID
  public forRequest(requestId: string) {
    return {
      error: (message: string, context?: Record<string, unknown>, error?: Error) => 
        this.error(message, context, error, requestId),
      warn: (message: string, context?: Record<string, unknown>) => 
        this.warn(message, context, requestId),
      info: (message: string, context?: Record<string, unknown>) => 
        this.info(message, context, requestId),
      debug: (message: string, context?: Record<string, unknown>) => 
        this.debug(message, context, requestId)
    }
  }

  // Database operation logging
  public database = {
    connection: (status: 'connected' | 'disconnected' | 'error', context?: Record<string, unknown>) => {
      if (status === 'error') {
        this.error(`Database connection ${status}`, context)
      } else {
        this.info(`Database connection ${status}`, context)
      }
    },
    query: (operation: string, collection: string, duration?: number, context?: Record<string, unknown>) => {
      this.debug(`Database ${operation} on ${collection}`, { ...context, duration: duration ? `${duration}ms` : undefined })
    },
    error: (operation: string, error: Error, context?: Record<string, unknown>) => {
      this.error(`Database ${operation} failed`, context, error)
    }
  }

  // ZKTeco device operation logging
  public device = {
    connection: (status: 'connected' | 'disconnected' | 'error', deviceIp?: string, context?: Record<string, unknown>) => {
      const baseContext = { deviceIp, ...context }
      if (status === 'error') {
        this.error(`ZKTeco device connection ${status}`, baseContext)
      } else {
        this.info(`ZKTeco device connection ${status}`, baseContext)
      }
    },
    operation: (operation: string, success: boolean, context?: Record<string, unknown>) => {
      if (success) {
        this.info(`ZKTeco ${operation} successful`, context)
      } else {
        this.warn(`ZKTeco ${operation} failed`, context)
      }
    },
    error: (operation: string, error: Error, context?: Record<string, unknown>) => {
      this.error(`ZKTeco ${operation} error`, context, error)
    }
  }

  // API operation logging
  public api = {
    request: (method: string, path: string, requestId: string, context?: Record<string, unknown>) => {
      this.info(`API ${method} ${path}`, context, requestId)
    },
    response: (method: string, path: string, statusCode: number, duration: number, requestId: string) => {
      const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO
      this.log(level, `API ${method} ${path} - ${statusCode}`, { duration: `${duration}ms` }, undefined, requestId)
    },
    error: (method: string, path: string, error: Error, requestId: string, context?: Record<string, unknown>) => {
      this.error(`API ${method} ${path} error`, context, error, requestId)
    }
  }
}

// Singleton instance
export const logger = new Logger()

// Convenience function to generate request IDs
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2)}`
}

export default logger