'use client';

import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  CalendarIcon,
  UserIcon,
  FilterIcon,
  DownloadIcon,
  RefreshCwIcon,
  SearchIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  BarChart3Icon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  PlayIcon,
  PauseIcon
} from 'lucide-react';

interface AttendanceRecord {
  _id: string;
  employeeId: string;
  employeeName: string;
  checkIn?: Date;
  checkOut?: Date;
  date: string;
  hoursWorked: number;
  overtime: number;
  status: 'present' | 'absent' | 'late' | 'partial';
  department: string;
}

interface AttendanceStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  averageHours: number;
  totalOvertimeHours: number;
}

export default function TestAttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    averageHours: 0,
    totalOvertimeHours: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent' | 'late' | 'partial'>('all');
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const loadData = async () => {
      await fetchAttendanceData();
      await fetchAttendanceStats();
    };
    loadData();
  }, [dateFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLiveMode) {
      interval = setInterval(async () => {
        await fetchAttendanceData();
        await fetchAttendanceStats();
        setLastSync(new Date());
      }, 30000); // Refresh every 30 seconds in live mode
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLiveMode, dateFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/attendance?date=${dateFilter}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setAttendanceRecords(data.data);
      } else {
        // Generate mock data for testing
        generateMockData();
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      generateMockData();
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      const response = await fetch(`/api/attendance/stats?date=${dateFilter}`);
      const data = await response.json();
      
      if (data.success && data.stats) {
        setStats(data.stats);
      } else {
        // Generate mock stats
        generateMockStats();
      }
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      generateMockStats();
    }
  };

  const generateMockData = () => {
    const mockData: AttendanceRecord[] = [
      {
        _id: '1',
        employeeId: 'EMP001',
        employeeName: 'John Smith',
        checkIn: new Date('2024-01-15T09:00:00'),
        checkOut: new Date('2024-01-15T17:30:00'),
        date: dateFilter,
        hoursWorked: 8.5,
        overtime: 0.5,
        status: 'present',
        department: 'Engineering'
      },
      {
        _id: '2',
        employeeId: 'EMP002',
        employeeName: 'Sarah Johnson',
        checkIn: new Date('2024-01-15T09:15:00'),
        date: dateFilter,
        hoursWorked: 7.75,
        overtime: 0,
        status: 'late',
        department: 'Marketing'
      },
      {
        _id: '3',
        employeeId: 'EMP003',
        employeeName: 'Mike Davis',
        date: dateFilter,
        hoursWorked: 0,
        overtime: 0,
        status: 'absent',
        department: 'Sales'
      },
      {
        _id: '4',
        employeeId: 'EMP004',
        employeeName: 'Emily Wilson',
        checkIn: new Date('2024-01-15T08:45:00'),
        checkOut: new Date('2024-01-15T17:00:00'),
        date: dateFilter,
        hoursWorked: 8.25,
        overtime: 0.25,
        status: 'present',
        department: 'HR'
      },
      {
        _id: '5',
        employeeId: 'EMP005',
        employeeName: 'Robert Brown',
        checkIn: new Date('2024-01-15T09:30:00'),
        date: dateFilter,
        hoursWorked: 4.5,
        overtime: 0,
        status: 'partial',
        department: 'Finance'
      }
    ];
    setAttendanceRecords(mockData);
  };

  const generateMockStats = () => {
    setStats({
      totalEmployees: 25,
      presentToday: 18,
      absentToday: 3,
      lateToday: 4,
      averageHours: 7.8,
      totalOvertimeHours: 12.5
    });
  };

  const syncAttendance = async () => {
    try {
      const response = await fetch('/api/attendance/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: dateFilter }),
      });
      
      const result = await response.json();
      if (result.success) {
        await fetchAttendanceData();
        await fetchAttendanceStats();
        setLastSync(new Date());
      }
    } catch (error) {
      console.error('Error syncing attendance:', error);
    }
  };

  const exportAttendance = async () => {
    try {
      const response = await fetch(`/api/attendance/export?date=${dateFilter}&format=csv`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-${dateFilter}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting attendance:', error);
    }
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'absent':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      case 'late':
        return <AlertTriangleIcon className="h-4 w-4 text-yellow-500" />;
      case 'partial':
        return <ClockIcon className="h-4 w-4 text-orange-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'partial':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance Tracking</h1>
            <p className="text-gray-600">Monitor and manage employee attendance data</p>
          </div>
          <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Live Mode Toggle */}
            <button
              onClick={() => setIsLiveMode(!isLiveMode)}
              className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${
                isLiveMode 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {isLiveMode ? (
                <PauseIcon className="h-5 w-5 mr-2" />
              ) : (
                <PlayIcon className="h-5 w-5 mr-2" />
              )}
              {isLiveMode ? 'Live Mode On' : 'Live Mode Off'}
            </button>

            <button
              onClick={exportAttendance}
              className="inline-flex items-center px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors duration-200"
            >
              <DownloadIcon className="h-5 w-5 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserIcon className="h-6 w-6 text-blue-600" />
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
              <p className="text-sm font-medium text-gray-600">Present Today</p>
              <div className="flex items-center">
                <p className="text-2xl font-semibold text-gray-900">{stats.presentToday}</p>
                <TrendingUpIcon className="h-4 w-4 text-green-500 ml-2" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangleIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Late/Absent</p>
              <div className="flex items-center">
                <p className="text-2xl font-semibold text-gray-900">{stats.absentToday + stats.lateToday}</p>
                <TrendingDownIcon className="h-4 w-4 text-red-500 ml-2" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3Icon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Avg Hours</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.averageHours}h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Date Filter */}
          <div className="flex items-center">
            <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
            <input
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>

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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'present' | 'absent' | 'late' | 'partial')}
            >
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="partial">Partial</option>
            </select>
          </div>

          {/* Sync Button */}
          <button
            onClick={syncAttendance}
            className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <RefreshCwIcon className="h-5 w-5 mr-2" />
            Sync Device
          </button>
        </div>

        {lastSync && (
          <div className="mt-4 text-sm text-gray-500">
            Last synced: {lastSync.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records found</h3>
            <p className="text-gray-600">
              {attendanceRecords.length === 0 ? 'No attendance data available for this date' : 'No records match your search criteria'}
            </p>
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
                    Check In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours Worked
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{record.employeeName}</div>
                          <div className="text-sm text-gray-500">{record.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.hoursWorked}h
                      {record.overtime > 0 && (
                        <span className="text-orange-600 ml-1">(+{record.overtime}h OT)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(record.status)}
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.department}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}