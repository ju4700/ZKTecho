import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { config } from '@/lib/config';

/**
 * GET /api/device/config
 * Get current device configuration
 */
export async function GET() {
  try {
    const zktecoConfig = config.get('zkteco');
    
    const deviceConfig = {
      ip: zktecoConfig.ip,
      port: zktecoConfig.port,
      timeout: zktecoConfig.timeout,
      retries: zktecoConfig.retries,
      status: 'configured'
    };

    logger.info('Device configuration retrieved', deviceConfig);

    return NextResponse.json({
      success: true,
      data: deviceConfig
    });

  } catch (error) {
    logger.error('Failed to get device configuration', { error });
    
    return NextResponse.json({
      success: false,
      error: {
        message: 'Failed to get device configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}

/**
 * POST /api/device/config
 * Update device configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ip, port = 4370, timeout = 10000 } = body;

    if (!ip) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'IP address is required',
          code: 'MISSING_IP'
        }
      }, { status: 400 });
    }

    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Invalid IP address format',
          code: 'INVALID_IP'
        }
      }, { status: 400 });
    }

    // Update environment variables (for current session)
    process.env.ZKTECO_IP = ip;
    process.env.ZKTECO_PORT = port.toString();
    process.env.ZKTECO_TIMEOUT = timeout.toString();

    const newConfig = {
      ip,
      port,
      timeout,
      status: 'updated',
      timestamp: new Date().toISOString()
    };

    logger.info('Device configuration updated', newConfig);

    return NextResponse.json({
      success: true,
      data: newConfig,
      message: 'Configuration updated successfully. Restart the server to apply changes permanently.'
    });

  } catch (error) {
    logger.error('Failed to update device configuration', { error });
    
    return NextResponse.json({
      success: false,
      error: {
        message: 'Failed to update device configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}