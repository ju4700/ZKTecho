import { AppConfig } from '@/types'

/**
 * Environment Configuration Manager
 * Centralizes all environment variable handling with validation and defaults
 */
class ConfigManager {
  private config: AppConfig

  constructor() {
    this.config = this.loadConfig()
    this.validateConfig()
  }

  private loadConfig(): AppConfig {
    return {
      database: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/zkteco-attendance',
        options: {
          maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || '10'),
          serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT || '5000'),
          socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT || '45000'),
        }
      },
      zkteco: {
        ip: process.env.ZKTECO_IP || '192.168.1.201',
        port: parseInt(process.env.ZKTECO_PORT || '4370'),
        timeout: parseInt(process.env.ZKTECO_TIMEOUT || '5000'),
        retries: parseInt(process.env.ZKTECO_RETRIES || '3'),
      },
      security: {
        jwtSecret: process.env.JWT_SECRET || (() => {
          if (process.env.NODE_ENV === 'production') {
            throw new Error('JWT_SECRET must be set in production')
          }
          return 'dev-secret-change-in-production'
        })(),
        apiKeyRequired: process.env.API_KEY_REQUIRED === 'true',
        rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
        rateLimitRequests: parseInt(process.env.RATE_LIMIT_REQUESTS || '100'),
      },
      app: {
        name: process.env.APP_NAME || 'ZKTeco Employee Management System',
        version: process.env.APP_VERSION || '1.0.0',
        environment: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
        logLevel: (process.env.LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug') || 'info',
        port: parseInt(process.env.PORT || '3000'),
      },
      features: {
        overtimeThreshold: parseFloat(process.env.OVERTIME_THRESHOLD_HOURS || '8'),
        autoSync: process.env.AUTO_SYNC_ENABLED !== 'false',
        realTimeMonitoring: process.env.REAL_TIME_MONITORING !== 'false',
      }
    }
  }

  private validateConfig(): void {
    const errors: string[] = []

    // Validate required environment variables
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.JWT_SECRET) {
        errors.push('JWT_SECRET is required in production')
      }
      if (!process.env.MONGODB_URI) {
        errors.push('MONGODB_URI is required in production')
      }
      if (!process.env.ZKTECO_IP) {
        errors.push('ZKTECO_IP is required in production')
      }
    }

    // Validate configuration values
    if (this.config.zkteco.port < 1 || this.config.zkteco.port > 65535) {
      errors.push('ZKTECO_PORT must be between 1 and 65535')
    }

    if (this.config.zkteco.timeout < 1000) {
      errors.push('ZKTECO_TIMEOUT must be at least 1000ms')
    }

    if (this.config.features.overtimeThreshold < 0 || this.config.features.overtimeThreshold > 24) {
      errors.push('OVERTIME_THRESHOLD_HOURS must be between 0 and 24')
    }

    if (this.config.security.rateLimitRequests < 1) {
      errors.push('RATE_LIMIT_REQUESTS must be at least 1')
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`)
    }
  }

  public getConfig(): AppConfig {
    return { ...this.config }
  }

  public get<K extends keyof AppConfig>(section: K): AppConfig[K] {
    return this.config[section]
  }

  public isDevelopment(): boolean {
    return this.config.app.environment === 'development'
  }

  public isProduction(): boolean {
    return this.config.app.environment === 'production'
  }

  public isTest(): boolean {
    return this.config.app.environment === 'test'
  }
}

// Singleton instance
export const config = new ConfigManager()

// Convenience exports
export const isDevelopment = () => config.isDevelopment()
export const isProduction = () => config.isProduction()
export const isTest = () => config.isTest()

export default config