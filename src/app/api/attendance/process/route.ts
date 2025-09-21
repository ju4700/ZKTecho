import { NextRequest, NextResponse } from 'next/server';
import { zktecoService } from '@/lib/zkteco';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import mongoose from 'mongoose';

/**
 * Attendance Processing System
 * 
 * Implements ZKTeco attendance log processing:
 * 1. Fetch attendance logs from device using zklib-js
 * 2. Process clock-in/out pairs for each employee
 * 3. Calculate regular hours, overtime, and break time
 * 4. Store processed attendance records in database
 * 5. Generate hourly wage calculations
 */

interface AttendanceRecord {
  employeeId: string;
  deviceUserId: string;
  timestamp: Date;
  attendanceType: number; // 1=Clock In, 2=Clock Out, 3=Break In, 4=Break Out
  deviceId: string;
  processed: boolean;
}

interface ProcessedAttendance {
  employeeId: string;
  date: string;
  clockIn?: Date;
  clockOut?: Date;
  breakIn?: Date;
  breakOut?: Date;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  breakHours: number;
  hourlyRate: number;
  regularPay: number;
  overtimePay: number;
  totalPay: number;
  workSchedule: {
    regularHours: number;
    overtimeRate: number;
  };
}

// Enhanced Attendance Schema
const AttendanceSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, index: true },
  deviceUserId: { type: String, required: true },
  timestamp: { type: Date, required: true, index: true },
  attendanceType: { type: Number, required: true }, // 1=In, 2=Out, 3=Break In, 4=Break Out
  deviceId: { type: String, default: 'ZKTeco-K40' },
  processed: { type: Boolean, default: false },
  
  // Processed fields
  date: { type: String, index: true }, // YYYY-MM-DD format
  clockIn: Date,
  clockOut: Date,
  breakIn: Date,
  breakOut: Date,
  totalHours: { type: Number, default: 0 },
  regularHours: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  breakHours: { type: Number, default: 0 },
  hourlyRate: { type: Number, default: 0 },
  regularPay: { type: Number, default: 0 },
  overtimePay: { type: Number, default: 0 },
  totalPay: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);

export async function POST(request: NextRequest) {
  try {
    const { action, employeeId, startDate, endDate } = await request.json();

    await connectDB();

    switch (action) {
      case 'syncFromDevice':
        return await syncAttendanceFromDevice();
      
      case 'processAttendance':
        return await processAttendanceRecords(employeeId, startDate, endDate);
      
      case 'calculatePayroll':
        return await calculatePayroll(employeeId, startDate, endDate);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: syncFromDevice, processAttendance, or calculatePayroll' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Attendance processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process attendance data' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    await connectDB();

    const query: Record<string, unknown> = {};
    
    if (employeeId) query.employeeId = employeeId;
    if (date) query.date = date;
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendanceRecords = await Attendance.find(query)
      .sort({ timestamp: -1 })
      .limit(100);

    return NextResponse.json({
      success: true,
      records: attendanceRecords,
      count: attendanceRecords.length
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance records' },
      { status: 500 }
    );
  }
}

async function syncAttendanceFromDevice() {
  try {
    console.log('🔄 Starting attendance sync from ZKTeco device...');
    
    // Connect to device
    const connected = await zktecoService.connect();
    if (!connected) {
      throw new Error('Failed to connect to ZKTeco device');
    }

    // Fetch attendance logs from device
    const deviceLogs = await zktecoService.getAttendanceLogs();
    console.log(`📥 Retrieved ${deviceLogs.length} attendance logs from device`);

    // Get existing records to avoid duplicates
    const existingRecords = await Attendance.find({}, { 
      deviceUserId: 1, 
      timestamp: 1 
    }).lean();

    const existingSet = new Set(
      existingRecords.map(r => `${r.deviceUserId}-${r.timestamp.getTime()}`)
    );

    // Process and filter new records
    let newRecords = 0;
    const recordsToInsert = [];

    for (const log of deviceLogs) {
      const recordKey = `${log.deviceUserId}-${new Date(log.timestamp).getTime()}`;
      
      if (!existingSet.has(recordKey)) {
        // Map device user ID to employee ID
        const employee = await Employee.findOne({ 
          $or: [
            { employeeId: log.deviceUserId },
            { 'deviceSync.deviceUserId': log.deviceUserId }
          ]
        });

        if (employee) {
          recordsToInsert.push({
            employeeId: employee.employeeId,
            deviceUserId: log.deviceUserId,
            timestamp: new Date(log.timestamp),
            attendanceType: log.attendanceType,
            deviceId: log.deviceId || 'ZKTeco-K40',
            processed: false,
            date: new Date(log.timestamp).toISOString().split('T')[0]
          });
          newRecords++;
        }
      }
    }

    // Insert new records
    if (recordsToInsert.length > 0) {
      await Attendance.insertMany(recordsToInsert);
      console.log(`✅ Inserted ${newRecords} new attendance records`);
    }

    await zktecoService.disconnect();

    return NextResponse.json({
      success: true,
      message: `Sync completed: ${newRecords} new records processed`,
      totalLogs: deviceLogs.length,
      newRecords,
      recordsProcessed: newRecords
    });

  } catch (error) {
    console.error('❌ Device sync error:', error);
    await zktecoService.disconnect();
    
    return NextResponse.json(
      { error: `Device sync failed: ${error}` },
      { status: 500 }
    );
  }
}

async function processAttendanceRecords(employeeId?: string, startDate?: string, endDate?: string) {
  try {
    console.log('🔄 Processing attendance records for hour calculation...');

    // Build query
    const query: Record<string, unknown> = { processed: false };
    if (employeeId) query.employeeId = employeeId;
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    // Group records by employee and date
    const records = await Attendance.find(query).sort({ timestamp: 1 });
    const groupedRecords = new Map<string, AttendanceRecord[]>();

    for (const record of records) {
      const key = `${record.employeeId}-${record.date}`;
      if (!groupedRecords.has(key)) {
        groupedRecords.set(key, []);
      }
      groupedRecords.get(key)!.push(record);
    }

    const processedCount = await processGroupedRecords(groupedRecords);

    return NextResponse.json({
      success: true,
      message: `Processed ${processedCount} attendance sessions`,
      recordsProcessed: processedCount
    });

  } catch (error) {
    console.error('❌ Processing error:', error);
    return NextResponse.json(
      { error: `Processing failed: ${error}` },
      { status: 500 }
    );
  }
}

async function processGroupedRecords(groupedRecords: Map<string, AttendanceRecord[]>): Promise<number> {
  let processedCount = 0;

  for (const [key, dayRecords] of groupedRecords) {
    const [employeeId, date] = key.split('-');
    
    // Get employee details for hourly rate and work schedule
    const employee = await Employee.findOne({ employeeId });
    if (!employee) continue;

    // Process clock-in/out pairs for the day
    const processedAttendance = await processDayAttendance(dayRecords, employee);
    
    if (processedAttendance) {
      // Update or create processed attendance record
      await Attendance.findOneAndUpdate(
        { employeeId, date },
        {
          ...processedAttendance,
          processed: true,
          updatedAt: new Date()
        },
        { upsert: true }
      );

      // Mark raw records as processed
      await Attendance.updateMany(
        { 
          employeeId, 
          date,
          processed: false 
        },
        { processed: true }
      );

      processedCount++;
    }
  }

  return processedCount;
}

async function processDayAttendance(records: AttendanceRecord[], employee: { 
  employeeId: string; 
  hourlyRate?: number; 
  workSchedule?: { regularHours?: number; overtimeRate?: number } 
}): Promise<ProcessedAttendance | null> {
  if (records.length === 0) return null;

  const date = records[0].timestamp.toISOString().split('T')[0];
  let clockIn: Date | undefined;
  let clockOut: Date | undefined;
  let breakIn: Date | undefined;
  let breakOut: Date | undefined;

  // Sort records by timestamp
  records.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Process attendance events
  for (const record of records) {
    switch (record.attendanceType) {
      case 1: // Clock In
        if (!clockIn) clockIn = record.timestamp;
        break;
      case 2: // Clock Out
        clockOut = record.timestamp;
        break;
      case 3: // Break In
        if (!breakIn) breakIn = record.timestamp;
        break;
      case 4: // Break Out
        breakOut = record.timestamp;
        break;
    }
  }

  // Calculate hours
  let totalHours = 0;
  let breakHours = 0;

  if (clockIn && clockOut) {
    totalHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
  }

  if (breakIn && breakOut) {
    breakHours = (breakOut.getTime() - breakIn.getTime()) / (1000 * 60 * 60);
  }

  const workHours = totalHours - breakHours;
  const regularHours = Math.min(workHours, employee.workSchedule?.regularHours || 8);
  const overtimeHours = Math.max(0, workHours - regularHours);

  // Calculate pay
  const hourlyRate = employee.hourlyRate || 0;
  const overtimeRate = employee.workSchedule?.overtimeRate || 1.5;
  const regularPay = regularHours * hourlyRate;
  const overtimePay = overtimeHours * hourlyRate * overtimeRate;
  const totalPay = regularPay + overtimePay;

  return {
    employeeId: employee.employeeId,
    date,
    clockIn,
    clockOut,
    breakIn,
    breakOut,
    totalHours: workHours,
    regularHours,
    overtimeHours,
    breakHours,
    hourlyRate,
    regularPay,
    overtimePay,
    totalPay,
    workSchedule: {
      regularHours: employee.workSchedule?.regularHours || 8,
      overtimeRate
    }
  };
}

async function calculatePayroll(employeeId?: string, startDate?: string, endDate?: string) {
  try {
    const query: Record<string, unknown> = { processed: true };
    if (employeeId) query.employeeId = employeeId;
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const processedRecords = await Attendance.find(query);
    
    // Group by employee
    const payrollSummary = new Map();

    for (const record of processedRecords) {
      if (!payrollSummary.has(record.employeeId)) {
        payrollSummary.set(record.employeeId, {
          employeeId: record.employeeId,
          totalDays: 0,
          totalRegularHours: 0,
          totalOvertimeHours: 0,
          totalRegularPay: 0,
          totalOvertimePay: 0,
          totalPay: 0,
          records: []
        });
      }

      const summary = payrollSummary.get(record.employeeId);
      summary.totalDays++;
      summary.totalRegularHours += record.regularHours || 0;
      summary.totalOvertimeHours += record.overtimeHours || 0;
      summary.totalRegularPay += record.regularPay || 0;
      summary.totalOvertimePay += record.overtimePay || 0;
      summary.totalPay += record.totalPay || 0;
      summary.records.push(record);
    }

    return NextResponse.json({
      success: true,
      payrollSummary: Array.from(payrollSummary.values()),
      totalEmployees: payrollSummary.size,
      dateRange: { startDate, endDate }
    });

  } catch (error) {
    console.error('❌ Payroll calculation error:', error);
    return NextResponse.json(
      { error: `Payroll calculation failed: ${error}` },
      { status: 500 }
    );
  }
}