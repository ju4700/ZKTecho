'use client'

import React, { useState } from 'react'
import { X, Fingerprint, CheckCircle, AlertCircle } from 'lucide-react'

interface AddEmployeeFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface EmployeeCreationStep {
  id: string
  label: string
  status: 'pending' | 'in-progress' | 'completed' | 'error'
  message?: string
}

export default function AddEmployeeForm({ isOpen, onClose, onSuccess }: AddEmployeeFormProps) {
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    phone: '',
    monthlySalary: ''
  })
  const [loading, setLoading] = useState(false)
  const [enrollmentStep, setEnrollmentStep] = useState<'form' | 'enrollment' | 'completed'>('form')
  const [createdEmployee, setCreatedEmployee] = useState<any>(null)
  const [steps, setSteps] = useState<EmployeeCreationStep[]>([
    { id: 'database', label: 'Save to Database', status: 'pending' },
    { id: 'device', label: 'Create User in ZKTeco Device', status: 'pending' },
    { id: 'fingerprint', label: 'Enroll Fingerprint', status: 'pending' }
  ])

  const updateStepStatus = (stepId: string, status: EmployeeCreationStep['status'], message?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, message } : step
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setEnrollmentStep('enrollment')

    try {
      // Step 1: Create employee in database and device
      updateStepStatus('database', 'in-progress')
      updateStepStatus('device', 'in-progress')
      
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          monthlySalary: parseFloat(formData.monthlySalary) || 0,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setCreatedEmployee(result)
        updateStepStatus('database', 'completed', 'Employee saved successfully')
        
        if (result.deviceSyncSuccess) {
          updateStepStatus('device', 'completed', `Device User ID: ${result.deviceUserId}`)
          
          // Step 2: Initiate fingerprint enrollment
          updateStepStatus('fingerprint', 'in-progress', 'Please place finger on ZKTeco device scanner')
          
          const enrollResponse = await fetch('/api/employees/enroll-fingerprint', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              employeeId: formData.employeeId
            }),
          })

          const enrollResult = await enrollResponse.json()
          
          if (enrollResponse.ok && enrollResult.success) {
            updateStepStatus('fingerprint', 'completed', 'Fingerprint enrollment initiated successfully')
            setEnrollmentStep('completed')
            
            // Show success message for a few seconds then close
            setTimeout(() => {
              onSuccess()
              handleClose()
            }, 3000)
          } else {
            updateStepStatus('fingerprint', 'error', enrollResult.message || 'Fingerprint enrollment failed')
          }
        } else {
          updateStepStatus('device', 'error', 'Failed to create user in ZKTeco device')
          updateStepStatus('fingerprint', 'error', 'Cannot enroll fingerprint without device user')
        }
      } else {
        updateStepStatus('database', 'error', result.error)
        updateStepStatus('device', 'error', 'Skipped due to database error')
        updateStepStatus('fingerprint', 'error', 'Skipped due to previous errors')
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error adding employee:', error)
      updateStepStatus('database', 'error', 'Network or server error')
      updateStepStatus('device', 'error', 'Skipped due to database error')
      updateStepStatus('fingerprint', 'error', 'Skipped due to previous errors')
      alert('Failed to add employee')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      employeeId: '',
      name: '',
      phone: '',
      monthlySalary: ''
    })
    setEnrollmentStep('form')
    setCreatedEmployee(null)
    setSteps([
      { id: 'database', label: 'Save to Database', status: 'pending' },
      { id: 'device', label: 'Create User in ZKTeco Device', status: 'pending' },
      { id: 'fingerprint', label: 'Enroll Fingerprint', status: 'pending' }
    ])
    onClose()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (!isOpen) return null

  const getStepIcon = (status: EmployeeCreationStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'in-progress':
        return (
          <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        )
      default:
        return <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {enrollmentStep === 'form' ? 'Add New Employee' : 'Employee Registration Process'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {enrollmentStep === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Employee ID *
              </label>
              <input
                type="text"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                placeholder="e.g., EMP001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone (Optional)
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                placeholder="+1 234 567 8900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Monthly Salary ($) *
              </label>
              <input
                type="number"
                name="monthlySalary"
                value={formData.monthlySalary}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                placeholder="3000.00"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex items-start">
                <Fingerprint className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
                <div>
                  <p className="text-sm font-medium text-blue-700">
                    Automated ZKTeco Integration
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    After creating the employee, the system will automatically:
                  </p>
                  <ul className="text-sm text-blue-600 mt-1 list-disc list-inside">
                    <li>Create user in ZKTeco device</li>
                    <li>Initiate fingerprint enrollment</li>
                    <li>Guide you through the enrollment process</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Create Employee & Enroll'}
              </button>
            </div>
          </form>
        )}

        {(enrollmentStep === 'enrollment' || enrollmentStep === 'completed') && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium text-gray-900 mb-3">Registration Progress</h4>
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center space-x-3">
                    <span className="flex-shrink-0">{getStepIcon(step.status)}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {index + 1}. {step.label}
                      </p>
                      {step.message && (
                        <p className={`text-sm ${
                          step.status === 'error' ? 'text-red-600' : 
                          step.status === 'completed' ? 'text-green-600' : 
                          'text-blue-600'
                        }`}>
                          {step.message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {steps.some(step => step.status === 'in-progress' && step.id === 'fingerprint') && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
                <div className="flex items-center">
                  <Fingerprint className="h-5 w-5 text-yellow-600 mr-2" />
                  <div>
                    <p className="font-medium text-yellow-800">
                      Fingerprint Enrollment in Progress
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Please place your finger on the ZKTeco device scanner. Follow the device prompts to complete enrollment.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {enrollmentStep === 'completed' && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-md">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <p className="font-medium text-green-800">
                      Employee Registration Completed!
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      {formData.name} has been successfully registered in both the system and ZKTeco device.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
