import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';

export async function GET() {
  try {
    await connectDB();
    
    // Get all employees
    const employees = await Employee.find({});
    
    // Mock stats for now - in a real implementation you'd calculate from attendance data
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const totalEmployees = employees.length;
    const activeToday = Math.floor(totalEmployees * 0.75); // Mock 75% attendance
    const pendingSync = employees.filter(emp => !emp.deviceSync?.isRegistered).length;
    const totalHoursToday = activeToday * 8.5; // Mock average of 8.5 hours per active employee
    
    return NextResponse.json({
      totalEmployees,
      activeToday,
      pendingSync,
      totalHoursToday
    });
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance statistics' },
      { status: 500 }
    );
  }
}