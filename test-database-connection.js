// Test database connection and table structure
// Run this with: node test-database-connection.js

import { createClient } from '@supabase/supabase-js'

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = 'https://nrutsewxzbtysbskaabd.supabase.co'
const supabaseKey = 'your-anon-key-here' // Replace with your actual anon key

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabase() {
  console.log('🔍 Testing database connection...')
  
  try {
    // Test 1: Check if restaurants table exists
    console.log('\n1. Testing restaurants table...')
    const { data: restaurants, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('*')
      .limit(1)
    
    if (restaurantsError) {
      console.error('❌ Restaurants table error:', restaurantsError.message)
    } else {
      console.log('✅ Restaurants table accessible')
      console.log('   Sample restaurant:', restaurants[0]?.name || 'No restaurants found')
    }

    // Test 2: Check if menu_items table exists
    console.log('\n2. Testing menu_items table...')
    const { data: menuItems, error: menuItemsError } = await supabase
      .from('menu_items')
      .select('*')
      .limit(1)
    
    if (menuItemsError) {
      console.error('❌ Menu items table error:', menuItemsError.message)
      console.log('   This means the menu_items table needs to be created')
    } else {
      console.log('✅ Menu items table accessible')
      console.log('   Sample menu item:', menuItems[0]?.name || 'No menu items found')
    }

    // Test 3: Check restaurant structure
    console.log('\n3. Checking restaurant structure...')
    if (restaurants && restaurants.length > 0) {
      const restaurant = restaurants[0]
      console.log('   Restaurant fields:', Object.keys(restaurant))
      console.log('   Has owner_id:', 'owner_id' in restaurant)
    }

  } catch (error) {
    console.error('❌ Database test failed:', error.message)
  }
}

testDatabase()



