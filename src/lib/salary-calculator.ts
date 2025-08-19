import { differenceInHours, endOfDay } from 'date-fns'

type AttendanceType = 'CHECK_IN' | 'CHECK_OUT'

export interface WorkSession {
  checkIn: Date
  checkOut?: Date
  breakIn?: Date
  breakOut?: Date
  totalHours: number
  breakHours: number
  workHours: number
}

export class SalaryCalculator {
  static calculateWorkHours(attendances: { timestamp: Date; type: AttendanceType }[]): WorkSession[] {
    const sessions: WorkSession[] = []
    const sortedAttendances = [...attendances].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    
    let currentSession: Partial<WorkSession> | null = null

    for (const attendance of sortedAttendances) {
      switch (attendance.type) {
        case 'CHECK_IN':
          if (currentSession && currentSession.checkIn && !currentSession.checkOut) {
            // Previous session wasn't closed properly, close it at end of day
            currentSession.checkOut = endOfDay(currentSession.checkIn)
            this.finalizeSession(currentSession as WorkSession)
            sessions.push(currentSession as WorkSession)
          }
          
          currentSession = {
            checkIn: attendance.timestamp,
            totalHours: 0,
            breakHours: 0,
            workHours: 0
          }
          break

        case 'CHECK_OUT':
          if (currentSession && currentSession.checkIn) {
            currentSession.checkOut = attendance.timestamp
            this.finalizeSession(currentSession as WorkSession)
            sessions.push(currentSession as WorkSession)
            currentSession = null
          }
          break
      }
    }

    // Handle unclosed session
    if (currentSession && currentSession.checkIn && !currentSession.checkOut) {
      currentSession.checkOut = endOfDay(currentSession.checkIn)
      this.finalizeSession(currentSession as WorkSession)
      sessions.push(currentSession as WorkSession)
    }

    return sessions
  }

  private static finalizeSession(session: WorkSession): void {
    if (session.checkIn && session.checkOut) {
      session.totalHours = differenceInHours(session.checkOut, session.checkIn)
      session.workHours = session.totalHours - session.breakHours
    }
  }

  static calculateMonthlySalary(
    monthlySalary: number,
    workingSessions: WorkSession[],
    totalWorkingDaysInMonth: number
  ): {
    grossSalary: number
    actualWorkingDays: number
    totalWorkingHours: number
    averageHoursPerDay: number
    dailyRate: number
  } {
    const totalWorkingHours = workingSessions.reduce((sum, session) => sum + session.workHours, 0)
    const actualWorkingDays = workingSessions.length
    const averageHoursPerDay = actualWorkingDays > 0 ? totalWorkingHours / actualWorkingDays : 0
    const dailyRate = monthlySalary / totalWorkingDaysInMonth
    const grossSalary = dailyRate * actualWorkingDays

    return {
      grossSalary,
      actualWorkingDays,
      totalWorkingHours,
      averageHoursPerDay,
      dailyRate
    }
  }

  static calculateOvertime(
    workingSessions: WorkSession[],
    standardHoursPerDay: number = 8,
    overtimeRate: number = 1.5
  ): {
    regularHours: number
    overtimeHours: number
    overtimePay: number
  } {
    let regularHours = 0
    let overtimeHours = 0

    workingSessions.forEach(session => {
      if (session.workHours <= standardHoursPerDay) {
        regularHours += session.workHours
      } else {
        regularHours += standardHoursPerDay
        overtimeHours += session.workHours - standardHoursPerDay
      }
    })

    const overtimePay = overtimeHours * overtimeRate

    return {
      regularHours,
      overtimeHours,
      overtimePay
    }
  }

  static calculateDeductions(
    grossSalary: number,
    tax: number = 0,
    insurance: number = 0,
    otherDeductions: number = 0
  ): {
    taxAmount: number
    insuranceAmount: number
    otherDeductions: number
    totalDeductions: number
    netSalary: number
  } {
    const taxAmount = grossSalary * (tax / 100)
    const insuranceAmount = grossSalary * (insurance / 100)
    const totalDeductions = taxAmount + insuranceAmount + otherDeductions
    const netSalary = grossSalary - totalDeductions

    return {
      taxAmount,
      insuranceAmount,
      otherDeductions,
      totalDeductions,
      netSalary
    }
  }
}
