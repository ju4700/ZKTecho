'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react'
import AddEmployeeForm from '@/components/AddEmployeeForm'

interface Employee {
  _id: string
  employeeId: string
  name: string
  phone: string | null
  monthlySalary: number
  isActive: boolean
  deviceUserId: string | null
  fingerprintEnrolled: boolean
  fingerprintDate: Date | null
  lastSyncedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

interface DeviceUser {
  userId: string
  name: string
  role: number
  cardno?: string
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [deviceUsers, setDeviceUsers] = useState<DeviceUser[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [deviceConnected, setDeviceConnected] = useState(false)

  useEffect(() => {
    fetchEmployees()
    checkDeviceConnection()
    fetchDeviceUsers()
  }, [])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      const data = await response.json()
      setEmployees(data)
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDeviceUsers = async () => {
    try {
      const response = await fetch('/api/device/users')
      if (response.ok) {
        const data = await response.json()
        setDeviceUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching device users:', error)
    }
  }

  const checkDeviceConnection = async () => {
    try {
      const response = await fetch('/api/device/status')
      const status = await response.json()
      setDeviceConnected(status.connected)
    } catch (error) {
      console.error('Error checking device status:', error)
      setDeviceConnected(false)
    }
  }

  const syncUserToDevice = async (employeeId: string, action: 'add' | 'delete' | 'sync') => {
    if (!deviceConnected && action !== 'delete') {
      alert('Device is not connected. Please check your ZKTeco device connection.')
      return
    }

    setSyncing(employeeId)
    try {
      const response = await fetch('/api/device/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId,
          action,
          role: 0 // Normal user
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        alert(result.message)
        fetchEmployees() // Refresh the list
        fetchDeviceUsers() // Refresh device users
      } else {
        alert(`Failed: ${result.error}`)
      }
    } catch {
      alert('Network error occurred')
    } finally {
      setSyncing(null)
    }
  }

  const isUserOnDevice = (employee: Employee) => {
    const deviceUserId = employee.deviceUserId || employee.employeeId
    return deviceUsers.some(du => du.userId === deviceUserId)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading employees...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Employee Management</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage employees and sync them with your ZKTeco device
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {deviceConnected ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <Wifi className="h-4 w-4" />
                  <span className="text-sm font-medium">Device Connected</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-red-600">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm font-medium">Device Disconnected</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </button>
          </div>
        </div>

        {/* Device Status Alert */}
        {!deviceConnected && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  ZKTeco Device Not Connected
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  You can still manage employees, but device sync functionality will be limited until the device is connected.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Employees Table */}
        <div className="mt-8">
          <div className="overflow-hidden bg-white shadow border border-gray-200 rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monthly Salary
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Device Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {employees.map((employee) => (
                      <tr key={employee._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {employee.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {employee.employeeId}
                              </div>
                              {employee.fingerprintEnrolled && (
                                <div className="text-xs text-green-600">
                                  ✓ Fingerprint Enrolled
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{employee.phone || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">General</div>
                          <div className="text-sm text-gray-500">Employee</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${employee.monthlySalary}/month
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isUserOnDevice(employee) ? (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              <span className="text-xs">On Device</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-gray-400">
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              <span className="text-xs">Not Synced</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {!isUserOnDevice(employee) ? (
                              <button
                                onClick={() => syncUserToDevice(employee._id, 'add')}
                                disabled={syncing === employee._id || !deviceConnected}
                                className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {syncing === employee._id ? 'Adding...' : 'Add to Device'}
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => syncUserToDevice(employee._id, 'sync')}
                                  disabled={syncing === employee._id || !deviceConnected}
                                  className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {syncing === employee._id ? 'Syncing...' : 'Update'}
                                </button>
                                <button
                                  onClick={() => syncUserToDevice(employee._id, 'delete')}
                                  disabled={syncing === employee._id}
                                  className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {syncing === employee._id ? 'Removing...' : 'Remove'}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {employees.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-500">No employees found. Add your first employee to get started.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Device Users Summary */}
        {deviceConnected && deviceUsers.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Device Users ({deviceUsers.length})</h2>
            <div className="bg-white shadow border border-gray-200 rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {deviceUsers.map((user) => (
                    <div key={user.userId} className="border border-gray-200 rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">ID: {user.userId}</div>
                      {user.cardno && (
                        <div className="text-xs text-gray-500">Card: {user.cardno}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Employee Form */}
      <AddEmployeeForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSuccess={fetchEmployees}
      />
    </div>
  )
}
