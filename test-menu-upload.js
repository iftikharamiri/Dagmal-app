// Test script to debug menu upload issues
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nrutsewxzbtysbskaabd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydXRzZXd4emJ0eXNic2thYWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTcxNDMsImV4cCI6MjA3MzE3MzE0M30.j-5yH4TnfC7BnC0YekydBH_UM8umTXNYBugv26S5UNY'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testMenuUpload() {
  console.log('Testing menu upload functionality...')
  
  try {
    // 1. Test authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth status:', user ? 'Logged in' : 'Not logged in')
    if (authError) console.error('Auth error:', authError)
    
    // 2. Test restaurants table access
    const { data: restaurants, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('id, name, owner_id')
      .limit(1)
    
    if (restaurantsError) {
      console.error('Restaurants error:', restaurantsError)
      return
    }
    console.log('Restaurants accessible:', restaurants)
    
    // 3. Test menu_items table access
    const { data: menuItems, error: menuItemsError } = await supabase
      .from('menu_items')
      .select('id, restaurant_id, name')
      .limit(1)
    
    if (menuItemsError) {
      console.error('Menu items error:', menuItemsError)
      return
    }
    console.log('Menu items accessible:', menuItems)
    
    // 4. Test inserting a simple menu item (if we have a restaurant)
    if (restaurants && restaurants.length > 0) {
      const testMenuItem = {
        restaurant_id: restaurants[0].id,
        name: 'Test Item',
        description: 'A test menu item',
        price: 10000, // 100 NOK in øre
        category: 'Test',
        dietary_info: ['vegetarian'],
        is_available: true
      }
      
      console.log('Testing menu item insertion...')
      const { data: insertData, error: insertError } = await supabase
        .from('menu_items')
        .insert([testMenuItem])
        .select()
      
      if (insertError) {
        console.error('Insert error:', insertError)
        console.error('Error details:', JSON.stringify(insertError, null, 2))
      } else {
        console.log('✅ Menu item inserted successfully:', insertData)
        
        // Clean up - delete the test item
        const { error: deleteError } = await supabase
          .from('menu_items')
          .delete()
          .eq('id', insertData[0].id)
        
        if (deleteError) {
          console.warn('Could not clean up test item:', deleteError)
        } else {
          console.log('✅ Test item cleaned up')
        }
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testMenuUpload()








