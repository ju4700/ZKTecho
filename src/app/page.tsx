'use client'

import React, { useState, useEffect } from 'react'
import { Users, Clock, DollarSign, Wifi, WifiOff, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Stats {
  totalEmployees: number
  activeEmployees: number
  totalAttendanceToday: number
  pendingSalaries: number
}

interface DeviceStatus {
  connected: boolean
  error?: string
  info?: {
    model?: string
    serialNumber?: string
    userCount?: number
  }
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalEmployees: 0,
    activeEmployees: 0,
    totalAttendanceToday: 0,
    pendingSalaries: 0
  })
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({ connected: false })
  const [statusLoading, setStatusLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    checkDeviceStatus()
  }, [])

  const fetchStats = async () => {
    try {
      const [employeesRes, attendanceRes, salariesRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/attendance'),
        fetch('/api/salaries')
      ])

      const employees = await employeesRes.json()
      const attendance = await attendanceRes.json()
      const salaries = await salariesRes.json()

      const today = new Date().toISOString().split('T')[0]
      const todayAttendance = attendance.filter((a: { timestamp: string }) => 
        a.timestamp.startsWith(today)
      )

      setStats({
        totalEmployees: employees.length,
        activeEmployees: employees.filter((e: { isActive: boolean }) => e.isActive).length,
        totalAttendanceToday: todayAttendance.length,
        pendingSalaries: salaries.filter((s: { isPaid: boolean }) => !s.isPaid).length
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkDeviceStatus = async () => {
    try {
      setStatusLoading(true)
      const response = await fetch('/api/device/status')
      const status = await response.json()
      setDeviceStatus(status)
    } catch (error) {
      console.error('Error checking device status:', error)
      setDeviceStatus({ connected: false, error: 'Failed to check device status' })
    } finally {
      setStatusLoading(false)
    }
  }

  const syncAttendance = async () => {
    if (!deviceStatus.connected) {
      alert('ZKTeco device is not connected. Please check your device connection.')
      return
    }

    setSyncing(true)
    try {
      const response = await fetch('/api/attendance/sync', {
        method: 'POST'
      })
      if (response.ok) {
        alert('Attendance synced successfully!')
        fetchStats()
      } else {
        const error = await response.json()
        alert(`Sync failed: ${error.error}`)
      }
    } catch {
      alert('Sync failed: Network error')
    } finally {
      setSyncing(false)
    }
  }

  const statCards = [
    {
      name: 'Total Employees',
      stat: stats.totalEmployees,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      name: 'Active Employees',
      stat: stats.activeEmployees,
      icon: Users,
      color: 'bg-green-500'
    },
    {
      name: 'Today\'s Attendance',
      stat: stats.totalAttendanceToday,
      icon: Clock,
      color: 'bg-yellow-500'
    },
    {
      name: 'Pending Salaries',
      stat: stats.pendingSalaries,
      icon: DollarSign,
      color: 'bg-red-500'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Employee Management Dashboard</h1>
            <p className="mt-2 text-sm text-gray-700">
              ZKTeco K40 Biometric Attendance System
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <div className="flex items-center space-x-4">
              {/* Device Status Indicator */}
              <div className="flex items-center space-x-2">
                {statusLoading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
                ) : deviceStatus.connected ? (
                  <div className="flex items-center space-x-2 text-green-600">
                    <Wifi className="h-4 w-4" />
                    <span className="text-sm font-medium">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-red-600">
                    <WifiOff className="h-4 w-4" />
                    <span className="text-sm font-medium">Disconnected</span>
                  </div>
                )}
              </div>

              <button
                onClick={checkDeviceStatus}
                disabled={statusLoading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {statusLoading ? 'Checking...' : 'Check Status'}
              </button>

              <button
                onClick={syncAttendance}
                disabled={syncing || !deviceStatus.connected}
                className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  deviceStatus.connected 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {syncing ? 'Syncing...' : 'Sync Attendance'}
              </button>
            </div>
          </div>
        </div>

        {/* Connection Alert */}
        {!deviceStatus.connected && !statusLoading && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  ZKTeco Device Not Connected
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    The biometric device is not connected. Please check:
                  </p>
                  <ul className="mt-1 list-disc list-inside">
                    <li>Device is powered on and connected to network</li>
                    <li>IP address is configured correctly (default: 192.168.1.201)</li>
                    <li>Network connectivity between server and device</li>
                  </ul>
                  <p className="mt-2">
                    <Link href="/setup" className="font-medium text-yellow-800 underline hover:text-yellow-600">
                      View setup guide →
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Device Info */}
        {deviceStatus.connected && deviceStatus.info && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex">
              <Wifi className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Device Connected Successfully
                </h3>
                <div className="mt-1 text-sm text-green-700">
                  <p>Model: {deviceStatus.info.model || 'ZKTeco K40'}</p>
                  <p>Serial: {deviceStatus.info.serialNumber || 'N/A'}</p>
                  <p>Users: {deviceStatus.info.userCount || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((item) => (
            <div key={item.name} className="overflow-hidden rounded-lg bg-white shadow border border-gray-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`${item.color} p-3 rounded-md`}>
                      <item.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {item.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">{item.stat}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/employees"
              className="relative group bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-600 ring-4 ring-white">
                  <Users className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Manage Employees
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Add, edit, or sync employees with ZKTeco device
                </p>
              </div>
            </Link>

            <Link
              href="/attendance"
              className="relative group bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-600 ring-4 ring-white">
                  <Clock className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">
                  View Attendance
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Track employee attendance records
                </p>
              </div>
            </Link>

            <Link
              href="/salaries"
              className="relative group bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-yellow-50 text-yellow-600 ring-4 ring-white">
                  <DollarSign className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Calculate Salaries
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Process payroll and salary calculations
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">System Status</h2>
          <div className="bg-white shadow border border-gray-200 rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Sync</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {deviceStatus.connected ? 'Ready to sync' : 'Device not connected'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">System Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Online
                    </span>
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
