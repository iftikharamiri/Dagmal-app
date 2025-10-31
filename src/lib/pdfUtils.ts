/**
 * PDF utility functions for extracting menu items from PDF files
 */

import * as pdfjsLib from 'pdfjs-dist'

// Set worker path - use CDN for better compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

export interface MenuItemFromPdf {
  name: string
  description?: string
  price: number
  category: string
  dietary_info: string[]
}

/**
 * Extract text content from a PDF file
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    console.log('Starting PDF text extraction...')
    const arrayBuffer = await file.arrayBuffer()
    console.log('PDF loaded, buffer size:', arrayBuffer.byteLength)
    
    // Use the modern API for pdfjs-dist v5+
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      verbosity: 0 // Suppress console messages
    })
    
    const pdf = await loadingTask.promise
    console.log('PDF document loaded, pages:', pdf.numPages)
    
    let fullText = ''

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`Extracting text from page ${pageNum}/${pdf.numPages}`)
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      
      // Extract text from the page
      const pageText = textContent.items
        .map((item: any) => {
          // Handle both string and TextItem formats
          return typeof item === 'string' ? item : item.str
        })
        .join(' ')
      
      console.log(`Page ${pageNum} extracted, length:`, pageText.length)
      fullText += pageText + '\n\n'
    }

    console.log('Total text extracted, length:', fullText.length)
    
    if (fullText.trim().length === 0) {
      throw new Error('No text could be extracted from the PDF. It may be image-based.')
    }
    
    return fullText
  } catch (error) {
    console.error('Error extracting text from PDF:', error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('worker')) {
        throw new Error('PDF worker not loaded. Please refresh the page and try again.')
      } else if (error.message.includes('Invalid PDF')) {
        throw new Error('The file is not a valid PDF. Please check your file.')
      } else {
        throw new Error(`Failed to extract text from PDF: ${error.message}`)
      }
    }
    
    throw new Error('Failed to extract text from PDF. The PDF might be image-based or corrupted.')
  }
}

/**
 * Extract menu items from PDF text using pattern matching
 */
export function extractMenuItemsFromText(text: string): MenuItemFromPdf[] {
  const menuItems: MenuItemFromPdf[] = []
  
  // Split text into lines
  const lines = text.split('\n').filter(line => line.trim().length > 0)
  
  // Price patterns for Norwegian menus
  const pricePatterns = [
    /(\d+)\s*[,\.]\s*/g,  // 169,- or 169.
    /kr\s*(\d+)/gi,        // kr 169
    /(\d+)\s*kr/gi,        // 169 kr
    /NOK\s*(\d+)/gi,       // NOK 169
  ]
  
  let currentCategory = 'MAIN'
  
  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Check if line is a category header
    if (isCategoryHeader(line)) {
      currentCategory = normalizeCategory(line)
      continue
    }
    
    // Try to extract menu item from line
    const item = extractMenuItemFromLine(line, currentCategory)
    if (item) {
      menuItems.push(item)
    }
  }
  
  // Remove duplicates
  const uniqueItems = menuItems.filter((item, index, self) => 
    index === self.findIndex(t => t.name.toLowerCase() === item.name.toLowerCase() && t.price === item.price)
  )
  
  return uniqueItems
}

/**
 * Check if a line is a category header
 */
function isCategoryHeader(line: string): boolean {
  const categoryKeywords = [
    'APPETIZER', 'FORRETTER', 'STARTER', 'FORRETT',
    'MAIN', 'HOVEDRETT', 'HOVEDRETTER',
    'DESSERT', 'DESSERTER',
    'DRINKS', 'DRIKKE', 'DRIKKEVARER', 'SOFT DRINKS',
    'WINE', 'VIN', 'VINER',
    'BEER', 'ØL',
    'SIDES', 'TILBEHØR',
    'BURGERS', 'BURGER',
    'PIZZA', 'PIZZER',
    'PASTA',
    'SALADS', 'SALATER',
    'SOUP', 'SUPPER', 'SUPPE',
    'SPECIAL', 'SPESIAL', 'SPESIALITET',
    'CHILDREN', 'BARN', 'BARNEMENY',
    'VEGETARIAN', 'VEGETAR',
    'VEGAN', 'VEGANSK'
  ]
  
  const upperLine = line.toUpperCase()
  return categoryKeywords.some(keyword => upperLine.includes(keyword))
}

/**
 * Normalize category name
 */
function normalizeCategory(line: string): string {
  const upperLine = line.toUpperCase()
  
  const categoryMap: { [key: string]: string } = {
    'APPETIZER': 'APPETIZERS',
    'FORRETTER': 'APPETIZERS',
    'STARTER': 'APPETIZERS',
    'FORRETT': 'APPETIZERS',
    'MAIN': 'MAIN DISHES',
    'HOVEDRETT': 'MAIN DISHES',
    'HOVEDRETTER': 'MAIN DISHES',
    'DESSERT': 'DESSERTS',
    'DESSERTER': 'DESSERTS',
    'DRINKS': 'DRINKS',
    'DRIKKE': 'DRINKS',
    'DRIKKEVARER': 'DRINKS',
    'SOFT DRINKS': 'DRINKS',
    'WINE': 'WINE',
    'VIN': 'WINE',
    'VINER': 'WINE',
    'BEER': 'BEER',
    'ØL': 'BEER',
    'SIDES': 'SIDES',
    'TILBEHØR': 'SIDES',
    'BURGERS': 'BURGERS',
    'BURGER': 'BURGERS',
    'PIZZA': 'PIZZA',
    'PIZZER': 'PIZZA',
    'PASTA': 'PASTA',
    'SALADS': 'SALADS',
    'SALATER': 'SALADS',
    'SOUP': 'SOUP',
    'SUPPER': 'SOUP',
    'SUPPE': 'SOUP',
    'SPECIAL': 'SPECIALS',
    'SPESIAL': 'SPECIALS',
    'SPESIALITET': 'SPECIALS',
    'CHILDREN': 'CHILDREN',
    'BARN': 'CHILDREN',
    'BARNEMENY': 'CHILDREN',
    'VEGETARIAN': 'VEGETARIAN',
    'VEGETAR': 'VEGETARIAN',
    'VEGAN': 'VEGAN',
    'VEGANSK': 'VEGAN'
  }
  
  for (const [key, value] of Object.entries(categoryMap)) {
    if (upperLine.includes(key)) {
      return value
    }
  }
  
  return upperLine
}

/**
 * Extract menu item from a line of text
 */
function extractMenuItemFromLine(line: string, category: string): MenuItemFromPdf | null {
  // Price patterns
  const pricePatterns = [
    /(\d+)\s*[,\.]\s*$/,         // 169,- or 169. at end of line
    /kr\s*(\d+)/gi,              // kr 169
    /(\d+)\s*kr/gi,              // 169 kr
    /NOK\s*(\d+)/gi,             // NOK 169
    /\s+(\d{3,4})\s*$/,          // 3-4 digit number at end
  ]
  
  let price: number | null = null
  let priceMatch: RegExpMatchArray | null = null
  
  // Find price
  for (const pattern of pricePatterns) {
    priceMatch = line.match(pattern)
    if (priceMatch) {
      price = parseInt(priceMatch[1] || priceMatch[0].replace(/[^\d]/g, ''))
      break
    }
  }
  
  // If no price found, skip this line
  if (!price || price < 10 || price > 10000) {
    return null
  }
  
  // Extract name and description
  let itemText = line
  
  // Remove price from line
  if (priceMatch) {
    itemText = line.substring(0, priceMatch.index || line.length).trim()
  }
  
  // Split by common separators
  const parts = itemText.split(/[-–—]/)
  
  const name = parts[0].trim()
  const description = parts.length > 1 ? parts.slice(1).join(' ').trim() : undefined
  
  // Validate item
  if (name.length < 2 || name.length > 100) {
    return null
  }
  
  // Skip obvious non-items
  const skipPatterns = [
    'ALLERGENER',
    'ALLERGEN',
    'CONTACT',
    'KONTAKT',
    'OPENING HOURS',
    'ÅPNINGSTIDER',
    'ADDRESS',
    'ADRESSE',
    'PHONE',
    'TELEFON',
    'EMAIL',
    'EPOST',
    'TABLE OF CONTENTS',
    'INNHOLDSFORTEGNELSE'
  ]
  
  const upperName = name.toUpperCase()
  if (skipPatterns.some(pattern => upperName.includes(pattern))) {
    return null
  }
  
  return {
    name,
    description,
    price: price * 100, // Convert to øre
    category,
    dietary_info: []
  }
}

/**
 * Convert PDF file to menu items
 */
export async function convertPdfToMenuItems(file: File): Promise<MenuItemFromPdf[]> {
  try {
    const text = await extractTextFromPdf(file)
    const items = extractMenuItemsFromText(text)
    return items
  } catch (error) {
    console.error('Error converting PDF to menu items:', error)
    throw error
  }
}
