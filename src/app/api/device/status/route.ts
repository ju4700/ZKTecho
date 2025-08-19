import { NextResponse } from 'next/server'
import { zktecoService } from '@/lib/zkteco'

export async function GET() {
  try {
    // Try to connect to the device and get basic info
    const isConnected = await zktecoService.connect()
    
    if (isConnected) {
      const deviceInfo = await zktecoService.getDeviceInfo()
      await zktecoService.disconnect()
      
      return NextResponse.json({
        status: 'connected',
        deviceInfo: deviceInfo || null,
        message: 'Device is reachable and responding'
      })
    } else {
      return NextResponse.json({
        status: 'disconnected',
        deviceInfo: null,
        message: 'Cannot connect to ZKTeco device'
      })
    }
  } catch (error) {
    console.error('Device status check error:', error)
    return NextResponse.json({
      status: 'error',
      deviceInfo: null,
      message: `Connection error: ${error}`
    }, { status: 500 })
  }
}
