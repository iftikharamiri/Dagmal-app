import express from 'express'
import multer from 'multer'
import pdfParse from 'pdf-parse/lib/pdf-parse.js'
import cors from 'cors'
import path from 'path'

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
