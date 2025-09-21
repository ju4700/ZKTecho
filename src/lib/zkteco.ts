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

export class ZKTecoService {
  private zkLib: any
  private ip: string
  private port: number
  private inport: number
  private timeout: number
  private isConnecting: boolean = false

  constructor(ip?: string, port?: number, timeout?: number) {
    this.ip = ip || process.env.ZKTECO_IP || '192.168.1.201'
    this.port = port || parseInt(process.env.ZKTECO_PORT || '4370', 10)
    this.inport = Math.floor(Math.random() * 1000) + 5200
    this.timeout = timeout || parseInt(process.env.ZKTECO_TIMEOUT || '5000', 10) // Reduced timeout
    
    console.log(`ZKTeco Service initialized with IP: ${this.ip}, Port: ${this.port}, InPort: ${this.inport}, Timeout: ${this.timeout}`)
  }

  async connect(): Promise<boolean> {
    // Prevent multiple simultaneous connections
    if (this.isConnecting) {
      console.log('⏳ Already connecting, waiting...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      return this.zkLib !== null
    }

    try {
      this.isConnecting = true
      
      const ZKLibConstructor = await loadZKLib()
      if (!ZKLibConstructor) {
        console.error('Failed to load zklib-js constructor')
        return false
      }

      // Ensure previous connection is cleaned up
      await this.forceDisconnect()

      this.zkLib = new ZKLibConstructor(this.ip, this.port, this.inport, this.timeout)
      
      console.log('🔌 Creating socket connection to ZKTeco device...')
      
      // Wrap in timeout to prevent hanging
      const connectPromise = this.zkLib.createSocket()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), this.timeout)
      )
      
      await Promise.race([connectPromise, timeoutPromise])
      
      console.log('✅ Successfully connected to ZKTeco device')
      return true
      
    } catch (error) {
      console.error('❌ ZKTeco connection error:', error)
      await this.forceDisconnect()
      return false
    } finally {
      this.isConnecting = false
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.zkLib) {
        await this.zkLib.disconnect()
        console.log('📴 Disconnected from ZKTeco device')
        this.zkLib = null
      }
    } catch (error) {
      console.error('ZKTeco disconnect error:', error)
      // Force cleanup even if disconnect fails
      this.zkLib = null
    }
  }

  async forceDisconnect(): Promise<void> {
    try {
      if (this.zkLib) {
        // Try graceful disconnect first
        try {
          await Promise.race([
            this.zkLib.disconnect(),
            new Promise(resolve => setTimeout(resolve, 2000)) // Max 2 seconds for disconnect
          ])
        } catch {
          console.log('Force disconnect due to timeout')
        }
        this.zkLib = null
      }
    } catch {
      // Ignore errors during force disconnect
      this.zkLib = null
    }
  }

  async getUsers(): Promise<DeviceUser[]> {
    try {
      const connected = await this.connect()
      if (!connected) {
        console.log('❌ Failed to connect to device for getUsers')
        return []
      }
      
      console.log('🔍 Fetching users from ZKTeco device...')
      
      // Test basic communication first with timeout
      try {
        console.log('🔍 Testing basic device communication...')
        const infoPromise = this.zkLib.getInfo()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Basic info timeout')), 3000)
        )
        
        const info = await Promise.race([infoPromise, timeoutPromise])
        console.log('✅ Basic device communication successful:', info)
      } catch (infoError) {
        console.error('⚠️ Basic device info failed:', infoError)
        await this.forceDisconnect()
        return []
      }
      
      // Get users with timeout
      try {
        const usersPromise = this.zkLib.getUsers()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Get users timeout')), 5000)
        )
        
        const users = await Promise.race([usersPromise, timeoutPromise])
        console.log('📥 Raw user data from device:', users)
        
        await this.disconnect()
        
        if (!users || !Array.isArray(users)) {
          console.log('⚠️ No users returned or invalid format')
          return []
        }
        
        const formattedUsers = users.map((user: any) => {
          console.log('👤 Processing user:', user)
          return {
            userId: user.uid || user.userId || user.userSn || String(user.uid || ''),
            name: user.name || user.userName || '',
            role: user.role || user.privilege || 0,
            cardno: user.cardno || user.cardNo || ''
          }
        }).filter(user => user.userId) // Remove users without valid IDs
        
        console.log('✅ Formatted users:', formattedUsers)
        return formattedUsers
        
      } catch (usersError) {
        console.error('❌ Error fetching users:', usersError)
        await this.forceDisconnect()
        return []
      }
      
    } catch (error) {
      console.error('❌ Error in getUsers:', error)
      await this.forceDisconnect()
      return []
    }
  }

  async getAttendanceLogs(): Promise<AttendanceLog[]> {
    try {
      const connected = await this.connect()
      if (!connected) {
        console.log('❌ Failed to connect to device for attendance logs')
        return []
      }
      
      console.log('🔍 Fetching attendance logs from device...')
      
      try {
        const logsPromise = this.zkLib.getAttendances()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Get attendance logs timeout')), 8000)
        )
        
        const logs = await Promise.race([logsPromise, timeoutPromise])
        console.log('📥 Raw attendance data:', logs)
        
        await this.disconnect()
        
        if (!logs || !Array.isArray(logs)) {
          console.log('⚠️ No attendance logs or invalid format')
          return []
        }
        
        const formattedLogs = logs.map((log: any) => ({
          deviceUserId: log.deviceUserId || log.userSn || log.uid || String(log.uid || ''),
          timestamp: new Date(log.timestamp || log.recordTime || log.time),
          attendanceType: log.attendanceType || log.verifyMode || log.type || 1,
          deviceId: log.deviceId || 'ZKTeco-K40'
        })).filter(log => log.deviceUserId) // Remove logs without valid user IDs
        
        console.log('✅ Formatted attendance logs:', formattedLogs.length, 'records')
        return formattedLogs
        
      } catch (logsError) {
        console.error('❌ Error fetching attendance logs:', logsError)
        await this.forceDisconnect()
        return []
      }
      
    } catch (error) {
      console.error('❌ Error in getAttendanceLogs:', error)
      await this.forceDisconnect()
      return []
    }
  }

  async getDeviceInfo(): Promise<DeviceInfo | null> {
    try {
      const connected = await this.connect()
      if (!connected) {
        return null
      }

      console.log('🔍 Fetching device information...')

      const info = await this.zkLib.getInfo()
      const deviceName = await this.zkLib.getDeviceName()
      const firmware = await this.zkLib.getFirmware()
      const platform = await this.zkLib.getPlatform()
      const serialNumber = await this.zkLib.getSerialNumber()
      
      await this.disconnect()

      const deviceInfo = {
        ...info,
        deviceName: deviceName || 'ZKTeco-K40',
        fpVersion: firmware || 'Unknown',
        platform: platform || 'Unknown',
        deviceId: serialNumber || 'Unknown'
      }
      
      console.log('📊 Device info:', deviceInfo)
      return deviceInfo
      
    } catch (error) {
      console.error('Error fetching device info:', error)
      await this.disconnect()
      return null
    }
  }

  async addUser(userId: string, name: string, password = '', role = 0, cardno = 0): Promise<boolean> {
    try {
      const connected = await this.connect()
      if (!connected) {
        return false
      }

      console.log(`👤 Creating user ${userId} (${name}) on device...`)

      await this.zkLib.setUser(parseInt(userId, 10), userId, name, password, role, cardno)
      
      await this.disconnect()
      
      console.log(`✅ Successfully created user ${userId} on device`)
      return true
      
    } catch (error) {
      console.error(`❌ Failed to create user ${userId}:`, error)
      await this.disconnect()
      return false
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      const connected = await this.connect()
      if (!connected) {
        console.error('Cannot connect to device for user deletion')
        return false
      }

      console.log(`🗑️ Deleting user ${userId} from device...`)

      await this.zkLib.deleteUser(parseInt(userId, 10))
      
      await this.disconnect()
      
      console.log(`✅ Successfully deleted user ${userId} from device`)
      return true
      
    } catch (error) {
      console.error(`❌ Failed to delete user ${userId}:`, error)
      await this.disconnect()
      return false
    }
  }

  async clearAttendanceLog(): Promise<boolean> {
    try {
      const connected = await this.connect()
      if (!connected) {
        return false
      }

      console.log('🗑️ Clearing attendance logs from device...')

      await this.zkLib.clearAttendanceLog()
      
      await this.disconnect()
      
      console.log('✅ Successfully cleared attendance logs from device')
      return true
      
    } catch (error) {
      console.error('❌ Failed to clear attendance logs:', error)
      await this.disconnect()
      return false
    }
  }

  async getTime(): Promise<Date | null> {
    try {
      const connected = await this.connect()
      if (!connected) {
        return null
      }

      const time = await this.zkLib.getTime()
      await this.disconnect()
      
      return new Date(time)
      
    } catch (error) {
      console.error('Error getting device time:', error)
      await this.disconnect()
      return null
    }
  }

  async getNextAvailableUserId(): Promise<string> {
    try {
      const users = await this.getUsers()
      if (users.length === 0) {
        return '1'
      }

      const existingIds = users
        .map(user => parseInt(user.userId, 10))
        .filter(id => !isNaN(id))
        .sort((a, b) => a - b)

      for (let i = 1; i <= 999; i++) {
        if (!existingIds.includes(i)) {
          return i.toString()
        }
      }

      return (Math.max(...existingIds) + 1).toString()
    } catch (error) {
      console.error('Error getting next available user ID:', error)
      return '1'
    }
  }
}

export const zktecoService = new ZKTecoService()