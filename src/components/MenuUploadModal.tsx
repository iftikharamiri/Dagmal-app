import React, { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, X, Eye, Download } from 'lucide-react'
import { toast } from 'sonner'
import { CompleteMenu, validateMenuJson, getMenuStats } from '@/lib/menuUtils'

interface MenuUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onMenuUploaded: (menu: CompleteMenu) => void
  restaurantId: string
}

export function MenuUploadModal({ isOpen, onClose, onMenuUploaded }: MenuUploadModalProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [menuData, setMenuData] = useState<CompleteMenu | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
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
              <p className="text-sm text-muted-fg">Upload your complete menu in JSON format</p>
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
          {!uploadedFile ? (
            <div className="space-y-6">
              {/* Upload Area */}
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
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-fg">
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setUploadedFile(null)
                    setMenuData(null)
                    setValidationErrors([])
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

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
