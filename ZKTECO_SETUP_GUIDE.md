# ZKTeco K40 Setup and Connection Guide

## 🔄 How to Reset Your ZKTeco K40 Machine

### Method 1: Factory Reset via Menu (Recommended)
1. **Access Admin Menu**:
   - Press and hold the `MENU` button on the device
   - Enter the admin password (default is usually `0` or `123456`)

2. **Navigate to Reset Option**:
   - Go to `Menu > Options > System > Factory Reset`
   - Or: `Menu > System > Reset > Factory Reset`

3. **Confirm Reset**:
   - Select "Factory Reset" or "Clear All Data"
   - Confirm when prompted
   - The device will restart automatically

### Method 2: Hard Reset (If menu is inaccessible)
1. **Power Reset**:
   - Disconnect power from the device
   - Wait 10 seconds
   - Reconnect power while holding the `ESC` button
   - Continue holding until the device boots up

2. **Default Reset Sequence**:
   - Try pressing: `MENU + 1 + 9 + 8 + 3` simultaneously
   - Or: `MENU + OK + ESC` for 10 seconds

### What Gets Reset:
- ✅ All user data and fingerprints
- ✅ All attendance logs
- ✅ Network settings (back to default)
- ✅ Admin passwords (back to default)
- ✅ Device settings

---

## 🌐 Network Configuration After Reset

### Step 1: Configure Network Settings
1. **Access Network Menu**:
   ```
   Menu > Communication > Network Settings
   ```

2. **Set IP Configuration**:
   - **IP Address**: `192.168.1.201` (or available IP in your network)
   - **Subnet Mask**: `255.255.255.0`
   - **Gateway**: `192.168.1.1` (your router IP)
   - **DNS**: `8.8.8.8` or your router IP

3. **Enable Network Communication**:
   - Set `TCP/IP` to `Enable`
   - Set `Port` to `4370` (default)
   - Save settings and restart device

### Step 2: Find Your Network Information
```bash
# On your computer, find your network details:
ip route show default  # Shows your gateway
hostname -I           # Shows your computer's IP
```

Example network setup:
- **Router IP**: 192.168.1.1
- **Computer IP**: 192.168.1.19 (where the web app runs)
- **ZKTeco IP**: 192.168.1.201 (what we'll set)

---

## 🔗 Connecting ZKTeco to Your System

### Step 1: Update Environment Configuration
Edit your `.env` file in the project:

```env
# ZKTeco Device Configuration
ZKTECO_IP="192.168.1.201"    # Use the IP you set on the device
ZKTECO_PORT=4370             # Default ZKTeco port
ZKTECO_TIMEOUT=5000          # Connection timeout

# Application Settings
OVERTIME_THRESHOLD_HOURS=8
COMPANY_NAME="Your Company Name"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
```

### Step 2: Test Device Connection
1. **Open your web application**: http://localhost:3000
2. **Go to Dashboard**
3. **Click "Sync Attendance"** button
4. **Check for connection status**

If successful, you'll see: "Successfully synced X attendance records"
If failed, you'll see connection error messages.

### Step 3: Verify Network Connectivity
```bash
# Test if device is reachable
ping 192.168.1.201

# Test if port is open (install nmap if needed)
nmap -p 4370 192.168.1.201
```

---

## 👥 Setting Up Employees

### Step 1: Add Employees to ZKTeco Device
1. **Access User Management**:
   ```
   Menu > User Management > New User
   ```

2. **Add Each Employee**:
   - **User ID**: Use simple numbers (1, 2, 3, etc.)
   - **Name**: Employee full name
   - **Password**: Optional 4-digit PIN
   - **Card**: Optional ID card number
   - **Fingerprint**: Enroll 2-3 fingerprints per user

3. **Save User Data**:
   - Press `OK` to save each user
   - Test fingerprint recognition

### Step 2: Add Same Employees to Web System
1. **Open Web Application**: http://localhost:3000
2. **Navigate to**: Employees → Add New Employee
3. **Fill Employee Details**:
   - **Employee ID**: MUST match ZKTeco User ID exactly
   - **Name**: Same as in device
   - **Department**: e.g., "Sales", "IT", "Admin"
   - **Position**: e.g., "Manager", "Developer"
   - **Hourly Rate**: e.g., 25.00 (for salary calculation)
   - **Email & Phone**: Optional contact info

⚠️ **CRITICAL**: Employee ID in web system MUST exactly match User ID in ZKTeco device!

---

## 📊 How the System Works

### Daily Workflow:
1. **Employee Check-in/out**: 
   - Employees use fingerprint on ZKTeco device
   - Device stores attendance logs internally

2. **Data Synchronization**:
   - Admin clicks "Sync Attendance" on dashboard
   - Web system fetches all new attendance data from device
   - Data is processed and stored in database

3. **Salary Calculation**:
   - Go to Salaries section
   - Select month/year and employee
   - System calculates:
     - Total work hours
     - Regular hours (up to 8/day)
     - Overtime hours (over 8/day)
     - Gross salary (hours × hourly rate)

### Attendance Types:
- **Check In**: Start of work day
- **Check Out**: End of work day  
- **Break In**: Return from break
- **Break Out**: Start of break

---

## 🔧 Troubleshooting Common Issues

### Connection Problems:
```bash
# Check if device IP is correct
ping 192.168.1.201

# Verify device is on same network
arp -a | grep 192.168.1.201

# Check if port is accessible
telnet 192.168.1.201 4370
```

### Device Issues:
- **Can't access menu**: Try default passwords: `0`, `123456`, `888888`
- **Network not working**: Check ethernet cable and router connection
- **Fingerprint not working**: Re-enroll fingerprints, clean sensor

### Web Application Issues:
- **Sync fails**: Check device IP in `.env` file
- **No employees found**: Verify Employee IDs match between device and web system
- **Salary calculation wrong**: Check overtime threshold and hourly rates

---

## 📱 Quick Start Checklist

### Device Setup:
- [ ] Reset ZKTeco device to factory defaults
- [ ] Configure network settings (IP, subnet, gateway)
- [ ] Test network connectivity
- [ ] Add employees with User IDs
- [ ] Enroll fingerprints for each employee

### Web System Setup:
- [ ] Update `.env` file with device IP
- [ ] Add employees with matching Employee IDs
- [ ] Set hourly rates for salary calculation
- [ ] Test attendance sync
- [ ] Verify salary calculation

### Daily Operations:
- [ ] Employees use fingerprint for attendance
- [ ] Admin syncs attendance data regularly
- [ ] Calculate monthly salaries
- [ ] Review attendance reports

---

## 🌐 Network Example

```
Router (192.168.1.1)
├── Computer (192.168.1.19) - Web Application
└── ZKTeco K40 (192.168.1.201) - Biometric Device
```

Both devices must be on the same network for communication!

---

## 📞 Support

If you encounter issues:
1. Check network connectivity first
2. Verify Employee ID matching
3. Review device manual for specific settings
4. Test with a single employee initially

The system is designed to be simple and reliable for local network use!
