/**
 * Geocoding utilities using OpenStreetMap Nominatim API
 * Free and reliable geocoding service
 */

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  display_name: string;
  confidence?: number;
}

interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
  importance?: number;
}

/**
 * Geocode an address to latitude/longitude coordinates
 * Uses OpenStreetMap Nominatim API (free tier)
 *
 * @param address - Full address or venue name
 * @param city - City name (default: "Lima, Peru")
 * @returns Geocoding result or null if not found
 */
export async function geocodeAddress(
  address: string,
  city: string = 'Lima, Peru'
): Promise<GeocodingResult | null> {
  if (!address || address.trim() === '') {
    return null;
  }

  try {
    // Construct full search query
    const query = `${address}, ${city}`;

    // Build Nominatim API URL
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '1',
      countrycodes: 'pe', // Limit to Peru
      addressdetails: '1'
    });

    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;

    // Make request with proper User-Agent (required by Nominatim)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CultuChat/1.0 (Cultural Events App)',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`Geocoding API error: ${response.statusText}`);
      return null;
    }

    const results: NominatimResponse[] = await response.json();

    if (!results || results.length === 0) {
      console.log(`No geocoding results found for: ${query}`);
      return null;
    }

    const result = results[0];

    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      display_name: result.display_name,
      confidence: result.importance
    };

  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Geocode with district fallback
 * If full address fails, tries to geocode just the district in Lima
 *
 * @param address - Full address
 * @param district - District name
 * @param city - City name (default: "Lima")
 * @returns Geocoding result or null
 */
export async function geocodeWithFallback(
  address: string | null,
  district: string | null,
  city: string = 'Lima'
): Promise<GeocodingResult | null> {
  // Try full address first
  if (address) {
    const result = await geocodeAddress(address, `${district || ''}, ${city}, Peru`);
    if (result) {
      return result;
    }
  }

  // Fallback to district only
  if (district) {
    const result = await geocodeAddress(district, `${city}, Peru`);
    if (result) {
      return result;
    }
  }

  // Final fallback: center of Lima
  if (city.toLowerCase() === 'lima') {
    console.log('Using Lima city center as fallback');
    return {
      latitude: -12.046374,
      longitude: -77.042793,
      display_name: 'Lima, Peru'
    };
  }

  return null;
}

/**
 * Batch geocode multiple addresses with rate limiting
 * Nominatim has a rate limit of 1 request per second
 *
 * @param addresses - Array of address objects
 * @param delayMs - Delay between requests in milliseconds (default: 1000)
 * @returns Array of geocoding results
 */
export async function batchGeocode(
  addresses: Array<{ address?: string; district?: string; city?: string }>,
  delayMs: number = 1000
): Promise<Array<GeocodingResult | null>> {
  const results: Array<GeocodingResult | null> = [];

  for (let i = 0; i < addresses.length; i++) {
    const { address, district, city } = addresses[i];

    console.log(`Geocoding ${i + 1}/${addresses.length}...`);

    const result = await geocodeWithFallback(
      address || null,
      district || null,
      city || 'Lima'
    );

    results.push(result);

    // Rate limiting: wait before next request (except for last one)
    if (i < addresses.length - 1) {
      await delay(delayMs);
    }
  }

  return results;
}

/**
 * Calculate distance between two coordinates in kilometers
 * Uses Haversine formula
 *
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Delay utility for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validate coordinates
 */
export function isValidCoordinates(lat: number, lon: number): boolean {
  return (
    lat >= -90 && lat <= 90 &&
    lon >= -180 && lon <= 180 &&
    !isNaN(lat) && !isNaN(lon)
  );
}

/**
 * Check if coordinates are within Lima metropolitan area
 * Lima bounds (approximate):
 * - North: -11.7
 * - South: -12.3
 * - West: -77.2
 * - East: -76.8
 */
export function isInLimaArea(lat: number, lon: number): boolean {
  return (
    lat >= -12.3 && lat <= -11.7 &&
    lon >= -77.2 && lon <= -76.8
  );
}
