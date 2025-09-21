import { NextResponse } from 'next/server';

export async function GET() {
  console.log('🧪 [Test Status] Called test endpoint');
  
  const testResponse = {
    isConnected: true,
    connectionStatus: {
      isConnected: true,
      lastConnected: new Date().toISOString(),
      type: "test-endpoint"
    },
    deviceInfo: {
      serialNumber: "TEST-001",
      deviceName: "Test Device",
      userCount: 99,
      attendanceLogCount: 999,
      deviceTime: new Date().toISOString()
    },
    lastSync: new Date().toISOString()
  };
  
  console.log('🧪 [Test Status] Returning response:', testResponse);
  
  return NextResponse.json(testResponse);
}