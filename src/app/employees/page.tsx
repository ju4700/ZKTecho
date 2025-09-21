'use client';

import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  SearchIcon, 
  FilterIcon,
  EditIcon,
  FingerprintIcon,
  UserIcon,
  PhoneIcon,
  DollarSignIcon,
  BadgeIcon,
  WifiIcon,
  WifiOffIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  XIcon,
  SettingsIcon,
  EyeIcon
} from 'lucide-react';
import AddEmployeeForm from '@/components/AddEmployeeForm';
import FingerprintAssignment from '@/components/FingerprintAssignment';
import FingerprintEnrollment from '@/components/FingerprintEnrollment';

interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  phone: string | null;
  monthlySalary: number;
  isActive: boolean;
  deviceUserId: string | null;
  fingerprintEnrolled: boolean;
  fingerprintDate: Date | null;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface DeviceUser {
  userId: string;
  name: string;
  role: number;
  cardno?: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [deviceUsers, setDeviceUsers] = useState<DeviceUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'enrolled' | 'not-enrolled'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFingerprintAssignment, setShowFingerprintAssignment] = useState(false);
  const [showFingerprintEnrollment, setShowFingerprintEnrollment] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [showDeviceUsers, setShowDeviceUsers] = useState(false);

  // Ensure employees is always an array
  const safeEmployees = Array.isArray(employees) ? employees : [];

  useEffect(() => {
    fetchEmployees();
    checkDeviceConnection();
    fetchDeviceUsers();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employees');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('API Response:', result); // Debug log
      
      // Handle different response formats
      if (result && result.data && Array.isArray(result.data)) {
        setEmployees(result.data);
      } else if (Array.isArray(result)) {
        setEmployees(result);
      } else {
        console.warn('Invalid employees data format:', result);
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]); // Ensure employees is always an array
    } finally {
      setLoading(false);
    }
  };

  const fetchDeviceUsers = async () => {
    try {
      const response = await fetch('/api/device/users');
      if (response.ok) {
        const data = await response.json();
        setDeviceUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching device users:', error);
    }
  };

  const checkDeviceConnection = async () => {
    try {
      const response = await fetch('/api/device/quick-status');
      const status = await response.json();
      setDeviceConnected(status.isConnected);
    } catch (error) {
      console.error('Error checking device status:', error);
      setDeviceConnected(false);
    }
  };

  // Sync user to device function (can be used for future sync features)
  // const syncUserToDevice = async (employeeId: string, action: 'add' | 'delete' | 'sync') => {
  //   if (!deviceConnected && action !== 'delete') {
  //     alert('Device is not connected. Please check your ZKTeco device connection.');
  //     return;
  //   }

  //   setSyncing(employeeId);
  //   try {
  //     const response = await fetch('/api/device/users', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         employeeId,
  //         action,
  //         role: 0
  //       }),
  //     });

  //     const result = await response.json();
      
  //     if (result.success) {
  //       alert(result.message);
  //       fetchEmployees();
  //       fetchDeviceUsers();
  //     } else {
  //       alert(`Failed: ${result.error}`);
  //     }
  //   } catch {
  //     alert('Network error occurred');
  //   } finally {
  //     setSyncing(null);
  //   }
  // };

  const openFingerprintAssignment = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowFingerprintAssignment(true);
  };

  const openFingerprintEnrollment = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowFingerprintEnrollment(true);
  };

  const handleFingerprintAssignmentSuccess = () => {
    fetchEmployees();
    setShowFingerprintAssignment(false);
    setSelectedEmployee(null);
  };

  const handleFingerprintEnrollmentComplete = () => {
    fetchEmployees();
    setShowFingerprintEnrollment(false);
    setSelectedEmployee(null);
  };

  const filteredEmployees = safeEmployees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (employee.phone && employee.phone.includes(searchTerm));
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'enrolled' && employee.fingerprintEnrolled) ||
                         (filterStatus === 'not-enrolled' && !employee.fingerprintEnrolled);
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Management</h1>
            <p className="text-gray-600">Manage employees and sync with your ZKTeco device</p>
          </div>
          <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Device Status */}
            <div className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
              deviceConnected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {deviceConnected ? (
                <WifiIcon className="h-4 w-4 mr-2" />
              ) : (
                <WifiOffIcon className="h-4 w-4 mr-2" />
              )}
              {deviceConnected ? 'Device Connected' : 'Device Offline'}
            </div>
            
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Employee
            </button>
          </div>
        </div>
      </div>

      {/* Device Connection Alert */}
      {!deviceConnected && (
        <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex">
            <AlertTriangleIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                ZKTeco Device Not Connected
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                You can still manage employees, but fingerprint enrollment and device sync will be unavailable.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-semibold text-gray-900">{safeEmployees.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FingerprintIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Enrolled</p>
              <p className="text-2xl font-semibold text-gray-900">
                {safeEmployees.filter(e => e.fingerprintEnrolled).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangleIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">
                {safeEmployees.filter(e => !e.fingerprintEnrolled).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <SettingsIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Device Users</p>
              <p className="text-2xl font-semibold text-gray-900">{deviceUsers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Status Filter */}
          <div className="relative">
            <FilterIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'enrolled' | 'not-enrolled')}
            >
              <option value="all">All Employees</option>
              <option value="enrolled">Enrolled</option>
              <option value="not-enrolled">Not Enrolled</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchEmployees}
            className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <RefreshCwIcon className="h-5 w-5 mr-2" />
            Refresh
          </button>

          {/* Show Device Users */}
          {deviceConnected && (
            <button
              onClick={() => setShowDeviceUsers(!showDeviceUsers)}
              className="flex items-center px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors duration-200"
            >
              <EyeIcon className="h-5 w-5 mr-2" />
              Device Users
            </button>
          )}
        </div>
      </div>

      {/* Employee List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredEmployees.length === 0 ? (
          <div className="text-center py-12">
            <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first employee</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Employee
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fingerprint Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.map((employee) => (
                  <tr key={employee._id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                          <div className="text-sm text-gray-500">ID: {employee.employeeId}</div>
                          {employee.fingerprintEnrolled && (
                            <div className="text-xs text-green-600 flex items-center mt-1">
                              <CheckCircleIcon className="h-3 w-3 mr-1" />
                              Fingerprint Enrolled
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {employee.phone || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <DollarSignIcon className="h-4 w-4 mr-1 text-green-500" />
                        ${employee.monthlySalary}/month
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {employee.fingerprintEnrolled && employee.deviceUserId ? (
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            ID: {employee.deviceUserId}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <AlertTriangleIcon className="h-3 w-3 mr-1" />
                            Not Assigned
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {!employee.fingerprintEnrolled ? (
                          <>
                            <button
                              onClick={() => openFingerprintAssignment(employee)}
                              className="text-green-600 hover:text-green-900 p-1 rounded-md hover:bg-green-50 transition-colors duration-200"
                              title="Assign Device ID"
                            >
                              <BadgeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openFingerprintEnrollment(employee)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors duration-200"
                              title="Enroll Fingerprint"
                            >
                              <FingerprintIcon className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => openFingerprintAssignment(employee)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors duration-200"
                              title="Change Device ID"
                            >
                              <EditIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openFingerprintEnrollment(employee)}
                              className="text-green-600 hover:text-green-900 p-1 rounded-md hover:bg-green-50 transition-colors duration-200"
                              title="Re-enroll Fingerprint"
                            >
                              <FingerprintIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {syncing === employee.employeeId && (
                          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Device Users Panel */}
      {showDeviceUsers && deviceConnected && deviceUsers.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              Device Users ({deviceUsers.length})
            </h2>
            <button
              onClick={() => setShowDeviceUsers(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {deviceUsers.map((user) => (
                <div key={user.userId} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center">
                    <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">ID: {user.userId}</div>
                      {user.cardno && (
                        <div className="text-xs text-gray-500">Card: {user.cardno}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddEmployeeForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSuccess={() => {
          fetchEmployees();
          setShowAddForm(false);
        }}
      />

      {selectedEmployee && (
        <FingerprintAssignment
          employee={selectedEmployee}
          isOpen={showFingerprintAssignment}
          onClose={() => {
            setShowFingerprintAssignment(false);
            setSelectedEmployee(null);
          }}
          onSuccess={handleFingerprintAssignmentSuccess}
        />
      )}

      {selectedEmployee && showFingerprintEnrollment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  Fingerprint Enrollment
                </h3>
                <button
                  onClick={() => {
                    setShowFingerprintEnrollment(false);
                    setSelectedEmployee(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors duration-200"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <FingerprintEnrollment
                employeeId={selectedEmployee.employeeId}
                employeeName={selectedEmployee.name}
                onEnrollmentComplete={handleFingerprintEnrollmentComplete}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}