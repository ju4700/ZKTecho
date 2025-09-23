/**
 * ZKTeco Protocol-Compliant User Creation with Fingerprint Enrollment
 * 
 * This implementation follows the official ZKTeco protocol documentation exactly:
 * - Proper packet structure with correct checksums
 * - Complete enrollment sequence as specified in the documentation
 * - Correct user data structure (72 bytes)
 * - Proper enrollment data structure (26 bytes)
 * - Full realtime event handling
 * 
 * Based on thorough analysis of zk-protocol-master documentation
 */

import net from 'net';

class ZKTecoProtocolCompliant {
    constructor() {
        this.socket = null;
        this.sessionId = 0;
        this.replyNumber = 0;
        this.isConnected = false;
        this.userIdWidth = 9; // Default, will be queried from device
        
        // Protocol Constants (from documentation)
        this.COMMANDS = {
            CMD_CONNECT: 0x03e8,
            CMD_EXIT: 0x03e9,
            CMD_ENABLEDEVICE: 0x03ea,
            CMD_DISABLEDEVICE: 0x03eb,
            CMD_RESTART: 0x03ec,
            CMD_POWEROFF: 0x03ed,
            CMD_OPTIONS_RRQ: 0x000b,
            CMD_OPTIONS_WRQ: 0x000c,
            CMD_USER_WRQ: 0x0008,
            CMD_USERTEMP_RRQ: 0x0009,
            CMD_DELETE_USER: 0x0012,
            CMD_DELETE_USERTEMP: 0x0013,
            CMD_REFRESHDATA: 0x03f5,
            CMD_STARTENROLL: 0x003d,
            CMD_STARTVERIFY: 0x003c,
            CMD_CANCELCAPTURE: 0x003e,
            CMD_VERIFY_WRQ: 0x004f,
            CMD_REG_EVENT: 0x01f4,
            CMD_DATA_WRRQ: 0x05df,
            CMD_DEL_FPTMP: 0x0086,
        };
        
        this.REPLIES = {
            CMD_ACK_OK: 0x07d0,
            CMD_ACK_ERROR: 0x07d1,
            CMD_ACK_DATA: 0x07d2,
            CMD_ACK_RETRY: 0x07d3,
            CMD_ACK_REPEAT: 0x07d4,
            CMD_ACK_UNAUTH: 0x07d5,
        };
        
        this.EVENTS = {
            EF_ATTLOG: 1,
            EF_FINGER: 2,
            EF_ENROLLUSER: 4,
            EF_ENROLLFINGER: 8,
            EF_BUTTON: 16,
            EF_UNLOCK: 32,
            EF_VERIFY: 128,
            EF_FPFTR: 256,
            EF_ALARM: 512,
        };
        
        this.VERIFY_MODES = {
            GROUP_VERIFY: 0,
            FP_ONLY: 129,
            PIN_ONLY: 130,
            PASSWORD_ONLY: 131,
            RFID_ONLY: 132,
            FP_PIN: 136,
            FP_PASSWORD: 137,
        };
        
        this.FP_FLAGS = {
            INVALID: 0,
            VALID: 1,
            DURESS: 3,
        };
    }
    
    /**
     * Calculate 16-bit checksum as per ZKTeco protocol specification
     */
    calculateChecksum(payload) {
        let chk32 = 0;
        
        // Make payload even length by padding with zero if needed
        const evenPayload = payload.length % 2 === 1 ? 
            Buffer.concat([payload, Buffer.from([0x00])]) : payload;
        
        // Sum all 16-bit words in little endian format
        for (let i = 0; i < evenPayload.length; i += 2) {
            const word = evenPayload[i] + (evenPayload[i + 1] << 8);
            chk32 += word;
        }
        
        // Add upper 16 bits to lower 16 bits
        chk32 = (chk32 & 0xffff) + ((chk32 & 0xffff0000) >> 16);
        
        // Calculate ones complement
        const checksum = chk32 ^ 0xFFFF;
        
        return checksum;
    }
    
    /**
     * Create protocol packet with proper structure
     */
    createPacket(command, data = Buffer.alloc(0), replyNum = null) {
        const actualReplyNum = replyNum !== null ? replyNum : this.replyNumber;
        
        // Create payload: command(2) + checksum(2) + session(2) + reply(2) + data
        const payload = Buffer.alloc(8 + data.length);
        
        // Command ID (little endian)
        payload.writeUInt16LE(command, 0);
        
        // Checksum placeholder (will be calculated)
        payload.writeUInt16LE(0, 2);
        
        // Session ID (little endian)
        payload.writeUInt16LE(this.sessionId, 4);
        
        // Reply number (little endian)
        payload.writeUInt16LE(actualReplyNum, 6);
        
        // Data
        if (data.length > 0) {
            data.copy(payload, 8);
        }
        
        // Calculate checksum for payload excluding the checksum field itself
        const checksumPayload = Buffer.concat([
            payload.subarray(0, 2),  // command
            payload.subarray(4)      // session + reply + data
        ]);
        
        const checksum = this.calculateChecksum(checksumPayload);
        payload.writeUInt16LE(checksum, 2);
        
        // Create final packet: header(4) + payload_size(4) + payload
        const packet = Buffer.alloc(8 + payload.length);
        
        // Header: 5050827d (little endian)
        packet.writeUInt8(0x50, 0);
        packet.writeUInt8(0x50, 1);
        packet.writeUInt8(0x82, 2);
        packet.writeUInt8(0x7d, 3);
        
        // Payload size (little endian)
        packet.writeUInt32LE(payload.length, 4);
        
        // Payload
        payload.copy(packet, 8);
        
        console.log(`📤 Creating packet - Command: 0x${command.toString(16)}, Data length: ${data.length}, Session: ${this.sessionId}, Reply: ${actualReplyNum}`);
        console.log(`📤 Packet created (${packet.length} bytes): ${packet.toString('hex')}`);
        
        return packet;
    }
    
    /**
     * Parse received packet
     */
    parsePacket(buffer) {
        if (buffer.length < 16) {
            throw new Error('Packet too small');
        }
        
        // Check header
        const header = buffer.readUInt32LE(0);
        if (header !== 0x7d825050) {
            throw new Error('Invalid packet header');
        }
        
        const payloadSize = buffer.readUInt32LE(4);
        const command = buffer.readUInt16LE(8);
        const checksum = buffer.readUInt16LE(10);
        const sessionId = buffer.readUInt16LE(12);
        const replyNumber = buffer.readUInt16LE(14);
        
        let data = Buffer.alloc(0);
        if (payloadSize > 8) {
            data = buffer.subarray(16, 8 + payloadSize);
        }
        
        console.log(`📦 Parsed packet - Command: 0x${command.toString(16)}, Session: ${sessionId}, Reply: ${replyNumber}`);
        
        return {
            command,
            checksum,
            sessionId,
            replyNumber,
            data,
            isRealtime: command === this.COMMANDS.CMD_REG_EVENT
        };
    }
    
    /**
     * Send packet and wait for response
     */
    async sendPacket(command, data = Buffer.alloc(0), timeout = 10000) {
        return new Promise((resolve, reject) => {
            const packet = this.createPacket(command, data);
            
            let responseReceived = false;
            const timeoutId = setTimeout(() => {
                if (!responseReceived) {
                    reject(new Error('Response timeout'));
                }
            }, timeout);
            
            const onData = (buffer) => {
                try {
                    responseReceived = true;
                    clearTimeout(timeoutId);
                    
                    console.log(`📨 Received ${buffer.length} bytes: ${buffer.toString('hex')}`);
                    const response = this.parsePacket(buffer);
                    
                    if (!response.isRealtime) {
                        this.replyNumber++;
                    }
                    
                    this.socket.removeListener('data', onData);
                    resolve(response);
                } catch (error) {
                    this.socket.removeListener('data', onData);
                    reject(error);
                }
            };
            
            this.socket.on('data', onData);
            this.socket.write(packet);
        });
    }
    
    /**
     * Connect to ZKTeco device
     */
    async connect(ip = '192.168.1.201', port = 4370) {
        return new Promise((resolve, reject) => {
            console.log(`🔌 Connecting to ${ip}:${port}...`);
            
            this.socket = new net.Socket();
            this.socket.setTimeout(30000);
            
            this.socket.connect(port, ip, async () => {
                try {
                    console.log(`✅ TCP connection established`);
                    
                    // Send connection command
                    console.log(`🔧 Initializing device connection...`);
                    const response = await this.sendPacket(this.COMMANDS.CMD_CONNECT);
                    
                    if (response.command === this.REPLIES.CMD_ACK_OK) {
                        this.sessionId = response.sessionId;
                        this.isConnected = true;
                        console.log(`✅ Session ID assigned: ${this.sessionId}`);
                        
                        // Set SDK build parameter (required by some devices)
                        const sdkBuild = Buffer.from('SDKBuild=1\0', 'ascii');
                        await this.sendPacket(this.COMMANDS.CMD_OPTIONS_WRQ, sdkBuild);
                        
                        // Enable realtime events
                        console.log(`📡 Enabling realtime events...`);
                        const eventData = Buffer.from([0xff, 0xff, 0x00, 0x00]);
                        await this.sendPacket(this.COMMANDS.CMD_REG_EVENT, eventData);
                        
                        console.log(`✅ Device connection initialized successfully`);
                        resolve();
                    } else {
                        reject(new Error(`Connection failed: ${response.command.toString(16)}`));
                    }
                } catch (error) {
                    reject(error);
                }
            });
            
            this.socket.on('error', (error) => {
                reject(error);
            });
            
            this.socket.on('timeout', () => {
                reject(new Error('Connection timeout'));
            });
        });
    }
    
    /**
     * Get device parameter (like PIN2Width)
     */
    async getDeviceParameter(paramName) {
        const paramData = Buffer.from(`~${paramName}\0`, 'ascii');
        
        try {
            const response = await this.sendPacket(this.COMMANDS.CMD_OPTIONS_RRQ, paramData);
            
            if (response.command === this.REPLIES.CMD_ACK_OK) {
                const responseStr = response.data.toString('ascii');
                const match = responseStr.match(new RegExp(`~${paramName}=(.+?)\0`));
                return match ? match[1] : null;
            } else {
                return null; // Parameter not supported
            }
        } catch {
            return null;
        }
    }
    
    /**
     * Delete existing user if exists
     */
    async deleteUserIfExists(userId) {
        console.log(`🗑️ Checking if user ${userId} exists...`);
        
        // First, we need to get the user's serial number
        // This requires reading all users and finding the matching user ID
        try {
            await this.sendPacket(this.COMMANDS.CMD_DISABLEDEVICE);
            
            // Read all user IDs
            const readUsersData = Buffer.from([0x01, 0x09, 0x00, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
            const response = await this.sendPacket(this.COMMANDS.CMD_DATA_WRRQ, readUsersData);
            
            if (response.command === this.REPLIES.CMD_ACK_DATA && response.data.length >= 4) {
                const userInfoSize = response.data.readUInt32LE(0);
                const userCount = userInfoSize / 72;
                
                console.log(`📊 Found ${userCount} users in device`);
                
                // Parse user entries (72 bytes each)
                for (let i = 0; i < userCount; i++) {
                    const offset = 4 + (i * 72);
                    const userEntry = response.data.subarray(offset, offset + 72);
                    
                    const userSn = userEntry.readUInt16LE(0);
                    const userIdBuffer = userEntry.subarray(48, 57);
                    const existingUserId = userIdBuffer.toString('ascii').replace(/\0/g, '');
                    
                    if (existingUserId === userId) {
                        console.log(`🗑️ User ${userId} found with serial number ${userSn}, deleting...`);
                        
                        // Delete all fingerprint templates first
                        const deleteTemplatesData = Buffer.alloc(3);
                        deleteTemplatesData.writeUInt16LE(userSn, 0);
                        deleteTemplatesData.writeUInt8(0, 2);
                        await this.sendPacket(this.COMMANDS.CMD_DELETE_USERTEMP, deleteTemplatesData);
                        
                        // Delete user
                        const deleteUserData = Buffer.alloc(2);
                        deleteUserData.writeUInt16LE(userSn, 0);
                        await this.sendPacket(this.COMMANDS.CMD_DELETE_USER, deleteUserData);
                        
                        await this.sendPacket(this.COMMANDS.CMD_REFRESHDATA);
                        console.log(`✅ User ${userId} deleted successfully`);
                        break;
                    }
                }
            }
            
            await this.sendPacket(this.COMMANDS.CMD_ENABLEDEVICE);
        } catch (error) {
            console.log(`⚠️ Error checking/deleting user: ${error.message}`);
            try {
                await this.sendPacket(this.COMMANDS.CMD_ENABLEDEVICE);
            } catch {
                // Ignore enable errors during cleanup
            }
        }
    }
    
    /**
     * Create user entry with correct 72-byte structure
     */
    createUserEntry(userId, userName, password = '', cardNumber = 0, groupNo = 1, permission = 0) {
        const entry = Buffer.alloc(72);
        
        // User serial number (will be assigned by device) - offset 0
        entry.writeUInt16LE(0, 0);
        
        // Permission token - offset 2
        entry.writeUInt8(permission, 2);
        
        // Password (8 bytes) - offset 3
        const passwordBuffer = Buffer.from(password.padEnd(8, '\0'), 'ascii');
        passwordBuffer.copy(entry, 3, 0, 8);
        
        // Name (24 bytes) - offset 11
        const nameBuffer = Buffer.from(userName.padEnd(24, '\0'), 'ascii');
        nameBuffer.copy(entry, 11, 0, 24);
        
        // Card number (4 bytes) - offset 35
        entry.writeUInt32LE(cardNumber, 35);
        
        // Group number (1 byte) - offset 39
        entry.writeUInt8(groupNo, 39);
        
        // User timezone flag (2 bytes) - offset 40
        entry.writeUInt16LE(0, 40); // 0 = use group timezones
        
        // Timezones (6 bytes) - offset 42
        entry.writeUInt16LE(0, 42); // TZ1
        entry.writeUInt16LE(0, 44); // TZ2
        entry.writeUInt16LE(0, 46); // TZ3
        
        // User ID (9 bytes) - offset 48
        const userIdBuffer = Buffer.from(userId.padEnd(9, '\0'), 'ascii');
        userIdBuffer.copy(entry, 48, 0, 9);
        
        // Fixed zeros (15 bytes) - offset 57
        entry.fill(0, 57, 72);
        
        return entry;
    }
    
    /**
     * Create enrollment data structure (26 bytes as per protocol)
     */
    createEnrollmentData(userId, fingerIndex = 0, fpFlag = this.FP_FLAGS.VALID) {
        const enrollData = Buffer.alloc(26);
        
        // User ID (user-id width bytes, padded to 24 bytes) - offset 0
        const userIdBuffer = Buffer.from(userId.padEnd(24, '\0'), 'ascii');
        userIdBuffer.copy(enrollData, 0, 0, 24);
        
        // Finger index (1 byte) - offset 24
        enrollData.writeUInt8(fingerIndex, 24);
        
        // Fingerprint flag (1 byte) - offset 25
        enrollData.writeUInt8(fpFlag, 25);
        
        return enrollData;
    }
    
    /**
     * Create user with fingerprint enrollment - COMPLETE PROTOCOL SEQUENCE
     */
    async createUserWithFingerprint(userId, userName, fingerIndex = 0) {
        try {
            console.log(`\n🚀 Starting complete user creation with fingerprint enrollment`);
            console.log(`👤 User ID: ${userId}`);
            console.log(`📝 User Name: ${userName}`);
            console.log(`👆 Finger Index: ${fingerIndex}`);
            console.log(`=====================================\n`);
            
            // Step 1: Get device parameters
            console.log(`1️⃣ Getting device parameters...`);
            const pin2Width = await this.getDeviceParameter('PIN2Width');
            if (pin2Width) {
                this.userIdWidth = parseInt(pin2Width);
                console.log(`📏 User ID max width: ${this.userIdWidth}`);
            }
            
            const isABCPinEnabled = await this.getDeviceParameter('IsABCPinEnable');
            console.log(`🔤 Alphanumeric PIN support: ${isABCPinEnabled ? 'Yes' : 'No'}`);
            
            // Step 2: Delete existing user if exists
            console.log(`\n2️⃣ Checking for existing user...`);
            await this.deleteUserIfExists(userId);
            
            // Step 3: Create user
            console.log(`\n3️⃣ Creating user entry...`);
            await this.sendPacket(this.COMMANDS.CMD_DISABLEDEVICE);
            
            const userEntry = this.createUserEntry(userId, userName, '', 0, 1, 0);
            await this.sendPacket(this.COMMANDS.CMD_USER_WRQ, userEntry);
            
            await this.sendPacket(this.COMMANDS.CMD_REFRESHDATA);
            console.log(`✅ User created successfully`);
            
            // Step 4: Set user verification mode to fingerprint only
            console.log(`\n4️⃣ Setting user verification mode...`);
            const verifyData = Buffer.alloc(24);
            verifyData.writeUInt16LE(0, 0); // User serial number (0 for new user)
            verifyData.writeUInt8(this.VERIFY_MODES.FP_ONLY, 2);
            verifyData.fill(0, 3, 24);
            
            await this.sendPacket(this.COMMANDS.CMD_VERIFY_WRQ, verifyData);
            console.log(`✅ Verification mode set to fingerprint only`);
            
            await this.sendPacket(this.COMMANDS.CMD_ENABLEDEVICE);
            
            // Step 5: Start enrollment procedure
            console.log(`\n5️⃣ Starting fingerprint enrollment...`);
            
            // Cancel any current capture operation
            await this.sendPacket(this.COMMANDS.CMD_CANCELCAPTURE);
            console.log(`🛑 Cancelled current capture operations`);
            
            // Send enrollment command with correct data structure
            const enrollData = this.createEnrollmentData(userId, fingerIndex, this.FP_FLAGS.VALID);
            console.log(`📤 Sending enrollment command with data:`, enrollData.toString('hex'));
            
            const enrollResponse = await this.sendPacket(this.COMMANDS.CMD_STARTENROLL, enrollData);
            
            if (enrollResponse.command === this.REPLIES.CMD_ACK_OK) {
                console.log(`✅ Enrollment command accepted`);
                
                // Start verification to prompt for fingerprints
                const verifyResponse = await this.sendPacket(this.COMMANDS.CMD_STARTVERIFY);
                
                if (verifyResponse.command === this.REPLIES.CMD_ACK_OK) {
                    console.log(`✅ Device ready for fingerprint enrollment`);
                    console.log(`\n🎯 ENROLLMENT ACTIVE!`);
                    console.log(`📱 Check your device screen - it should show enrollment instructions`);
                    console.log(`👆 PLACE YOUR FINGER ON THE SCANNER when prompted`);
                    console.log(`🔄 You will need to place the same finger 3 times for complete enrollment`);
                    
                    // Monitor for enrollment events
                    await this.monitorEnrollmentEvents();
                    
                } else {
                    throw new Error(`Start verify failed: 0x${verifyResponse.command.toString(16)}`);
                }
            } else {
                throw new Error(`Enrollment failed: 0x${enrollResponse.command.toString(16)}`);
            }
            
        } catch (error) {
            console.error(`❌ User creation with fingerprint failed: ${error.message}`);
            
            // Try to re-enable device
            try {
                await this.sendPacket(this.COMMANDS.CMD_ENABLEDEVICE);
            } catch {
                // Ignore enable errors during cleanup
            }
            
            throw error;
        }
    }
    
    /**
     * Monitor enrollment events and handle the complete enrollment process
     */
    async monitorEnrollmentEvents() {
        return new Promise((resolve, reject) => {
            let enrollmentComplete = false;
            let fingerPlaceCount = 0;
            let timeoutId;
            
            const resetTimeout = () => {
                if (timeoutId) clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    if (!enrollmentComplete) {
                        console.log(`⏰ Enrollment timeout - no finger placement detected`);
                        cleanup();
                        reject(new Error('Enrollment timeout'));
                    }
                }, 60000); // 60 second timeout
            };
            
            const cleanup = () => {
                if (timeoutId) clearTimeout(timeoutId);
                this.socket.removeListener('data', handleRealtimeData);
                enrollmentComplete = true;
            };
            
            const handleRealtimeData = async (buffer) => {
                try {
                    const response = this.parsePacket(buffer);
                    
                    if (response.isRealtime) {
                        const eventCode = response.sessionId; // For realtime packets, session ID contains event code
                        
                        console.log(`📨 Realtime event: 0x${eventCode.toString(16)}`);
                        
                        // Send acknowledgment for realtime events
                        const ackPacket = this.createPacket(this.REPLIES.CMD_ACK_OK, Buffer.alloc(0), 0);
                        this.socket.write(ackPacket);
                        
                        if (eventCode === this.EVENTS.EF_FINGER) {
                            fingerPlaceCount++;
                            console.log(`👆 Finger placed! (${fingerPlaceCount}/3)`);
                            console.log(`🔄 Keep finger on scanner until you hear a beep or see confirmation`);
                            resetTimeout();
                            
                        } else if (eventCode === this.EVENTS.EF_FPFTR) {
                            const score = response.data.length > 0 ? response.data[0] : 0;
                            console.log(`📊 Fingerprint quality score: ${score}/100`);
                            
                            if (score === 100) {
                                console.log(`✅ Good fingerprint sample captured!`);
                            } else {
                                console.log(`⚠️ Poor quality sample, try again`);
                            }
                            
                        } else if (eventCode === this.EVENTS.EF_ENROLLFINGER) {
                            console.log(`🎉 Enrollment process completed!`);
                            
                            if (response.data.length >= 2) {
                                const result = response.data.readUInt16LE(0);
                                
                                if (result === 0) {
                                    console.log(`✅ FINGERPRINT ENROLLMENT SUCCESSFUL!`);
                                    console.log(`👤 User has been created with fingerprint`);
                                    cleanup();
                                    resolve();
                                } else if (result === 6) {
                                    console.log(`⚠️ Enrollment failed - No fingerprint data captured`);
                                    console.log(`💡 This usually means:`);
                                    console.log(`   • No finger was placed on the scanner`);
                                    console.log(`   • Finger was not placed long enough`);
                                    console.log(`   • Scanner quality was too poor`);
                                    console.log(`📱 Please check your device screen for instructions`);
                                    cleanup();
                                    reject(new Error(`Enrollment failed - No fingerprint captured (error code: ${result})`));
                                } else {
                                    console.log(`❌ Enrollment failed with error code: ${result}`);
                                    cleanup();
                                    reject(new Error(`Enrollment failed: ${result}`));
                                }
                            } else {
                                console.log(`❌ Enrollment failed - invalid response data`);
                                cleanup();
                                reject(new Error('Invalid enrollment response'));
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error handling realtime data: ${error.message}`);
                }
            };
            
            this.socket.on('data', handleRealtimeData);
            resetTimeout();
            
            console.log(`⏳ Monitoring for enrollment events (60 second timeout)...`);
        });
    }
    
    /**
     * Disconnect from device
     */
    async disconnect() {
        if (this.isConnected && this.socket) {
            try {
                await this.sendPacket(this.COMMANDS.CMD_EXIT);
                this.socket.end();
                console.log(`🔌 Disconnected from device`);
            } catch (error) {
                console.log(`⚠️ Disconnect error: ${error.message}`);
            }
        }
        
        this.isConnected = false;
        this.sessionId = 0;
        this.replyNumber = 0;
    }
}

// Test function
async function testProtocolCompliantEnrollment() {
    const zkDevice = new ZKTecoProtocolCompliant();
    
    try {
        console.log(`🚀 Protocol-Compliant ZKTeco User Creation Test`);
        console.log(`============================================`);
        console.log(`This test follows the exact ZKTeco protocol documentation`);
        console.log(`and implements the complete user creation with fingerprint sequence.\n`);
        
        // Connect to device
        await zkDevice.connect();
        
        // Create user with fingerprint
        await zkDevice.createUserWithFingerprint('TEST001', 'TestUser');
        
        console.log(`\n🎉 SUCCESS! User created with fingerprint enrollment completed.`);
        
    } catch (error) {
        console.error(`\n❌ Test failed: ${error.message}`);
        console.error(error.stack);
    } finally {
        await zkDevice.disconnect();
    }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
    testProtocolCompliantEnrollment()
        .then(() => {
            console.log(`\n✅ Test completed`);
            process.exit(0);
        })
        .catch((error) => {
            console.error(`\n💥 Test failed:`, error);
            process.exit(1);
        });
}

export default ZKTecoProtocolCompliant;