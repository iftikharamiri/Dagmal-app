// Simple script to test database connection and create menu_items table
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nrutsewxzbtysbskaabd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydXRzZXd4emJ0eXNic2thYWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTcxNDMsImV4cCI6MjA3MzE3MzE0M30.j-5yH4TnfC7BnC0YekydBH_UM8umTXNYBugv26S5UNY'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDatabase() {
  console.log('Testing database connection...')
  
  try {
    // Test basic connection
    const { data: restaurants, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('id, name')
      .limit(1)
    
    if (restaurantsError) {
      console.error('Restaurants table error:', restaurantsError)
      return
    }
    
    console.log('✅ Restaurants table accessible:', restaurants)
    
    // Test menu_items table
    const { data: menuItems, error: menuItemsError } = await supabase
      .from('menu_items')
      .select('id')
      .limit(1)
    
    if (menuItemsError) {
      console.error('❌ Menu items table error:', menuItemsError)
      console.log('The menu_items table does not exist or is not accessible.')
      console.log('Please run the SQL script to create the table.')
      return
    }
    
    console.log('✅ Menu items table accessible:', menuItems)
    
  } catch (error) {
    console.error('Database test failed:', error)
  }
}

testDatabase()












