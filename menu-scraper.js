// Menu Scraper for Restaurant Websites
// This script can be run in the browser console to extract menu data from restaurant websites

// Function to scrape Babylon Burger menu
function scrapeBabylonBurgerMenu() {
  const menuItems = [];
  
  // Find all menu items by looking for price patterns
  const priceRegex = /(\d+),-/g;
  const allergenRegex = /ALLERGENER\s*([0-9,\s]+)/i;
  
  // Map allergen numbers to names
  const allergenMap = {
    1: 'soy',
    2: 'egg', 
    3: 'milk',
    4: 'mustard',
    5: 'celery',
    6: 'sesame',
    7: 'gluten'
  };
  
  // Find all elements that might contain menu items
  const elements = document.querySelectorAll('*');
  
  elements.forEach(element => {
    const text = element.textContent || '';
    
    // Look for price patterns
    const priceMatches = text.match(priceRegex);
    if (priceMatches && priceMatches.length > 0) {
      // Get the parent element to find the full item
      const parent = element.closest('li, p, div');
      if (parent) {
        const fullText = parent.textContent || '';
        
        // Extract item name (usually before the price)
        const nameMatch = fullText.match(/^([^0-9]+?)\s*(\d+),-/);
        if (nameMatch) {
          const name = nameMatch[1].trim();
          const price = parseInt(nameMatch[2]);
          
          // Skip if this looks like a category header
          if (name.length > 3 && !name.includes('ALLERGENER') && !name.includes('Burger/Tallerken')) {
            // Extract description (text between name and price)
            const descMatch = fullText.match(new RegExp(name + '\\s*(.+?)\\s*' + price + ',-'));
            const description = descMatch ? descMatch[1].trim() : '';
            
            // Extract allergens
            const allergenMatch = fullText.match(allergenRegex);
            const allergens = allergenMatch ? 
              allergenMatch[1].split(',').map(n => allergenMap[n.trim()]).filter(Boolean) : [];
            
            // Determine category based on context
            let category = 'OTHER';
            const categoryElement = parent.closest('h1, h2, h3, h4, h5, h6');
            if (categoryElement) {
              const categoryText = categoryElement.textContent || '';
              if (categoryText.includes('BURGERS')) category = 'BURGERS';
              else if (categoryText.includes('VEGETARIAN')) category = 'VEGETARIAN';
              else if (categoryText.includes('SIDES')) category = 'SIDES';
              else if (categoryText.includes('LITTLE ONES')) category = 'LITTLE ONES';
              else if (categoryText.includes('ICE CREAM SHAKES')) category = 'ICE CREAM SHAKES';
              else if (categoryText.includes('DIPS')) category = 'DIPS';
              else if (categoryText.includes('SOFT DRINKS')) category = 'SOFT DRINKS';
            }
            
            menuItems.push({
              name: name,
              description: description,
              price: price,
              category: category,
              dietary_info: allergens,
              image_url: null
            });
          }
        }
      }
    }
  });
  
  // Remove duplicates and return
  const uniqueItems = menuItems.filter((item, index, self) => 
    index === self.findIndex(t => t.name === item.name && t.price === item.price)
  );
  
  return uniqueItems;
}

// Function to scrape generic restaurant menu
function scrapeGenericMenu() {
  const menuItems = [];
  
  // Common price patterns
  const pricePatterns = [
    /(\d+),-/g,           // 169,-
    /(\d+)\s*kr/gi,       // 169 kr
    /kr\s*(\d+)/gi,       // kr 169
    /\$\s*(\d+)/g,        // $169
    /€\s*(\d+)/g,         // €169
    /£\s*(\d+)/g          // £169
  ];
  
  // Find all text elements
  const elements = document.querySelectorAll('p, li, div, span');
  
  elements.forEach(element => {
    const text = element.textContent || '';
    
    // Check for price patterns
    for (const pattern of pricePatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        const price = parseInt(matches[0].replace(/[^\d]/g, ''));
        
        if (price > 0 && price < 1000) { // Reasonable price range
          // Extract name (usually before price)
          const nameMatch = text.match(/^([^0-9$€£]+?)\s*[0-9$€£]/);
          if (nameMatch) {
            const name = nameMatch[1].trim();
            
            if (name.length > 2 && name.length < 50) { // Reasonable name length
              // Extract description
              const descMatch = text.match(new RegExp(name + '\\s*(.+?)\\s*[0-9$€£]'));
              const description = descMatch ? descMatch[1].trim() : '';
              
              // Determine category
              let category = 'MAIN';
              const parent = element.closest('*');
              if (parent) {
                const categoryElement = parent.querySelector('h1, h2, h3, h4, h5, h6');
                if (categoryElement) {
                  category = categoryElement.textContent.trim().toUpperCase();
                }
              }
              
              menuItems.push({
                name: name,
                description: description,
                price: price,
                category: category,
                dietary_info: [],
                image_url: null
              });
            }
          }
        }
        break; // Found a price, move to next element
      }
    }
  });
  
  // Remove duplicates
  const uniqueItems = menuItems.filter((item, index, self) => 
    index === self.findIndex(t => t.name === item.name && t.price === item.price)
  );
  
  return uniqueItems;
}

// Main function to run the scraper
function scrapeMenu(url) {
  console.log('🍽️ Starting menu scraping...');
  
  let menuItems = [];
  
  if (url.includes('babylonpizza.no') || url.includes('babylon-burger')) {
    console.log('📋 Detected Babylon Burger menu, using specialized scraper...');
    menuItems = scrapeBabylonBurgerMenu();
  } else {
    console.log('📋 Using generic menu scraper...');
    menuItems = scrapeGenericMenu();
  }
  
  console.log(`✅ Found ${menuItems.length} menu items`);
  console.log('📄 Menu items:', menuItems);
  
  // Generate JSON
  const json = JSON.stringify(menuItems, null, 2);
  
  // Create download link
  const blob = new Blob([json], { type: 'application/json' });
  const url_download = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url_download;
  a.download = 'restaurant-menu.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url_download);
  
  console.log('💾 JSON file downloaded!');
  return menuItems;
}

// Usage instructions
console.log(`
🍽️ Menu Scraper Ready!

To use this scraper:

1. Navigate to the restaurant's menu page
2. Open browser console (F12)
3. Paste this entire script
4. Run: scrapeMenu(window.location.href)

Or for specific URLs:
- scrapeMenu('https://babylonpizza.no/meny-babylon-burger/')
- scrapeMenu('https://example-restaurant.com/menu')

The script will automatically:
- Extract menu items with names, descriptions, and prices
- Detect categories from headings
- Download a JSON file ready for upload
`);

// Auto-run if on Babylon Burger page
if (window.location.href.includes('babylonpizza.no') || window.location.href.includes('babylon-burger')) {
  console.log('🎯 Auto-detected Babylon Burger menu, running scraper...');
  setTimeout(() => scrapeMenu(window.location.href), 1000);
}



