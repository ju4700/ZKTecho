import { NextResponse } from 'next/server'
import { zktecoIntegration } from '@/lib/zkteco-integration'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { deviceUserId } = body

    if (!deviceUserId) {
      return NextResponse.json(
        { error: 'Device User ID is required' },
        { status: 400 }
      )
    }

    const success = await zktecoIntegration.enrollFingerprint(deviceUserId)

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Fingerprint enrollment started. Please place finger on device sensor.'
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to start enrollment. Check device connection.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in enrollment API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
