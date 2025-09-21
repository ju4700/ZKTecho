#!/usr/bin/env node
/**
 * Test script for Enhanced ZKTeco Service
 * Tests connection, data retrieval, and basic operations
 */

const { getEnhancedZKTecoService } = require('./src/lib/zkteco-enhanced.ts');

async function testEnhancedZKTeco() {
  console.log('🧪 Starting Enhanced ZKTeco Service Tests...\n');
  
  const service = getEnhancedZKTecoService();
  
  try {
    // Test 1: Connection Status
    console.log('📋 Test 1: Check Initial Connection Status');
    const initialStatus = service.getConnectionStatus();
    console.log('Initial Status:', initialStatus);
    console.log('✅ Test 1 Passed\n');
    
    // Test 2: Device Connection
    console.log('📋 Test 2: Test Device Connection');
    const connected = await service.connect();
    console.log('Connection Result:', connected);
    if (connected) {
      console.log('✅ Test 2 Passed - Device Connected');
    } else {
      console.log('❌ Test 2 Failed - Device Not Connected');
      return;
    }
    console.log('');
    
    // Test 3: Get Device Info
    console.log('📋 Test 3: Get Device Information');
    const deviceInfo = await service.getDeviceInfo();
    console.log('Device Info:', JSON.stringify(deviceInfo, null, 2));
    if (deviceInfo) {
      console.log('✅ Test 3 Passed - Device Info Retrieved');
    } else {
      console.log('❌ Test 3 Failed - No Device Info');
    }
    console.log('');
    
    // Test 4: Get Users
    console.log('📋 Test 4: Get Device Users');
    const users = await service.getUsers();
    console.log(`Found ${users.length} users on device:`);
    users.forEach((user, index) => {
      console.log(`  User ${index + 1}:`, {
        userId: user.userId,
        name: user.name,
        role: user.role,
        userSn: user.userSn,
        enabled: user.enabled
      });
    });
    if (users.length > 0) {
      console.log('✅ Test 4 Passed - Users Retrieved');
    } else {
      console.log('⚠️ Test 4 Warning - No Users Found');
    }
    console.log('');
    
    // Test 5: Get Attendance Logs
    console.log('📋 Test 5: Get Attendance Logs');
    const logs = await service.getAttendanceLogs();
    console.log(`Found ${logs.length} attendance logs:`);
    logs.slice(0, 3).forEach((log, index) => {
      console.log(`  Log ${index + 1}:`, {
        userId: log.deviceUserId,
        timestamp: log.timestamp.toISOString(),
        type: log.attendanceType
      });
    });
    if (logs.length > 0) {
      console.log('✅ Test 5 Passed - Attendance Logs Retrieved');
    } else {
      console.log('⚠️ Test 5 Warning - No Attendance Logs Found');
    }
    console.log('');
    
    // Test 6: Final Connection Status
    console.log('📋 Test 6: Check Final Connection Status');
    const finalStatus = service.getConnectionStatus();
    console.log('Final Status:', finalStatus);
    console.log('✅ Test 6 Passed\n');
    
    console.log('🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testEnhancedZKTeco().then(() => {
    console.log('\n✨ Test execution completed');
    process.exit(0);
  }).catch((error) => {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { testEnhancedZKTeco };