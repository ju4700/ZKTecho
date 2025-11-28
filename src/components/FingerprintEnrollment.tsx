"use client";

import { useState } from "react";

interface FingerprintEnrollmentProps {
  employeeId: string;
  employeeName: string;
  onEnrollmentComplete?: () => void;
}

interface EnrollmentStatus {
  stage:
    | "idle"
    | "connecting"
    | "enrolling"
    | "capturing"
    | "processing"
    | "completed"
    | "error";
  message: string;
  progress: number;
  samplesCollected: number;
  samplesRequired: number;
  error?: string;
}

export default function FingerprintEnrollment({
  employeeId,
  employeeName,
  onEnrollmentComplete,
}: FingerprintEnrollmentProps) {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<EnrollmentStatus | null>(null);
  const [selectedFinger, setSelectedFinger] = useState(0);

  console.log("Current session:", sessionId); // Keep track of session ID

  const fingerNames = [
    "Right Thumb",
    "Right Index",
    "Right Middle",
    "Right Ring",
    "Right Pinky",
    "Left Thumb",
    "Left Index",
    "Left Middle",
    "Left Ring",
    "Left Pinky",
  ];

  const startEnrollment = async () => {
    try {
      setIsEnrolling(true);
      setStatus(null);

      const response = await fetch("/api/employees/fingerprint/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          fingerIndex: selectedFinger,
          fingerFlag: 1, // Valid fingerprint
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start enrollment");
      }

      const result = await response.json();
      setSessionId(result.sessionId);
      setStatus(result.status);

      // Poll for status updates
      pollEnrollmentStatus(result.sessionId);
    } catch (error) {
      console.error("Enrollment error:", error);
      setStatus({
        stage: "error",
        message: `Failed to start enrollment: ${error}`,
        progress: 0,
        samplesCollected: 0,
        samplesRequired: 3,
        error: String(error),
      });
      setIsEnrolling(false);
    }
  };

  const pollEnrollmentStatus = async (sessionId: string) => {
    try {
      const response = await fetch(
        `/api/employees/fingerprint/enroll?sessionId=${sessionId}`
      );
      if (!response.ok) return;

      const result = await response.json();
      setStatus(result.status);

      if (result.status.stage === "completed") {
        setIsEnrolling(false);
        if (onEnrollmentComplete) {
          onEnrollmentComplete();
        }
        setTimeout(() => {
          setStatus(null);
          setSessionId(null);
        }, 3000);
      } else if (result.status.stage === "error") {
        setIsEnrolling(false);
        setTimeout(() => {
          setStatus(null);
          setSessionId(null);
        }, 5000);
      } else {
        // Continue polling
        setTimeout(() => pollEnrollmentStatus(sessionId), 1000);
      }
    } catch (error) {
      console.error("Status polling error:", error);
      setIsEnrolling(false);
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case "connecting":
        return (
          <svg
            className="animate-spin w-5 h-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        );
      case "capturing":
        return (
          <svg
            className="w-5 h-5 text-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 2v12a2 2 0 002 2h6a2 2 0 002-2V6H7z"
            />
          </svg>
        );
      case "completed":
        return (
          <svg
            className="w-5 h-5 text-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "error":
        return (
          <svg
            className="w-5 h-5 text-destructive"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-5 h-5 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
            />
          </svg>
        );
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Fingerprint Enrollment
        </h3>
        <div className="text-sm text-muted-foreground">
          Employee: {employeeName}
        </div>
      </div>

      {!isEnrolling && !status && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Select Finger
            </label>
            <select
              value={selectedFinger}
              onChange={(e) => setSelectedFinger(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-input bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
            >
              {fingerNames.map((name, index) => (
                <option key={index} value={index}>
                  {name} ({index})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={startEnrollment}
            className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Start Fingerprint Enrollment
          </button>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Ensure the ZKTeco device is connected</p>
            <p>• Clean your finger before scanning</p>
            <p>• You will need to scan 3 times for enrollment</p>
          </div>
        </div>
      )}

      {status && (
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            {getStageIcon(status.stage)}
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">
                {status.message}
              </div>
              {status.stage === "capturing" && (
                <div className="text-xs text-muted-foreground mt-1">
                  Sample {status.samplesCollected} of {status.samplesRequired}
                </div>
              )}
            </div>
          </div>

          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                status.stage === "error"
                  ? "bg-destructive"
                  : status.stage === "completed"
                  ? "bg-foreground"
                  : "bg-primary"
              }`}
              style={{ width: `${status.progress}%` }}
            />
          </div>

          {status.stage === "capturing" && (
            <div className="bg-secondary border border-border rounded-lg p-3">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-foreground mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <span className="text-sm text-foreground">
                  Place your finger firmly on the scanner and hold steady
                </span>
              </div>
            </div>
          )}

          {status.stage === "error" && status.error && (
            <div className="bg-secondary border border-border rounded-lg p-3">
              <div className="text-sm text-destructive">
                <strong>Error:</strong> {status.error}
              </div>
            </div>
          )}

          {status.stage === "completed" && (
            <div className="bg-secondary border border-border rounded-lg p-3">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-foreground mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm text-foreground">
                  Fingerprint enrollment completed successfully!
                </span>
              </div>
            </div>
          )}

          {(status.stage === "error" || status.stage === "completed") && (
            <button
              onClick={() => {
                setStatus(null);
                setSessionId(null);
                setIsEnrolling(false);
              }}
              className="w-full bg-secondary text-foreground py-2 px-4 rounded-lg hover:bg-secondary/80 transition-colors border border-border"
            >
              Close
            </button>
          )}
        </div>
      )}
    </div>
  );
}
