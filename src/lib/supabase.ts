import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Temporarily hardcode for testing
const supabaseUrl = 'https://nrutsewxzbtysbskaabd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydXRzZXd4emJ0eXNic2thYWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTcxNDMsImV4cCI6MjA3MzE3MzE0M30.j-5yH4TnfC7BnC0YekydBH_UM8umTXNYBugv26S5UNY'

// Force real Supabase connection - no placeholder check
console.log('✅ Using real Supabase:', supabaseUrl)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

