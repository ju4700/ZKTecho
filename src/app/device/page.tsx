"use client";

import React, { useState, useEffect } from "react";
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
  MonitorIcon,
  ServerIcon,
  CpuIcon,
} from "lucide-react";

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
    ip: "192.168.1.201",
    port: 4370,
    timeout: 5000,
    autoConnect: true,
  });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<
    DiscoveredDevice[]
  >([]);
  const [discovering, setDiscovering] = useState(false);

  useEffect(() => {
    fetchDeviceStatus();
    fetchDeviceUsers();
  }, []);

  const fetchDeviceStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/device/quick-status");
      const data = await response.json();

      if (data.isConnected) {
        setDeviceStatus({
          connected: true,
          ip: process.env.NEXT_PUBLIC_ZKTECO_IP || "192.168.1.201",
          port: process.env.NEXT_PUBLIC_ZKTECO_PORT
            ? parseInt(process.env.NEXT_PUBLIC_ZKTECO_PORT)
            : 4370,
          model: data.deviceInfo?.deviceName || "ZKTeco K40",
          serialNumber: data.deviceInfo?.serialNumber || "Unknown",
          version: "Unknown",
          userCount: data.deviceInfo?.userCount || 0,
          recordCount: data.deviceInfo?.attendanceLogCount || 0,
          freeMemory: 0,
          totalMemory: 0,
        });
      } else {
        setDeviceStatus({
          connected: false,
        });
      }
    } catch (error) {
      console.error("Failed to fetch device status:", error);
      setDeviceStatus({
        connected: false,
      });
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

  const connectToDevice = async () => {
    setConnecting(true);
    try {
      const response = await fetch("/api/device/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "connect",
          config: deviceConfig,
        }),
      });

      const result = await response.json();
      if (result.success) {
        await fetchDeviceStatus();
        await fetchDeviceUsers();
      }
    } catch (error) {
      console.error("Error connecting to device:", error);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectFromDevice = async () => {
    try {
      const response = await fetch("/api/device/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "disconnect",
        }),
      });

      if (response.ok) {
        await fetchDeviceStatus();
        setDeviceUsers([]);
      }
    } catch (error) {
      console.error("Error disconnecting from device:", error);
    }
  };

  const syncAllUsers = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/device/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "sync-all",
        }),
      });

      const result = await response.json();
      if (result.success) {
        await fetchDeviceUsers();
      }
    } catch (error) {
      console.error("Error syncing users:", error);
    } finally {
      setSyncing(false);
    }
  };

  const discoverDevices = async () => {
    setDiscovering(true);
    try {
      const response = await fetch("/api/device/discover");
      const data = await response.json();
      setDiscoveredDevices(data.devices || []);
    } catch (error) {
      console.error("Error discovering devices:", error);
    } finally {
      setDiscovering(false);
    }
  };

  const filteredUsers = deviceUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userId.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-secondary rounded w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-secondary rounded-lg"></div>
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
            Device Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your ZKTeco biometric device and sync settings
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="inline-flex items-center justify-center px-4 py-2 border border-input bg-background hover:bg-secondary text-foreground rounded-md transition-colors text-sm font-medium"
          >
            <SettingsIcon className="h-4 w-4 mr-2" />
            Configuration
          </button>

          {deviceStatus?.connected ? (
            <button
              onClick={disconnectFromDevice}
              className="inline-flex items-center justify-center px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md transition-colors text-sm font-medium"
            >
              <PowerIcon className="h-4 w-4 mr-2" />
              Disconnect
            </button>
          ) : (
            <button
              onClick={connectToDevice}
              disabled={connecting}
              className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md disabled:opacity-50 transition-colors text-sm font-medium"
            >
              {connecting ? (
                <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <WifiIcon className="h-4 w-4 mr-2" />
              )}
              {connecting ? "Connecting..." : "Connect"}
            </button>
          )}
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center">
          {deviceStatus?.connected ? (
            <div className="h-10 w-10 rounded-full bg-foreground/10 flex items-center justify-center">
              <CheckCircleIcon className="h-5 w-5 text-foreground" />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircleIcon className="h-5 w-5 text-destructive" />
            </div>
          )}
          <div className="ml-4">
            <h3 className="text-base font-medium text-foreground">
              {deviceStatus?.connected
                ? "Device Connected"
                : "Device Disconnected"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {deviceStatus?.connected
                ? `Connected to ${deviceStatus.ip}:${deviceStatus.port}`
                : "No device connection established."}
            </p>
          </div>
        </div>
      </div>

      {/* Device Configuration */}
      {showConfig && (
        <div className="bg-card rounded-lg border border-border p-6 space-y-6">
          <h2 className="text-lg font-semibold text-foreground">
            Device Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                IP Address
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                value={deviceConfig.ip}
                onChange={(e) =>
                  setDeviceConfig({ ...deviceConfig, ip: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Port
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                value={deviceConfig.port}
                onChange={(e) =>
                  setDeviceConfig({
                    ...deviceConfig,
                    port: parseInt(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Timeout (ms)
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                value={deviceConfig.timeout}
                onChange={(e) =>
                  setDeviceConfig({
                    ...deviceConfig,
                    timeout: parseInt(e.target.value),
                  })
                }
              />
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <input
                type="checkbox"
                id="autoConnect"
                className="h-4 w-4 rounded border-input bg-background text-primary focus:ring-primary"
                checked={deviceConfig.autoConnect}
                onChange={(e) =>
                  setDeviceConfig({
                    ...deviceConfig,
                    autoConnect: e.target.checked,
                  })
                }
              />
              <label
                htmlFor="autoConnect"
                className="text-sm font-medium text-foreground"
              >
                Auto-connect on startup
              </label>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-border">
            <button
              onClick={discoverDevices}
              disabled={discovering}
              className="inline-flex items-center px-4 py-2 border border-input bg-background hover:bg-secondary text-foreground rounded-md disabled:opacity-50 transition-colors text-sm font-medium"
            >
              {discovering ? (
                <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <SearchIcon className="h-4 w-4 mr-2" />
              )}
              {discovering ? "Discovering..." : "Discover Devices"}
            </button>

            <button
              onClick={() => setShowConfig(false)}
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors text-sm font-medium"
            >
              Save Configuration
            </button>
          </div>

          {/* Discovered Devices */}
          {discoveredDevices.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-sm font-medium text-foreground">
                Discovered Devices
              </h3>
              <div className="space-y-2">
                {discoveredDevices.map((device, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-border rounded-lg bg-secondary/50"
                  >
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {device.ip}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Port: {device.port}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setDeviceConfig({
                          ...deviceConfig,
                          ip: device.ip,
                          port: device.port,
                        })
                      }
                      className="text-sm font-medium text-foreground hover:underline"
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Users
                </p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {deviceStatus.userCount || 0}
                </p>
              </div>
              <UsersIcon className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Records
                </p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {deviceStatus.recordCount || 0}
                </p>
              </div>
              <DatabaseIcon className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Memory
                </p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {deviceStatus.freeMemory
                    ? `${Math.round(
                        (deviceStatus.freeMemory /
                          (deviceStatus.totalMemory || 1)) *
                          100
                      )}%`
                    : "N/A"}
                </p>
              </div>
              <CpuIcon className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Status
                </p>
                <div className="flex items-center mt-2 space-x-2">
                  <div className="h-2 w-2 rounded-full bg-foreground" />
                  <p className="text-2xl font-bold text-foreground">Online</p>
                </div>
              </div>
              <ActivityIcon className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      )}

      {/* Device Users Management */}
      {deviceStatus?.connected && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg font-semibold text-foreground">
                Device Users ({deviceUsers.length})
              </h2>

              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="pl-9 pr-4 py-2 w-full sm:w-64 bg-background border border-input rounded-md focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={fetchDeviceUsers}
                    className="inline-flex items-center px-3 py-2 border border-input bg-background hover:bg-secondary text-foreground rounded-md transition-colors text-sm font-medium"
                  >
                    <RefreshCwIcon className="h-4 w-4 mr-2" />
                    Refresh
                  </button>

                  <button
                    onClick={syncAllUsers}
                    disabled={syncing}
                    className="inline-flex items-center px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                    {syncing ? (
                      <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <DownloadIcon className="h-4 w-4 mr-2" />
                    )}
                    {syncing ? "Syncing..." : "Sync All"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No users found
              </h3>
              <p className="text-muted-foreground">
                {deviceUsers.length === 0
                  ? "No users are currently enrolled on the device"
                  : "No users match your search criteria"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                      User
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                      User ID
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                      Card Number
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.userId}
                      className="hover:bg-secondary/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                            <UsersIcon className="h-4 w-4 text-foreground" />
                          </div>
                          <div className="ml-3">
                            <div className="font-medium text-foreground">
                              {user.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {user.userId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 14
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-foreground"
                          }`}
                        >
                          {user.role === 14 ? "Admin" : "User"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {user.cardno || "N/A"}
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
