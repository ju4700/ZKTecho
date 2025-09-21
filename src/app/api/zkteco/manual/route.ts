import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Employee from '@/models/Employee'

export async function POST(request: Request) {
  try {
    const { fingerprintIds } = await request.json()
    
    if (!Array.isArray(fingerprintIds)) {
      return NextResponse.json({
        success: false,
        error: 'fingerprintIds must be an array'
      }, { status: 400 })
    }
    
    await connectDB()
    
    // Get all employees with assigned fingerprint IDs
    const assignedEmployees = await Employee.find({ 
      deviceUserId: { $in: fingerprintIds } 
    }).select('deviceUserId name employeeId')
    
    // Create mapping of assigned IDs
    const assignedMap = new Map()
    assignedEmployees.forEach((emp: Record<string, unknown>) => {
      assignedMap.set(emp.deviceUserId, {
        employeeId: emp.employeeId,
        name: emp.name
      })
    })
    
    // Separate available vs assigned IDs
    const availableUsers = fingerprintIds
      .filter(id => !assignedMap.has(id))
      .map(id => ({
        zktecoId: id,
        name: `Fingerprint ${id}`,
        isAvailable: true
      }))
    
    const assignedUsers = fingerprintIds
      .filter(id => assignedMap.has(id))
      .map(id => ({
        zktecoId: id,
        name: `Fingerprint ${id}`,
        isAvailable: false,
        assignedTo: assignedMap.get(id)
      }))
    
    return NextResponse.json({
      success: true,
      total: fingerprintIds.length,
      available: availableUsers.length,
      assigned: assignedUsers.length,
      deviceUsers: fingerprintIds.map(id => ({ zktecoId: id, name: `Fingerprint ${id}` })),
      availableUsers,
      assignedUsers,
      message: `Manual fingerprint ID verification for ${fingerprintIds.length} IDs`
    })
    
  } catch (error) {
    console.error('Error in manual fingerprint verification:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}