import { NextResponse } from 'next/server'
import { getEnhancedZKTecoService } from '@/lib/zkteco-enhanced'

export async function GET() {
  try {
    const zkService = getEnhancedZKTecoService()
    
    // Fast connection test - just verify device is reachable
    let deviceReachable = false
    let deviceInfo = null
    let lastError = null

    try {
      // Quick connection test - just connect and get basic info
      const isConnected = await zkService.connect()
      
      if (isConnected) {
        // Get only basic device info for speed
        deviceInfo = await zkService.getDeviceInfo()
        deviceReachable = true
        
        // Disconnect immediately after basic check
        await zkService.disconnect()
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error'
      console.error('Quick device status check failed:', error)
    }

    // Return status immediately without getting all data
    return NextResponse.json({
      isConnected: deviceReachable,
      connectionStatus: {
        isConnected: deviceReachable,
        lastConnected: deviceReachable ? new Date().toISOString() : null,
        lastError: lastError
      },
      deviceInfo: deviceReachable ? {
        serialNumber: deviceInfo?.deviceId || 'ZKT-K40-001',
        deviceName: deviceInfo?.deviceName || 'ZKTeco K40',
        platform: deviceInfo?.platform || 'Unknown',
        firmware: deviceInfo?.fpVersion || 'Unknown',
        userCount: deviceInfo?.userCounts || 'Loading...',
        attendanceLogCount: deviceInfo?.logCounts || 'Loading...',
        userCapacity: deviceInfo?.userCapacity || deviceInfo?.userCounts || 'Unknown',
        logCapacity: deviceInfo?.logCapacity || 'Unknown'
      } : {
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

  } catch (error) {
    console.error('Error in device status check:', error)
    
    return NextResponse.json({
      isConnected: false,
      connectionStatus: {
        isConnected: false,
        lastError: error instanceof Error ? error.message : 'Unknown error',
        lastConnected: null
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
}