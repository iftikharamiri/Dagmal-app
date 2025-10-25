// Test database connection and check for deals
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nrutsewxzbtysbskaabd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydXRzZXd4emJ0eXNic2thYWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTcxNDMsImV4cCI6MjA3MzE3MzE0M30.j-5yH4TnfC7BnC0YekydBH_UM8umTXNYBugv26S5UNY'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDatabase() {
  console.log('🔍 Testing database connection...')
  
  try {
    // Test 1: Check restaurants
    console.log('\n1. Testing restaurants table...')
    const { data: restaurants, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('id, name, categories')
      .limit(5)
    
    if (restaurantsError) {
      console.error('❌ Restaurants error:', restaurantsError)
    } else {
      console.log('✅ Restaurants found:', restaurants?.length || 0)
      restaurants?.forEach(r => console.log(`  - ${r.name} (${r.id})`))
    }
    
    // Test 2: Check deals
    console.log('\n2. Testing deals table...')
    const { data: deals, error: dealsError } = await supabase
      .from('deals')
      .select('id, title, restaurant_id, is_active')
      .limit(10)
    
    if (dealsError) {
      console.error('❌ Deals error:', dealsError)
    } else {
      console.log('✅ Deals found:', deals?.length || 0)
      deals?.forEach(d => console.log(`  - ${d.title} (restaurant: ${d.restaurant_id}, active: ${d.is_active})`))
    }
    
    // Test 3: Check for Nordlys restaurant specifically
    console.log('\n3. Testing Nordlys restaurant...')
    const { data: nordlys, error: nordlysError } = await supabase
      .from('restaurants')
      .select('id, name, categories')
      .ilike('name', '%nordlys%')
    
    if (nordlysError) {
      console.error('❌ Nordlys error:', nordlysError)
    } else {
      console.log('✅ Nordlys restaurants found:', nordlys?.length || 0)
      nordlys?.forEach(r => console.log(`  - ${r.name} (${r.id})`))
      
      // Check deals for Nordlys
      if (nordlys && nordlys.length > 0) {
        const nordlysId = nordlys[0].id
        console.log(`\n4. Testing deals for Nordlys (${nordlysId})...`)
        
        const { data: nordlysDeals, error: nordlysDealsError } = await supabase
          .from('deals')
          .select('id, title, restaurant_id, is_active')
          .eq('restaurant_id', nordlysId)
        
        if (nordlysDealsError) {
          console.error('❌ Nordlys deals error:', nordlysDealsError)
        } else {
          console.log('✅ Nordlys deals found:', nordlysDeals?.length || 0)
          nordlysDeals?.forEach(d => console.log(`  - ${d.title} (active: ${d.is_active})`))
        }
      }
    }
    
    // Test 4: Check menu_items table
    console.log('\n5. Testing menu_items table...')
    const { data: menuItems, error: menuItemsError } = await supabase
      .from('menu_items')
      .select('id, name, restaurant_id')
      .limit(5)
    
    if (menuItemsError) {
      console.error('❌ Menu items error:', menuItemsError)
    } else {
      console.log('✅ Menu items found:', menuItems?.length || 0)
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
  }
}

testDatabase()