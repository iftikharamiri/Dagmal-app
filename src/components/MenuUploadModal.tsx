import React, { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, X, Eye, Download, Globe, Link as LinkIcon, FileImage } from 'lucide-react'
import { toast } from 'sonner'
import { CompleteMenu, validateMenuJson, getMenuStats } from '@/lib/menuUtils'
import { convertPdfToMenuItems } from '@/lib/pdfUtils'

interface MenuUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onMenuUploaded: (menu: CompleteMenu) => void
  restaurantId: string
}

type UploadMode = 'upload' | 'url' | 'pdf'

// AI integration removed

export function MenuUploadModal({ isOpen, onClose, onMenuUploaded }: MenuUploadModalProps) {
  const [uploadMode, setUploadMode] = useState<UploadMode>('upload')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [menuData, setMenuData] = useState<CompleteMenu | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isScraping, setIsScraping] = useState(false)
  const [isConvertingPdf, setIsConvertingPdf] = useState(false)
  
  const [previewMode, setPreviewMode] = useState(false)
  const [menuUrl, setMenuUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      toast.error('Please select a JSON file')
      return
    }

    setUploadedFile(file)
    setIsValidating(true)
    setValidationErrors([])

    try {
      const text = await file.text()
      const jsonData = JSON.parse(text)
      
      const validation = validateMenuJson(jsonData)
      
      if (validation.valid) {
        setMenuData(jsonData)
        toast.success('Menu file is valid!')
      } else {
        setValidationErrors(validation.errors)
        toast.error('Menu file has validation errors')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid JSON file'
      setValidationErrors([errorMessage])
      toast.error('Failed to parse JSON file')
    } finally {
      setIsValidating(false)
    }
  }

  const handleUpload = async () => {
    if (!menuData) return

    setIsUploading(true)
    try {
      // Here you would typically upload to your backend
      // For now, we'll just call the callback
      onMenuUploaded(menuData)
      toast.success('Menu uploaded successfully!')
      handleClose()
    } catch (error) {
      toast.error('Failed to upload menu')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setUploadedFile(null)
    setMenuData(null)
    setValidationErrors([])
    setPreviewMode(false)
    setMenuUrl('')
    setUploadMode('upload')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const downloadSampleMenu = () => {
    const sampleMenu = {
      "restaurant_info": {
        "name": "Your Restaurant Name",
        "description": "Restaurant description",
        "phone": "+47 123 45 678",
        "address": "Your Address",
        "city": "Your City",
        "categories": ["Cuisine Type"]
      },
      "menu_metadata": {
        "version": "1.0",
        "last_updated": new Date().toISOString(),
        "currency": "NOK",
        "language": "no"
      },
      "categories": [
        {
          "id": "appetizers",
          "name": "APPETIZERS",
          "description": "Start your meal right",
          "display_order": 1,
          "items": [
            {
              "id": "sample-item",
              "name": "Sample Item",
              "description": "Item description",
              "price": 15000,
              "dietary_info": ["vegetarian"],
              "is_available": true
            }
          ]
        }
      ]
    }

    const blob = new Blob([JSON.stringify(sampleMenu, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample-menu.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Extract menu items from HTML document
  const extractMenuItems = (doc: Document) => {
    const menuItems: any[] = []
    const priceRegex = /(\d+),-/g
    
    const elements = doc.querySelectorAll('*')
    
    elements.forEach(element => {
      const text = element.textContent || ''
      
      const priceMatches = text.match(priceRegex)
      if (priceMatches && priceMatches.length > 0) {
        const parent = element.closest('li, p, div')
        if (parent) {
          const fullText = parent.textContent || ''
          const nameMatch = fullText.match(/^([^0-9]+?)\s*(\d+),-/)
          
          if (nameMatch) {
            const name = nameMatch[1].trim()
            const price = parseInt(nameMatch[2])
            
            if (name.length > 3 && name.length < 50 && 
                !name.includes('ALLERGENER') && 
                !name.includes('Burger/Tallerken') &&
                !name.includes('MENU') &&
                !name.includes('BURGERS')) {
              
              const descMatch = fullText.match(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*(.+?)\\s*' + price + ',-'))
              const description = descMatch ? descMatch[1].trim() : ''
              
              let category = 'MAIN'
              const categoryElement = parent.closest('h1, h2, h3, h4, h5, h6')
              if (categoryElement) {
                const categoryText = categoryElement.textContent || ''
                if (categoryText.includes('BURGERS')) category = 'BURGERS'
                else if (categoryText.includes('VEGETARIAN')) category = 'VEGETARIAN'
                else if (categoryText.includes('SIDES')) category = 'SIDES'
                else if (categoryText.includes('DIPS')) category = 'DIPS'
                else if (categoryText.includes('DRINKS')) category = 'DRINKS'
              }
              
              menuItems.push({
                name,
                description,
                price: price * 100, // Convert to øre
                category,
                dietary_info: []
              })
            }
          }
        }
      }
    })
    
    // Remove duplicates
    return menuItems.filter((item, index, self) => 
      index === self.findIndex(t => t.name === item.name && t.price === item.price)
    )
  }

  // Convert simple array format to CompleteMenu format
  const convertArrayToCompleteMenu = (items: any[], url?: string): CompleteMenu => {
    // Group by category
    const categoryMap = new Map<string, any[]>()
    
    items.forEach((item, index) => {
      const category = item.category || 'MAIN'
      if (!categoryMap.has(category)) {
        categoryMap.set(category, [])
      }
      categoryMap.get(category)!.push({
        id: `item-${index}`,
        name: item.name,
        description: item.description,
        price: item.price,
        dietary_info: item.dietary_info || [],
        is_available: true
      })
    })
    
    // Convert to categories array
    const categories = Array.from(categoryMap.entries()).map(([name, items], index) => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      display_order: index + 1,
      items
    }))
    
    // Extract domain name for restaurant info or use default
    let restaurantName = 'Restaurant'
    if (url) {
      try {
        const domain = new URL(url).hostname.replace('www.', '')
        restaurantName = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)
      } catch (e) {
        // Invalid URL, use default
      }
    }
    
    return {
      restaurant_info: {
        name: restaurantName,
        description: '',
        categories: []
      },
      menu_metadata: {
        version: '1.0',
        last_updated: new Date().toISOString(),
        currency: 'NOK',
        language: 'no'
      },
      categories
    }
  }

  // Handle PDF file upload
  const handlePdfUpload = async (file: File) => {
    setIsConvertingPdf(true)
    setValidationErrors([])
    setUploadedFile(file)

    try {
      toast.info('Converting PDF to menu...')
      
      // Convert PDF to menu items
      const menuItems = await convertPdfToMenuItems(file)
      
      if (menuItems.length === 0) {
        throw new Error('No menu items found in PDF. Make sure the PDF contains text (not just images).')
      }
      
      // Convert to CompleteMenu format
      const completeMenu = convertArrayToCompleteMenu(menuItems)
      
      // Validate
      const validation = validateMenuJson(completeMenu)
      
      if (validation.valid) {
        setMenuData(completeMenu)
        toast.success(`Successfully extracted ${menuItems.length} menu items from PDF!`)
      } else {
        setValidationErrors(validation.errors)
        toast.error('Extracted menu has validation errors')
      }
      
    } catch (error: any) {
      console.error('PDF conversion error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to convert PDF'
      setValidationErrors([errorMessage])
      toast.error(errorMessage)
      setUploadedFile(null)
    } finally {
      setIsConvertingPdf(false)
    }
  }

  // Handle URL scraping
  const handleUrlScrape = async () => {
    if (!menuUrl) {
      toast.error('Please enter a menu URL')
      return
    }

    setIsScraping(true)
    setValidationErrors([])

    try {
      toast.info('Scraping menu from URL...')
      
      // Use CORS proxy to fetch the page
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(menuUrl)}`
      const response = await fetch(proxyUrl)
      const data = await response.json()
      
      if (!response.ok || !data.contents) {
        throw new Error('Failed to fetch menu page')
      }
      
      // Parse the HTML
      const parser = new DOMParser()
      const doc = parser.parseFromString(data.contents, 'text/html')
      
      // Extract menu items
      const menuItems = extractMenuItems(doc)
      
      if (menuItems.length === 0) {
        throw new Error('No menu items found. The website might not be compatible or the menu structure is different.')
      }
      
      // Convert to CompleteMenu format
      const completeMenu = convertArrayToCompleteMenu(menuItems, menuUrl)
      
      // Validate
      const validation = validateMenuJson(completeMenu)
      
      if (validation.valid) {
        setMenuData(completeMenu)
        toast.success(`Successfully extracted ${menuItems.length} menu items!`)
      } else {
        setValidationErrors(validation.errors)
        toast.error('Extracted menu has validation errors')
      }
      
    } catch (error: any) {
      console.error('Scraping error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to scrape menu'
      setValidationErrors([errorMessage])
      toast.error(errorMessage)
    } finally {
      setIsScraping(false)
    }
  }

  // AI extraction removed

  if (!isOpen) return null

  const menuStats = menuData ? getMenuStats(menuData) : null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Upload Menu</h2>
              <p className="text-sm text-muted-fg">
                {uploadMode === 'pdf' 
                  ? 'Upload PDF menu to automatically extract items'
                  : uploadMode === 'url'
                  ? 'Import menu from restaurant website'
                  : 'Upload your complete menu in JSON format'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!uploadedFile && !menuData ? (
            <div className="space-y-6">
              {/* Mode Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => setUploadMode('upload')}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                    uploadMode === 'upload'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" />
                    JSON
                  </div>
                </button>
                
                <button
                  onClick={() => setUploadMode('pdf')}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                    uploadMode === 'pdf'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <FileImage className="w-4 h-4" />
                    PDF
                  </div>
                </button>
                <button
                  onClick={() => setUploadMode('url')}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                    uploadMode === 'url'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Globe className="w-4 h-4" />
                    URL
                  </div>
                </button>
              </div>

              {uploadMode === 'upload' ? (
                /* Upload JSON Area */
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Upload Menu JSON File</h3>
                  <p className="text-muted-fg mb-4">
                    Select a JSON file containing your complete menu
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium"
                  >
                    Choose File
                  </button>
                </div>
              ) : uploadMode === 'pdf' ? (
                /* Upload PDF Area */
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handlePdfUpload(file)
                      }
                    }}
                    className="hidden"
                  />
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileImage className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Upload Menu PDF</h3>
                  <p className="text-muted-fg mb-4">
                    Upload your PDF menu and we'll automatically extract the items
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isConvertingPdf}
                    className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConvertingPdf ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                        Converting...
                      </span>
                    ) : (
                      'Choose PDF File'
                    )}
                  </button>
                  {validationErrors.length > 0 && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <ul className="text-sm text-red-800 space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                /* URL Input */
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Import Menu from URL</h3>
                  <p className="text-muted-fg mb-4">
                    Paste a link to your restaurant's online menu
                  </p>
                  <div className="max-w-md mx-auto space-y-3">
                    <input
                      type="url"
                      value={menuUrl}
                      onChange={(e) => setMenuUrl(e.target.value)}
                      placeholder="https://example-restaurant.com/menu"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <button
                      onClick={handleUrlScrape}
                      disabled={isScraping || !menuUrl}
                      className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed w-full"
                    >
                      {isScraping ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                          Scraping...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <LinkIcon className="w-5 h-5" />
                          Extract Menu
                        </span>
                      )}
                    </button>
                  </div>
                  {validationErrors.length > 0 && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <ul className="text-sm text-red-800 space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Sample Menu */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-medium mb-3">Need a template?</h4>
                <p className="text-sm text-muted-fg mb-4">
                  Download our sample menu template to get started
                </p>
                <button
                  onClick={downloadSampleMenu}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download Sample Menu
                </button>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h4 className="font-medium text-blue-900 mb-3">Menu JSON Format</h4>
                <div className="text-sm text-blue-800 space-y-2">
                  <p>Your JSON file should include:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Restaurant information (name, description, contact details)</li>
                    <li>Menu categories with items</li>
                    <li>Item details (name, description, price, dietary info)</li>
                    <li>Optional: variants, special sections, metadata</li>
                  </ul>
                  <p className="mt-3">
                    <strong>Price format:</strong> Use øre (Norwegian currency subunit). 
                    For example, 15000 = 150 NOK
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* File Info */}
              {(uploadedFile || menuData) && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium">
                        {uploadedFile ? uploadedFile.name : 'Menu from URL'}
                      </p>
                      <p className="text-sm text-muted-fg">
                        {uploadedFile ? `${(uploadedFile.size / 1024).toFixed(1)} KB` : `${menuStats?.totalItems || 0} items`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setUploadedFile(null)
                      setMenuData(null)
                      setValidationErrors([])
                      setMenuUrl('')
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Validation Results */}
              {isValidating ? (
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
                  <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
                  <span className="text-blue-800">Validating menu file...</span>
                </div>
              ) : validationErrors.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Validation Errors</span>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4">
                    <ul className="space-y-1 text-sm text-red-800">
                      {validationErrors.map((error, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-500 mt-0.5">•</span>
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : menuData ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Menu is valid!</span>
                  </div>

                  {/* Menu Stats */}
                  {menuStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-primary">{menuStats.totalItems}</div>
                        <div className="text-sm text-muted-fg">Items</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-primary">{menuStats.totalCategories}</div>
                        <div className="text-sm text-muted-fg">Categories</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-primary">
                          {Math.round(menuStats.averagePrice / 100)} NOK
                        </div>
                        <div className="text-sm text-muted-fg">Avg Price</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-primary">{menuStats.dietaryOptions.length}</div>
                        <div className="text-sm text-muted-fg">Dietary Options</div>
                      </div>
                    </div>
                  )}

                  {/* Preview Toggle */}
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Menu Preview</h4>
                    <button
                      onClick={() => setPreviewMode(!previewMode)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      {previewMode ? 'Hide' : 'Show'} Preview
                    </button>
                  </div>

                  {previewMode && (
                    <div className="bg-gray-50 rounded-xl p-4 max-h-60 overflow-y-auto">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(menuData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  onClick={handleClose}
                  className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                {menuData && (
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? 'Uploading...' : 'Upload Menu'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
