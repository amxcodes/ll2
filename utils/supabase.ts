import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://muhzcyekidbuoslrlyuh.supabase.co"
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11aHpjeWVraWRidW9zbHJseXVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3MDkwOTUsImV4cCI6MjA1MDI4NTA5NX0.dE_lAEGOzYNOfyHO9TtypjWgiyUxRPEQ_S7S00NdhN4"

// Create a custom storage adapter that handles SSR
const createStorageAdapter = () => {
  if (Platform.OS === 'web' && typeof window === 'undefined') {
    // Return no-op storage for SSR
    return {
      getItem: () => Promise.resolve(null),
      setItem: () => Promise.resolve(),
      removeItem: () => Promise.resolve()
    }
  }
  
  return AsyncStorage
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: createStorageAdapter(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)