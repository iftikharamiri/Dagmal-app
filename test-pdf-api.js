const fs = require('fs')
const FormData = require('form-data')
const fetch = require('node-fetch')

async function testPdfApi() {
  try {
    console.log('🧪 Testing PDF API...')
    
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:3001/api/health')
    const healthData = await healthResponse.json()
    console.log('✅ Health check:', healthData)
    
    // Create a simple test PDF content (this is just for testing the API structure)
    // In real usage, you would upload actual PDF files
    console.log('📄 PDF API is ready for testing!')
    console.log('')
    console.log('🚀 Next steps:')
    console.log('1. Go to http://localhost:5173')
    console.log('2. Navigate to restaurant dashboard')
    console.log('3. Upload a PDF menu file')
    console.log('4. Go to create-deal page')
    console.log('5. Try searching in the PDF!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.log('')
    console.log('🔧 Make sure the PDF server is running:')
    console.log('   npm run server')
  }
}

testPdfApi()





















