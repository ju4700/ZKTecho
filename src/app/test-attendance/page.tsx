'use client';

import { useState } from 'react';

export default function AttendanceTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const testSyncFromDevice = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/attendance/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'syncFromDevice' })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const testProcessAttendance = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/attendance/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'processAttendance' })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const testCalculatePayroll = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/attendance/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'calculatePayroll',
          startDate: '2025-09-01',
          endDate: '2025-09-30'
        })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Attendance Processing Test
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={testSyncFromDevice}
              disabled={loading}
              className="bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Processing...' : 'Sync from Device'}
            </button>

            <button
              onClick={testProcessAttendance}
              disabled={loading}
              className="bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Processing...' : 'Process Attendance'}
            </button>

            <button
              onClick={testCalculatePayroll}
              disabled={loading}
              className="bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Processing...' : 'Calculate Payroll'}
            </button>
          </div>

          {result && (
            <div className="bg-gray-100 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Result:</h3>
              <pre className="text-sm bg-white p-4 rounded border overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-6 text-sm text-gray-600">
            <h4 className="font-semibold mb-2">API Functions:</h4>
            <ul className="space-y-1">
              <li>• <strong>Sync from Device:</strong> Fetches attendance logs from ZKTeco device</li>
              <li>• <strong>Process Attendance:</strong> Calculates work hours from clock-in/out pairs</li>
              <li>• <strong>Calculate Payroll:</strong> Generates hourly wage calculations with overtime</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}