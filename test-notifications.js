// Test notifications table
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nrutsewxzbtysbskaabd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydXRzZXd4emJ0eXNic2thYWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTcxNDMsImV4cCI6MjA3MzE3MzE0M30.j-5yH4TnfC7BnC0YekydBH_UM8umTXNYBugv26S5UNY'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testNotifications() {
  console.log('🔔 Testing notifications table...')
  
  try {
    // Test 1: Check if notifications table exists
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .limit(5)
    
    if (notificationsError) {
      console.error('❌ Notifications table error:', notificationsError)
    } else {
      console.log('✅ Notifications table exists, found:', notifications?.length || 0, 'notifications')
      notifications?.forEach(n => console.log(`  - ${n.customer_name} claimed ${n.deal_title}`))
    }
    
    // Test 2: Try to create a test notification
    console.log('\n🧪 Testing notification creation...')
    const { data: testNotification, error: testError } = await supabase
      .from('notifications')
      .insert({
        restaurant_id: 'rest-dc8190d4-a52b-4b6e-a968-cbec4d3e3d7e', // Nordlys
        deal_id: 'test-deal',
        claim_id: 'test-claim',
        customer_name: 'Test Customer',
        customer_phone: '+4712345678',
        deal_title: 'Test Deal',
        quantity: 1,
        service_type: 'dine_in',
        claim_date: new Date().toISOString().split('T')[0]
      })
      .select()
    
    if (testError) {
      console.error('❌ Test notification creation failed:', testError)
    } else {
      console.log('✅ Test notification created successfully:', testNotification)
      
      // Clean up test notification
      await supabase
        .from('notifications')
        .delete()
        .eq('id', testNotification[0].id)
      console.log('🧹 Test notification cleaned up')
    }
    
  } catch (error) {
    console.error('❌ Notifications test failed:', error)
  }
}

testNotifications()





