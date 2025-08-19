# ZKTeco K40 Attendance Management System Setup

## Prerequisites
1. MongoDB installed and running locally
2. ZKTeco K40 device connected to your local network
3. Node.js and npm installed

## Database Setup
1. Start MongoDB service on your system
2. The application will automatically connect to `mongodb://localhost:27017/zkteco-attendance`
3. Database and collections will be created automatically

## Application Setup
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Access the application at `http://localhost:3000`

## ZKTeco Device Configuration
1. Connect your ZKTeco K40 to the same network as your computer
2. Note the device IP address (usually found in device settings)
3. Use the "Device Discovery" feature in the app to automatically find the device
4. Or manually connect using the device IP address

## System Features

### Employee Management
- **Add Employee**: Name, phone number, monthly salary
- **Fingerprint Enrollment**: Register employee fingerprints directly on the device
- **Device Sync**: Add/remove employees from ZKTeco device
- **Simplified Profile**: Minimalistic approach focused on attendance tracking

### Attendance Tracking
- **Automatic Sync**: Pull attendance data from ZKTeco device
- **Check In/Out Logic**: Alternating punch records
- **Real-time Updates**: Live attendance monitoring
- **Device Integration**: Direct communication with biometric device

### Salary Calculation
- **Monthly Based**: Salaries calculated from monthly rates
- **Attendance Tracking**: Links attendance to salary calculations
- **Fingerprint Enrollment Date**: Salary calculations start from enrollment date

## Workflow
1. **Add Employee** → Enter basic information (name, phone, monthly salary)
2. **Register on Device** → Add employee to ZKTeco device for fingerprint enrollment
3. **Enroll Fingerprint** → Employee enrolls fingerprint on the device
4. **Track Attendance** → System automatically syncs attendance data
5. **Calculate Salary** → Monthly salary calculations based on attendance

## Network Configuration
- Ensure ZKTeco device and computer are on the same network
- Default device discovery scans common IP ranges (192.168.x.x, 10.0.x.x)
- Device typically uses port 4370 for communication

## Troubleshooting
- **Device Not Found**: Check network connection and IP address
- **Database Connection**: Ensure MongoDB is running locally
- **Fingerprint Issues**: Verify employee is registered on device first
- **Attendance Sync**: Check device connectivity and try manual sync

## Security Notes
- System designed for local network use
- No external authentication required for development
- Device communication uses standard ZKTeco protocol
- MongoDB runs locally without external access

This system is designed to be minimalistic but functional, focusing specifically on attendance management with ZKTeco K40 integration.
