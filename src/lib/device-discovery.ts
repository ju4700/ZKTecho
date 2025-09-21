import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from './logger';

const execAsync = promisify(exec);

interface DeviceInfo {
  ip: string;
  port: number;
  status: 'reachable' | 'unreachable';
  responseTime?: number;
  deviceType?: string;
}

interface NetworkRange {
  start: string;
  end: string;
  subnet: string;
}

export class ZKTecoDeviceDiscovery {
  private readonly defaultPorts = [4370, 4371, 4372, 80, 443];
  private readonly timeout = 5000;

  /**
   * Discover ZKTeco devices on the local network
   */
  async discoverDevices(customRange?: string): Promise<DeviceInfo[]> {
    logger.info('Starting ZKTeco device discovery', { customRange });

    try {
      const networkRanges = customRange ? [this.parseRange(customRange)] : await this.getLocalNetworkRanges();
      const devices: DeviceInfo[] = [];

      for (const range of networkRanges) {
        logger.info(`Scanning network range: ${range.subnet}`, { range });
        const rangeDevices = await this.scanRange(range);
        devices.push(...rangeDevices);
      }

      logger.info(`Device discovery completed. Found ${devices.length} devices`, {
        reachableDevices: devices.filter(d => d.status === 'reachable').length,
        totalScanned: devices.length
      });

      return devices.filter(device => device.status === 'reachable');
    } catch (error) {
      logger.error('Device discovery failed', { error });
      throw error;
    }
  }

  /**
   * Test connection to a specific device
   */
  async testDevice(ip: string, port: number = 4370): Promise<DeviceInfo> {
    const startTime = Date.now();

    try {
      // Use netcat to test port connectivity
      await execAsync(
        `timeout ${this.timeout / 1000} nc -zv ${ip} ${port}`,
        { timeout: this.timeout }
      );

      const responseTime = Date.now() - startTime;
      
      return {
        ip,
        port,
        status: 'reachable',
        responseTime,
        deviceType: 'ZKTeco (assumed)'
      };
    } catch {
      return {
        ip,
        port,
        status: 'unreachable'
      };
    }
  }

  /**
   * Get local network ranges automatically
   */
  private async getLocalNetworkRanges(): Promise<NetworkRange[]> {
    try {
      const { stdout } = await execAsync('ip route | grep -E "192\\.168\\.|10\\.|172\\."');
      const routes = stdout.split('\n').filter(line => line.includes('/'));
      
      const ranges: NetworkRange[] = [];
      
      for (const route of routes) {
        const match = route.match(/(\d+\.\d+\.\d+\.\d+\/\d+)/);
        if (match) {
          const cidr = match[1];
          const range = this.cidrToRange(cidr);
          if (range) {
            ranges.push(range);
          }
        }
      }

      // Fallback to common ranges if none found
      if (ranges.length === 0) {
        ranges.push(
          { start: '192.168.1.1', end: '192.168.1.254', subnet: '192.168.1.0/24' },
          { start: '192.168.0.1', end: '192.168.0.254', subnet: '192.168.0.0/24' }
        );
      }

      return ranges;
    } catch (error) {
      logger.warn('Could not determine local network ranges, using defaults', { error });
      return [
        { start: '192.168.1.1', end: '192.168.1.254', subnet: '192.168.1.0/24' },
        { start: '192.168.0.1', end: '192.168.0.254', subnet: '192.168.0.0/24' }
      ];
    }
  }

  /**
   * Scan a network range for ZKTeco devices
   */
  private async scanRange(range: NetworkRange): Promise<DeviceInfo[]> {
    const devices: DeviceInfo[] = [];

    // Generate IP addresses in range
    const ips = this.generateIpRange(range.start, range.end);
    
    // Limit concurrent scans to avoid overwhelming the network
    const batchSize = 20;
    
    for (let i = 0; i < ips.length; i += batchSize) {
      const batch = ips.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (ip) => {
        // Try common ZKTeco ports
        for (const port of this.defaultPorts) {
          const result = await this.testDevice(ip, port);
          if (result.status === 'reachable') {
            return result;
          }
        }
        return null;
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          devices.push(result.value);
        }
      });

      // Small delay between batches to be network-friendly
      if (i + batchSize < ips.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return devices;
  }

  /**
   * Generate IP addresses in a range
   */
  private generateIpRange(start: string, end: string): string[] {
    const ips: string[] = [];
    const startParts = start.split('.').map(Number);
    const endParts = end.split('.').map(Number);

    for (let i = startParts[3]; i <= endParts[3]; i++) {
      ips.push(`${startParts[0]}.${startParts[1]}.${startParts[2]}.${i}`);
    }

    return ips;
  }

  /**
   * Convert CIDR notation to IP range
   */
  private cidrToRange(cidr: string): NetworkRange | null {
    try {
      const [network, prefixLength] = cidr.split('/');
      const parts = network.split('.').map(Number);
      
      if (parts.length !== 4 || !prefixLength) return null;

      const prefix = parseInt(prefixLength);
      const hostBits = 32 - prefix;
      const subnetMask = (0xffffffff << hostBits) >>> 0;
      
      const networkInt = (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
      const networkBase = (networkInt & subnetMask) >>> 0;
      const broadcastInt = (networkBase | ((1 << hostBits) - 1)) >>> 0;

      const startInt = networkBase + 1;
      const endInt = broadcastInt - 1;

      const start = [
        (startInt >>> 24) & 0xff,
        (startInt >>> 16) & 0xff,
        (startInt >>> 8) & 0xff,
        startInt & 0xff
      ].join('.');

      const end = [
        (endInt >>> 24) & 0xff,
        (endInt >>> 16) & 0xff,
        (endInt >>> 8) & 0xff,
        endInt & 0xff
      ].join('.');

      return { start, end, subnet: cidr };
    } catch (error) {
      logger.error('Failed to parse CIDR', { cidr, error });
      return null;
    }
  }

  /**
   * Parse custom range input
   */
  private parseRange(range: string): NetworkRange {
    if (range.includes('/')) {
      // CIDR notation
      const parsed = this.cidrToRange(range);
      if (parsed) return parsed;
    }

    if (range.includes('-')) {
      // Range notation like "192.168.1.1-192.168.1.254"
      const [start, end] = range.split('-');
      return { start: start.trim(), end: end.trim(), subnet: range };
    }

    // Single IP
    return { start: range, end: range, subnet: range };
  }

  /**
   * Quick ping test for basic connectivity
   */
  async quickPing(ip: string): Promise<boolean> {
    try {
      await execAsync(`ping -c 1 -W 2 ${ip}`, { timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }
}

export const deviceDiscovery = new ZKTecoDeviceDiscovery();