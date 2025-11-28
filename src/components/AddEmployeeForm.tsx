"use client";

import React, { useState, useEffect } from "react";
import { X, Fingerprint, CheckCircle, AlertCircle } from "lucide-react";

interface DeviceUser {
  userId: string;
  name: string;
  role: number;
  cardno?: string;
}

interface AddEmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface EmployeeCreationStep {
  id: string;
  label: string;
  status: "pending" | "in-progress" | "completed" | "error";
  message?: string;
}

export default function AddEmployeeForm({
  isOpen,
  onClose,
  onSuccess,
}: AddEmployeeFormProps) {
  const [formData, setFormData] = useState({
    employeeId: "",
    name: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    hourlyRate: "",
    deviceUserId: "", // Link to existing ZKTeco user
  });
  const [deviceUsers, setDeviceUsers] = useState<DeviceUser[]>([]);
  const [loadingDeviceUsers, setLoadingDeviceUsers] = useState(false);

  // Fetch device users when form opens
  useEffect(() => {
    if (isOpen) {
      fetchDeviceUsers();
    }
  }, [isOpen]);

  const fetchDeviceUsers = async () => {
    setLoadingDeviceUsers(true);
    try {
      const response = await fetch("/api/device/users");
      if (response.ok) {
        const data = await response.json();
        setDeviceUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching device users:", error);
    } finally {
      setLoadingDeviceUsers(false);
    }
  };
  const [loading, setLoading] = useState(false);
  const [enrollmentStep, setEnrollmentStep] = useState<
    "form" | "enrollment" | "completed"
  >("form");
  const [steps, setSteps] = useState<EmployeeCreationStep[]>([
    { id: "database", label: "Save to Database", status: "pending" },
    { id: "device", label: "Link to ZKTeco Device User", status: "pending" },
    {
      id: "fingerprint",
      label: "Verify Fingerprint Status",
      status: "pending",
    },
  ]);

  const updateStepStatus = (
    stepId: string,
    status: EmployeeCreationStep["status"],
    message?: string
  ) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === stepId ? { ...step, status, message } : step
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setEnrollmentStep("enrollment");

    try {
      // Step 1: Create employee in database and device
      updateStepStatus("database", "in-progress");
      updateStepStatus("device", "in-progress");

      const response = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          hourlyRate: parseFloat(formData.hourlyRate) || 0,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        updateStepStatus(
          "database",
          "completed",
          "Employee saved successfully"
        );

        if (result.deviceSyncSuccess) {
          updateStepStatus(
            "device",
            "completed",
            `Device User ID: ${result.deviceUserId}`
          );

          // Step 2: Initiate fingerprint enrollment
          updateStepStatus(
            "fingerprint",
            "in-progress",
            "Please place finger on ZKTeco device scanner"
          );

          const enrollResponse = await fetch(
            "/api/employees/enroll-fingerprint",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                employeeId: formData.employeeId,
              }),
            }
          );

          const enrollResult = await enrollResponse.json();

          if (enrollResponse.ok && enrollResult.success) {
            updateStepStatus(
              "fingerprint",
              "completed",
              "Fingerprint enrollment initiated successfully"
            );
            setEnrollmentStep("completed");

            // Show success message for a few seconds then close
            setTimeout(() => {
              onSuccess();
              handleClose();
            }, 3000);
          } else {
            updateStepStatus(
              "fingerprint",
              "error",
              enrollResult.message || "Fingerprint enrollment failed"
            );
          }
        } else {
          updateStepStatus(
            "device",
            "error",
            "Failed to create user in ZKTeco device"
          );
          updateStepStatus(
            "fingerprint",
            "error",
            "Cannot enroll fingerprint without device user"
          );
        }
      } else {
        updateStepStatus("database", "error", result.error);
        updateStepStatus("device", "error", "Skipped due to database error");
        updateStepStatus(
          "fingerprint",
          "error",
          "Skipped due to previous errors"
        );
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error adding employee:", error);
      updateStepStatus("database", "error", "Network or server error");
      updateStepStatus("device", "error", "Skipped due to database error");
      updateStepStatus(
        "fingerprint",
        "error",
        "Skipped due to previous errors"
      );
      alert("Failed to add employee");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      employeeId: "",
      name: "",
      email: "",
      phone: "",
      department: "",
      position: "",
      hourlyRate: "",
      deviceUserId: "",
    });
    setEnrollmentStep("form");
    setSteps([
      { id: "database", label: "Save to Database", status: "pending" },
      { id: "device", label: "Link to ZKTeco Device User", status: "pending" },
      {
        id: "fingerprint",
        label: "Verify Fingerprint Status",
        status: "pending",
      },
    ]);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!isOpen) return null;

  const getStepIcon = (status: EmployeeCreationStep["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-foreground" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case "in-progress":
        return (
          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        );
      default:
        return <div className="h-5 w-5 border-2 border-muted rounded-full" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative p-6 border border-border w-[500px] shadow-lg rounded-lg bg-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">
            {enrollmentStep === "form"
              ? "Add New Employee"
              : "Employee Registration Process"}
          </h3>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {enrollmentStep === "form" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Employee ID *
              </label>
              <input
                type="text"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                required
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                placeholder="e.g., EMP001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Phone (Optional)
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                placeholder="+1 234 567 8900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                placeholder="john.doe@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Department *
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                placeholder="Engineering"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Position *
              </label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                required
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                placeholder="Software Engineer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Link to ZKTeco Device User *
              </label>
              <select
                name="deviceUserId"
                value={formData.deviceUserId}
                onChange={(e) =>
                  setFormData({ ...formData, deviceUserId: e.target.value })
                }
                required
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Select existing ZKTeco user...</option>
                {loadingDeviceUsers ? (
                  <option disabled>Loading device users...</option>
                ) : (
                  deviceUsers.map((user) => (
                    <option key={user.userId} value={user.userId}>
                      ID: {user.userId} - {user.name || "Unnamed User"} (Role:{" "}
                      {user.role})
                    </option>
                  ))
                )}
              </select>
              {deviceUsers.length === 0 && !loadingDeviceUsers && (
                <p className="mt-1 text-sm text-destructive">
                  No device users found. Please ensure ZKTeco device is
                  connected.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Hourly Rate ($) *
              </label>
              <input
                type="number"
                name="hourlyRate"
                value={formData.hourlyRate}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                placeholder="25.00"
              />
            </div>

            <div className="bg-secondary p-4 rounded-md border border-border">
              <div className="flex items-start">
                <Fingerprint className="h-5 w-5 text-primary mt-0.5 mr-2" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Automated ZKTeco Integration
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    After creating the employee, the system will automatically:
                  </p>
                  <ul className="text-sm text-muted-foreground mt-1 list-disc list-inside">
                    <li>Create user in ZKTeco device</li>
                    <li>Initiate fingerprint enrollment</li>
                    <li>Guide you through the enrollment process</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-border mt-6">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-input bg-background hover:bg-secondary text-foreground rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md shadow-sm text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Create Employee & Enroll"}
              </button>
            </div>
          </form>
        )}

        {(enrollmentStep === "enrollment" ||
          enrollmentStep === "completed") && (
          <div className="space-y-4">
            <div className="bg-secondary p-4 rounded-md border border-border">
              <h4 className="font-medium text-foreground mb-3">
                Registration Progress
              </h4>
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center space-x-3">
                    <span className="flex-shrink-0">
                      {getStepIcon(step.status)}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {index + 1}. {step.label}
                      </p>
                      {step.message && (
                        <p
                          className={`text-sm ${
                            step.status === "error"
                              ? "text-destructive"
                              : step.status === "completed"
                              ? "text-muted-foreground"
                              : "text-primary"
                          }`}
                        >
                          {step.message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {steps.some(
              (step) =>
                step.status === "in-progress" && step.id === "fingerprint"
            ) && (
              <div className="bg-secondary border border-border p-4 rounded-md">
                <div className="flex items-center">
                  <Fingerprint className="h-5 w-5 text-primary mr-2" />
                  <div>
                    <p className="font-medium text-foreground">
                      Fingerprint Enrollment in Progress
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Please place your finger on the ZKTeco device scanner.
                      Follow the device prompts to complete enrollment.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {enrollmentStep === "completed" && (
              <div className="bg-secondary border border-border p-4 rounded-md">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-foreground mr-2" />
                  <div>
                    <p className="font-medium text-foreground">
                      Employee Registration Completed!
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formData.name} has been successfully registered in both
                      the system and ZKTeco device.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-border mt-6">
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-input bg-background hover:bg-secondary text-foreground rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
