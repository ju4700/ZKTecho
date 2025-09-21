'use client';

import React, { useState, useEffect } from 'react';
import {
  UserIcon,
  UsersIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  SearchIcon,
  FilterIcon,
  RefreshCwIcon,
  DownloadIcon,
  UploadIcon,
  FingerprintIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  PhoneIcon,
  MailIcon,
  DollarSignIcon,
  BuildingIcon,
  SettingsIcon,
  EyeIcon,
  DatabaseIcon
} from 'lucide-react';

interface TestEmployee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  hireDate: string;
  salary: number;
  status: 'active' | 'inactive' | 'on-leave';
  fingerprintEnrolled: boolean;
  deviceUserId?: string;
  lastActivity?: Date;
  permissions: string[];
}

interface EmployeeStats {
  totalEmployees: number;
  activeEmployees: number;
  enrolledEmployees: number;
  pendingEmployees: number;
  departments: { name: string; count: number }[];
}

export default function TestEmployeeManagementPage() {
  const [employees, setEmployees] = useState<TestEmployee[]>([]);
  const [stats, setStats] = useState<EmployeeStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    enrolledEmployees: 0,
    pendingEmployees: 0,
    departments: []
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  useEffect(() => {
    generateMockData();
  }, []);

  const generateMockData = () => {
    const mockEmployees: TestEmployee[] = [
      {
        _id: '1',
        employeeId: 'EMP001',
        name: 'John Smith',
        email: 'john.smith@company.com',
        phone: '+1234567890',
        department: 'Engineering',
        position: 'Senior Developer',
        hireDate: '2022-01-15',
        salary: 75000,
        status: 'active',
        fingerprintEnrolled: true,
        deviceUserId: '001',
        lastActivity: new Date(),
        permissions: ['access_all', 'admin_panel']
      },
      {
        _id: '2',
        employeeId: 'EMP002',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@company.com',
        phone: '+1234567891',
        department: 'Marketing',
        position: 'Marketing Manager',
        hireDate: '2021-11-20',
        salary: 65000,
        status: 'active',
        fingerprintEnrolled: true,
        deviceUserId: '002',
        lastActivity: new Date(Date.now() - 86400000),
        permissions: ['access_marketing', 'reports']
      },
      {
        _id: '3',
        employeeId: 'EMP003',
        name: 'Mike Davis',
        email: 'mike.davis@company.com',
        phone: '+1234567892',
        department: 'Sales',
        position: 'Sales Representative',
        hireDate: '2023-03-10',
        salary: 50000,
        status: 'on-leave',
        fingerprintEnrolled: false,
        permissions: ['access_sales']
      },
      {
        _id: '4',
        employeeId: 'EMP004',
        name: 'Emily Wilson',
        email: 'emily.wilson@company.com',
        phone: '+1234567893',
        department: 'HR',
        position: 'HR Specialist',
        hireDate: '2022-08-05',
        salary: 55000,
        status: 'active',
        fingerprintEnrolled: true,
        deviceUserId: '003',
        lastActivity: new Date(Date.now() - 3600000),
        permissions: ['access_hr', 'employee_management']
      },
      {
        _id: '5',
        employeeId: 'EMP005',
        name: 'Robert Brown',
        email: 'robert.brown@company.com',
        phone: '+1234567894',
        department: 'Finance',
        position: 'Accountant',
        hireDate: '2021-06-12',
        salary: 60000,
        status: 'inactive',
        fingerprintEnrolled: false,
        permissions: ['access_finance']
      }
    ];

    const mockStats: EmployeeStats = {
      totalEmployees: mockEmployees.length,
      activeEmployees: mockEmployees.filter(e => e.status === 'active').length,
      enrolledEmployees: mockEmployees.filter(e => e.fingerprintEnrolled).length,
      pendingEmployees: mockEmployees.filter(e => !e.fingerprintEnrolled).length,
      departments: [
        { name: 'Engineering', count: 1 },
        { name: 'Marketing', count: 1 },
        { name: 'Sales', count: 1 },
        { name: 'HR', count: 1 },
        { name: 'Finance', count: 1 }
      ]
    };

    setEmployees(mockEmployees);
    setStats(mockStats);
    setLoading(false);
  };

  const handleSelectEmployee = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map(e => e._id));
    }
  };

  const handleBulkAction = (action: string) => {
    console.log(`Performing ${action} on employees:`, selectedEmployees);
    // Implement bulk actions here
    setSelectedEmployees([]);
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter;
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'on-leave':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      case 'on-leave':
        return <AlertTriangleIcon className="h-4 w-4 text-yellow-500" />;
      default:
        return <UserIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Employee Management</h1>
            <p className="text-gray-600">Comprehensive employee management testing interface</p>
          </div>
          <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                <DatabaseIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  viewMode === 'cards' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                <UsersIcon className="h-4 w-4" />
              </button>
            </div>

            <button className="inline-flex items-center px-4 py-2 text-green-600 border border-green-300 rounded-lg hover:bg-green-50 transition-colors duration-200">
              <UploadIcon className="h-5 w-5 mr-2" />
              Import
            </button>

            <button className="inline-flex items-center px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors duration-200">
              <DownloadIcon className="h-5 w-5 mr-2" />
              Export
            </button>

            <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Employee
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalEmployees}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeEmployees}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FingerprintIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Enrolled</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.enrolledEmployees}</p>
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
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingEmployees}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
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

          {/* Department Filter */}
          <div className="relative">
            <BuildingIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
              {stats.departments.map(dept => (
                <option key={dept.name} value={dept.name}>{dept.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <FilterIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on-leave">On Leave</option>
            </select>
          </div>

          <button className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <RefreshCwIcon className="h-5 w-5 mr-2" />
            Refresh
          </button>
        </div>

        {/* Bulk Actions */}
        {selectedEmployees.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-800">
                {selectedEmployees.length} employee(s) selected
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('enroll')}
                  className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
                >
                  Bulk Enroll
                </button>
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200"
                >
                  Deactivate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Employee List */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
              <p className="text-gray-600">No employees match your search criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fingerprint
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee._id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedEmployees.includes(employee._id)}
                          onChange={() => handleSelectEmployee(employee._id)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                            <div className="text-sm text-gray-500">{employee.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center mb-1">
                          <MailIcon className="h-3 w-3 mr-1 text-gray-400" />
                          {employee.email}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <PhoneIcon className="h-3 w-3 mr-1 text-gray-400" />
                          {employee.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center mb-1">
                          <BuildingIcon className="h-4 w-4 mr-2 text-gray-400" />
                          {employee.department}
                        </div>
                        <div className="text-sm text-gray-500">{employee.position}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(employee.status)}
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                            {employee.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {employee.fingerprintEnrolled ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            <span className="text-xs">ID: {employee.deviceUserId}</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-400">
                            <XCircleIcon className="h-4 w-4 mr-1" />
                            <span className="text-xs">Not Enrolled</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors duration-200">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900 p-1 rounded-md hover:bg-green-50 transition-colors duration-200">
                            <EditIcon className="h-4 w-4" />
                          </button>
                          <button className="text-purple-600 hover:text-purple-900 p-1 rounded-md hover:bg-purple-50 transition-colors duration-200">
                            <FingerprintIcon className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors duration-200">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <div key={employee._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex items-center">
                  {getStatusIcon(employee.status)}
                  <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                    {employee.status}
                  </span>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">{employee.name}</h3>
                <p className="text-sm text-gray-500">{employee.employeeId}</p>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <BuildingIcon className="h-4 w-4 mr-2 text-gray-400" />
                  {employee.department} - {employee.position}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MailIcon className="h-4 w-4 mr-2 text-gray-400" />
                  {employee.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSignIcon className="h-4 w-4 mr-2 text-gray-400" />
                  ${employee.salary.toLocaleString()}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {employee.fingerprintEnrolled ? (
                    <div className="flex items-center text-green-600">
                      <FingerprintIcon className="h-4 w-4 mr-1" />
                      <span className="text-xs">Enrolled</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-400">
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      <span className="text-xs">Not Enrolled</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-1">
                  <button className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50 transition-colors duration-200">
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button className="text-green-600 hover:text-green-900 p-2 rounded-md hover:bg-green-50 transition-colors duration-200">
                    <EditIcon className="h-4 w-4" />
                  </button>
                  <button className="text-purple-600 hover:text-purple-900 p-2 rounded-md hover:bg-purple-50 transition-colors duration-200">
                    <SettingsIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}