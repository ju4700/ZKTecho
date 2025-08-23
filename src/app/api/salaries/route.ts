import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Employee from '@/models/Employee'
import Attendance from '@/models/Attendance'
import Salary from '@/models/Salary'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const month = parseInt(searchParams.get('month') || '0')
    const year = parseInt(searchParams.get('year') || '0')

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year are required' }, { status: 400 })
    }

    const filter: { month: number; year: number; employeeId?: string } = { month, year }
    if (employeeId) {
      filter.employeeId = employeeId
    }

    const salaries = await Salary.find(filter).sort({ createdAt: -1 })
    return NextResponse.json(salaries)
  } catch (error) {
    console.error('Error fetching salaries:', error)
    return NextResponse.json({ error: 'Failed to fetch salaries' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const { employeeId, month, year } = await request.json()

    if (!employeeId || !month || !year) {
      return NextResponse.json(
        { error: 'Employee ID, month, and year are required' },
        { status: 400 }
      )
    }

    const employee = await Employee.findById(employeeId)
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const existingSalary = await Salary.findOne({
      employeeId,
      month,
      year
    })

    if (existingSalary) {
      return NextResponse.json(
        { error: 'Salary already calculated for this month' },
        { status: 400 }
      )
    }

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const attendances = await Attendance.find({
      employeeId,
      timestamp: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ timestamp: 1 })

    const workingDays = new Set()
    attendances.forEach(attendance => {
      const dateStr = attendance.timestamp.toDateString()
      workingDays.add(dateStr)
    })

    const actualWorkingDays = workingDays.size
    const totalWorkingDays = getDaysInMonth(year, month)
    const dailySalary = employee.monthlySalary / totalWorkingDays
    const calculatedSalary = dailySalary * actualWorkingDays

    const salary = await Salary.create({
      employeeId,
      month,
      year,
      monthlySalary: employee.monthlySalary,
      totalWorkingDays,
      actualWorkingDays,
      calculatedSalary,
      bonuses: 0,
      deductions: 0,
      finalSalary: calculatedSalary,
      isPaid: false
    })

    return NextResponse.json(salary, { status: 201 })
  } catch (error) {
    console.error('Error calculating salary:', error)
    return NextResponse.json({ error: 'Failed to calculate salary' }, { status: 500 })
  }
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}
