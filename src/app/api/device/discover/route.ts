import { NextRequest, NextResponse } from 'next/server';
import { deviceDiscovery } from '@/lib/device-discovery';
import { logger } from '@/lib/logger';

/**
 * GET /api/device/discover
 * Discover ZKTeco devices on the network
 */
async function discoverDevices(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || 'unknown';
  
  try {
    logger.info(`[${requestId}] Starting device discovery`);

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || undefined;
    const quick = searchParams.get('quick') === 'true';

    if (quick) {
      // Quick discovery - test only common IPs
      const commonIps = [
        '192.168.1.201', '192.168.1.100', '192.168.1.150',
        '192.168.0.201', '192.168.0.100', '192.168.0.150'
      ];

      const devices = [];
      for (const ip of commonIps) {
        const result = await deviceDiscovery.testDevice(ip);
        if (result.status === 'reachable') {
          devices.push(result);
        }
      }

      logger.info(`[${requestId}] Quick discovery completed`, {
        found: devices.length,
        tested: commonIps.length
      });

      return NextResponse.json({
        success: true,
        data: {
          devices,
          scanType: 'quick',
          totalFound: devices.length,
          totalScanned: commonIps.length
        }
      });
    }

    // Full network discovery
    const devices = await deviceDiscovery.discoverDevices(range);

    logger.info(`[${requestId}] Device discovery completed`, {
      found: devices.length,
      range: range || 'auto-detected'
    });

    return NextResponse.json({
      success: true,
      data: {
        devices,
        scanType: 'full',
        totalFound: devices.length,
        range: range || 'auto-detected'
      }
    });

  } catch (error) {
    logger.error(`[${requestId}] Device discovery failed`, { error });
    
    return NextResponse.json({
      success: false,
      error: {
        message: 'Device discovery failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}

/**
 * POST /api/device/discover
 * Test connection to a specific device
 */
async function testSpecificDevice(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || 'unknown';
  
  try {
    const body = await request.json();
    const { ip, port = 4370 } = body;

    if (!ip) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'IP address is required',
          code: 'MISSING_IP'
        }
      }, { status: 400 });
    }

    logger.info(`[${requestId}] Testing device connection`, { ip, port });

    const result = await deviceDiscovery.testDevice(ip, port);

    logger.info(`[${requestId}] Device test completed`, {
      ip,
      port,
      status: result.status,
      responseTime: result.responseTime
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error(`[${requestId}] Device test failed`, { error });
    
    return NextResponse.json({
      success: false,
      error: {
        message: 'Device test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}

// Export handlers directly
export const GET = discoverDevices;
export const POST = testSpecificDevice;
