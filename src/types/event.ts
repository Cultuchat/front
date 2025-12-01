// Backend Event type (matches Supabase events table)
export type Event = {
  // Core fields
  id: number | string;
  title: string;
  description?: string;
  short_description?: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  
  // Date and time
  event_date?: string;
  event_end_date?: string;
  event_time?: string;
  date?: string; // Formatted date for UI
  time?: string; // Formatted time for UI
  
  // Location
  venue_name?: string;
  venue_address?: string;
  district?: string;
  city?: string;
  location?: string; // Combined location for UI
  latitude?: number;
  longitude?: number;
  
  // Pricing
  price_min?: number;
  price_max?: number;
  price_text?: string;
  price?: string; // Formatted price for UI
  is_free?: boolean;
  
  // Source
  source_name?: string;
  source_url?: string;
  organizer?: string; // Alias for source_name
  
  // Media
  image_url?: string;
  image?: string; // Emoji/icon for UI
  
  // UI state
  registered?: boolean;
  duration?: string;
  capacity?: number;
  
  // Metadata
  embedding_generated?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};
