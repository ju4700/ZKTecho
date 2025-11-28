"use client";

import React, { useState, useEffect } from "react";
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
  EyeIcon,
} from "lucide-react";
import AddEmployeeForm from "@/components/AddEmployeeForm";
import FingerprintAssignment from "@/components/FingerprintAssignment";
import FingerprintEnrollment from "@/components/FingerprintEnrollment";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "enrolled" | "not-enrolled"
  >("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFingerprintAssignment, setShowFingerprintAssignment] =
    useState(false);
  const [showFingerprintEnrollment, setShowFingerprintEnrollment] =
    useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
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
      const response = await fetch("/api/employees");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Handle different response formats
      if (result && result.data && Array.isArray(result.data)) {
        setEmployees(result.data);
      } else if (Array.isArray(result)) {
        setEmployees(result);
      } else {
        console.warn("Invalid employees data format:", result);
        setEmployees([]);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      setEmployees([]); // Ensure employees is always an array
    } finally {
      setLoading(false);
    }
  };

  const fetchDeviceUsers = async () => {
    try {
      const response = await fetch("/api/device/users");
      if (response.ok) {
        const data = await response.json();
        setDeviceUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching device users:", error);
    }
  };

  const checkDeviceConnection = async () => {
    try {
      const response = await fetch("/api/device/quick-status");
      const status = await response.json();
      setDeviceConnected(status.isConnected);
    } catch (error) {
      console.error("Error checking device status:", error);
      setDeviceConnected(false);
    }
  };

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

  const filteredEmployees = safeEmployees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.phone && employee.phone.includes(searchTerm));

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "enrolled" && employee.fingerprintEnrolled) ||
      (filterStatus === "not-enrolled" && !employee.fingerprintEnrolled);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-secondary rounded w-64"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-secondary rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Employee Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage employees and sync with your ZKTeco device
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Device Status */}
          <div
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium border ${
              deviceConnected
                ? "bg-secondary text-foreground border-border"
                : "bg-destructive/10 text-destructive border-destructive/20"
            }`}
          >
            {deviceConnected ? (
              <WifiIcon className="h-4 w-4 mr-2" />
            ) : (
              <WifiOffIcon className="h-4 w-4 mr-2" />
            )}
            {deviceConnected ? "Device Connected" : "Device Offline"}
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors text-sm font-medium"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Device Connection Alert */}
      {!deviceConnected && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex">
            <AlertTriangleIcon className="h-5 w-5 text-destructive flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-destructive">
                ZKTeco Device Not Connected
              </h3>
              <p className="mt-1 text-sm text-destructive/80">
                You can still manage employees, but fingerprint enrollment and
                device sync will be unavailable.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Employees
              </p>
              <p className="text-2xl font-bold text-foreground mt-2">
                {safeEmployees.length}
              </p>
            </div>
            <UserIcon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Enrolled
              </p>
              <p className="text-2xl font-bold text-foreground mt-2">
                {safeEmployees.filter((e) => e.fingerprintEnrolled).length}
              </p>
            </div>
            <FingerprintIcon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Pending
              </p>
              <p className="text-2xl font-bold text-foreground mt-2">
                {safeEmployees.filter((e) => !e.fingerprintEnrolled).length}
              </p>
            </div>
            <AlertTriangleIcon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Device Users
              </p>
              <p className="text-2xl font-bold text-foreground mt-2">
                {deviceUsers.length}
              </p>
            </div>
            <SettingsIcon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search employees..."
              className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-md focus:ring-1 focus:ring-primary focus:border-primary text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <FilterIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <select
              className="pl-9 pr-8 py-2 bg-background border border-input rounded-md focus:ring-1 focus:ring-primary focus:border-primary appearance-none text-sm"
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(
                  e.target.value as "all" | "enrolled" | "not-enrolled"
                )
              }
            >
              <option value="all">All Employees</option>
              <option value="enrolled">Enrolled</option>
              <option value="not-enrolled">Not Enrolled</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchEmployees}
            className="inline-flex items-center px-4 py-2 border border-input bg-background hover:bg-secondary text-foreground rounded-md transition-colors text-sm font-medium"
          >
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>

          {/* Show Device Users */}
          {deviceConnected && (
            <button
              onClick={() => setShowDeviceUsers(!showDeviceUsers)}
              className="inline-flex items-center px-4 py-2 border border-input bg-background hover:bg-secondary text-foreground rounded-md transition-colors text-sm font-medium"
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              Device Users
            </button>
          )}
        </div>
      </div>

      {/* Employee List */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {filteredEmployees.length === 0 ? (
          <div className="text-center py-12">
            <UserIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No employees found
            </h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first employee
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors text-sm font-medium"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Employee
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                    Salary
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                    Fingerprint Status
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEmployees.map((employee) => (
                  <tr
                    key={employee._id}
                    className="hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-foreground" />
                        </div>
                        <div className="ml-3">
                          <div className="font-medium text-foreground">
                            {employee.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID: {employee.employeeId}
                          </div>
                          {employee.fingerprintEnrolled && (
                            <div className="text-xs text-green-600 flex items-center mt-1">
                              <CheckCircleIcon className="h-3 w-3 mr-1" />
                              Enrolled
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-muted-foreground">
                        <PhoneIcon className="h-3 w-3 mr-2" />
                        {employee.phone || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-foreground">
                        <DollarSignIcon className="h-3 w-3 mr-1 text-muted-foreground" />
                        ${employee.monthlySalary}/month
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {employee.fingerprintEnrolled && employee.deviceUserId ? (
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-foreground">
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            ID: {employee.deviceUserId}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-muted-foreground">
                            <AlertTriangleIcon className="h-3 w-3 mr-1" />
                            Not Assigned
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {!employee.fingerprintEnrolled ? (
                          <>
                            <button
                              onClick={() =>
                                openFingerprintAssignment(employee)
                              }
                              className="text-foreground hover:text-primary p-1 rounded-md hover:bg-secondary transition-colors"
                              title="Assign Device ID"
                            >
                              <BadgeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                openFingerprintEnrollment(employee)
                              }
                              className="text-foreground hover:text-primary p-1 rounded-md hover:bg-secondary transition-colors"
                              title="Enroll Fingerprint"
                            >
                              <FingerprintIcon className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() =>
                                openFingerprintAssignment(employee)
                              }
                              className="text-foreground hover:text-primary p-1 rounded-md hover:bg-secondary transition-colors"
                              title="Change Device ID"
                            >
                              <EditIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                openFingerprintEnrollment(employee)
                              }
                              className="text-foreground hover:text-primary p-1 rounded-md hover:bg-secondary transition-colors"
                              title="Re-enroll Fingerprint"
                            >
                              <FingerprintIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {syncing === employee.employeeId && (
                          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
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
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Device Users ({deviceUsers.length})
            </h2>
            <button
              onClick={() => setShowDeviceUsers(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {deviceUsers.map((user) => (
                <div
                  key={user.userId}
                  className="border border-border rounded-lg p-4 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-foreground">
                        {user.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ID: {user.userId}
                      </div>
                      {user.cardno && (
                        <div className="text-xs text-muted-foreground">
                          Card: {user.cardno}
                        </div>
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
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg shadow-lg border border-border max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-foreground">
                  Fingerprint Enrollment
                </h3>
                <button
                  onClick={() => {
                    setShowFingerprintEnrollment(false);
                    setSelectedEmployee(null);
                  }}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-secondary transition-colors"
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
