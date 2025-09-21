import { NextResponse } from 'next/server'
import { zktecoService } from '@/lib/zkteco'

export async function GET() {
  try {
    console.log('🧪 Testing ZKTeco device methods and connection...')
    
    // Test connection and method discovery
    const connected = await zktecoService.connect()
    
    if (!connected) {
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to device'
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Connection successful - check server logs for available methods',
      note: 'Look at terminal output for available zkLib methods'
    })
    
  } catch (error) {
    console.error('❌ Debug test failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}