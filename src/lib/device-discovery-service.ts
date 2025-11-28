import { EnhancedZKTecoService } from './zkteco-enhanced'

export interface DiscoveredDevice {
  ip: string
  port: number
  status: 'reachable' | 'unreachable'
  deviceInfo?: any
}

export class DeviceDiscoveryService {
  private defaultPorts = [4370]
  private scanTimeout = 2000 // 2 seconds per IP

  /**
   * Scan a range of IPs for ZKTeco devices
   * @param subnet Base subnet (e.g., "192.168.1")
   * @param startRange Start IP suffix (e.g., 1)
   * @param endRange End IP suffix (e.g., 254)
   */
  async scanRange(subnet: string, startRange: number = 1, endRange: number = 254): Promise<DiscoveredDevice[]> {
    console.log(`🔍 Scanning network range ${subnet}.${startRange}-${endRange}...`)
    
    const ipsToScan: string[] = []
    for (let i = startRange; i <= endRange; i++) {
      ipsToScan.push(`${subnet}.${i}`)
    }

    // Process in batches to avoid overwhelming the network/resources
    const batchSize = 10
    const discoveredDevices: DiscoveredDevice[] = []

    for (let i = 0; i < ipsToScan.length; i += batchSize) {
      const batch = ipsToScan.slice(i, i + batchSize)
      const promises = batch.map(ip => this.checkDevice(ip))
      
      const results = await Promise.all(promises)
      const found = results.filter(d => d !== null) as DiscoveredDevice[]
      
      if (found.length > 0) {
        console.log(`✨ Found ${found.length} devices in batch`)
        discoveredDevices.push(...found)
      }
    }

    console.log(`✅ Scan complete. Found ${discoveredDevices.length} devices.`)
    return discoveredDevices
  }

  /**
   * Check a single IP for ZKTeco device
   */
  async checkDevice(ip: string): Promise<DiscoveredDevice | null> {
    try {
      // We use the enhanced service to attempt a connection
      // We create a temporary instance just for this check
      // Note: We don't use the singleton here to avoid messing with the main connection
      
      // Hack: We can't easily instantiate a private class. 
      // We cast it to any to bypass private constructor for this utility.
      
      const ServiceClass = EnhancedZKTecoService as any
      const service = new ServiceClass(ip, 4370, 2000) // Short timeout
      
      const connected = await service.connect()
      if (connected) {
        const info = await service.getDeviceInfo()
        await service.disconnect()
        
        return {
          ip,
          port: 4370,
          status: 'reachable',
          deviceInfo: info
        }
      }
    } catch (error) {
      // Ignore errors, just means not reachable
    }
    return null
  }
}

export const deviceDiscoveryService = new DeviceDiscoveryService()
