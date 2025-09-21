import mongoose from 'mongoose'
import config from './config'
import logger from './logger'
import { DatabaseConnectionState } from '@/types'

/**
 * Enhanced MongoDB Connection Manager
 * Provides robust connection handling with retry logic and monitoring
 */

class DatabaseManager {
  private connectionState: DatabaseConnectionState = {
    isConnected: false,
    connectionCount: 0
  }

  private connection: typeof mongoose | null = null
  private connectionPromise: Promise<typeof mongoose> | null = null

  constructor() {
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    mongoose.connection.on('connected', () => {
      this.connectionState = {
        isConnected: true,
        lastConnectionTime: new Date(),
        connectionCount: this.connectionState.connectionCount + 1
      }
      logger.database.connection('connected', {
        connectionCount: this.connectionState.connectionCount
      })
    })

    mongoose.connection.on('error', (error) => {
      this.connectionState = {
        ...this.connectionState,
        isConnected: false,
        error: error.message
      }
      logger.database.connection('error', { error: error.message })
    })

    mongoose.connection.on('disconnected', () => {
      this.connectionState = {
        ...this.connectionState,
        isConnected: false
      }
      logger.database.connection('disconnected')
    })

    // Graceful shutdown
    process.on('SIGINT', this.gracefulShutdown.bind(this))
    process.on('SIGTERM', this.gracefulShutdown.bind(this))
  }

  private async gracefulShutdown(): Promise<void> {
    try {
      if (this.connection) {
        await mongoose.connection.close()
        logger.info('Database connection closed gracefully')
      }
    } catch (error) {
      logger.error('Error during database shutdown', {}, error instanceof Error ? error : new Error('Unknown shutdown error'))
    }
    process.exit(0)
  }

  public async connect(): Promise<typeof mongoose> {
    if (this.connection && this.connectionState.isConnected) {
      return this.connection
    }

    if (!this.connectionPromise) {
      this.connectionPromise = this.establishConnection()
    }

    try {
      this.connection = await this.connectionPromise
      return this.connection
    } catch (error) {
      this.connectionPromise = null
      throw error
    }
  }

  private async establishConnection(): Promise<typeof mongoose> {
    const dbConfig = config.get('database')
    
    const options = {
      bufferCommands: false,
      maxPoolSize: dbConfig.options.maxPoolSize,
      serverSelectionTimeoutMS: dbConfig.options.serverSelectionTimeoutMS,
      socketTimeoutMS: dbConfig.options.socketTimeoutMS,
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true,
      retryReads: true
    }

    logger.info('Attempting database connection', {
      uri: dbConfig.uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@'), // Hide password in logs
      options: {
        maxPoolSize: options.maxPoolSize,
        serverSelectionTimeoutMS: options.serverSelectionTimeoutMS,
        socketTimeoutMS: options.socketTimeoutMS
      }
    })

    try {
      const connection = await mongoose.connect(dbConfig.uri, options)
      
      logger.info('Database connected successfully', {
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name
      })

      return connection
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown database connection error')
      logger.error('Database connection failed', {
        uri: dbConfig.uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@'),
        error: err.message
      }, err)
      throw err
    }
  }

  public getConnectionState(): DatabaseConnectionState {
    return { ...this.connectionState }
  }

  public async disconnect(): Promise<void> {
    if (this.connection) {
      await mongoose.connection.close()
      this.connection = null
      this.connectionPromise = null
    }
  }

  public async ping(): Promise<boolean> {
    try {
      if (!this.connection || !mongoose.connection.db) {
        return false
      }
      
      await mongoose.connection.db.admin().ping()
      return true
    } catch {
      return false
    }
  }
}

// Singleton instance
const databaseManager = new DatabaseManager()

// Main connection function for backward compatibility
export default async function connectDB(): Promise<typeof mongoose> {
  return databaseManager.connect()
}

// Export additional utilities
export { databaseManager }
export const getConnectionState = () => databaseManager.getConnectionState()
export const pingDatabase = () => databaseManager.ping()
