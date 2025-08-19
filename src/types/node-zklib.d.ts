declare module 'node-zklib' {
  export class ZKLib {
    constructor(ip: string, port: number, timeout: number, inport: number)
    createSocket(): Promise<boolean>
    disconnect(): Promise<void>
    getAttendances(): Promise<AttendanceLog[]>
    getUsers(): Promise<DeviceUser[]>
    getRealTimeLogs(): Promise<AttendanceLog[]>
    getInfo(): Promise<DeviceInfo>
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
}
