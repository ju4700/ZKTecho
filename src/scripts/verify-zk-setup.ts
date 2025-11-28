import { getEnhancedZKTecoService, EnhancedZKTecoService } from '../lib/zkteco-enhanced'
import { zktecoIntegration } from '../lib/zkteco-integration'
import { deviceDiscoveryService } from '../lib/device-discovery-service'

async function verify() {
  console.log('🔍 Verifying ZKTeco Setup...')

  try {
    // 1. Check Enhanced Service Export
    console.log('1. Checking EnhancedZKTecoService export...')
    if (typeof getEnhancedZKTecoService === 'function') {
      console.log('✅ getEnhancedZKTecoService is a function')
    } else {
      console.error('❌ getEnhancedZKTecoService is NOT a function')
    }

    if (EnhancedZKTecoService) {
      console.log('✅ EnhancedZKTecoService class is exported')
    } else {
      console.error('❌ EnhancedZKTecoService class is NOT exported')
    }

    // 2. Check Integration Service
    console.log('2. Checking ZKTecoIntegrationService...')
    if (zktecoIntegration) {
      console.log('✅ zktecoIntegration instance exists')
    } else {
      console.error('❌ zktecoIntegration instance is missing')
    }

    // 3. Check Device Discovery Service
    console.log('3. Checking DeviceDiscoveryService...')
    if (deviceDiscoveryService) {
      console.log('✅ deviceDiscoveryService instance exists')
    } else {
      console.error('❌ deviceDiscoveryService instance is missing')
    }

    console.log('✨ Verification Complete!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Verification Failed:', error)
    process.exit(1)
  }
}

verify()
