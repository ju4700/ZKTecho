'use client';

import { useState, useEffect, useCallback } from 'react';

interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  phone?: string;
  monthlySalary: number;
  deviceSync: {
    isRegistered: boolean;
    lastSync: string;
    fingerPrintCount: number;
  };
}

interface DeviceUser {
  userId: string;
  name: string;
  role: number;
  cardno?: string;
}

interface TestResult {
  operation: string;
  success: boolean;
  message: string;
  data?: unknown;
  timestamp: string;
}

export default function EmployeeManagementTest() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [deviceUsers, setDeviceUsers] = useState<DeviceUser[]>([]);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  
  // Test employee data
  const [testEmployee, setTestEmployee] = useState({
    employeeId: 'TEST001',
    name: 'John Test User',
    email: 'john.test@company.com',
    phone: '+1234567890',
    monthlySalary: 3000.00
  });

  const addTestResult = (operation: string, success: boolean, message: string, data?: unknown) => {
    const result: TestResult = {
      operation,
      success,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [result, ...prev]);
  };

  const checkDeviceConnection = useCallback(async () => {
    try {
      const response = await fetch('/api/device/status');
      const data = await response.json();
      setDeviceConnected(data.isConnected);
      addTestResult('Device Connection Check', data.isConnected, 
        data.isConnected ? 'Device is connected' : 'Device is offline', data);
    } catch (error) {
      addTestResult('Device Connection Check', false, `Error: ${error}`);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await fetch('/api/employees');
      const data = await response.json();
      setEmployees(data);
      addTestResult('Fetch Employees', true, `Loaded ${data.length} employees from database`);
    } catch (error) {
      addTestResult('Fetch Employees', false, `Error: ${error}`);
    }
  }, []);

  const fetchDeviceUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/device/users');
      const data = await response.json();
      setDeviceUsers(data.users || []);
      addTestResult('Fetch Device Users', true, `Found ${data.users?.length || 0} users on device`);
    } catch (error) {
      addTestResult('Fetch Device Users', false, `Error: ${error}`);
    }
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      await checkDeviceConnection();
      await fetchEmployees();
      await fetchDeviceUsers();
    };
    initializeData();
  }, [checkDeviceConnection, fetchEmployees, fetchDeviceUsers]);

  const testAddEmployee = async () => {
    setLoading(true);
    try {
      // 1. Add to database
      const dbResponse = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testEmployee)
      });

      if (!dbResponse.ok) {
        const error = await dbResponse.json();
        throw new Error(error.error || 'Failed to add to database');
      }

      const dbResult = await dbResponse.json();
      addTestResult('Add Employee to Database', true, 'Employee added to database successfully', dbResult);

      // 2. Sync to device
      const syncResponse = await fetch('/api/integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addEmployeeToDevice',
          employeeId: testEmployee.employeeId
        })
      });

      if (syncResponse.ok) {
        const syncResult = await syncResponse.json();
        addTestResult('Add Employee to Device', true, 'Employee synced to device successfully', syncResult);
      } else {
        const error = await syncResponse.json();
        addTestResult('Add Employee to Device', false, `Device sync failed: ${error.error}`);
      }

      // Refresh data
      await fetchEmployees();
      await fetchDeviceUsers();

    } catch (error) {
      addTestResult('Add Employee', false, `Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testDeleteEmployee = async () => {
    setLoading(true);
    try {
      // Find the test employee
      const employee = employees.find(emp => emp.employeeId === testEmployee.employeeId);
      if (!employee) {
        throw new Error('Test employee not found. Add employee first.');
      }

      // 1. Delete from device first
      const deviceResponse = await fetch('/api/integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteEmployeeFromDevice',
          employeeId: testEmployee.employeeId
        })
      });

      if (deviceResponse.ok) {
        const deviceResult = await deviceResponse.json();
        addTestResult('Delete Employee from Device', true, 'Employee removed from device', deviceResult);
      } else {
        const error = await deviceResponse.json();
        addTestResult('Delete Employee from Device', false, `Device deletion failed: ${error.error}`);
      }

      // 2. Delete from database
      const dbResponse = await fetch(`/api/employees/${employee._id}`, {
        method: 'DELETE'
      });

      if (dbResponse.ok) {
        addTestResult('Delete Employee from Database', true, 'Employee removed from database');
      } else {
        const error = await dbResponse.json();
        addTestResult('Delete Employee from Database', false, `Database deletion failed: ${error.error}`);
      }

      // Refresh data
      await fetchEmployees();
      await fetchDeviceUsers();

    } catch (error) {
      addTestResult('Delete Employee', false, `Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testFingerprintEnrollment = async () => {
    setLoading(true);
    try {
      const employee = employees.find(emp => emp.employeeId === testEmployee.employeeId);
      if (!employee) {
        throw new Error('Test employee not found. Add employee first.');
      }

      const response = await fetch('/api/employees/fingerprint/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: testEmployee.employeeId,
          fingerIndex: 0,
          fingerFlag: 1
        })
      });

      if (response.ok) {
        const result = await response.json();
        addTestResult('Fingerprint Enrollment', true, 'Fingerprint enrollment started', result);
      } else {
        const error = await response.json();
        addTestResult('Fingerprint Enrollment', false, `Enrollment failed: ${error.error}`);
      }

    } catch (error) {
      addTestResult('Fingerprint Enrollment', false, `Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testDeviceSync = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'syncAllEmployees' })
      });

      if (response.ok) {
        const result = await response.json();
        addTestResult('Device Sync All', true, 'All employees synced to device', result);
        await fetchDeviceUsers();
      } else {
        const error = await response.json();
        addTestResult('Device Sync All', false, `Sync failed: ${error.error}`);
      }

    } catch (error) {
      addTestResult('Device Sync All', false, `Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Employee Management Testing Suite
          </h1>
          <p className="text-gray-600 mb-4">
            Test all employee management operations with ZKTeco K40 device integration
          </p>
          
          {/* Device Status */}
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              deviceConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${deviceConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{deviceConnected ? 'Device Connected' : 'Device Offline'}</span>
            </div>
            <div className="text-sm text-gray-600">
              Database: {employees.length} employees | Device: {deviceUsers.length} users
            </div>
            <button
              onClick={checkDeviceConnection}
              className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded hover:bg-blue-200"
            >
              Refresh Status
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Test Controls */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Controls</h2>
            
            {/* Test Employee Data */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Test Employee Data</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="block text-gray-600">Employee ID</label>
                  <input
                    type="text"
                    value={testEmployee.employeeId}
                    onChange={(e) => setTestEmployee({...testEmployee, employeeId: e.target.value})}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-600">Name</label>
                  <input
                    type="text"
                    value={testEmployee.name}
                    onChange={(e) => setTestEmployee({...testEmployee, name: e.target.value})}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-600">Phone</label>
                  <input
                    type="text"
                    value={testEmployee.phone}
                    onChange={(e) => setTestEmployee({...testEmployee, phone: e.target.value})}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-600">Monthly Salary</label>
                  <input
                    type="number"
                    value={testEmployee.monthlySalary}
                    onChange={(e) => setTestEmployee({...testEmployee, monthlySalary: parseFloat(e.target.value)})}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Test Buttons */}
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={testAddEmployee}
                disabled={loading}
                className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Processing...' : '1. Add Employee (DB + Device)'}
              </button>

              <button
                onClick={testFingerprintEnrollment}
                disabled={loading || !employees.find(emp => emp.employeeId === testEmployee.employeeId)}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Processing...' : '2. Test Fingerprint Enrollment'}
              </button>

              <button
                onClick={testDeviceSync}
                disabled={loading}
                className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Processing...' : '3. Sync All Employees to Device'}
              </button>

              <button
                onClick={testDeleteEmployee}
                disabled={loading || !employees.find(emp => emp.employeeId === testEmployee.employeeId)}
                className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Processing...' : '4. Delete Employee (Device + DB)'}
              </button>

              <div className="border-t pt-3">
                <button
                  onClick={clearTestResults}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Clear Test Results
                </button>
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Test Results</h2>
              <span className="text-sm text-gray-500">{testResults.length} operations</span>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No test results yet. Run some tests to see results here.
                </div>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className={`p-3 rounded-lg border-l-4 ${
                    result.success ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${
                            result.success ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {result.success ? '✅' : '❌'} {result.operation}
                          </span>
                          <span className="text-xs text-gray-500">{result.timestamp}</span>
                        </div>
                        <p className={`text-sm mt-1 ${
                          result.success ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {result.message}
                        </p>
                        {result.data && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-600 cursor-pointer">View Data</summary>
                            <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                              {typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Current State */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Database Employees */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Employees ({employees.length})</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {employees.map((employee) => (
                <div key={employee._id} className="p-3 bg-gray-50 rounded border">
                  <div className="font-medium">{employee.name}</div>
                  <div className="text-sm text-gray-600">ID: {employee.employeeId}</div>
                  <div className="text-sm text-gray-600">Phone: {employee.phone || 'N/A'}</div>
                  <div className="text-sm text-gray-600">Salary: ${employee.monthlySalary}/month</div>
                  <div className="text-sm text-gray-600">
                    Device Sync: {employee.deviceSync?.isRegistered ? '✅ Registered' : '❌ Not Registered'}
                  </div>
                  <div className="text-sm text-gray-600">
                    Fingerprints: {employee.deviceSync?.fingerPrintCount || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Device Users */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Users ({deviceUsers.length})</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {deviceUsers.map((user) => (
                <div key={user.userId} className="p-3 bg-gray-50 rounded border">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-gray-600">Device ID: {user.userId}</div>
                  <div className="text-sm text-gray-600">Role: {user.role}</div>
                  {user.cardno && (
                    <div className="text-sm text-gray-600">Card: {user.cardno}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}