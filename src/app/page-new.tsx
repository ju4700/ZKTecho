'use client'

import React, { useState, useEffect } from 'react'
import { Users, Clock, DollarSign } from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  totalAttendanceToday: number
  pendingSalaries: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    totalAttendanceToday: 0,
    pendingSalaries: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      // This would be actual API calls in a real implementation
      // For now, using placeholder data
      setStats({
        totalEmployees: 25,
        activeEmployees: 23,
        totalAttendanceToday: 18,
        pendingSalaries: 5
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const syncAttendance = async () => {
    try {
      const response = await fetch('/api/attendance/sync', {
        method: 'POST'
      })
      const result = await response.json()
      
      if (response.ok) {
        alert(`Successfully synced ${result.syncedCount} attendance records`)
        fetchDashboardStats()
      } else {
        alert('Failed to sync attendance data')
      }
    } catch (error) {
      console.error('Error syncing attendance:', error)
      alert('Error syncing attendance data')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Overview of your employee management system
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={syncAttendance}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Sync Attendance
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Employees</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalEmployees}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Employees</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.activeEmployees}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Today&apos;s Attendance</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalAttendanceToday}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Salaries</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.pendingSalaries}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/employees/new"
                className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Users className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-sm font-medium text-gray-900">Add New Employee</span>
              </Link>
              <Link
                href="/attendance"
                className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Clock className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-sm font-medium text-gray-900">View Attendance Records</span>
              </Link>
              <Link
                href="/salaries"
                className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <DollarSign className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-sm font-medium text-gray-900">Calculate Salaries</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">System Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">ZKTeco Device</span>
                <span className="text-sm font-medium text-green-600">Connected</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Database</span>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Last Sync</span>
                <span className="text-sm font-medium text-gray-900">2 minutes ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
