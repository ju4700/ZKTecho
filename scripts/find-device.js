#!/usr/bin/env node

const { exec } = require('child_process');
const net = require('net');

// Function to get network range
function getNetworkRange() {
  return new Promise((resolve) => {
    exec('ip route | grep -E "192.168|10.0|172.16"', (error, stdout) => {
      if (error) {
        console.log('Using default network ranges...');
        resolve(['192.168.1', '192.168.0']);
        return;
      }
      
      const networks = [];
      const lines = stdout.split('\n');
      lines.forEach(line => {
        const match = line.match(/(\d+\.\d+\.\d+)\.0\/24/);
        if (match) {
          networks.push(match[1]);
        }
      });
      
      resolve(networks.length > 0 ? networks : ['192.168.1', '192.168.0']);
    });
  });
}

// Function to scan a single IP
function scanIP(ip, port = 4370) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 2000;
    
    socket.setTimeout(timeout);
    
    socket.on('connect', () => {
      console.log(`✅ Found ZKTeco device at ${ip}:${port}`);
      socket.destroy();
      resolve(ip);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(null);
    });
    
    socket.on('error', () => {
      resolve(null);
    });
    
    socket.connect(port, ip);
  });
}

// Main scanning function
async function findZKTecoDevices() {
  console.log('🔍 Scanning for ZKTeco devices...');
  console.log('This may take a few minutes...\n');
  
  const networks = await getNetworkRange();
  console.log(`Scanning networks: ${networks.join(', ')}\n`);
  
  const foundDevices = [];
  
  for (const network of networks) {
    console.log(`Scanning ${network}.x network...`);
    const promises = [];
    
    // Scan common ZKTeco IP ranges
    for (let i = 1; i <= 254; i++) {
      const ip = `${network}.${i}`;
      promises.push(scanIP(ip));
    }
    
    const results = await Promise.all(promises);
    const devices = results.filter(ip => ip !== null);
    foundDevices.push(...devices);
  }
  
  console.log('\n' + '='.repeat(50));
  if (foundDevices.length > 0) {
    console.log('✅ Found ZKTeco devices:');
    foundDevices.forEach(ip => {
      console.log(`   • ${ip}:4370`);
    });
    
    console.log('\n📝 To use in your application:');
    console.log(`   Update your .env.local file:`);
    console.log(`   ZKTECO_IP=${foundDevices[0]}`);
  } else {
    console.log('❌ No ZKTeco devices found');
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Make sure the device is powered on');
    console.log('   2. Check network cables are connected');
    console.log('   3. Verify the device is on the same network');
    console.log('   4. Try accessing the device web interface in browser');
  }
  console.log('='.repeat(50));
}

// Run the scanner
findZKTecoDevices().catch(console.error);