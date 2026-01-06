import express from 'express'
import multer from 'multer'
import pdfParse from 'pdf-parse/lib/pdf-parse.js'
import cors from 'cors'
import path from 'path'
import fetch from 'node-fetch'
import { createAgent, extract } from 'llama-cloud-services/extract'
import { createClient } from '@hey-api/client-fetch'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Note: For future server-side cookie tracking, check cookie consent
// The frontend stores consent in 'dagmal_consent' cookie
// Use the consent utilities from src/lib/consent.ts to check user preferences

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed'), false)
    }
  }
})

// PDF text extraction endpoint
app.post('/api/extract-pdf-text', upload.single('pdf'), async (req, res) => {
  try {
    console.log('📄 PDF processing request received')
    
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No PDF file provided',
        success: false 
      })
    }

    console.log('📄 Processing file:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    })

    // Extract text from PDF
    const pdfBuffer = req.file.buffer
    const data = await pdfParse(pdfBuffer)
    const extractedText = data.text

    console.log('📄 Text extraction successful:', {
      textLength: extractedText.length,
      pages: data.numpages,
      preview: extractedText.substring(0, 200) + '...'
    })

    if (!extractedText.trim()) {
      return res.status(400).json({
        error: 'PDF contains no extractable text (might be a scanned image)',
        success: false
      })
    }

    // Return the extracted text
    res.json({
      success: true,
      text: extractedText,
      pages: data.numpages,
      fileInfo: {
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      }
    })

  } catch (error) {
    console.error('❌ PDF processing error:', error)
    
    res.status(500).json({
      error: 'Failed to process PDF file',
      details: error.message,
      success: false
    })
  }
})

// Simple in-memory cache with TTL for reverse geocoding
const geoCache = new Map() // key -> { value, expiresAt }
const GEO_TTL_MS = 1000 * 60 * 30 // 30 minutes

// Simple per-IP rate limiter (1 req/sec)
const lastRequestPerIp = new Map()
const RATE_LIMIT_MS = 1000

app.get('/api/reverse-geocode', async (req, res) => {
  try {
    const { lat, lon, lang = 'nb' } = req.query
    if (!lat || !lon) {
      return res.status(400).json({ error: 'lat and lon are required' })
    }

    // Rate limiting by IP
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
    const now = Date.now()
    const last = lastRequestPerIp.get(ip) || 0
    if (now - last < RATE_LIMIT_MS) {
      return res.status(429).json({ error: 'Too many requests, please slow down' })
    }
    lastRequestPerIp.set(ip, now)

    // Cache by rounded coords to reduce upstream calls
    const key = `${Number(lat).toFixed(3)},${Number(lon).toFixed(3)},${lang}`
    const cached = geoCache.get(key)
    if (cached && cached.expiresAt > now) {
      return res.json(cached.value)
    }

    // Call Nominatim from the server (avoids browser CORS)
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&addressdetails=1&accept-language=${encodeURIComponent(lang)}`
    const upstream = await fetch(url, {
      headers: {
        // Identify per Nominatim policy (set a contact email via env if available)
        'User-Agent': process.env.NOMINATIM_UA || 'DagmalApp/1.0 (contact: support@dagmal.no)',
        'Accept': 'application/json'
      }
    })

    if (!upstream.ok) {
      const text = await upstream.text()
      return res.status(upstream.status).json({ error: 'Upstream error', details: text })
    }

    const data = await upstream.json()
    const address = data.address || {}
    const city = address.city || address.town || address.village || address.municipality || address.county || 'Ukjent lokasjon'
    const country = address.country || 'Norge'
    const payload = {
      cityName: `${city}, ${country}`,
      raw: data
    }

    geoCache.set(key, { value: payload, expiresAt: now + GEO_TTL_MS })
    res.json(payload)
  } catch (err) {
    console.error('Reverse geocode server error:', err)
    res.status(500).json({ error: 'Reverse geocoding failed' })
  }
})

// AI-powered PDF menu extraction using LlamaExtract
app.post('/api/extract-ai-menu', upload.single('pdf'), async (req, res) => {
  try {
    console.log('🤖 AI menu extraction request received')
    
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No PDF file provided',
        success: false 
      })
    }

    const apiKey = process.env.LLAMA_EXTRACT_API_KEY || 'llx-SEx8Hb9PwgGyeK0fEf6fU3Us2Zvo1zl6EIVBxtmrf5B6DKLL'
    
    if (!apiKey) {
      return res.status(500).json({
        error: 'LlamaExtract API key not configured',
        success: false
      })
    }

    console.log('🤖 Processing with AI:', {
      originalname: req.file.originalname,
      size: req.file.size
    })

    // Create a client with the API key
    const client = createClient({
      baseUrl: 'https://api.llamaindex.ai',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    })

    // Define the schema for restaurant menu extraction
    const schema = {
      type: 'object',
      properties: {
        menu_items: {
          type: 'array',
          description: 'Array of menu items',
          items: {
            type: 'object',
            properties: {
              dish_name: {
                type: 'string',
                description: 'Name of the dish or menu item'
              },
              description: {
                type: 'string',
                description: 'Description or ingredients of the dish'
              },
              price: {
                type: 'string',
                description: 'Price of the dish (e.g., "169,-", "199 kr", etc.)'
              },
              category: {
                type: 'string',
                description: 'Category of the dish (e.g., BURGERS, DESSERTS, APPETIZERS, etc.)'
              }
            },
            required: ['dish_name', 'price', 'category']
          }
        }
      },
      required: ['menu_items']
    }

    // Create or get an extraction agent
    console.log('🤖 Creating/extracting agent...')
    const agent = await createAgent(
      'restaurant_menu_extractor',
      schema,
      {
        extraction_target: 'PER_DOC',
        extraction_mode: 'BALANCED'
      },
      undefined, // project_id
      undefined, // organization_id
      client,
      3, // maxRetriesOnError
      1000 // retryInterval
    )

    if (!agent) {
      throw new Error('Failed to create or retrieve extraction agent')
    }

    console.log('🤖 Agent ready, ID:', agent.id)

    // Run extraction on the PDF file
    console.log('🤖 Starting extraction...')
    const arrayBuffer = req.file.buffer
    const result = await extract(
      agent.id,
      undefined, // filePath
      new Uint8Array(arrayBuffer), // fileContent
      req.file.originalname, // fileName
      undefined, // project_id
      undefined, // organization_id
      client,
      false, // fromUi
      10000, // pollingInterval (10 seconds)
      30, // maxPollingIterations (5 minutes max)
      3, // maxRetriesOnError
      1000 // retryInterval
    )

    if (!result || !result.data) {
      throw new Error('Failed to extract data from PDF')
    }

    console.log('🤖 Extraction complete')

    // Parse the results
    const extractedItems = parseExtractionResults(result.data)
    console.log('🤖 Parsed items:', extractedItems.length)

    res.json({
      success: true,
      items: extractedItems
    })

  } catch (error) {
    console.error('🤖 AI extraction error:', error)
    res.status(500).json({
      error: error.message || 'Failed to extract menu with AI',
      success: false
    })
  }
})

// Helper function to parse extraction results
function parseExtractionResults(data) {
  if (!data || typeof data !== 'object') {
    console.warn('No data to parse')
    return []
  }

  // Check if data has menu_items array
  if (data.menu_items && Array.isArray(data.menu_items)) {
    return data.menu_items.map(item => ({
      dish_name: item.dish_name || item.name || '',
      description: item.description || undefined,
      price: item.price || '0',
      category: item.category || 'MAIN'
    }))
  }

  // Check if data is an array of items
  if (Array.isArray(data)) {
    return data.map(item => ({
      dish_name: item.dish_name || item.name || '',
      description: item.description || undefined,
      price: item.price || '0',
      category: item.category || 'MAIN'
    }))
  }

  // Check if data has an "items" property
  if (data.items && Array.isArray(data.items)) {
    return data.items.map(item => ({
      dish_name: item.dish_name || item.name || '',
      description: item.description || undefined,
      price: item.price || '0',
      category: item.category || 'MAIN'
    }))
  }

  console.warn('Could not parse extraction results, structure:', Object.keys(data))
  return []
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'PDF processing server is running',
    timestamp: new Date().toISOString()
  })
})

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large. Maximum size is 10MB.',
        success: false
      })
    }
  }
  
  res.status(500).json({
    error: error.message || 'Internal server error',
    success: false
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PDF processing server running on http://localhost:${PORT}`)
  console.log(`📄 PDF extraction endpoint: http://localhost:${PORT}/api/extract-pdf-text`)
  console.log(`❤️ Health check: http://localhost:${PORT}/api/health`)
})
