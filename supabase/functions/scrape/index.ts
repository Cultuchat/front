// Edge Function: Scrape
// Scrapes events from various sources using Firecrawl and stores them in Supabase

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { geocodeWithFallback } from '../_shared/geocoding.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EventSource {
  url: string
  category: string
  name: string
}

interface ScrapedEvent {
  title?: string
  description?: string
  date?: string
  time?: string
  venue?: string
  location?: string
  price?: string
  imageUrl?: string
  eventUrl?: string
}

const SOURCES: EventSource[] = [
  {
    url: 'https://www.joinnus.com/PE/conciertos',
    category: 'Música',
    name: 'Joinnus Conciertos'
  },
  {
    url: 'https://www.joinnus.com/PE/teatro',
    category: 'Teatro',
    name: 'Joinnus Teatro'
  },
  {
    url: 'https://www.teleticket.com.pe',
    category: 'General',
    name: 'Teleticket'
  },
  {
    url: 'https://www.ccpucp.edu.pe/programacion',
    category: 'Arte',
    name: 'Centro Cultural PUCP'
  },
  {
    url: 'https://www.icpna.edu.pe/eventos',
    category: 'Arte',
    name: 'ICPNA'
  },
  {
    url: 'https://www.mali.pe/actividades',
    category: 'Arte',
    name: 'MALI'
  },
  {
    url: 'https://www.mac.pe/calendario',
    category: 'Arte',
    name: 'MAC Lima'
  }
]

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting scraping process...')

    // Connect to Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')

    if (!firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY not configured')
    }

    let totalScraped = 0
    let totalInserted = 0
    const errors: string[] = []

    // Scrape each source
    for (const source of SOURCES) {
      try {
        console.log(`Scraping: ${source.name} (${source.url})`)

        const events = await scrapeSource(source, firecrawlApiKey)
        totalScraped += events.length

        console.log(`Found ${events.length} events from ${source.name}`)

        // Insert events into database with geocoding
        for (const event of events) {
          try {
            // Geocode the event location
            let latitude = null;
            let longitude = null;

            if (event.venue_address || event.district) {
              const geoResult = await geocodeWithFallback(
                event.venue_address,
                event.district,
                'Lima'
              );

              if (geoResult) {
                latitude = geoResult.latitude;
                longitude = geoResult.longitude;
                console.log(`Geocoded "${event.title}": ${latitude}, ${longitude}`);
              } else {
                console.log(`Could not geocode "${event.title}"`);
              }

              // Rate limiting: wait 1 second between geocoding requests
              await new Promise(resolve => setTimeout(resolve, 1000));
            }

            const { error } = await supabase
              .from('events')
              .insert({
                title: event.title,
                description: event.description,
                category: source.category,
                event_date: event.event_date,
                event_time: event.event_time,
                venue_name: event.venue_name,
                venue_address: event.venue_address,
                district: event.district,
                price_text: event.price_text,
                price_min: event.price_min,
                price_max: event.price_max,
                is_free: event.is_free,
                source_name: source.name,
                source_url: event.source_url || source.url,
                image_url: event.image_url,
                city: 'Lima',
                is_active: true,
                latitude,
                longitude
              })

            if (error) {
              console.error(`Error inserting event "${event.title}":`, error)
              errors.push(`${source.name}: ${error.message}`)
            } else {
              totalInserted++
            }
          } catch (insertError) {
            console.error('Insert error:', insertError)
            errors.push(`${source.name}: ${insertError.message}`)
          }
        }

      } catch (sourceError) {
        console.error(`Error scraping ${source.name}:`, sourceError)
        errors.push(`${source.name}: ${sourceError.message}`)
      }
    }

    // Deactivate old events
    const { error: deactivateError } = await supabase
      .from('events')
      .update({ is_active: false })
      .lt('event_date', new Date().toISOString())

    if (deactivateError) {
      console.error('Error deactivating old events:', deactivateError)
    }

    console.log(`Scraping complete. Scraped: ${totalScraped}, Inserted: ${totalInserted}`)

    return new Response(
      JSON.stringify({
        success: true,
        scraped: totalScraped,
        inserted: totalInserted,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Scraping error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

/**
 * Scrape a single source using Firecrawl
 */
async function scrapeSource(
  source: EventSource,
  apiKey: string
): Promise<any[]> {
  const schema = {
    type: 'object',
    properties: {
      events: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            date: { type: 'string' },
            time: { type: 'string' },
            venue: { type: 'string' },
            location: { type: 'string' },
            price: { type: 'string' },
            imageUrl: { type: 'string' },
            eventUrl: { type: 'string' }
          },
          required: ['title']
        }
      }
    }
  }

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: source.url,
        formats: ['extract'],
        extract: {
          schema,
          systemPrompt: `You are an expert at extracting event information from websites.
Extract all cultural events you can find on this page including concerts, theater shows,
art exhibitions, dance performances, festivals, and gastronomy events.
Focus on events happening in Lima, Peru. Extract as much detail as possible.`
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Firecrawl API error: ${response.statusText}`)
    }

    const result = await response.json()

    if (!result.success || !result.data?.extract?.events) {
      return []
    }

    // Process and normalize events
    const events = result.data.extract.events.map((event: ScrapedEvent) =>
      processEvent(event, source)
    ).filter((event: any) => event !== null)

    return events

  } catch (error) {
    console.error(`Error scraping ${source.url}:`, error)
    return []
  }
}

/**
 * Process and normalize event data
 */
function processEvent(eventData: ScrapedEvent, source: EventSource): any | null {
  try {
    const title = eventData.title?.trim()
    if (!title) return null

    const description = eventData.description?.trim()
    const venueName = eventData.venue?.trim()
    const location = eventData.location?.trim()
    const priceText = eventData.price?.trim()
    const imageUrl = eventData.imageUrl
    const eventUrl = eventData.eventUrl

    // Parse date
    const eventDate = parseDate(eventData.date)

    // Parse time
    const eventTime = normalizeTime(eventData.time)

    // Parse price
    const priceInfo = parsePrice(priceText)

    // Extract district
    const district = extractDistrict(location || venueName)

    return {
      title,
      description,
      short_description: description?.substring(0, 200),
      event_date: eventDate,
      event_time: eventTime,
      venue_name: venueName || location,
      venue_address: location,
      district,
      price_text: priceInfo.price_text,
      price_min: priceInfo.price_min,
      price_max: priceInfo.price_max,
      is_free: priceInfo.is_free,
      source_url: eventUrl,
      image_url: imageUrl
    }

  } catch (error) {
    console.error('Error processing event:', error)
    return null
  }
}

/**
 * Parse date string to ISO format
 */
function parseDate(dateStr?: string): string | null {
  if (!dateStr) return null

  try {
    // Try ISO format first
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      return date.toISOString()
    }

    // Try common formats
    // You can add more sophisticated date parsing here
    return null
  } catch {
    return null
  }
}

/**
 * Normalize time string
 */
function normalizeTime(timeStr?: string): string | null {
  if (!timeStr) return null
  return timeStr.trim()
}

/**
 * Parse price information
 */
function parsePrice(priceText?: string): {
  price_text: string | null
  price_min: number | null
  price_max: number | null
  is_free: boolean
} {
  if (!priceText) {
    return { price_text: null, price_min: null, price_max: null, is_free: false }
  }

  const priceLower = priceText.toLowerCase()

  // Check if free
  const isFree = /gratis|free|entrada libre|sin costo/i.test(priceLower)
  if (isFree) {
    return { price_text: priceText, price_min: 0, price_max: 0, is_free: true }
  }

  // Extract numbers
  const numbers = priceText.match(/\d+(?:,\d{3})*(?:\.\d{2})?/g)
  const prices = numbers ? numbers.map(n => parseFloat(n.replace(/,/g, ''))) : []

  return {
    price_text: priceText,
    price_min: prices.length > 0 ? Math.min(...prices) : null,
    price_max: prices.length > 0 ? Math.max(...prices) : null,
    is_free: false
  }
}

/**
 * Extract district from address
 */
function extractDistrict(address?: string): string | null {
  if (!address) return null

  const districts = [
    'Miraflores', 'San Isidro', 'Barranco', 'Surco', 'La Molina',
    'San Borja', 'Jesús María', 'Lince', 'Magdalena', 'Pueblo Libre',
    'San Miguel', 'Cercado de Lima', 'Lima', 'Breña', 'Chorrillos',
    'Surquillo', 'San Luis', 'La Victoria', 'Rímac', 'Callao',
    'Los Olivos', 'Independencia', 'Comas', 'San Juan de Lurigancho',
    'Ate', 'Villa El Salvador', 'Villa María del Triunfo', 'San Martín de Porres'
  ]

  const addressLower = address.toLowerCase()
  for (const district of districts) {
    if (addressLower.includes(district.toLowerCase())) {
      return district
    }
  }

  return null
}
