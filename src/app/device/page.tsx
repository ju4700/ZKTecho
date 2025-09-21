'use client';

import React, { useState, useEffect } from 'react';
import {
  WifiIcon,
  SettingsIcon,
  RefreshCwIcon,
  UsersIcon,
  ActivityIcon,
  SearchIcon,
  PowerIcon,
  CheckCircleIcon,
  XCircleIcon,
  DownloadIcon,
  DatabaseIcon,
  MonitorIcon
} from 'lucide-react';

interface DeviceStatus {
  connected: boolean;
  ip?: string;
  port?: number;
  model?: string;
  serialNumber?: string;
  version?: string;
  userCount?: number;
  recordCount?: number;
  freeMemory?: number;
  totalMemory?: number;
}

interface DeviceUser {
  userId: string;
  name: string;
  role: number;
  cardno?: string;
  password?: string;
}

interface DeviceConfig {
  ip: string;
  port: number;
  timeout: number;
  autoConnect: boolean;
}

interface DiscoveredDevice {
  ip: string;
  port: number;
}

export default function DeviceManagementPage() {
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
  const [deviceUsers, setDeviceUsers] = useState<DeviceUser[]>([]);
  const [deviceConfig, setDeviceConfig] = useState<DeviceConfig>({
    ip: '192.168.1.201',
    port: 4370,
    timeout: 5000,
    autoConnect: true
  });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredDevice[]>([]);
  const [discovering, setDiscovering] = useState(false);

  useEffect(() => {
    fetchDeviceStatus();
    fetchDeviceUsers();
  }, []);

  const fetchDeviceStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/device/status');
      const data = await response.json();
      setDeviceStatus(data);
    } catch (error) {
      console.error('Error fetching device status:', error);
      setDeviceStatus({ connected: false });
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

  const connectToDevice = async () => {
    setConnecting(true);
    try {
      const response = await fetch('/api/device/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'connect',
          config: deviceConfig
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        await fetchDeviceStatus();
        await fetchDeviceUsers();
      }
    } catch (error) {
      console.error('Error connecting to device:', error);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectFromDevice = async () => {
    try {
      const response = await fetch('/api/device/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'disconnect'
        }),
      });
      
      if (response.ok) {
        await fetchDeviceStatus();
        setDeviceUsers([]);
      }
    } catch (error) {
      console.error('Error disconnecting from device:', error);
    }
  };

  const syncAllUsers = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/device/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync-all'
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        await fetchDeviceUsers();
      }
    } catch (error) {
      console.error('Error syncing users:', error);
    } finally {
      setSyncing(false);
    }
  };

  const discoverDevices = async () => {
    setDiscovering(true);
    try {
      const response = await fetch('/api/device/discover');
      const data = await response.json();
      setDiscoveredDevices(data.devices || []);
    } catch (error) {
      console.error('Error discovering devices:', error);
    } finally {
      setDiscovering(false);
    }
  };

  const filteredUsers = deviceUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.userId.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Device Management</h1>
            <p className="text-gray-600">Manage your ZKTeco biometric device and sync settings</p>
          </div>
          <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="inline-flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <SettingsIcon className="h-5 w-5 mr-2" />
              Configuration
            </button>
            
            {deviceStatus?.connected ? (
              <button
                onClick={disconnectFromDevice}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                <PowerIcon className="h-5 w-5 mr-2" />
                Disconnect
              </button>
            ) : (
              <button
                onClick={connectToDevice}
                disabled={connecting}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
              >
                {connecting ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                ) : (
                  <WifiIcon className="h-5 w-5 mr-2" />
                )}
                {connecting ? 'Connecting...' : 'Connect'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className={`mb-8 rounded-xl p-4 ${
        deviceStatus?.connected 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center">
          {deviceStatus?.connected ? (
            <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
          ) : (
            <XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
          )}
          <div className="ml-3">
            <h3 className={`text-sm font-medium ${
              deviceStatus?.connected ? 'text-green-800' : 'text-red-800'
            }`}>
              {deviceStatus?.connected ? 'Device Connected' : 'Device Disconnected'}
            </h3>
            <p className={`mt-1 text-sm ${
              deviceStatus?.connected ? 'text-green-700' : 'text-red-700'
            }`}>
              {deviceStatus?.connected 
                ? `Connected to ${deviceStatus.ip}:${deviceStatus.port}` 
                : 'No device connection established. Check your network and device settings.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Device Configuration */}
      {showConfig && (
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Device Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IP Address
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={deviceConfig.ip}
                onChange={(e) => setDeviceConfig({ ...deviceConfig, ip: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Port
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={deviceConfig.port}
                onChange={(e) => setDeviceConfig({ ...deviceConfig, port: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timeout (ms)
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={deviceConfig.timeout}
                onChange={(e) => setDeviceConfig({ ...deviceConfig, timeout: parseInt(e.target.value) })}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoConnect"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={deviceConfig.autoConnect}
                onChange={(e) => setDeviceConfig({ ...deviceConfig, autoConnect: e.target.checked })}
              />
              <label htmlFor="autoConnect" className="ml-2 block text-sm text-gray-900">
                Auto-connect on startup
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={discoverDevices}
              disabled={discovering}
              className="inline-flex items-center px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors duration-200"
            >
              {discovering ? (
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
              ) : (
                <SearchIcon className="h-4 w-4 mr-2" />
              )}
              {discovering ? 'Discovering...' : 'Discover Devices'}
            </button>

            <button
              onClick={() => setShowConfig(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Save Configuration
            </button>
          </div>

          {/* Discovered Devices */}
          {discoveredDevices.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Discovered Devices</h3>
              <div className="space-y-2">
                {discoveredDevices.map((device, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{device.ip}</div>
                      <div className="text-xs text-gray-500">Port: {device.port}</div>
                    </div>
                    <button
                      onClick={() => setDeviceConfig({ ...deviceConfig, ip: device.ip, port: device.port })}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Use This Device
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Device Stats */}
      {deviceStatus?.connected && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UsersIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{deviceStatus.userCount || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DatabaseIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Records</p>
                <p className="text-2xl font-semibold text-gray-900">{deviceStatus.recordCount || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MonitorIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Memory</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {deviceStatus.freeMemory ? `${Math.round((deviceStatus.freeMemory / (deviceStatus.totalMemory || 1)) * 100)}%` : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ActivityIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="text-2xl font-semibold text-gray-900">Online</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Device Users Management */}
      {deviceStatus?.connected && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-medium text-gray-900">Device Users ({deviceUsers.length})</h2>
              
              <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={fetchDeviceUsers}
                    className="inline-flex items-center px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm"
                  >
                    <RefreshCwIcon className="h-4 w-4 mr-1" />
                    Refresh
                  </button>

                  <button
                    onClick={syncAllUsers}
                    disabled={syncing}
                    className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200 text-sm"
                  >
                    {syncing ? (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1"></div>
                    ) : (
                      <DownloadIcon className="h-4 w-4 mr-1" />
                    )}
                    {syncing ? 'Syncing...' : 'Sync All'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">
                {deviceUsers.length === 0 ? 'No users are currently enrolled on the device' : 'No users match your search criteria'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Card Number
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.userId} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <UsersIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.userId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 14 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 14 ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.cardno || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}