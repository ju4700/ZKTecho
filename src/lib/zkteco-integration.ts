/* eslint-disable @typescript-eslint/no-explicit-any */
import { getEnhancedZKTecoService } from './zkteco-enhanced'
import Employee from '../models/Employee'
import connectToMongoDB from './mongodb'

export interface DeviceUserCreationResult {
  success: boolean
  deviceUserId?: string
  message: string
  needsFingerprint?: boolean
}

export interface DeviceIntegrationService {
  // Employee-Device Sync
  createEmployeeOnDevice(employee: any): Promise<DeviceUserCreationResult>
  deleteEmployeeFromDevice(deviceUserId: string): Promise<boolean>
  syncEmployeeToDevice(employeeId: string): Promise<boolean>
  
  // Fingerprint Management
  enrollFingerprint(deviceUserId: string): Promise<boolean>
  verifyFingerprint(deviceUserId: string): Promise<boolean>
  
  // Attendance Processing
  syncAttendanceFromDevice(): Promise<number>
  processAttendanceLogs(logs: any[]): Promise<void>
  
  // Real-time Monitoring
  startRealTimeMonitoring(): Promise<boolean>
  stopRealTimeMonitoring(): void
  
  // Device Management
  getDeviceStatus(): Promise<any>
  resetDevice(): Promise<boolean>
}

class ZKTecoIntegrationService implements DeviceIntegrationService {
  private isMonitoring = false
  private monitoringInterval?: NodeJS.Timeout

  constructor() {
    console.log('🔧 ZKTeco Integration Service initialized')
  }

  private get zkService() {
    return getEnhancedZKTecoService()
  }

  async createEmployeeOnDevice(employee: any): Promise<DeviceUserCreationResult> {
    try {
      console.log(`👤 Creating employee ${employee.name} on ZKTeco device...`)
      
      // We need to generate a numeric ID for the device if one doesn't exist
      // ZKTeco devices typically use numeric IDs
      let deviceUserId = employee.deviceUserId
      
      if (!deviceUserId) {
         // Simple numeric generation strategy if not provided
         // In a real app, you might want a counter in DB
         deviceUserId = Math.floor(Math.random() * 10000).toString()
      }
      
      console.log(`🆔 Assigned device user ID: ${deviceUserId}`)
      
      // Create user on device
      const success = await this.zkService.addUser(
        deviceUserId,
        employee.name,
        '', // password (empty for fingerprint-only)
        0,  // role (0 = normal user)
        0   // card number
      )
      
      if (success) {
        // Update employee in database
        await connectToMongoDB()
        await Employee.findByIdAndUpdate(employee._id, {
          deviceUserId,
          deviceSyncStatus: 'synced',
          lastDeviceSync: new Date()
        })
        
        console.log(`✅ Successfully created employee ${employee.name} on device`)
        return {
          success: true,
          deviceUserId,
          message: `Employee created on device with ID ${deviceUserId}`,
          needsFingerprint: true
        }
      } else {
        console.error(`❌ Failed to create employee ${employee.name} on device`)
        return {
          success: false,
          message: 'Failed to create employee on device'
        }
      }
    } catch (error) {
      console.error('Error creating employee on device:', error)
      return {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  async deleteEmployeeFromDevice(deviceUserId: string): Promise<boolean> {
    try {
      console.log(`🗑️ Deleting employee with device ID ${deviceUserId}...`)
      
      const success = await this.zkService.deleteUser(deviceUserId)
      
      if (success) {
        // Update employee in database
        await connectToMongoDB()
        await Employee.findOneAndUpdate(
          { deviceUserId },
          {
            deviceUserId: undefined,
            fingerprintEnrolled: false,
            deviceSyncStatus: 'pending',
            lastDeviceSync: new Date()
          }
        )
        
        console.log(`✅ Successfully deleted employee from device`)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error deleting employee from device:', error)
      return false
    }
  }

  async syncEmployeeToDevice(employeeId: string): Promise<boolean> {
    try {
      await connectToMongoDB()
      const employee = await Employee.findById(employeeId)
      
      if (!employee) {
        console.error('Employee not found')
        return false
      }
      
      if (!employee.deviceUserId) {
        // Create new user on device
        const result = await this.createEmployeeOnDevice(employee)
        return result.success
      } else {
        // Update existing user on device
        const success = await this.zkService.addUser(
          employee.deviceUserId,
          employee.name,
          '',
          0,
          0
        )
        
        if (success) {
          employee.deviceSyncStatus = 'synced'
          employee.lastDeviceSync = new Date()
          await employee.save()
        }
        
        return success
      }
    } catch (error) {
      console.error('Error syncing employee to device:', error)
      return false
    }
  }

  async enrollFingerprint(deviceUserId: string): Promise<boolean> {
    try {
      console.log(`👆 Starting fingerprint enrollment for user ${deviceUserId}...`)
      
      // Use the enhanced service's startFingerprintEnrollment
      // We'll try to enroll finger index 0 (usually right thumb or index)
      const success = await this.zkService.startFingerprintEnrollment(deviceUserId, 0)
      
      if (success) {
        await connectToMongoDB()
        const employee = await Employee.findOne({ deviceUserId })
        
        if (employee) {
          // Note: The actual enrollment completion happens on the device.
          // We mark it as 'pending' or similar if we had that state, 
          // but for now we assume if the command succeeded, the user will do it.
          // Ideally, we wait for a regEvent from the device.
          console.log(`✅ Fingerprint enrollment command sent for user ${deviceUserId}`)
          return true
        }
      }
      
      return false
    } catch (error) {
      console.error('Error enrolling fingerprint:', error)
      return false
    }
  }

  async verifyFingerprint(deviceUserId: string): Promise<boolean> {
    try {
      // Check if user exists on device
      const users = await this.zkService.getUsers()
      const deviceUser = users.find(user => user.userId === deviceUserId)
      
      return !!deviceUser
    } catch (error) {
      console.error('Error verifying fingerprint:', error)
      return false
    }
  }

  async syncAttendanceFromDevice(): Promise<number> {
    try {
      console.log('📥 Syncing attendance logs from device...')
      
      const logs = await this.zkService.getAttendanceLogs()
      console.log(`📊 Retrieved ${logs.length} attendance logs from device`)
      
      if (logs.length > 0) {
        await this.processAttendanceLogs(logs)
        // Optionally clear logs after sync if configured
        // await this.zkService.clearAttendanceLog()
      }
      
      return logs.length
    } catch (error) {
      console.error('Error syncing attendance from device:', error)
      return 0
    }
  }

  async processAttendanceLogs(logs: any[]): Promise<void> {
    try {
      console.log(`🔄 Processing ${logs.length} attendance logs...`)
      
      await connectToMongoDB()
      
      // Import Attendance model dynamically to avoid circular deps if any
      const { default: Attendance } = await import('../models/Attendance')
      
      let processedCount = 0
      
      for (const log of logs) {
        // Find employee by device user ID
        const employee = await Employee.findOne({ deviceUserId: log.deviceUserId })
        
        if (!employee) {
          // console.warn(`⚠️ Employee not found for device user ID: ${log.deviceUserId}`)
          continue
        }

        // Check if this log already exists to avoid duplicates
        const existingLog = await Attendance.findOne({
          deviceUserId: log.deviceUserId,
          timestamp: log.timestamp
        })

        if (existingLog) {
          continue
        }
        
        // Determine check-in/out type based on time or device status
        // For simplicity, we might toggle or use time of day
        // ZKTeco 'attendanceType' might be 0/1/4/5 etc.
        // 0=CheckIn, 1=CheckOut, 4=OvertimeIn, 5=OvertimeOut
        let type = 'CHECK_IN'
        if (log.attendanceType === 1 || log.attendanceType === 5) {
          type = 'CHECK_OUT'
        } else {
          // Fallback logic: if morning -> IN, if afternoon -> OUT
          const hour = new Date(log.timestamp).getHours()
          if (hour > 13) type = 'CHECK_OUT'
        }

        await Attendance.create({
          employeeId: employee._id,
          deviceUserId: log.deviceUserId,
          timestamp: log.timestamp,
          type,
          deviceId: log.deviceId || 'ZKTeco'
        })
        
        processedCount++
        console.log(`✅ Processed log for employee ${employee.name}: ${log.timestamp} (${type})`)
      }
      
      console.log(`✅ Attendance log processing completed. Added ${processedCount} new records.`)
    } catch (error) {
      console.error('Error processing attendance logs:', error)
    }
  }

  async startRealTimeMonitoring(): Promise<boolean> {
    try {
      if (this.isMonitoring) {
        console.log('⚠️ Real-time monitoring already active')
        return true
      }
      
      console.log('🔴 Starting real-time attendance monitoring...')
      
      // 1. Subscribe to real-time events
      const eventSuccess = await this.zkService.subscribeToEvents(
        (log: any) => {
          // Handle real-time attendance log
          console.log('⚡ Real-time attendance received:', log)
          this.processAttendanceLogs([log])
        },
        (score: number) => {
          console.log('⚡ Real-time fingerprint score:', score)
        }
      )

      if (!eventSuccess) {
        console.warn('⚠️ Failed to subscribe to real-time events, falling back to polling')
      }

      // 2. Set up periodic sync (every 30 seconds) as backup/polling
      this.monitoringInterval = setInterval(async () => {
        try {
          await this.syncAttendanceFromDevice()
        } catch (error) {
          console.error('Error in real-time monitoring:', error)
        }
      }, 30000)
      
      this.isMonitoring = true
      console.log('✅ Real-time monitoring started')
      return true
    } catch (error) {
      console.error('Error starting real-time monitoring:', error)
      return false
    }
  }

  stopRealTimeMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = undefined
    }
    
    // Stop events
    if (this.zkService.stopEvents) {
        this.zkService.stopEvents()
    }

    this.isMonitoring = false
    console.log('⏹️ Real-time monitoring stopped')
  }

  async getDeviceStatus(): Promise<any> {
    try {
      const info = await this.zkService.getDeviceInfo()
      
      // We don't want to call getUsers every time as it's slow
      // const users = await this.zkService.getUsers()
      
      return {
        connected: true,
        deviceInfo: info,
        // userCount: users.length,
        lastSync: new Date(),
        monitoring: this.isMonitoring
      }
    } catch (error) {
      console.error('Error getting device status:', error)
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        monitoring: this.isMonitoring
      }
    }
  }

  async resetDevice(): Promise<boolean> {
    try {
      console.log('🔄 Resetting device connection...')
      
      // Stop monitoring
      this.stopRealTimeMonitoring()
      
      // Disconnect and reconnect
      await this.zkService.forceDisconnect()
      
      console.log('✅ Device reset completed')
      return true
    } catch (error) {
      console.error('Error resetting device:', error)
      return false
    }
  }

  // Helper method to get comprehensive employee-device status
  async getEmployeeDeviceStatus(): Promise<any[]> {
    try {
      await connectToMongoDB()
      const employees = await Employee.find({ status: 'active' })
      const deviceUsers = await this.zkService.getUsers()
      
      return employees.map(emp => {
        const deviceUser = deviceUsers.find(du => du.userId === emp.deviceUserId)
        return {
          employee: emp,
          onDevice: !!deviceUser,
          syncStatus: emp.deviceSyncStatus,
          fingerprintEnrolled: emp.fingerprintEnrolled,
          needsSync: !deviceUser || emp.deviceSyncStatus !== 'synced'
        }
      })
    } catch (error) {
      console.error('Error getting employee-device status:', error)
      return []
    }
  }
}

export const zktecoIntegration = new ZKTecoIntegrationService()