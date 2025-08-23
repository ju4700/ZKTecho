/* eslint-disable @typescript-eslint/no-explicit-any */
let ZKLib: unknown = null
const loadZKLib = async () => {
  if (typeof window === 'undefined' && !ZKLib) {
    try {
      const zkModule = await import('zklib')
      ZKLib = zkModule.default
    } catch (error) {
      console.error('Failed to load ZKLib:', error)
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
  private zkLib: unknown
  private ip: string
  private port: number
  private timeout: number

  constructor(ip: string = process.env.ZKTECO_IP || '192.168.1.201', port: number = parseInt(process.env.ZKTECO_PORT || '4370'), timeout: number = parseInt(process.env.ZKTECO_TIMEOUT || '5000')) {
    this.ip = ip
    this.port = port
    this.timeout = timeout
  }

  private async ensureZKLib() {
    if (!this.zkLib) {
      const ZKLibClass = await loadZKLib() as any
      if (ZKLibClass) {
        this.zkLib = new ZKLibClass(this.ip, this.port, this.timeout, 4000)
      } else {
        throw new Error('ZKLib not available - likely running in browser environment')
      }
    }
  }

  async connect(): Promise<boolean> {
    try {
      await this.ensureZKLib()
      await (this.zkLib as any).createSocket()
      return true
    } catch (error) {
      console.error('ZKTeco connection error:', error)
      return false
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.zkLib) {
        await (this.zkLib as any).disconnect()
      }
    } catch (error) {
      console.error('ZKTeco disconnect error:', error)
    }
  }

  async getAttendanceLogs(): Promise<AttendanceLog[]> {
    try {
      await this.connect()
      const logs = await (this.zkLib as any).getAttendances()
      await this.disconnect()
      return logs || []
    } catch (error) {
      console.error('Error fetching attendance logs:', error)
      return []
    }
  }

  async getUsers(): Promise<DeviceUser[]> {
    try {
      await this.connect()
      const users = await (this.zkLib as any).getUsers()
      await this.disconnect()
      return users || []
    } catch (error) {
      console.error('Error fetching users:', error)
      return []
    }
  }

  async getRealTimeLogs(): Promise<AttendanceLog[]> {
    try {
      await this.connect()
      const logs = await (this.zkLib as any).getRealTimeLogs()
      await this.disconnect()
      return logs || []
    } catch (error) {
      console.error('Error fetching real-time logs:', error)
      return []
    }
  }

  async getDeviceInfo(): Promise<DeviceInfo | null> {
    try {
      await this.connect()
      const info = await (this.zkLib as any).getInfo()
      await this.disconnect()
      return info
    } catch (error) {
      console.error('Error fetching device info:', error)
      return null
    }
  }

  async addUser(userId: string, name: string, password?: string, role: number = 0, cardno?: string): Promise<boolean> {
    try {
      await this.connect()
      const userObj = {
        userId: userId,
        name: name,
        password: password || '',
        role: role,
        cardno: cardno || ''
      }
      const result = await (this.zkLib as any).setUser(userId, userObj)
      await this.disconnect()
      return result
    } catch (error) {
      console.error('Error adding user to device:', error)
      return false
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      await this.connect()
      const result = await (this.zkLib as any).deleteUser(userId)
      await this.disconnect()
      return result
    } catch (error) {
      console.error('Error deleting user from device:', error)
      return false
    }
  }

  async enrollFingerprint(userId: string, fingerprintTemplate: string): Promise<boolean> {
    try {
      await this.connect()
      const result = await (this.zkLib as any).setUserFingerPrint(userId, fingerprintTemplate)
      await this.disconnect()
      return result
    } catch (error) {
      console.error('Error enrolling fingerprint:', error)
      return false
    }
  }

  async clearAllUsers(): Promise<boolean> {
    try {
      await this.connect()
      const result = await (this.zkLib as any).clearAdminPrivilege()
      await this.disconnect()
      return result
    } catch (error) {
      console.error('Error clearing users:', error)
      return false
    }
  }

  async saveDataToDevice(): Promise<boolean> {
    try {
      await this.connect()
      const result = await (this.zkLib as any).saveDataToDevice()
      await this.disconnect()
      return result
    } catch (error) {
      console.error('Error saving data to device:', error)
      return false
    }
  }
}

export const zktecoService = new ZKTecoService()
