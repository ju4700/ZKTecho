"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Fingerprint,
  User,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface FingerprintAssignmentProps {
  employee: {
    _id: string;
    employeeId: string;
    name: string;
    deviceUserId?: string | null;
    fingerprintEnrolled: boolean;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ZKTecoUser {
  zktecoId: string;
  name: string;
  role: number;
  cardno?: string;
  isAssigned: boolean;
  assignedTo?: string;
}

interface ZKTecoUsersResponse {
  success: boolean;
  total: number;
  available: number;
  assigned: number;
  availableUsers: ZKTecoUser[];
  assignedUsers: ZKTecoUser[];
  error?: string;
}

export default function FingerprintAssignment({
  employee,
  isOpen,
  onClose,
  onSuccess,
}: FingerprintAssignmentProps) {
  const [loading, setLoading] = useState(false);
  const [zktecoUsers, setZktecoUsers] = useState<ZKTecoUsersResponse | null>(
    null
  );
  const [selectedZktecoId, setSelectedZktecoId] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchZKTecoUsers();
    }
  }, [isOpen]);

  const fetchZKTecoUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/zkteco/users");
      const data = await response.json();
      setZktecoUsers(data);

      if (!data.success) {
        console.error("Failed to fetch ZKTeco users:", data.error);
      }
    } catch (error) {
      console.error("Error fetching ZKTeco users:", error);
      setZktecoUsers({
        success: false,
        total: 0,
        available: 0,
        assigned: 0,
        availableUsers: [],
        assignedUsers: [],
        error: "Failed to connect to ZKTeco device",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignFingerprint = async () => {
    if (!selectedZktecoId) {
      alert("Please select a fingerprint to assign");
      return;
    }

    setAssigning(true);
    try {
      const response = await fetch("/api/employees/assign-fingerprint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: employee.employeeId,
          zktecoId: selectedZktecoId,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(
          `Successfully assigned fingerprint ID ${selectedZktecoId} to ${employee.name}!`
        );
        onSuccess();
        onClose();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error assigning fingerprint:", error);
      alert("Failed to assign fingerprint");
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassignFingerprint = async () => {
    if (!employee.deviceUserId) return;

    const confirmed = confirm(
      `Are you sure you want to remove the fingerprint assignment from ${employee.name}?`
    );
    if (!confirmed) return;

    setAssigning(true);
    try {
      const response = await fetch("/api/employees/assign-fingerprint", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: employee.employeeId,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(
          `Successfully removed fingerprint assignment from ${employee.name}!`
        );
        onSuccess();
        fetchZKTecoUsers(); // Refresh the list
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error removing fingerprint assignment:", error);
      alert("Failed to remove fingerprint assignment");
    } finally {
      setAssigning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative p-6 border border-border w-[700px] shadow-lg rounded-lg bg-card max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">
            Assign Fingerprint ID to {employee.name}
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Current Assignment Status */}
        <div className="mb-6 p-4 bg-secondary rounded-md border border-border">
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">
                Employee: {employee.name} (ID: {employee.employeeId})
              </p>
              {employee.fingerprintEnrolled && employee.deviceUserId ? (
                <div className="flex items-center space-x-2 mt-1">
                  <CheckCircle className="h-4 w-4 text-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Currently assigned Fingerprint ID: {employee.deviceUserId}
                  </p>
                  <button
                    onClick={handleUnassignFingerprint}
                    disabled={assigning}
                    className="ml-2 text-xs text-destructive hover:text-destructive/80 disabled:opacity-50"
                  >
                    {assigning ? "Removing..." : "Remove Assignment"}
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2 mt-1">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No Fingerprint ID assigned
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Device Connection Status */}
        <div className="mb-4 flex items-center justify-between">
          <h4 className="font-medium text-foreground">
            ZKTeco Fingerprint IDs
          </h4>
          <button
            onClick={fetchZKTecoUsers}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-1 text-sm text-primary hover:text-primary/80 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">
              Loading fingerprint IDs from device...
            </span>
          </div>
        ) : zktecoUsers?.success ? (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-secondary p-3 rounded-md text-center border border-border">
                <p className="text-2xl font-bold text-foreground">
                  {zktecoUsers.total}
                </p>
                <p className="text-sm text-muted-foreground">Total IDs Found</p>
              </div>
              <div className="bg-secondary p-3 rounded-md text-center border border-border">
                <p className="text-2xl font-bold text-foreground">
                  {zktecoUsers.available}
                </p>
                <p className="text-sm text-muted-foreground">Available IDs</p>
              </div>
              <div className="bg-secondary p-3 rounded-md text-center border border-border">
                <p className="text-2xl font-bold text-muted-foreground">
                  {zktecoUsers.assigned}
                </p>
                <p className="text-sm text-muted-foreground">Already Used</p>
              </div>
            </div>

            {/* All Fingerprint IDs */}
            <div>
              <h5 className="font-medium text-muted-foreground mb-3">
                Select Fingerprint ID to Assign
              </h5>

              {zktecoUsers.total > 0 ? (
                <div className="space-y-3">
                  {/* Available IDs */}
                  {zktecoUsers.availableUsers.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">
                        Available IDs (Select One)
                      </p>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {zktecoUsers.availableUsers.map((user) => (
                          <label
                            key={user.zktecoId}
                            className={`flex items-center space-x-3 p-3 border rounded-md cursor-pointer hover:bg-secondary/50 transition-colors ${
                              selectedZktecoId === user.zktecoId
                                ? "border-primary bg-secondary"
                                : "border-border"
                            }`}
                          >
                            <input
                              type="radio"
                              name="zktecoId"
                              value={user.zktecoId}
                              checked={selectedZktecoId === user.zktecoId}
                              onChange={(e) =>
                                setSelectedZktecoId(e.target.value)
                              }
                              className="text-primary focus:ring-primary"
                            />
                            <Fingerprint className="h-5 w-5 text-foreground" />
                            <div className="flex-1">
                              <p className="font-medium text-foreground">
                                ID: {user.zktecoId}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {user.name || "No name"} • Available
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Already Used IDs */}
                  {zktecoUsers.assignedUsers.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Already Used IDs (Cannot Select)
                      </p>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {zktecoUsers.assignedUsers.map((user) => (
                          <div
                            key={user.zktecoId}
                            className="flex items-center space-x-3 p-2 border border-border rounded-md bg-secondary opacity-60"
                          >
                            <Fingerprint className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-muted-foreground">
                                ID: {user.zktecoId}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Used by: {user.assignedTo}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Fingerprint className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="font-medium">No Fingerprint IDs Found</p>
                  <p className="text-sm">
                    No enrolled fingerprints detected on the ZKTeco device
                  </p>
                  <p className="text-xs mt-2 text-primary">
                    Enroll fingerprints directly on the ZKTeco device first,
                    then refresh this list
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-destructive">
            <AlertCircle className="h-12 w-12 mx-auto mb-2" />
            <p className="font-medium">Failed to Load Fingerprint IDs</p>
            <p className="text-sm">
              {zktecoUsers?.error || "Device connection error"}
            </p>
            <p className="text-xs mt-2 text-muted-foreground">
              Check device connection and try again
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-input bg-background hover:bg-secondary text-foreground rounded-md text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          {zktecoUsers?.success && zktecoUsers.availableUsers.length > 0 && (
            <button
              onClick={handleAssignFingerprint}
              disabled={!selectedZktecoId || assigning}
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md shadow-sm text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {assigning ? "Assigning..." : "Assign Selected Fingerprint ID"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
