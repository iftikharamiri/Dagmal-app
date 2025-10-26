import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nrutsewxzbtysbskaabd.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydXRzZXd4emJ0eXNic2thYWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTcxNDMsImV4cCI6MjA3MzE3MzE0M30.j-5yH4TnfC7BnC0YekydBH_UM8umTXNYBugv26S5UNY'


export const supabase = createClient(supabaseUrl, supabaseAnonKey)

