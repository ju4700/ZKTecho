const ZKLib = require('zklib-js')

async function testZKTecoUserManagement() {
  console.log('🔄 Testing ZKTeco User Management...')
  
  let zkLib = null
  
  try {
    // Initialize ZKLib
    zkLib = new ZKLib({
      ip: process.env.ZKTECO_IP || '192.168.1.201',
      port: parseInt(process.env.ZKTECO_PORT || '4370'),
      inport: 5204,
      timeout: parseInt(process.env.ZKTECO_TIMEOUT || '10000'),
      connectionType: 'tcp'
    })
    
    // Test connection
    console.log('� Connecting to ZKTeco device...')
    const connected = await new Promise((resolve) => {
      zkLib.connect((err) => {
        if (err) {
          console.error('Connection error:', err)
          resolve(false)
        } else {
          console.log('✅ Connected successfully')
          resolve(true)
        }
      })
    })
    
    if (!connected) {
      console.log('❌ Cannot connect to device')
      return
    }
    
    // Test 1: Get current users
    console.log('\n� Getting current users...')
    const users = await new Promise((resolve) => {
      zkLib.getUser((err, users) => {
        if (err) {
          console.error('Error getting users:', err)
          resolve([])
        } else {
          resolve(users || [])
        }
      })
    })
    
    console.log(`Current users in device: ${users.length}`)
    users.forEach(user => {
      console.log(`  - ID: ${user.userId}, Name: ${user.name}`)
    })
    
    // Test 2: Create a test user
    console.log('\n👤 Creating test user...')
    const testUserId = '999'
    const testUserName = 'Test Employee'
    
    const userCreated = await new Promise((resolve) => {
      const userObject = {
        userId: testUserId,
        name: testUserName,
        role: 0,
        password: '',
        cardno: ''
      }
      
      zkLib.setUser(userObject, (err) => {
        if (err) {
          console.error('Error creating user:', err)
          resolve(false)
        } else {
          console.log('✅ User created successfully')
          resolve(true)
        }
      })
    })
    
    if (userCreated) {
      // Test 3: Delete test user
      console.log('\n🗑️ Cleaning up test user...')
      const deleted = await new Promise((resolve) => {
        zkLib.delUser(testUserId, (err) => {
          if (err) {
            console.error('Error deleting user:', err)
            resolve(false)
          } else {
            console.log('✅ User deleted successfully')
            resolve(true)
          }
        })
      })
    }
    
    // Disconnect
    zkLib.disconnect()
    console.log('\n✅ Test completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testZKTecoUserManagement()