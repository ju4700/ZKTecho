'use client';

import React, { useState, useEffect } from 'react';
import { 
  WifiIcon, 
  RefreshCwIcon, 
  SettingsIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  SearchIcon,
  MonitorIcon,
  ClockIcon,
  UsersIcon,
  NetworkIcon
} from 'lucide-react';

interface DeviceInfo {
  ip: string;
  port: number;
  status: 'reachable' | 'unreachable';
  responseTime?: number;
  deviceType?: string;
}

interface DeviceConfig {
  ip: string;
  port: number;
  timeout: number;
  retries: number;
  status: string;
}

export default function DeviceManagement() {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [currentConfig, setCurrentConfig] = useState<DeviceConfig | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [newIp, setNewIp] = useState('');
  const [newPort, setNewPort] = useState(4370);
  const [scanType, setScanType] = useState<'quick' | 'full'>('quick');
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');

  // Load current configuration on mount
  useEffect(() => {
    loadCurrentConfig();
    checkConnectionStatus();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      const response = await fetch('/api/device/config');
      if (response.ok) {
        const result = await response.json();
        setCurrentConfig(result.data);
        setNewIp(result.data.ip);
        setNewPort(result.data.port);
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/device/status');
      if (response.ok) {
        const result = await response.json();
        setConnectionStatus(result.connected ? 'connected' : 'disconnected');
      }
    } catch (error) {
      setConnectionStatus('disconnected');
    }
  };

  const discoverDevices = async () => {
    setIsScanning(true);
    try {
      const response = await fetch(`/api/device/discover?quick=${scanType === 'quick'}`);
      if (response.ok) {
        const result = await response.json();
        setDevices(result.data.devices || []);
      }
    } catch (error) {
      console.error('Device discovery failed:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const testDevice = async (ip: string, port: number = 4370) => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/device/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, port })
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.data;
      }
    } catch (error) {
      console.error('Device test failed:', error);
    } finally {
      setIsTesting(false);
    }
    return null;
  };

  const updateConfiguration = async () => {
    setIsConfiguring(true);
    try {
      const response = await fetch('/api/device/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ip: newIp, 
          port: newPort,
          timeout: 10000 
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setCurrentConfig(result.data);
        alert('Configuration updated successfully! Please restart the server to apply changes.');
      }
    } catch (error) {
      console.error('Configuration update failed:', error);
      alert('Failed to update configuration');
    } finally {
      setIsConfiguring(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'reachable':
        return 'text-green-600';
      case 'disconnected':
      case 'unreachable':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'reachable':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'disconnected':
      case 'unreachable':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <NetworkIcon className="h-6 w-6" />
          ZKTeco Device Management
        </h1>
        <p className="text-gray-600">
          Configure and manage your ZKTeco biometric devices
        </p>
      </div>

      {/* Current Device Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MonitorIcon className="h-5 w-5" />
          Current Device Status
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Connection</span>
              {getStatusIcon(connectionStatus)}
            </div>
            <div className={`font-semibold capitalize ${getStatusColor(connectionStatus)}`}>
              {connectionStatus}
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="text-sm text-gray-600">Device IP</div>
            <div className="font-semibold">{currentConfig?.ip || 'Not configured'}</div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="text-sm text-gray-600">Port</div>
            <div className="font-semibold">{currentConfig?.port || 'Not configured'}</div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="text-sm text-gray-600">Timeout</div>
            <div className="font-semibold">{currentConfig?.timeout}ms</div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={checkConnectionStatus}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCwIcon className="h-4 w-4" />
            Refresh Status
          </button>
        </div>
      </div>

      {/* Device Discovery */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <SearchIcon className="h-5 w-5" />
          Device Discovery
        </h2>

        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Scan Type:</label>
            <select
              value={scanType}
              onChange={(e) => setScanType(e.target.value as 'quick' | 'full')}
              className="border rounded-md px-3 py-1"
            >
              <option value="quick">Quick Scan (Common IPs)</option>
              <option value="full">Full Network Scan</option>
            </select>
          </div>

          <button
            onClick={discoverDevices}
            disabled={isScanning}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <WifiIcon className="h-4 w-4" />
            {isScanning ? 'Scanning...' : 'Discover Devices'}
          </button>
        </div>

        {devices.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">Found Devices:</h3>
            {devices.map((device, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(device.status)}
                  <div>
                    <div className="font-medium">{device.ip}:{device.port}</div>
                    <div className="text-sm text-gray-600">
                      {device.deviceType} • {device.responseTime}ms
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => testDevice(device.ip, device.port)}
                    disabled={isTesting}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50"
                  >
                    Test
                  </button>
                  <button
                    onClick={() => {
                      setNewIp(device.ip);
                      setNewPort(device.port);
                    }}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                  >
                    Use This
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Device Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <SettingsIcon className="h-5 w-5" />
          Device Configuration
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Device IP Address
              </label>
              <input
                type="text"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                placeholder="192.168.1.201"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Port
              </label>
              <input
                type="number"
                value={newPort}
                onChange={(e) => setNewPort(Number(e.target.value))}
                placeholder="4370"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => testDevice(newIp, newPort)}
              disabled={isTesting || !newIp}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>

            <button
              onClick={updateConfiguration}
              disabled={isConfiguring || !newIp}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isConfiguring ? 'Updating...' : 'Update Configuration'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <UsersIcon className="h-5 w-5" />
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/api/device/status"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 border rounded-lg hover:bg-gray-50 text-center"
          >
            <div className="font-medium">Device Status API</div>
            <div className="text-sm text-gray-600">Check device connectivity</div>
          </a>

          <a
            href="/api/zkteco/test"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 border rounded-lg hover:bg-gray-50 text-center"
          >
            <div className="font-medium">ZKTeco Test</div>
            <div className="text-sm text-gray-600">Test ZKTeco integration</div>
          </a>

          <a
            href="/test-employee-management"
            className="p-4 border rounded-lg hover:bg-gray-50 text-center"
          >
            <div className="font-medium">Test Management</div>
            <div className="text-sm text-gray-600">Employee management test</div>
          </a>
        </div>
      </div>
    </div>
  );
}