# ZKTeco Employee Management System

A professional, production-ready employee management system designed to integrate with ZKTeco K40 biometric attendance machines. This system provides comprehensive employee management, real-time attendance tracking, and automated salary calculation with enterprise-grade security and monitoring.

## ✨ Features

### 🏢 **Employee Management**
- Complete employee lifecycle management (add, edit, view, deactivate)
- Comprehensive employee profiles with department, position, and salary details
- Biometric integration with ZKTeco device user sync
- Advanced search and filtering capabilities
- Bulk operations and data export

### ⏰ **Attendance Tracking**
- Real-time synchronization with ZKTeco K40 biometric devices
- Automatic attendance data import and processing
- Support for multiple attendance types (check-in, check-out, break)
- Historical attendance viewing with advanced filtering
- Attendance analytics and insights

### 💰 **Salary Management**
- Automated salary calculation based on attendance and hourly rates
- Configurable overtime calculations and thresholds  
- Monthly payroll generation and reports
- Deduction and bonus management
- Tax calculation support

### 📊 **Dashboard & Analytics**
- Real-time dashboard with key performance indicators
- Employee statistics and department insights
- Attendance trends and patterns
- Salary summaries and cost analysis
- Customizable reporting tools

### 🔐 **Security & Monitoring**
- Professional security headers and CORS configuration
- Input validation and sanitization on all endpoints
- Rate limiting to prevent API abuse
- Comprehensive error handling and logging
- Request tracking and monitoring

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 with TypeScript and React 19
- **Backend**: Next.js API Routes with professional middleware
- **Database**: MongoDB with Mongoose ODM
- **UI Framework**: Tailwind CSS with Lucide React icons
- **ZKTeco Integration**: Enhanced zklib with connection pooling
- **Security**: Custom middleware for validation, rate limiting, and monitoring
- **Logging**: Structured logging with request tracking
- **Configuration**: Environment-based configuration management

## 📋 Prerequisites

- **Node.js**: Version 18 or higher
- **MongoDB**: Local instance or MongoDB Atlas cloud database
- **ZKTeco Device**: K40 or compatible model on the same network
- **Network**: Device and server on the same network segment

## ⚡ Quick Start

### 1. **Installation**

```bash
# Clone the repository
git clone <repository-url>
cd ZKTecho

# Install dependencies
npm install
```

### 2. **Environment Configuration**

Create `.env.local` file:

```env
# Database Configuration
MONGODB_URI="mongodb://localhost:27017/zkteco-attendance"
# or for MongoDB Atlas:
# MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/database"

# ZKTeco Device Configuration  
ZKTECO_IP="192.168.1.201"
ZKTECO_PORT=4370
ZKTECO_TIMEOUT=10000
ZKTECO_RETRIES=3

# Security Configuration
JWT_SECRET="your-super-secure-jwt-secret-here"
API_KEY_REQUIRED=false

# Application Configuration
NODE_ENV="development"
LOG_LEVEL="info"
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900000

# Feature Configuration
OVERTIME_THRESHOLD_HOURS=8
AUTO_SYNC_ENABLED=true
REAL_TIME_MONITORING=true
```

### 3. **Device Discovery** (if you don't know your device IP)

```bash
# Quick scan for common device IPs
curl "http://localhost:3000/api/device/discover?quick=true"

# Or visit the device management interface
# http://localhost:3000/device-management
```

### 4. **Start Development**

```bash
# Start the development server
npm run dev

# Application will be available at:
# http://localhost:3000
```

## 📱 Application Access

| Interface | URL | Description |
|-----------|-----|-------------|
| **Main Dashboard** | http://localhost:3000 | Overview and navigation |
| **Employee Management** | http://localhost:3000/employees | Add/edit employees |
| **Device Management** | http://localhost:3000/device-management | Configure ZKTeco device |
| **Test Interface** | http://localhost:3000/test-employee-management | System testing |

## 🔧 API Endpoints

### Employee Management
- `GET /api/employees` - List employees with pagination and search
- `POST /api/employees` - Create new employee
- `GET /api/employees/[id]` - Get employee details
- `PUT /api/employees/[id]` - Update employee
- `DELETE /api/employees/[id]` - Delete employee

### Attendance System
- `GET /api/attendance` - Retrieve attendance records
- `POST /api/attendance/sync` - Sync with ZKTeco device
- `GET /api/attendance/stats` - Attendance statistics

### Device Management
- `GET /api/device/status` - Check device connection status
- `GET /api/device/discover` - Discover ZKTeco devices on network
- `POST /api/device/discover` - Test specific device connection
- `GET /api/device/config` - Get device configuration
- `POST /api/device/config` - Update device configuration

### Salary Management
- `GET /api/salaries` - Calculate and retrieve salary information
- `POST /api/salaries/generate` - Generate payroll reports

## 🔍 Device Setup & Troubleshooting

### **Automatic Device Discovery**
The system includes built-in device discovery tools:

1. **Quick Discovery**: Tests common IP addresses
2. **Full Network Scan**: Scans entire network range
3. **Manual Testing**: Test specific IP addresses
4. **Configuration Management**: Update device settings via web interface

### **Common Issues**

| Issue | Solution |
|-------|----------|
| Device not found | Use device discovery tool or check network connectivity |
| Connection timeout | Verify device IP and port, check firewall settings |
| Authentication failed | Ensure device is not locked or in use by another application |
| Slow response | Check network latency and device load |

## 🏗️ Development & Deployment

### **Development Commands**

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npm run type-check
```

### **Production Deployment**

1. **Environment Setup**: Configure production environment variables
2. **Database**: Ensure MongoDB is accessible and secured
3. **Network**: Configure device network access
4. **Security**: Set strong JWT secrets and enable API key authentication
5. **Monitoring**: Enable logging and monitoring tools

## 📊 Features & Specifications

### **Security Features**
- ✅ Input validation and sanitization
- ✅ Rate limiting and DDoS protection  
- ✅ Security headers (CSP, XSS protection)
- ✅ CORS configuration
- ✅ Error handling and logging
- ✅ Request tracking and monitoring

### **Performance Features**
- ✅ Database connection pooling
- ✅ Optimized queries with indexing
- ✅ Efficient device communication
- ✅ Responsive UI with modern React
- ✅ TypeScript for type safety

### **Integration Features**
- ✅ Real-time device synchronization
- ✅ Automatic attendance processing
- ✅ Configurable salary calculations
- ✅ Export capabilities
- ✅ API-first architecture

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Check the device management interface for troubleshooting
- Review API documentation for integration help
- Use the built-in test interfaces for debugging

## 🎯 Project Status

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: September 2025

**Key Achievements**:
- ✅ Successfully integrated with ZKTeco K40 devices
- ✅ Professional security and monitoring implementation
- ✅ Comprehensive employee and attendance management
- ✅ Real-time device synchronization
- ✅ Production-ready architecture and deployment
   git clone <repository-url>
   cd zkteco-employee-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your settings:
   ```env
   # ZKTeco Device Configuration
   ZKTECO_IP="192.168.1.201"          # Your device IP
   ZKTECO_PORT=4370                   # Default ZKTeco port
   ZKTECO_TIMEOUT=5000               # Connection timeout
   
   # Application Settings
   OVERTIME_THRESHOLD_HOURS=8         # Hours before overtime
   COMPANY_NAME="Your Company Name"
   
   # JWT Configuration (change in production)
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   ```

4. **Setup MongoDB**
   ```bash
   # Install MongoDB (Ubuntu/Debian)
   sudo apt update
   sudo apt install mongodb
   
   # Start MongoDB service
   sudo systemctl start mongod
   sudo systemctl enable mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

## ZKTeco Device Configuration

### Network Setup
1. Connect your ZKTeco K40 to the same network as your server
2. Note the device IP address (usually found in device settings)
3. Ensure the device is accessible from your server

### Device Settings
1. Enable network communication on the device
2. Set the device to allow external connections
3. Note down the communication port (default: 4370)

### Finding Device IP
- Check device menu: `Menu > Options > Network > IP Address`
- Use network scanning tools to find the device
- Check your router's connected devices list

## Usage Guide

### 1. Employee Management

**Adding Employees:**
1. Navigate to "Employees" in the main menu
2. Click "Add New Employee"
3. Fill in employee details:
   - Employee ID (must match ZKTeco device user ID)
   - Personal information
   - Department and position
   - Hourly rate
4. Save the employee record

**Important:** The Employee ID must exactly match the user ID configured in your ZKTeco device.

### 2. Attendance Sync

**Manual Sync:**
1. Go to Dashboard
2. Click "Sync Attendance" button
3. System will fetch all attendance logs from device

**Automatic Setup:**
- Set up a cron job to regularly sync attendance
- Recommended: Every 15-30 minutes during work hours

### 3. Salary Calculation

**Calculate Monthly Salaries:**
1. Navigate to "Salaries"
2. Select month and year
3. Choose specific employee or calculate for all
4. System automatically:
   - Calculates total work hours
   - Separates regular and overtime hours
   - Applies hourly rates
   - Generates salary report

### 4. Reports and Analytics

**Dashboard Overview:**
- Total employees count
- Active employees
- Today's attendance
- Pending salary calculations

**Detailed Reports:**
- Employee-wise attendance reports
- Monthly salary summaries
- Department-wise analytics

## API Endpoints

### Employees
- `GET /api/employees` - List all employees
- `POST /api/employees` - Create new employee
- `GET /api/employees/[id]` - Get employee details
- `PUT /api/employees/[id]` - Update employee
- `DELETE /api/employees/[id]` - Delete employee

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Add attendance record
- `POST /api/attendance/sync` - Sync from ZKTeco device

### Salaries
- `GET /api/salaries` - Get salary records
- `POST /api/salaries` - Calculate salary for employee

## Troubleshooting

### Common Issues

**Device Connection Problems:**
1. Verify device IP address
2. Check network connectivity
3. Ensure device allows external connections
4. Check firewall settings

**Attendance Sync Issues:**
1. Verify employee IDs match between system and device
2. Check device time settings
3. Ensure device has attendance data

**Salary Calculation Problems:**
1. Verify employee hourly rates are set
2. Check attendance data exists for the period
3. Verify overtime threshold settings

## Deployment

### Local Network Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

3. **Access from other devices**
   - Use server's IP address: `http://[SERVER_IP]:3000`
   - Ensure firewall allows port 3000

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ZKTECO_IP` | ZKTeco device IP address | 192.168.1.201 |
| `ZKTECO_PORT` | Device communication port | 4370 |
| `ZKTECO_TIMEOUT` | Connection timeout (ms) | 5000 |
| `OVERTIME_THRESHOLD_HOURS` | Hours before overtime | 8 |
| `COMPANY_NAME` | Your company name | Your Company Name |
| `JWT_SECRET` | JWT signing secret | (change in production) |

## License

This project is licensed under the MIT License.
