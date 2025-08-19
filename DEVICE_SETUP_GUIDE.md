# ZKTeco K40 Connection and Testing Guide

## Prerequisites Setup

### 1. MongoDB Setup
Start MongoDB on your system:
```bash
# On Ubuntu/Debian
sudo systemctl start mongod

# On Fedora/RHEL/CentOS
sudo systemctl start mongod

# On macOS (with Homebrew)
brew services start mongodb/brew/mongodb-community

# Or start manually
mongod --dbpath /path/to/your/db
```

### 2. Application Setup
Your application is already running at:
- **Local**: http://localhost:3000
- **Network**: http://192.168.1.19:3000

## ZKTeco K40 Device Setup

### Step 1: Physical Connection
1. **Power on** your ZKTeco K40 device
2. **Connect to network** using Ethernet cable or WiFi:
   - Go to device menu: **Menu → Comm → Ethernet**
   - Set IP mode to **DHCP** (automatic) or **Static** (manual)
   - Note down the device IP address

### Step 2: Network Configuration
1. **Check device IP**: 
   - On device: **Menu → System Info → Network**
   - Common default IPs: `192.168.1.201`, `192.168.0.201`
   
2. **Verify connectivity**:
   ```bash
   ping [DEVICE_IP]
   ```

### Step 3: Device Settings
1. **Enable network communication**:
   - Menu → Comm → Ethernet → **Enable**
   - Set Port: **4370** (default)
   
2. **Set access control**:
   - Menu → Access Control → **Enable**

## Testing the Connection

### Method 1: Automatic Device Discovery
1. Open the web application at http://localhost:3000
2. Go to **Device Management** section
3. Click **"Discover Devices"**
4. The system will scan these IP ranges:
   - 192.168.1.1-254
   - 192.168.0.1-254
   - 10.0.0.1-254

### Method 2: Manual Connection
1. If automatic discovery doesn't work, note your device IP
2. In the application, go to **Device Settings**
3. Enter the device IP manually
4. Click **"Connect"**

## Complete Workflow Test

### Test 1: Employee Registration
1. **Add New Employee**:
   - Name: "Test User"
   - Phone: "1234567890"
   - Monthly Salary: "50000"
   - Click **"Add Employee"**

2. **Register on Device**:
   - Find the employee in the list
   - Click **"Add to Device"**
   - Device should show success message

### Test 2: Fingerprint Enrollment
1. **On the ZKTeco Device**:
   - Go to **User Management → New User**
   - Enter User ID (should match employee ID from web)
   - Place finger on scanner multiple times
   - Save the user

2. **Verify in Web App**:
   - Check employee status shows "Fingerprint Enrolled"
   - Salary calculation should start from enrollment date

### Test 3: Attendance Tracking
1. **Test Check-in**:
   - Place enrolled finger on device scanner
   - Device should beep and show "Thank you"
   - First scan = Check In

2. **Test Check-out**:
   - Place finger again after some time
   - Second scan = Check Out

3. **Sync Data**:
   - In web app, click **"Sync Attendance"**
   - View attendance records in **Attendance** section

## Troubleshooting

### Connection Issues
- **Device not found**: Check network connection and IP address
- **Connection timeout**: Verify device is on same network
- **Access denied**: Check device communication settings

### Device Commands
```bash
# Check network connectivity
ping [DEVICE_IP]

# Check if device port is open
telnet [DEVICE_IP] 4370

# View network interfaces
ip addr show
```

### Common Device IP Addresses
- Default: `192.168.1.201`
- Alternative: `192.168.0.201`
- Check device display: **Menu → System Info → Network**

### Database Issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# View MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Connect to MongoDB shell
mongosh
```

## Application Features Testing

### 1. Employee Management
- ✅ Add new employees with basic info
- ✅ Edit employee details
- ✅ Delete employees
- ✅ Register/remove from device

### 2. Device Integration
- ✅ Automatic device discovery
- ✅ Manual device connection
- ✅ User registration on device
- ✅ Real-time device status

### 3. Attendance Tracking
- ✅ Automatic attendance sync
- ✅ Check-in/Check-out logic
- ✅ Attendance history view
- ✅ Real-time updates

### 4. Salary Calculation
- ✅ Monthly salary rates
- ✅ Attendance-based calculations
- ✅ Fingerprint enrollment date tracking

## Next Steps

1. **Connect your ZKTeco K40** following the steps above
2. **Test device discovery** in the web application
3. **Register a test employee** and enroll fingerprint
4. **Test attendance tracking** with finger scans
5. **Verify data sync** between device and application

The system is now ready for production use with your ZKTeco K40 device!
