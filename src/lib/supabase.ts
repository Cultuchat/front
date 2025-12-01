import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Client for browser (with auth)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Client for server-side (without auth)
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions for our database
export interface Event {
  id: number
  title: string
  description?: string
  short_description?: string
  category?: string
  subcategory?: string
  tags: string[]
  event_date?: string
  event_end_date?: string
  event_time?: string
  venue_name?: string
  venue_address?: string
  district?: string
  city: string
  price_min?: number
  price_max?: number
  price_text?: string
  is_free: boolean
  source_name: string
  source_url: string
  image_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: number
  name: string
  slug: string
  description?: string
  icon?: string
  created_at: string
}

export interface District {
  id: number
  name: string
  slug: string
  zone?: string
  created_at: string
}
