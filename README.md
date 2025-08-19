# ZKTeco Employee Management System

A comprehensive web-based employee management system designed to work with ZKTeco K40 biometric attendance machines. This system provides employee management, attendance tracking, and automatic salary calculation based on hourly rates.

## Features

### 🏢 Employee Management
- Add, edit, and manage employee records
- Store employee details: name, department, position, hourly rate
- Track active/inactive status
- Unique employee ID integration with ZKTeco device

### ⏰ Attendance Tracking
- Real-time sync with ZKTeco K40 biometric device
- Support for check-in/check-out and break tracking
- Automatic attendance data import from device
- View attendance logs with filtering options

### 💰 Salary Calculation
- Automatic calculation based on hourly rates
- Overtime calculation (configurable threshold)
- Monthly salary reports
- Regular vs overtime hours tracking
- Support for deductions (future feature)

### 📊 Dashboard & Reports
- Real-time dashboard with key metrics
- Employee statistics
- Attendance summaries
- Salary status overview

## Technology Stack

- **Frontend**: Next.js 15 with TypeScript
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **UI**: Tailwind CSS
- **ZKTeco Integration**: node-zklib
- **Icons**: Lucide React

## Prerequisites

- Node.js 18 or higher
- ZKTeco K40 biometric device connected to the same network
- Basic knowledge of network configuration

## Installation

1. **Clone the repository**
   ```bash
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

4. **Setup database**
   ```bash
   npx prisma generate
   npx prisma db push
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
