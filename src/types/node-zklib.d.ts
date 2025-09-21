declare module 'zklib-js' {
  export default class ZKLib {
    constructor(ip: string, port: number, timeout: number, inport: number)
    
    // Connection properties
    connectionType: 'tcp' | 'udp' | null
    zklibTcp: object
    zklibUdp: object
    interval: NodeJS.Timeout | null
    timer: NodeJS.Timeout | null
    isBusy: boolean
    ip: string
    
    // Connection methods
    createSocket(): Promise<void>
    disconnect(): Promise<void>
    
    // User management
    getUsers(): Promise<User[]>
    setUser(uid: number, userid: string, name: string, password: string, role: number, cardno: number): Promise<boolean>
    deleteUser(uid: number): Promise<boolean>
    
    // Attendance methods
    getAttendances(callback?: (data: AttendanceRecord) => void): Promise<AttendanceRecord[]>
    clearAttendanceLog(): Promise<boolean>
    
    // Device information
    getInfo(): Promise<DeviceInfo>
    getSocketStatus(): Promise<{ status: string; connected: boolean }>
    
    // Real-time monitoring
    getRealTimeLogs(callback: (data: AttendanceRecord) => void): Promise<boolean>
    
    // Device control
    enableDevice(): Promise<boolean>
    disableDevice(): Promise<boolean>
    freeData(): Promise<boolean>
    
    // Command execution
    executeCmd(command: string, data?: string): Promise<unknown>
    
    // Scheduling
    setIntervalSchedule(callback: () => void, timer: number): void
    setTimerSchedule(callback: () => void, timer: number): void
  }

  export interface User {
    uid: number
    userid: string
    name: string
    password?: string
    role: number
    cardno?: number
  }

  export interface AttendanceRecord {
    deviceUserId: string
    timestamp: string | Date
    attendanceType: number
    userSn?: string
    recordTime?: string
    time?: string
    verifyMode?: number
    type?: number
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
    deviceName?: string
    algorithmVer?: string
    flashSize?: string
    freeFlashSize?: string
    language?: string
    workCode?: string
    deviceId?: string
    lockFunOn?: string
    voiceFunOn?: string
    faceVersion?: string
    fpVersion?: string
    pushVer?: string
    platform?: string
  }

  export class ZKError extends Error {
    err: Error
    ip: string
    command: string
    constructor(err: Error, command: string, ip: string)
  }
}
