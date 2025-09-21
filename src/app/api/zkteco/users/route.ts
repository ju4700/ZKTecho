import { NextResponse } from 'next/server'
import { zktecoService } from '@/lib/zkteco'
import connectDB from '@/lib/mongodb'
import Employee from '@/models/Employee'

export async function GET() {
  try {
    console.log('🔍 Fetching ZKTeco users and assignment status...')
    
    // Try to get users from device first
    let deviceUsers = await zktecoService.getUsers()
    console.log('📥 Device users from API:', deviceUsers)
    
    let isUsingManualFallback = false
    
    // FIRMWARE 4.0.4 FALLBACK: If device API fails, use manual list
    if (deviceUsers.length === 0) {
      console.log('⚠️ Device API returned no users, using firmware 4.0.4 fallback...')
      console.log('💡 For ZKTeco firmware v4.0.4, manual ID specification required')
      
      // Manual list of fingerprint IDs that exist on your device
      // TODO: Update this array with the actual IDs you have on your device
      const knownFingerprintIds = ['1', '2'] // You mentioned 2 fingerprints exist
      
      deviceUsers = knownFingerprintIds.map(id => ({
        userId: id,
        name: `Fingerprint ${id}`,
        role: 0,
        cardno: ''
      }))
      
      isUsingManualFallback = true
      console.log('📋 Using manual fingerprint IDs:', deviceUsers)
    }

    // Get all employees from database to see which ZKTeco IDs are already assigned
    await connectDB()
    const employees = await Employee.find({ deviceUserId: { $ne: null } })
    const assignedDeviceIds = employees.map(emp => emp.deviceUserId)
    
    // Mark which device users are available vs assigned
    const enrichedUsers = deviceUsers.map(deviceUser => ({
      zktecoId: deviceUser.userId,
      name: deviceUser.name || `Fingerprint ${deviceUser.userId}`,
      role: deviceUser.role,
      cardno: deviceUser.cardno,
      isAssigned: assignedDeviceIds.includes(deviceUser.userId),
      assignedTo: assignedDeviceIds.includes(deviceUser.userId) 
        ? employees.find(emp => emp.deviceUserId === deviceUser.userId)?.name
        : null
    }))
    
    // Separate available and assigned users
    const availableUsers = enrichedUsers.filter(user => !user.isAssigned)
    const assignedUsers = enrichedUsers.filter(user => user.isAssigned)
    
    return NextResponse.json({
      success: true,
      total: enrichedUsers.length,
      available: availableUsers.length,
      assigned: assignedUsers.length,
      deviceUsers: enrichedUsers,
      availableUsers,
      assignedUsers,
      firmwareNote: isUsingManualFallback ? 'Using manual IDs for firmware v4.0.4' : 'Device API used'
    })
    
  } catch (error) {
    console.error('Error fetching ZKTeco users:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch enrolled fingerprints from device',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}