import { NextResponse } from 'next/server'
import { zktecoService } from '@/lib/zkteco'
import connectDB from '@/lib/mongodb'
import Employee from '@/models/Employee'
import Attendance from '@/models/Attendance'

export async function POST() {
  try {
    await connectDB()
    
    const logs = await zktecoService.getAttendanceLogs()
    
    if (logs.length === 0) {
      return NextResponse.json({ message: 'No new attendance logs found' })
    }

    let syncedCount = 0
    const errors: string[] = []

    for (const log of logs) {
      try {
        const employee = await Employee.findOne({ 
          deviceUserId: log.deviceUserId 
        })

        if (!employee) {
          errors.push(`Employee not found for device user ID: ${log.deviceUserId}`)
          continue
        }

        const existingAttendance = await Attendance.findOne({
          employeeId: employee._id.toString(),
          deviceUserId: log.deviceUserId,
          timestamp: log.timestamp
        })

        if (existingAttendance) {
          continue
        }

        const lastAttendance = await Attendance.findOne({
          employeeId: employee._id.toString()
        }).sort({ timestamp: -1 })

        let attendanceType: 'CHECK_IN' | 'CHECK_OUT' = 'CHECK_IN'
        if (lastAttendance && lastAttendance.type === 'CHECK_IN') {
          attendanceType = 'CHECK_OUT'
        }

        await Attendance.create({
          employeeId: employee._id.toString(),
          deviceUserId: log.deviceUserId,
          timestamp: log.timestamp,
          type: attendanceType,
          deviceId: log.deviceId
        })

        syncedCount++
      } catch (error) {
        console.error('Error processing attendance log:', error)
        errors.push(`Failed to process log for device user ${log.deviceUserId}`)
      }
    }

    return NextResponse.json({
      message: `Successfully synced ${syncedCount} attendance records`,
      syncedCount,
      totalLogs: logs.length,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Attendance sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync attendance data' },
      { status: 500 }
    )
  }
}
