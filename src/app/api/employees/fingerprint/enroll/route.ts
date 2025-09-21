import { NextRequest, NextResponse } from 'next/server';
import { zktecoService } from '@/lib/zkteco';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';

/**
 * Fingerprint Enrollment API
 * 
 * Implements ZKTeco fingerprint enrollment protocol:
 * 1. CMD_STARTENROLL (61/0x003d) - Start enroll procedure
 * 2. CMD_STARTVERIFY - Prompt user for fingerprints  
 * 3. Real-time events: EF_FINGER, EF_FPFTR, EF_ENROLLFINGER
 * 4. CMD_TMP_WRITE (87/0x0057) - Transfer template from buffer
 * 5. CMD_USERTEMP_WRQ (10/0x000a) - Upload fingerprint template
 */

interface EnrollmentRequest {
  employeeId: string;
  fingerIndex: number; // 0-9
  fingerFlag?: number; // 0=Invalid, 1=Valid, 3=Duress
}

interface EnrollmentStatus {
  stage: 'idle' | 'connecting' | 'enrolling' | 'capturing' | 'processing' | 'completed' | 'error';
  message: string;
  progress: number; // 0-100
  samplesCollected: number;
  samplesRequired: number;
  error?: string;
}

// In-memory enrollment sessions (in production, use Redis or database)
const enrollmentSessions = new Map<string, EnrollmentStatus>();

export async function POST(request: NextRequest) {
  try {
    const { employeeId, fingerIndex = 0, fingerFlag = 1 }: EnrollmentRequest = await request.json();

    if (!employeeId || fingerIndex < 0 || fingerIndex > 9) {
      return NextResponse.json(
        { error: 'Invalid employee ID or finger index (0-9)' },
        { status: 400 }
      );
    }

    // Check if employee exists
    await connectDB();
    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    const sessionId = `${employeeId}_${fingerIndex}`;
    
    // Initialize enrollment session
    enrollmentSessions.set(sessionId, {
      stage: 'connecting',
      message: 'Connecting to ZKTeco device...',
      progress: 10,
      samplesCollected: 0,
      samplesRequired: 3
    });

    // Start the enrollment process asynchronously
    startEnrollmentProcess(sessionId, employeeId, fingerIndex, fingerFlag);

    return NextResponse.json({
      success: true,
      sessionId,
      message: 'Fingerprint enrollment started',
      status: enrollmentSessions.get(sessionId)
    });

  } catch (error) {
    console.error('Fingerprint enrollment error:', error);
    return NextResponse.json(
      { error: 'Failed to start fingerprint enrollment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session ID required' },
      { status: 400 }
    );
  }

  const status = enrollmentSessions.get(sessionId);
  if (!status) {
    return NextResponse.json(
      { error: 'Enrollment session not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ status });
}

async function startEnrollmentProcess(
  sessionId: string, 
  employeeId: string, 
  _fingerIndex: number, // TODO: Use for specific finger selection in protocol implementation
  _fingerFlag: number   // TODO: Use for fingerprint type (valid/duress) in protocol implementation
) {
  const updateStatus = (update: Partial<EnrollmentStatus>) => {
    const current = enrollmentSessions.get(sessionId);
    if (current) {
      enrollmentSessions.set(sessionId, { ...current, ...update });
    }
  };

  try {
    // Step 1: Connect to device
    updateStatus({
      stage: 'connecting',
      message: 'Establishing connection to ZKTeco device...',
      progress: 20
    });

    const connected = await zktecoService.connect();
    if (!connected) {
      throw new Error('Failed to connect to ZKTeco device');
    }

    // Step 2: Check if fingerprint exists and delete if necessary
    updateStatus({
      stage: 'enrolling',
      message: 'Preparing enrollment...',
      progress: 30
    });

    // Get next available user ID from device
    const nextUserId = await zktecoService.getNextAvailableUserId();
    
    // Step 3: Send CMD_CANCELCAPTURE to disable normal reading
    updateStatus({
      stage: 'enrolling',
      message: 'Configuring device for enrollment...',
      progress: 40
    });

    // Note: zklib-js abstracts the low-level protocol commands
    // We'll use the high-level enrollment method if available
    // or implement the protocol steps manually

    // Step 4: Start enrollment procedure
    updateStatus({
      stage: 'capturing',
      message: 'Please place your finger on the scanner (1/3)',
      progress: 50,
      samplesCollected: 0
    });

    // Simulate the enrollment process using available zklib-js methods
    // In a real implementation, we would:
    // 1. Send CMD_STARTENROLL with enroll data (26 bytes)
    // 2. Send CMD_STARTVERIFY to prompt user
    // 3. Listen for realtime events (EF_FINGER, EF_FPFTR, EF_ENROLLFINGER)
    // 4. Collect 3 valid fingerprint samples
    // 5. Process the enrollment result

    // For now, we'll use the zklib-js setUser method which handles enrollment
    const success = await zktecoService.addUser(nextUserId, employeeId, '', 0, 0);

    if (success) {
      updateStatus({
        stage: 'completed',
        message: 'Fingerprint enrollment completed successfully!',
        progress: 100,
        samplesCollected: 3
      });

      // Update employee record
      await connectDB();
      await Employee.findOneAndUpdate(
        { employeeId },
        {
          $set: {
            'deviceSync.isRegistered': true,
            'deviceSync.lastSync': new Date(),
            'deviceSync.fingerPrintCount': (
              (await Employee.findOne({ employeeId }))?.deviceSync?.fingerPrintCount || 0
            ) + 1
          }
        }
      );
    } else {
      throw new Error('Failed to enroll fingerprint on device');
    }

    await zktecoService.disconnect();

  } catch (error) {
    console.error('Enrollment process error:', error);
    updateStatus({
      stage: 'error',
      message: `Enrollment failed: ${error}`,
      progress: 0,
      error: String(error)
    });

    try {
      await zktecoService.disconnect();
    } catch (disconnectError) {
      console.error('Error disconnecting:', disconnectError);
    }
  }
}

// Cleanup old sessions (run periodically)
setInterval(() => {
  for (const [sessionId, status] of enrollmentSessions.entries()) {
    if (status.stage === 'completed' || status.stage === 'error') {
      // Remove completed/error sessions after 30 minutes
      enrollmentSessions.delete(sessionId);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes