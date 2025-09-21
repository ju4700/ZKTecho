'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  UsersIcon, 
  ClockIcon, 
  CreditCardIcon, 
  TrendingUpIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  MonitorIcon,
  RefreshCwIcon,
  ChevronRightIcon,
  BarChart3Icon,
  CalendarIcon,
  DollarSignIcon
} from 'lucide-react';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  todayAttendance: number;
  pendingSalaries: number;
  deviceStatus: 'connected' | 'disconnected' | 'unknown';
}

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    title: 'Add Employee',
    description: 'Register new employee',
    href: '/employees',
    icon: UsersIcon,
    color: 'bg-blue-500'
  },
  {
    title: 'View Attendance',
    description: 'Check attendance records',
    href: '/test-attendance',
    icon: ClockIcon,
    color: 'bg-green-500'
  },
  {
    title: 'Manage Device',
    description: 'Configure ZKTeco device',
    href: '/device-management',
    icon: MonitorIcon,
    color: 'bg-purple-500'
  },
  {
    title: 'Generate Reports',
    description: 'Create salary reports',
    href: '/dashboard',
    icon: BarChart3Icon,
    color: 'bg-orange-500'
  }
];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    todayAttendance: 0,
    pendingSalaries: 0,
    deviceStatus: 'unknown'
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch employees
      const employeesResponse = await fetch('/api/employees');
      const employeesData = await employeesResponse.json();
      
      // Fetch device status
      const deviceResponse = await fetch('/api/device/status');
      const deviceData = await deviceResponse.json();
      
      // Fetch attendance
      const attendanceResponse = await fetch('/api/attendance');
      const attendanceData = await attendanceResponse.json();

      interface Employee {
        status: string;
      }

      setStats({
        totalEmployees: employeesData.data?.employees?.length || 0,
        activeEmployees: employeesData.data?.employees?.filter((emp: Employee) => emp.status === 'active')?.length || 0,
        todayAttendance: attendanceData.data?.length || 0,
        pendingSalaries: 0, // Will be calculated from salary API
        deviceStatus: deviceData.connected ? 'connected' : 'disconnected'
      });
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceStatusIcon = () => {
    switch (stats.deviceStatus) {
      case 'connected':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'disconnected':
        return <AlertCircleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <RefreshCwIcon className="h-5 w-5 text-yellow-600 animate-spin" />;
    }
  };

  const getDeviceStatusText = () => {
    switch (stats.deviceStatus) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Checking...';
    }
  };

  const getDeviceStatusColor = () => {
    switch (stats.deviceStatus) {
      case 'connected':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'disconnected':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to your ZKTeco Employee Management System</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Employees */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalEmployees}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600">{stats.activeEmployees} active</span>
          </div>
        </div>

        {/* Today's Attendance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today&apos;s Attendance</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.todayAttendance}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <CalendarIcon className="h-4 w-4 text-blue-500 mr-1" />
            <span className="text-gray-600">Records logged</span>
          </div>
        </div>

        {/* Pending Salaries */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Salaries</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingSalaries}</p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <DollarSignIcon className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <CreditCardIcon className="h-4 w-4 text-orange-500 mr-1" />
            <span className="text-gray-600">To be processed</span>
          </div>
        </div>

        {/* Device Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Device Status</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{getDeviceStatusText()}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <MonitorIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getDeviceStatusColor()}`}>
              {getDeviceStatusIcon()}
              <span className="ml-1">ZKTeco K40</span>
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions Grid */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:border-gray-300"
              >
                <div className="flex items-center space-x-4">
                  <div className={`h-12 w-12 ${action.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">System Status</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">Connected</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Services</span>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">Operational</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">ZKTeco Device</span>
                <div className="flex items-center space-x-2">
                  {getDeviceStatusIcon()}
                  <span className={`text-sm ${stats.deviceStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                    {getDeviceStatusText()}
                  </span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={loadDashboardData}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                >
                  <RefreshCwIcon className="h-4 w-4" />
                  <span>Refresh Status</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}