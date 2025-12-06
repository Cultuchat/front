/**
 * Tavily Search API Integration
 * Búsqueda web especializada para eventos culturales en Perú
 */

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

export interface TavilySearchResponse {
  results: TavilyResult[];
  query: string;
  response_time: number;
}

/**
 * Busca eventos usando Tavily Search API
 * @param query - Query de búsqueda del usuario
 * @param apiKey - Tavily API key
 * @returns Resultados de la búsqueda
 */
export async function searchWithTavily(
  query: string,
  apiKey: string
): Promise<TavilySearchResponse | null> {
  try {
    console.log(`[Tavily] Searching for: "${query}"`);

    // Mejorar el query para enfocarse en eventos culturales en Perú
    const enhancedQuery = `${query} eventos culturales Perú Lima 2025`;

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: enhancedQuery,
        search_depth: 'basic', // 'basic' o 'advanced'
        include_answer: false,
        include_raw_content: false,
        max_results: 10,
        include_domains: [
          'joinnus.com',
          'teleticket.com.pe',
          'ccpucp.edu.pe',
          'icpna.edu.pe',
          'mali.pe',
          'mac.pe',
          'eventbrite.com',
          'ticketmaster.com.pe',
          'passline.com',
          'joinnus.pe'
        ],
        // exclude_domains: ['facebook.com', 'instagram.com'], // Opcional
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Tavily] API error: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();

    console.log(`[Tavily] Found ${data.results?.length || 0} results in ${data.response_time || 0}s`);

    return {
      results: data.results || [],
      query: data.query || query,
      response_time: data.response_time || 0,
    };
  } catch (error) {
    console.error('[Tavily] Search error:', error);
    return null;
  }
}

/**
 * Filtra URLs de Tavily para quedarse solo con páginas de eventos válidas
 * @param results - Resultados de Tavily
 * @returns URLs filtradas y validadas
 */
export function filterEventUrls(results: TavilyResult[]): TavilyResult[] {
  return results.filter((result) => {
    const url = result.url.toLowerCase();

    // Filtrar URLs no relevantes
    const isInvalidUrl =
      url.includes('/blog') ||
      url.includes('/noticias') ||
      url.includes('/contacto') ||
      url.includes('/nosotros') ||
      url.includes('/login') ||
      url.includes('/registro') ||
      url.includes('/cart') ||
      url.includes('/carrito');

    // Solo URLs que probablemente contengan eventos
    const isEventUrl =
      url.includes('/evento') ||
      url.includes('/concierto') ||
      url.includes('/teatro') ||
      url.includes('/exposicion') ||
      url.includes('/actividad') ||
      url.includes('/programacion') ||
      url.includes('/calendario') ||
      url.includes('/show') ||
      url.includes('/festival') ||
      result.title.toLowerCase().includes('evento') ||
      result.title.toLowerCase().includes('concierto') ||
      result.title.toLowerCase().includes('teatro');

    return !isInvalidUrl && (isEventUrl || result.score > 0.7);
  });
}

/**
 * Extrae información básica de un resultado de Tavily
 * Útil para logging y análisis
 */
export function extractTavilyEventInfo(result: TavilyResult): {
  title: string;
  url: string;
  snippet: string;
  date?: string;
} {
  return {
    title: result.title,
    url: result.url,
    snippet: result.content.substring(0, 200),
    date: result.published_date,
  };
}
