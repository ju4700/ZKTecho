#!/usr/bin/env node

// Test ZKTeco connection directly with multiple configurations
const ZKLib = require('zklib');

const configs = [
  {
    name: 'Standard UDP',
    ip: '192.168.1.13',
    port: 4370,
    inport: 5203,
    timeout: 10000,
    connectionType: 'udp'
  },
  {
    name: 'TCP Connection',
    ip: '192.168.1.13',
    port: 4370,
    inport: 5204,
    timeout: 10000,
    connectionType: 'tcp'
  },
  {
    name: 'Different Inport',
    ip: '192.168.1.13',
    port: 4370,
    inport: 5000,
    timeout: 10000,
    connectionType: 'udp'
  }
];

async function testConfig(config) {
  return new Promise((resolve) => {
    console.log(`\n🔧 Testing configuration: ${config.name}`);
    console.log('Config:', config);
    
    const zk = new ZKLib(config);
    
    const timeout = setTimeout(() => {
      console.log(`❌ ${config.name}: Timeout after ${config.timeout}ms`);
      resolve(false);
    }, config.timeout + 1000);
    
    zk.connect((err) => {
      clearTimeout(timeout);
      
      if (err) {
        console.log(`❌ ${config.name}: Connection failed -`, err.message);
        resolve(false);
        return;
      }
      
      console.log(`✅ ${config.name}: Connected successfully!`);
      
      // Quick test to get device info
      zk.serialNumber((err, serialNumber) => {
        if (!err && serialNumber) {
          console.log(`📱 ${config.name}: Device Serial -`, serialNumber);
        }
        
        zk.disconnect();
        console.log(`🔌 ${config.name}: Disconnected`);
        resolve(true);
      });
    });
  });
}

async function runTests() {
  console.log('� Starting ZKTeco connection tests...\n');
  
  for (const config of configs) {
    const success = await testConfig(config);
    if (success) {
      console.log(`\n🎉 SUCCESS! Use this configuration in your app:`);
      console.log(`ZKTECO_IP=${config.ip}`);
      console.log(`ZKTECO_PORT=${config.port}`);
      console.log(`Inport: ${config.inport}`);
      console.log(`Connection Type: ${config.connectionType}`);
      process.exit(0);
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n❌ All connection tests failed.');
  console.log('\n💡 Possible solutions:');
  console.log('1. Check device communication settings (TCP/IP mode, Server mode)');
  console.log('2. Verify device firmware supports network communication');
  console.log('3. Try accessing device web interface at http://192.168.1.13');
  console.log('4. Check device manual for specific network configuration');
  
  process.exit(1);
}

runTests();