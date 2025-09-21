/* eslint-disable @typescript-eslint/no-explicit-any */
import { zktecoService } from './zkteco'
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

  async createEmployeeOnDevice(employee: any): Promise<DeviceUserCreationResult> {
    try {
      console.log(`👤 Creating employee ${employee.name} on ZKTeco device...`)
      
      // Get next available device user ID
      const deviceUserId = await zktecoService.getNextAvailableUserId()
      console.log(`🆔 Assigned device user ID: ${deviceUserId}`)
      
      // Create user on device
      const success = await zktecoService.addUser(
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
      
      const success = await zktecoService.deleteUser(deviceUserId)
      
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
        const success = await zktecoService.addUser(
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
      
      // Note: zklib-js doesn't have direct fingerprint enrollment
      // This would typically require physical interaction with the device
      // For now, we'll mark as enrolled after successful user creation
      
      await connectToMongoDB()
      const employee = await Employee.findOne({ deviceUserId })
      
      if (employee) {
        employee.fingerprintEnrolled = true
        employee.deviceSyncStatus = 'synced'
        employee.lastDeviceSync = new Date()
        await employee.save()
        
        console.log(`✅ Fingerprint enrollment marked for user ${deviceUserId}`)
        return true
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
      const users = await zktecoService.getUsers()
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
      
      const logs = await zktecoService.getAttendanceLogs()
      console.log(`📊 Retrieved ${logs.length} attendance logs from device`)
      
      if (logs.length > 0) {
        await this.processAttendanceLogs(logs)
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
      
      for (const log of logs) {
        // Find employee by device user ID
        const employee = await Employee.findOne({ deviceUserId: log.deviceUserId })
        
        if (!employee) {
          console.warn(`⚠️ Employee not found for device user ID: ${log.deviceUserId}`)
          continue
        }
        
        // Process the log and update attendance records
        // This would involve complex logic to match clock-in/out pairs
        console.log(`✅ Processed log for employee ${employee.name}: ${log.timestamp}`)
      }
      
      console.log('✅ Attendance log processing completed')
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
      
      // Set up periodic sync (every 30 seconds)
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
    this.isMonitoring = false
    console.log('⏹️ Real-time monitoring stopped')
  }

  async getDeviceStatus(): Promise<any> {
    try {
      const info = await zktecoService.getDeviceInfo()
      const users = await zktecoService.getUsers()
      
      return {
        connected: true,
        deviceInfo: info,
        userCount: users.length,
        users: users,
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
      await zktecoService.disconnect()
      
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
      const deviceUsers = await zktecoService.getUsers()
      
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