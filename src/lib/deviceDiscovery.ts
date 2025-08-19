interface NetworkDevice {
  ip: string
  status: 'connected' | 'disconnected'
  info?: {
    model?: string
    serialNumber?: string
    userCount?: number
  }
}

export class DeviceDiscoveryService {
  private commonIPs = [
    '192.168.1.201', // Default ZKTeco IP
    '192.168.0.201',
    '192.168.1.100',
    '192.168.0.100'
  ]

  async scanNetwork(): Promise<NetworkDevice[]> {
    const devices: NetworkDevice[] = []
    
    // Get current network range dynamically
    const networkRange = await this.getNetworkRange()
    const ipsToScan = [...this.commonIPs, ...networkRange]
    
    // Remove duplicates
    const uniqueIPs = [...new Set(ipsToScan)]
    
    // Scan each IP concurrently with timeout
    const scanPromises = uniqueIPs.map(ip => this.scanSingleDevice(ip))
    const results = await Promise.allSettled(scanPromises)
    
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        devices.push(result.value)
      }
    })
    
    return devices
  }

  private async scanSingleDevice(ip: string): Promise<NetworkDevice | null> {
    try {
      // Create a temporary ZKTeco service for this IP
      const { ZKTecoService } = await import('./zkteco')
      const tempService = new ZKTecoService(ip, 4370, 3000)
      
      const connected = await tempService.connect()
      if (connected) {
        const info = await tempService.getDeviceInfo()
        await tempService.disconnect()
        
        return {
          ip,
          status: 'connected',
          info: {
            model: info?.deviceName || 'ZKTeco Device',
            serialNumber: info?.deviceId || 'Unknown',
            userCount: info?.userCounts || 0
          }
        }
      }
    } catch (error) {
      // Silent fail for network scanning
      console.debug(`Failed to connect to ${ip}:`, error)
    }
    
    return null
  }

  private async getNetworkRange(): Promise<string[]> {
    // Generate common network ranges
    const ranges: string[] = []
    
    // 192.168.1.x range
    for (let i = 200; i <= 210; i++) {
      ranges.push(`192.168.1.${i}`)
    }
    
    // 192.168.0.x range
    for (let i = 200; i <= 210; i++) {
      ranges.push(`192.168.0.${i}`)
    }
    
    return ranges
  }

  async findDevices(): Promise<NetworkDevice[]> {
    console.log('Scanning network for ZKTeco devices...')
    const devices = await this.scanNetwork()
    console.log(`Found ${devices.length} ZKTeco device(s)`)
    return devices
  }
}

export const deviceDiscovery = new DeviceDiscoveryService()
