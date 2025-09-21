/* eslint-disable @typescript-eslint/no-explicit-any */

let ZKLib: any = null
const loadZKLib = async () => {
  if (typeof window === 'undefined' && !ZKLib) {
    try {
      const zkModule = await import('zklib-js')
      ZKLib = zkModule.default
    } catch (error) {
      console.error('Failed to load zklib-js:', error)
      return null
    }
  }
  return ZKLib
}

export interface AttendanceLog {
  deviceUserId: string
  timestamp: Date
  attendanceType: number
  deviceId?: string
}

export interface DeviceUser {
  userId: string
  name: string
  role: number
  cardno?: string
  userSn?: number
  enabled?: boolean
  group?: number
  verificationMode?: number
}

export interface DeviceInfo {
  userCounts: number
  logCounts: number
  logCapacity: number
  userCapacity: number
  deviceName: string
  algorithmVer: string
  flashSize: string
  freeFlashSize: string
  language: string
  workCode: string
  deviceId: string
  lockFunOn: string
  voiceFunOn: string
  faceVersion: string
  fpVersion: string
  pushVer: string
  platform: string
}

export interface ConnectionStatus {
  isConnected: boolean
  sessionId?: string
  lastError?: string
  connectionTime?: Date
}

/**
 * Enhanced ZKTeco Service following official protocol documentation
 * Based on ZKTeco protocol specifications from zk-protocol-master
 */
export class EnhancedZKTecoService {
  private zkLib: any
  private ip: string
  private port: number
  private inport: number
  private timeout: number
  private isConnecting: boolean = false
  private connectionStatus: ConnectionStatus = { isConnected: false }
  private sessionId: string = ''
  private maxRetries: number = 3
  private retryDelay: number = 1000

  constructor(ip?: string, port?: number, timeout?: number) {
    this.ip = ip || process.env.ZKTECO_IP || '192.168.1.201'
    this.port = port || parseInt(process.env.ZKTECO_PORT || '4370', 10)
    this.inport = Math.floor(Math.random() * 1000) + 5200
    this.timeout = timeout || parseInt(process.env.ZKTECO_TIMEOUT || '8000', 10) // Increased timeout
    
    console.log(`Enhanced ZKTeco Service initialized with IP: ${this.ip}, Port: ${this.port}, InPort: ${this.inport}, Timeout: ${this.timeout}`)
  }

  /**
   * Establish connection following ZKTeco protocol
   * 1. Create socket connection (TCP/IP port 4370)
   * 2. Send CMD_CONNECT
   * 3. Set SDKBuild=1 parameter
   */
  async connect(): Promise<boolean> {
    if (this.isConnecting) {
      console.log('⏳ Already connecting, waiting...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      return this.connectionStatus.isConnected
    }

    let retryCount = 0
    while (retryCount < this.maxRetries) {
      try {
        this.isConnecting = true
        
        const ZKLibConstructor = await loadZKLib()
        if (!ZKLibConstructor) {
          throw new Error('Failed to load zklib-js constructor')
        }

        // Ensure previous connection is cleaned up
        await this.forceDisconnect()

        this.zkLib = new ZKLibConstructor(this.ip, this.port, this.inport, this.timeout)
        
        console.log(`🔌 [Attempt ${retryCount + 1}/${this.maxRetries}] Creating socket connection to ZKTeco device...`)
        
        // Create socket with timeout protection
        const connectPromise = this.zkLib.createSocket()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), this.timeout)
        )
        
        await Promise.race([connectPromise, timeoutPromise])
        
        // Verify connection with basic info request
        await this.verifyConnection()
        
        this.connectionStatus = {
          isConnected: true,
          connectionTime: new Date(),
          lastError: undefined
        }
        
        console.log('✅ Successfully connected to ZKTeco device')
        return true
        
      } catch (error) {
        console.error(`❌ Connection attempt ${retryCount + 1} failed:`, error)
        this.connectionStatus = {
          isConnected: false,
          lastError: error instanceof Error ? error.message : String(error)
        }
        
        await this.forceDisconnect()
        
        retryCount++
        if (retryCount < this.maxRetries) {
          console.log(`⏳ Retrying in ${this.retryDelay}ms...`)
          await new Promise(resolve => setTimeout(resolve, this.retryDelay))
          this.retryDelay *= 2 // Exponential backoff
        }
      } finally {
        this.isConnecting = false
      }
    }
    
    console.error(`❌ Failed to connect after ${this.maxRetries} attempts`)
    return false
  }

  /**
   * Verify connection by requesting basic device info
   */
  private async verifyConnection(): Promise<void> {
    try {
      const verifyPromise = this.zkLib.getInfo()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Verification timeout')), 5000) // Increased timeout
      )
      
      const info = await Promise.race([verifyPromise, timeoutPromise])
      console.log('✅ Connection verified with device info:', info)
    } catch (error) {
      throw new Error(`Connection verification failed: ${error}`)
    }
  }

  /**
   * Graceful disconnection following protocol
   * Send CMD_EXIT before closing socket
   */
  async disconnect(): Promise<void> {
    try {
      if (this.zkLib && this.connectionStatus.isConnected) {
        // Try to send CMD_EXIT first (protocol compliance)
        try {
          await Promise.race([
            this.zkLib.disconnect(),
            new Promise(resolve => setTimeout(resolve, 2000))
          ])
        } catch (disconnectError) {
          console.warn('Graceful disconnect failed, forcing cleanup:', disconnectError)
        }
        
        console.log('📴 Disconnected from ZKTeco device')
      }
    } catch (error) {
      console.error('ZKTeco disconnect error:', error)
    } finally {
      this.zkLib = null
      this.connectionStatus = { isConnected: false }
      this.sessionId = ''
    }
  }

  /**
   * Force disconnect without protocol compliance (emergency cleanup)
   */
  async forceDisconnect(): Promise<void> {
    try {
      if (this.zkLib) {
        try {
          await Promise.race([
            this.zkLib.disconnect(),
            new Promise(resolve => setTimeout(resolve, 1000))
          ])
        } catch {
          console.log('Force disconnect completed')
        }
      }
    } catch {
      // Ignore all errors during force disconnect
    } finally {
      this.zkLib = null
      this.connectionStatus = { isConnected: false }
      this.sessionId = ''
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus }
  }

  /**
   * Get users following protocol specifications
   * Uses CMD_DATA_WRRQ to read all user IDs
   */
  async getUsers(): Promise<DeviceUser[]> {
    let retryCount = 0
    
    while (retryCount < this.maxRetries) {
      try {
        const connected = await this.connect()
        if (!connected) {
          throw new Error('Failed to establish connection')
        }
        
        console.log('🔍 Fetching users from ZKTeco device...')
        
        // Get users with timeout protection
        const usersPromise = this.zkLib.getUsers()
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Get users timeout')), 8000)
        )
        
        const users = await Promise.race([usersPromise, timeoutPromise])
        console.log('📥 Raw user data from device:', users)
        
        await this.disconnect()
        
        // Handle different data formats from the device
        let userArray = users
        if (users && typeof users === 'object' && users.data && Array.isArray(users.data)) {
          userArray = users.data
        } else if (!Array.isArray(users)) {
          console.log('⚠️ No users returned or invalid format')
          return []
        }
        
        const formattedUsers = userArray.map((user: any) => {
          console.log('👤 Processing user:', user)
          return {
            userId: user.uid || user.userId || user.userSn || String(user.uid || ''),
            name: user.name || user.userName || '',
            role: user.role || user.privilege || 0,
            cardno: user.cardno || user.cardNo || '',
            userSn: user.userSn || user.uid,
            enabled: user.enabled !== false, // Default to enabled unless explicitly disabled
            group: user.group || 1,
            verificationMode: user.verificationMode || 0
          }
        }).filter((user: any) => user.userId && String(user.userId).trim() !== '') // Remove users without valid IDs
        
        console.log('✅ Formatted users:', formattedUsers)
        return formattedUsers
        
      } catch (error) {
        console.error(`❌ Error getting users (attempt ${retryCount + 1}):`, error)
        await this.forceDisconnect()
        
        retryCount++
        if (retryCount < this.maxRetries) {
          console.log(`⏳ Retrying getUsers in ${this.retryDelay}ms...`)
          await new Promise(resolve => setTimeout(resolve, this.retryDelay))
        }
      }
    }
    
    console.error(`❌ Failed to get users after ${this.maxRetries} attempts`)
    return []
  }

  /**
   * Get attendance logs with enhanced error handling
   */
  async getAttendanceLogs(): Promise<AttendanceLog[]> {
    let retryCount = 0
    
    while (retryCount < this.maxRetries) {
      try {
        const connected = await this.connect()
        if (!connected) {
          throw new Error('Failed to establish connection')
        }
        
        console.log('🔍 Fetching attendance logs from device...')
        
        const logsPromise = this.zkLib.getAttendances()
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Get attendance logs timeout')), 10000)
        )
        
        const logs = await Promise.race([logsPromise, timeoutPromise])
        console.log('📥 Raw attendance data:', logs)
        
        await this.disconnect()
        
        // Handle different data formats from the device
        let logArray = logs
        if (logs && typeof logs === 'object' && logs.data && Array.isArray(logs.data)) {
          logArray = logs.data
        } else if (!Array.isArray(logs)) {
          console.log('⚠️ No attendance logs or invalid format')
          return []
        }
        
        const formattedLogs = logArray.map((log: any) => ({
          deviceUserId: log.deviceUserId || log.userSn || log.uid || String(log.uid || ''),
          timestamp: new Date(log.timestamp || log.recordTime || log.time),
          attendanceType: log.attendanceType || log.verifyMode || log.type || 1,
          deviceId: log.deviceId || 'ZKTeco-K40'
        })).filter((log: any) => log.deviceUserId && log.deviceUserId.trim() !== '')
        
        console.log('✅ Formatted attendance logs:', formattedLogs.length, 'records')
        return formattedLogs
        
      } catch (error) {
        console.error(`❌ Error getting attendance logs (attempt ${retryCount + 1}):`, error)
        await this.forceDisconnect()
        
        retryCount++
        if (retryCount < this.maxRetries) {
          console.log(`⏳ Retrying getAttendanceLogs in ${this.retryDelay}ms...`)
          await new Promise(resolve => setTimeout(resolve, this.retryDelay))
        }
      }
    }
    
    console.error(`❌ Failed to get attendance logs after ${this.maxRetries} attempts`)
    return []
  }

  /**
   * Get device information with retry logic
   */
  async getDeviceInfo(): Promise<DeviceInfo | null> {
    let retryCount = 0
    
    while (retryCount < this.maxRetries) {
      try {
        const connected = await this.connect()
        if (!connected) {
          throw new Error('Failed to establish connection')
        }

        console.log('🔍 Fetching device information...')

        // Get device info with timeout
        const infoPromise = this.zkLib.getInfo()
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Get device info timeout')), 5000)
        )
        
        const info = await Promise.race([infoPromise, timeoutPromise])
        
        // Try to get additional info (non-critical)
        let deviceName = 'ZKTeco-K40'
        let firmware = 'Unknown'
        let platform = 'Unknown'
        let serialNumber = 'Unknown'
        
        try {
          const additionalInfoPromise = Promise.all([
            this.zkLib.getDeviceName?.() || Promise.resolve('ZKTeco-K40'),
            this.zkLib.getFirmware?.() || Promise.resolve('Unknown'),
            this.zkLib.getPlatform?.() || Promise.resolve('Unknown'),
            this.zkLib.getSerialNumber?.() || Promise.resolve('Unknown')
          ])
          
          const additionalTimeout = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Additional info timeout')), 3000)
          )
          
          const [name, fw, plat, sn] = await Promise.race([additionalInfoPromise, additionalTimeout])
          deviceName = name || deviceName
          firmware = fw || firmware
          platform = plat || platform
          serialNumber = sn || serialNumber
        } catch (additionalError) {
          console.warn('Could not fetch additional device info:', additionalError)
        }
        
        await this.disconnect()

        const deviceInfo = {
          ...info,
          deviceName,
          fpVersion: firmware,
          platform,
          deviceId: serialNumber
        }
        
        console.log('📊 Device info:', deviceInfo)
        return deviceInfo
        
      } catch (error) {
        console.error(`❌ Error getting device info (attempt ${retryCount + 1}):`, error)
        await this.forceDisconnect()
        
        retryCount++
        if (retryCount < this.maxRetries) {
          console.log(`⏳ Retrying getDeviceInfo in ${this.retryDelay}ms...`)
          await new Promise(resolve => setTimeout(resolve, this.retryDelay))
        }
      }
    }
    
    console.error(`❌ Failed to get device info after ${this.maxRetries} attempts`)
    return null
  }

  /**
   * Add user following protocol specifications
   * TODO: Implement proper CMD_USER_WRQ protocol
   */
  async addUser(userId: string, name: string, password = '', role = 0, cardno = 0): Promise<boolean> {
    let retryCount = 0
    
    while (retryCount < this.maxRetries) {
      try {
        const connected = await this.connect()
        if (!connected) {
          throw new Error('Failed to establish connection')
        }

        console.log(`👤 Creating user ${userId} (${name}) on device...`)

        const addUserPromise = this.zkLib.setUser(parseInt(userId, 10), userId, name, password, role, cardno)
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Add user timeout')), 5000)
        )
        
        await Promise.race([addUserPromise, timeoutPromise])
        
        await this.disconnect()
        
        console.log(`✅ Successfully created user ${userId} on device`)
        return true
        
      } catch (error) {
        console.error(`❌ Failed to create user ${userId} (attempt ${retryCount + 1}):`, error)
        await this.forceDisconnect()
        
        retryCount++
        if (retryCount < this.maxRetries) {
          console.log(`⏳ Retrying addUser in ${this.retryDelay}ms...`)
          await new Promise(resolve => setTimeout(resolve, this.retryDelay))
        }
      }
    }
    
    console.error(`❌ Failed to add user after ${this.maxRetries} attempts`)
    return false
  }

  /**
   * Delete user following protocol specifications
   * TODO: Implement proper CMD_DELETE_USER protocol
   */
  async deleteUser(userId: string): Promise<boolean> {
    let retryCount = 0
    
    while (retryCount < this.maxRetries) {
      try {
        const connected = await this.connect()
        if (!connected) {
          throw new Error('Failed to establish connection')
        }

        console.log(`🗑️ Deleting user ${userId} from device...`)

        const deleteUserPromise = this.zkLib.deleteUser(parseInt(userId, 10))
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Delete user timeout')), 5000)
        )
        
        await Promise.race([deleteUserPromise, timeoutPromise])
        
        await this.disconnect()
        
        console.log(`✅ Successfully deleted user ${userId} from device`)
        return true
        
      } catch (error) {
        console.error(`❌ Failed to delete user ${userId} (attempt ${retryCount + 1}):`, error)
        await this.forceDisconnect()
        
        retryCount++
        if (retryCount < this.maxRetries) {
          console.log(`⏳ Retrying deleteUser in ${this.retryDelay}ms...`)
          await new Promise(resolve => setTimeout(resolve, this.retryDelay))
        }
      }
    }
    
    console.error(`❌ Failed to delete user after ${this.maxRetries} attempts`)
    return false
  }

  /**
   * Start fingerprint enrollment following protocol
   * Uses CMD_STARTENROLL command
   */
  async startFingerprintEnrollment(userId: string, fingerIndex: number): Promise<boolean> {
    try {
      const connected = await this.connect()
      if (!connected) {
        throw new Error('Failed to establish connection')
      }

      console.log(`👆 Starting fingerprint enrollment for user ${userId}, finger ${fingerIndex}`)

      // Note: This may need to be implemented at a lower level using CMD_STARTENROLL
      // For now, using the library's built-in method if available
      if (this.zkLib.startEnroll) {
        const enrollPromise = this.zkLib.startEnroll(parseInt(userId, 10), fingerIndex)
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Start enrollment timeout')), 5000)
        )
        
        await Promise.race([enrollPromise, timeoutPromise])
        
        console.log(`✅ Fingerprint enrollment started for user ${userId}`)
        return true
      } else {
        console.warn('⚠️ Fingerprint enrollment not supported by library')
        await this.disconnect()
        return false
      }
      
    } catch (error) {
      console.error(`❌ Failed to start fingerprint enrollment:`, error)
      await this.forceDisconnect()
      return false
    }
  }
}

// Create singleton instance
let enhancedZktecoService: EnhancedZKTecoService | null = null

export const getEnhancedZKTecoService = (): EnhancedZKTecoService => {
  if (!enhancedZktecoService) {
    enhancedZktecoService = new EnhancedZKTecoService()
  }
  return enhancedZktecoService
}