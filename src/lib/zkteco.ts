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

  constructor(ip?: string, port?: number, timeout?: number) {
    this.ip = ip || process.env.ZKTECO_IP || '192.168.1.201'
    this.port = port || parseInt(process.env.ZKTECO_PORT || '4370')
    this.timeout = timeout || parseInt(process.env.ZKTECO_TIMEOUT || '5000')
    
    console.log(`ZKTeco Service initialized with IP: ${this.ip}, Port: ${this.port}`)
  }

  private async ensureZKLib() {
    if (!this.zkLib) {
      if (!this.ip || this.ip === 'undefined') {
        throw new Error('ZKTeco IP address not configured. Please set ZKTECO_IP environment variable or provide IP in constructor.')
      }
      
      const ZKLibClass = await loadZKLib() as any
      if (ZKLibClass) {
        this.zkLib = new ZKLibClass({
          ip: this.ip,
          port: this.port,
          inport: 5201,
          timeout: this.timeout
        })
      } else {
        throw new Error('ZKLib not available - likely running in browser environment')
      }
    }
  }

  async connect(): Promise<boolean> {
    try {
      await this.ensureZKLib()
      return new Promise((resolve) => {
        (this.zkLib as any).connect((err: any) => {
          if (err) {
            console.error('ZKTeco connection error:', err)
            resolve(false)
          } else {
            resolve(true)
          }
        })
      })
    } catch (error) {
      console.error('ZKTeco connection error:', error)
      return false
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.zkLib) {
        (this.zkLib as any).disconnect()
      }
    } catch (error) {
      console.error('ZKTeco disconnect error:', error)
    }
  }

  async getAttendanceLogs(): Promise<AttendanceLog[]> {
    try {
      const connected = await this.connect()
      if (!connected) {
        return []
      }
      
      return new Promise((resolve) => {
        (this.zkLib as any).getAttendance((err: any, logs: any[]) => {
          this.disconnect()
          if (err) {
            console.error('Error fetching attendance logs:', err)
            resolve([])
          } else {
            const formattedLogs = (logs || []).map((log: any) => ({
              deviceUserId: log.deviceUserId || log.userSn || log.userId,
              timestamp: new Date(log.timestamp || log.recordTime),
              attendanceType: log.attendanceType || log.verifyMode || 1,
              deviceId: log.deviceId || 'default'
            }))
            resolve(formattedLogs)
          }
        })
      })
    } catch (error) {
      console.error('Error fetching attendance logs:', error)
      return []
    }
  }

  async getUsers(): Promise<DeviceUser[]> {
    try {
      const connected = await this.connect()
      if (!connected) {
        return []
      }
      
      return new Promise((resolve) => {
        (this.zkLib as any).getUser((err: any, users: any[]) => {
          this.disconnect()
          if (err) {
            console.error('Error fetching users:', err)
            resolve([])
          } else {
            const formattedUsers = (users || []).map((user: any) => ({
              userId: user.userId || user.userSn,
              name: user.name || '',
              role: user.role || 0,
              cardno: user.cardno || ''
            }))
            resolve(formattedUsers)
          }
        })
      })
    } catch (error) {
      console.error('Error fetching users:', error)
      return []
    }
  }

  async getRealTimeLogs(): Promise<AttendanceLog[]> {
    console.log('Real-time logs not supported with current zklib version')
    return []
  }

  async getDeviceInfo(): Promise<DeviceInfo | null> {
    try {
      const connected = await this.connect()
      if (!connected) {
        return null
      }
      
      return new Promise((resolve) => {
        (this.zkLib as any).serialNumber((err: any, serialNumber: string) => {
          if (err) {
            this.disconnect()
            resolve(null)
          } else {
            (this.zkLib as any).version((versionErr: any, version: string) => {
              this.disconnect()
              if (versionErr) {
                resolve({
                  userCounts: 0,
                  logCounts: 0,
                  logCapacity: 0,
                  userCapacity: 0,
                  deviceName: 'ZKTeco Device',
                  algorithmVer: '',
                  flashSize: '',
                  freeFlashSize: '',
                  language: '',
                  workCode: '',
                  deviceId: serialNumber || 'unknown',
                  lockFunOn: '',
                  voiceFunOn: '',
                  faceVersion: '',
                  fpVersion: '',
                  pushVer: '',
                  platform: version || 'unknown'
                })
              } else {
                resolve({
                  userCounts: 0,
                  logCounts: 0,
                  logCapacity: 0,
                  userCapacity: 0,
                  deviceName: 'ZKTeco Device',
                  algorithmVer: '',
                  flashSize: '',
                  freeFlashSize: '',
                  language: '',
                  workCode: '',
                  deviceId: serialNumber || 'unknown',
                  lockFunOn: '',
                  voiceFunOn: '',
                  faceVersion: '',
                  fpVersion: '',
                  pushVer: '',
                  platform: version || 'unknown'
                })
              }
            })
          }
        })
      })
    } catch (error) {
      console.error('Error fetching device info:', error)
      return null
    }
  }

  async addUser(userId: string, name: string): Promise<boolean> {
    console.log(`User management not supported with current zklib version. Attempted to add user: ${userId} - ${name}`)
    return false
  }

  async deleteUser(userId: string): Promise<boolean> {
    console.log(`User management not supported with current zklib version. Attempted to delete user: ${userId}`)
    return false
  }

  async enrollFingerprint(userId: string): Promise<boolean> {
    console.log(`Fingerprint enrollment not supported with current zklib version. Attempted for user: ${userId}`)
    return false
  }

  async clearAllUsers(): Promise<boolean> {
    console.log('Clear all users not supported with current zklib version')
    return false
  }

  async saveDataToDevice(): Promise<boolean> {
    console.log('Save data to device not supported with current zklib version')
    return false
  }
}

export const zktecoService = new ZKTecoService()
