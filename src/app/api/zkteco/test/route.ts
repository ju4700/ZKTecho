import { NextResponse } from 'next/server'
import { zktecoService } from '@/lib/zkteco'

export async function GET() {
  try {
    console.log('🧪 Testing ZKTeco device connectivity and methods...')
    
    // Test device info
    let deviceInfo = null
    try {
      deviceInfo = await zktecoService.getDeviceInfo()
      console.log('📊 Device Info:', deviceInfo)
    } catch (err) {
      console.log('❌ Device info failed:', err)
    }
    
    // Test user fetching
    let users: unknown[] = []
    try {
      console.log('🧪 Testing user fetching...')
      users = await zktecoService.getUsers()
      console.log('� Users found:', users)
    } catch (err) {
      console.log('❌ User fetching failed:', err)
    }
    
    // Test attendance logs
    let attendanceLogs: unknown[] = []
    try {
      console.log('🧪 Testing attendance log fetching...')
      attendanceLogs = await zktecoService.getAttendanceLogs()
      console.log('� Attendance logs found:', attendanceLogs.length)
    } catch (err) {
      console.log('❌ Attendance log fetching failed:', err)
    }
    
    return NextResponse.json({
      success: true,
      deviceInfo,
      usersFound: users.length,
      users,
      attendanceLogsFound: attendanceLogs.length,
      attendanceLogs: attendanceLogs.slice(0, 5), // Show only first 5 for brevity
      message: 'Device test completed with new firmware v4.0.4 support'
    })
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}