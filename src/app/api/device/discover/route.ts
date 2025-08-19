import { NextResponse } from 'next/server'
import { deviceDiscovery } from '@/lib/deviceDiscovery'

export async function GET() {
  try {
    const devices = await deviceDiscovery.findDevices()
    return NextResponse.json({ devices })
  } catch (error) {
    console.error('Device discovery error:', error)
    return NextResponse.json(
      { error: 'Failed to discover devices' },
      { status: 500 }
    )
  }
}
