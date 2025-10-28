import express from 'express'
import multer from 'multer'
import pdfParse from 'pdf-parse/lib/pdf-parse.js'
import cors from 'cors'
import path from 'path'
import fetch from 'node-fetch'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

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
