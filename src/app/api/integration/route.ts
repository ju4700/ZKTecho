import { NextRequest, NextResponse } from 'next/server'
import { zktecoIntegration } from '../../../lib/zkteco-integration'
import { zktecoService } from '../../../lib/zkteco'
import Employee from '../../../models/Employee'
import connectToMongoDB from '../../../lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'status':
        const status = await zktecoIntegration.getDeviceStatus()
        return NextResponse.json(status)

      case 'device-info':
        const info = await zktecoService.getDeviceInfo()
        return NextResponse.json(info)

      case 'users':
        const users = await zktecoService.getUsers()
        return NextResponse.json(users)

      case 'employee-sync-status':
        const syncStatus = await zktecoIntegration.getEmployeeDeviceStatus()
        return NextResponse.json(syncStatus)

      case 'attendance-logs':
        const logs = await zktecoService.getAttendanceLogs()
        return NextResponse.json({ logs, count: logs.length })

      default:
        // Default: comprehensive device overview
        const [deviceInfo, deviceUsers, employees] = await Promise.all([
          zktecoService.getDeviceInfo(),
          zktecoService.getUsers(),
          (async () => {
            await connectToMongoDB()
            return Employee.find({ status: 'active' }).select('name employeeId deviceUserId fingerprintEnrolled deviceSyncStatus')
          })()
        ])

        return NextResponse.json({
          device: {
            info: deviceInfo,
            userCount: deviceUsers.length,
            users: deviceUsers,
            connected: true
          },
          employees: {
            total: employees.length,
            synced: employees.filter(e => e.deviceSyncStatus === 'synced').length,
            withFingerprint: employees.filter(e => e.fingerprintEnrolled).length,
            needsSync: employees.filter(e => e.deviceSyncStatus !== 'synced').length
          },
          sync: {
            lastSync: new Date(),
            monitoring: false // Will be updated when monitoring is implemented
          }
        })
    }
  } catch (error) {
    console.error('Device integration error:', error)
    return NextResponse.json(
      { 
        error: 'Device integration failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case 'create-employee':
        // Create employee on device
        const result = await zktecoIntegration.createEmployeeOnDevice(data.employee)
        return NextResponse.json(result)

      case 'delete-employee':
        // Delete employee from device
        const deleteResult = await zktecoIntegration.deleteEmployeeFromDevice(data.deviceUserId)
        return NextResponse.json({ success: deleteResult })

      case 'sync-employee':
        // Sync specific employee to device
        const syncResult = await zktecoIntegration.syncEmployeeToDevice(data.employeeId)
        return NextResponse.json({ success: syncResult })

      case 'sync-all-employees':
        // Sync all employees to device
        await connectToMongoDB()
        const employees = await Employee.find({ status: 'active' })
        const results = []
        
        for (const employee of employees) {
          if (!employee.deviceUserId) {
            const result = await zktecoIntegration.createEmployeeOnDevice(employee)
            results.push({ employeeId: employee._id, result })
          }
        }
        
        return NextResponse.json({ results, total: results.length })

      case 'enroll-fingerprint':
        // Mark fingerprint as enrolled
        const enrollResult = await zktecoIntegration.enrollFingerprint(data.deviceUserId)
        return NextResponse.json({ success: enrollResult })

      case 'sync-attendance':
        // Sync attendance from device
        const logCount = await zktecoIntegration.syncAttendanceFromDevice()
        return NextResponse.json({ success: true, logsProcessed: logCount })

      case 'start-monitoring':
        // Start real-time monitoring
        const monitoringResult = await zktecoIntegration.startRealTimeMonitoring()
        return NextResponse.json({ success: monitoringResult })

      case 'stop-monitoring':
        // Stop real-time monitoring
        zktecoIntegration.stopRealTimeMonitoring()
        return NextResponse.json({ success: true })

      case 'reset-device':
        // Reset device connection
        const resetResult = await zktecoIntegration.resetDevice()
        return NextResponse.json({ success: resetResult })

      case 'bulk-sync':
        // Comprehensive sync operation
        console.log('🔄 Starting bulk sync operation...')
        
        // 1. Sync attendance logs
        const attendanceCount = await zktecoIntegration.syncAttendanceFromDevice()
        
        // 2. Verify all employees are on device
        await connectToMongoDB()
        const allEmployees = await Employee.find({ status: 'active' })
        const deviceUsers = await zktecoService.getUsers()
        
        const syncResults = []
        for (const employee of allEmployees) {
          if (!employee.deviceUserId) {
            const result = await zktecoIntegration.createEmployeeOnDevice(employee)
            syncResults.push({ 
              employee: employee.name, 
              action: 'created',
              result 
            })
          } else {
            const deviceUser = deviceUsers.find(du => du.userId === employee.deviceUserId)
            if (!deviceUser) {
              const result = await zktecoIntegration.createEmployeeOnDevice(employee)
              syncResults.push({ 
                employee: employee.name, 
                action: 'recreated',
                result 
              })
            }
          }
        }
        
        return NextResponse.json({
          success: true,
          attendanceLogsProcessed: attendanceCount,
          employeesSynced: syncResults.length,
          details: syncResults
        })

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Device integration POST error:', error)
    return NextResponse.json(
      { 
        error: 'Device integration operation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceUserId = searchParams.get('deviceUserId')
    
    if (!deviceUserId) {
      return NextResponse.json(
        { error: 'Device User ID is required' },
        { status: 400 }
      )
    }
    
    const success = await zktecoIntegration.deleteEmployeeFromDevice(deviceUserId)
    
    return NextResponse.json({ success })
  } catch (error) {
    console.error('Device integration DELETE error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete employee from device',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}