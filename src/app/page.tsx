"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  UsersIcon,
  ClockIcon,
  MonitorIcon,
  RefreshCwIcon,
  ChevronRightIcon,
  BarChart3Icon,
  CalendarIcon,
  DollarSignIcon,
  ActivityIcon,
} from "lucide-react";

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  todayAttendance: number;
  pendingSalaries: number;
  deviceStatus: "connected" | "disconnected" | "unknown";
}

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

const quickActions: QuickAction[] = [
  {
    title: "Add Employee",
    description: "Register new employee",
    href: "/employees",
    icon: UsersIcon,
  },
  {
    title: "View Attendance",
    description: "Check attendance records",
    href: "/test-attendance",
    icon: ClockIcon,
  },
  {
    title: "Manage Device",
    description: "Configure ZKTeco device",
    href: "/device",
    icon: MonitorIcon,
  },
  {
    title: "Generate Reports",
    description: "Create salary reports",
    href: "/dashboard",
    icon: BarChart3Icon,
  },
];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    todayAttendance: 0,
    pendingSalaries: 0,
    deviceStatus: "unknown",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch employees
      const employeesResponse = await fetch("/api/employees");
      const employeesData = await employeesResponse.json();

      // Fetch device status
      const deviceResponse = await fetch("/api/device/quick-status");
      const deviceData = await deviceResponse.json();

      // Fetch attendance
      const attendanceResponse = await fetch("/api/attendance");
      const attendanceData = await attendanceResponse.json();

      interface Employee {
        status: string;
      }

      setStats({
        totalEmployees: employeesData.data?.employees?.length || 0,
        activeEmployees:
          employeesData.data?.employees?.filter(
            (emp: Employee) => emp.status === "active"
          )?.length || 0,
        todayAttendance: attendanceData.data?.length || 0,
        pendingSalaries: 0, // Will be calculated from salary API
        deviceStatus: deviceData.isConnected ? "connected" : "disconnected",
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceStatusText = () => {
    switch (stats.deviceStatus) {
      case "connected":
        return "Online";
      case "disconnected":
        return "Offline";
      default:
        return "Checking...";
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-8 bg-secondary rounded w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-secondary rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Overview of your organization
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <RefreshCwIcon className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Employees */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Employees
              </p>
              <p className="text-2xl font-bold text-foreground mt-2">
                {stats.totalEmployees}
              </p>
            </div>
            <UsersIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-4 flex items-center text-xs text-muted-foreground">
            <span className="text-foreground font-medium">
              {stats.activeEmployees}
            </span>
            <span className="ml-1">active now</span>
          </div>
        </div>

        {/* Today's Attendance */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Today&apos;s Attendance
              </p>
              <p className="text-2xl font-bold text-foreground mt-2">
                {stats.todayAttendance}
              </p>
            </div>
            <ClockIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-4 flex items-center text-xs text-muted-foreground">
            <CalendarIcon className="h-3 w-3 mr-1" />
            <span>Logged today</span>
          </div>
        </div>

        {/* Pending Salaries */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Pending Salaries
              </p>
              <p className="text-2xl font-bold text-foreground mt-2">
                {stats.pendingSalaries}
              </p>
            </div>
            <DollarSignIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-4 flex items-center text-xs text-muted-foreground">
            <span>Processing required</span>
          </div>
        </div>

        {/* Device Status */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Device Status
              </p>
              <div className="flex items-center mt-2 space-x-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    stats.deviceStatus === "connected"
                      ? "bg-foreground"
                      : "bg-muted-foreground/30"
                  }`}
                />
                <p className="text-2xl font-bold text-foreground">
                  {getDeviceStatusText()}
                </p>
              </div>
            </div>
            <MonitorIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-4 flex items-center text-xs text-muted-foreground">
            <span>ZKTeco K40</span>
          </div>
        </div>
      </div>

      {/* Quick Actions & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions Grid */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold text-foreground">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="group bg-card rounded-lg border border-border p-6 hover:border-foreground/50 transition-all duration-200"
              >
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-secondary rounded-md group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-foreground group-hover:underline decoration-1 underline-offset-4">
                      {action.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {action.description}
                    </p>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">
            System Health
          </h2>
          <div className="bg-card rounded-lg border border-border p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ActivityIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  Database
                </span>
              </div>
              <span className="text-xs bg-secondary px-2 py-1 rounded-full text-foreground">
                Operational
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ActivityIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  API Services
                </span>
              </div>
              <span className="text-xs bg-secondary px-2 py-1 rounded-full text-foreground">
                Operational
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MonitorIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  ZKTeco Device
                </span>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  stats.deviceStatus === "connected"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {getDeviceStatusText()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
