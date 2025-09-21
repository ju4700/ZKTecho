import { NextResponse } from 'next/server'
import { getEnhancedZKTecoService } from '@/lib/zkteco-enhanced'

export async function GET() {
  try {
    const zkService = getEnhancedZKTecoService()
    const connectionStatus = zkService.getConnectionStatus()
    
    // Try to get fresh connection status
    const isConnected = await zkService.connect()
    
    if (isConnected) {
      try {
        // Get device info if connected
        const deviceInfo = await zkService.getDeviceInfo()
        const users = await zkService.getUsers()
        const attendanceLogs = await zkService.getAttendanceLogs()
        
        await zkService.disconnect()
        
        return NextResponse.json({
          isConnected: true,
          connectionStatus: {
            ...connectionStatus,
            isConnected: true,
            lastConnected: new Date().toISOString()
          },
          deviceInfo: {
            serialNumber: deviceInfo?.deviceId || 'ZKT-K40-001',
            deviceName: deviceInfo?.deviceName || 'ZKTeco K40',
            platform: deviceInfo?.platform || 'Unknown',
            firmware: deviceInfo?.fpVersion || 'Unknown',
            userCount: users.length,
            attendanceLogCount: attendanceLogs.length,
            userCapacity: deviceInfo?.userCapacity || 'Unknown',
            logCapacity: deviceInfo?.logCapacity || 'Unknown'
          },
          lastSync: new Date().toISOString()
        })
      } catch (error) {
        console.error('Error getting device details:', error)
        await zkService.disconnect()
        return NextResponse.json({
          isConnected: true,
          connectionStatus: {
            isConnected: true,
            lastError: error instanceof Error ? error.message : 'Unknown error',
            lastConnected: new Date().toISOString()
          },
          deviceInfo: {
            serialNumber: 'ZKT-K40-001',
            deviceName: 'ZKTeco K40',
            platform: 'Unknown',
            firmware: 'Unknown',
            userCount: 0,
            attendanceLogCount: 0,
            userCapacity: 'Unknown',
            logCapacity: 'Unknown'
          },
          lastSync: new Date().toISOString()
        })
      }
    } else {
      return NextResponse.json({
        isConnected: false,
        connectionStatus: {
          isConnected: false,
          lastError: connectionStatus.lastError || 'Connection failed',
          lastAttempt: new Date().toISOString()
        },
        deviceInfo: null,
        lastSync: 'Never'
      })
    }
  } catch (error) {
    console.error('Device status check error:', error)
    return NextResponse.json({
      isConnected: false,
      deviceInfo: null,
      lastSync: 'Never'
    }, { status: 500 })
  }
}
