import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { 
  searchWithFirecrawl, 
  filterFirecrawlResults, 
  scrapeWithFirecrawl,
  scrapeMultipleSources,
  getRelevantUrls,
  LIMA_CULTURAL_URLS 
} from "./shared/firecrawl-search.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ChatRequest {
  message: string;
  userId?: string;
  forceWebSearch?: boolean; // Forzar búsqueda web con Firecrawl
}

interface EventMatch {
  id: number;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  venue_name: string;
  venue_address: string;
  district: string;
  city: string;
  price_text: string;
  category: string;
  image_url: string;
  source_url: string;
  latitude: number;
  longitude: number;
  similarity: number;
  is_free?: boolean;
}

// Umbral de similitud para considerar buenos resultados
const SIMILARITY_THRESHOLD = 0.4;
const MIN_GOOD_RESULTS = 3;

// Category mappings for strict filtering - EVENTOS CULTURALES (no conciertos masivos)
const CATEGORY_MAPPINGS: { [key: string]: { keywords: string[]; dbCategories: string[] } } = {
  'teatro': {
    keywords: ['teatro', 'obra', 'obras de teatro', 'comedia', 'drama', 'monólogo', 'actuación', 'dramaturgia', 'escénico', 'unipersonal'],
    dbCategories: ['Teatro', 'Obra de Teatro', 'Comedia', 'Drama']
  },
  'arte': {
    keywords: ['arte', 'exposición', 'exposiciones', 'galería', 'museo', 'pintura', 'escultura', 'muestra', 'exhibición', 'instalación artística', 'arte contemporáneo', 'artes visuales'],
    dbCategories: ['Arte & Cultura', 'Arte', 'Exposición', 'Museo', 'Galería', 'Artes Visuales']
  },
  'musica': {
    keywords: ['música clásica', 'orquesta', 'sinfónica', 'ópera', 'recital', 'coro', 'coral', 'cámara', 'filarmónica', 'lírica', 'jazz', 'música criolla', 'música andina', 'música peruana'],
    dbCategories: ['Música Clásica', 'Ópera', 'Concierto de Cámara', 'Jazz', 'Música Criolla', 'Recital']
  },
  'danza': {
    keywords: ['ballet', 'danza', 'baile clásico', 'danza contemporánea', 'folklore', 'folclore', 'marinera', 'danza moderna', 'coreografía'],
    dbCategories: ['Ballet', 'Danza', 'Danza Contemporánea', 'Folklore']
  },
  'cine': {
    keywords: ['cine', 'película', 'películas', 'film', 'cortometraje', 'documental', 'cine club', 'proyección', 'cinemateca'],
    dbCategories: ['Cine', 'Documental', 'Cine Club']
  },
  'literatura': {
    keywords: ['literatura', 'poesía', 'libro', 'libros', 'lectura', 'escritor', 'feria del libro', 'presentación de libro', 'narrativa', 'cuento'],
    dbCategories: ['Literatura', 'Poesía', 'Presentación de Libro', 'Feria del Libro']
  },
  'infantil': {
    keywords: ['infantil', 'niños', 'familia', 'kids', 'familiar', 'títeres', 'cuenta cuentos', 'taller para niños'],
    dbCategories: ['Infantil', 'Familiar', 'Títeres', 'Teatro Infantil']
  },
  'festival': {
    keywords: ['festival', 'festivales', 'feria cultural', 'bienal'],
    dbCategories: ['Festival', 'Festival Cultural', 'Feria Cultural', 'Bienal']
  },
  'taller': {
    keywords: ['taller', 'talleres', 'workshop', 'curso', 'clase magistral', 'masterclass', 'seminario'],
    dbCategories: ['Taller', 'Workshop', 'Curso', 'Clase Magistral']
  },
  'gratis': {
    keywords: ['gratis', 'gratuito', 'gratuitos', 'entrada libre', 'sin costo', 'free'],
    dbCategories: [] // Special: filter by is_free field
  }
};

// Detect specific category from user query
function detectStrictCategory(query: string): { category: string | null; isFreeFilter: boolean } {
  const lowerQuery = query.toLowerCase();
  
  for (const [categoryKey, config] of Object.entries(CATEGORY_MAPPINGS)) {
    for (const keyword of config.keywords) {
      if (lowerQuery.includes(keyword)) {
        if (categoryKey === 'gratis') {
          return { category: null, isFreeFilter: true };
        }
        return { category: categoryKey, isFreeFilter: false };
      }
    }
  }
  
  return { category: null, isFreeFilter: false };
}

// Filter events by detected category strictly
function filterEventsByStrictCategory(events: EventMatch[], categoryKey: string): EventMatch[] {
  const config = CATEGORY_MAPPINGS[categoryKey];
  if (!config) return events;
  
  return events.filter(event => {
    if (!event.category) return false;
    const eventCategoryLower = event.category.toLowerCase();
    
    // Check if event category matches any of the expected categories
    return config.dbCategories.some(dbCat => 
      eventCategoryLower.includes(dbCat.toLowerCase()) ||
      dbCat.toLowerCase().includes(eventCategoryLower)
    ) || config.keywords.some(kw => eventCategoryLower.includes(kw));
  });
}

// Filter free events
function filterFreeEvents(events: EventMatch[]): EventMatch[] {
  return events.filter(event => {
    // Check is_free field or price_text
    const priceText = (event.price_text || '').toLowerCase();
    return priceText.includes('gratis') || 
           priceText.includes('gratuito') || 
           priceText.includes('entrada libre') ||
           priceText === '0' ||
           priceText === 's/ 0';
  });
}

// Generate embedding for a query using OpenAI
async function generateEmbedding(text: string): Promise<number[]> {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiApiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: text,
      model: "text-embedding-3-small",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// Helper: Get date in YYYY-MM-DD format
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Helper: Add days to a date
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Helper: Get last day of month
function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// Detect if query is asking for events by date/month
function detectDateQuery(message: string): { type: 'today' | 'tomorrow' | 'weekend' | 'week' | 'month' | 'range' | 'specific' | null, startDate?: string, endDate?: string } {
  const lowerMessage = message.toLowerCase();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // ========================================
  // SPECIFIC DATE PATTERNS
  // ========================================
  
  // "el 25 de diciembre", "25 de diciembre", "diciembre 25"
  const specificDateMatch = lowerMessage.match(/(\d{1,2})\s*(?:de\s+)?(\w+)(?:\s+(?:de\s+)?(\d{4}))?/);
  if (specificDateMatch) {
    const monthsMap: { [key: string]: number } = {
      'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4,
      'mayo': 5, 'junio': 6, 'julio': 7, 'agosto': 8,
      'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
    };
    const day = parseInt(specificDateMatch[1]);
    const monthName = specificDateMatch[2];
    const monthNum = monthsMap[monthName];
    
    if (monthNum && day >= 1 && day <= 31) {
      let year = specificDateMatch[3] ? parseInt(specificDateMatch[3]) : now.getFullYear();
      // If month already passed, use next year
      if (monthNum < now.getMonth() + 1 || (monthNum === now.getMonth() + 1 && day < now.getDate())) {
        year = now.getFullYear() + 1;
      }
      const dateStr = `${year}-${monthNum.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      console.log(`[Date] Detected specific date: ${dateStr}`);
      return { type: 'specific', startDate: dateStr, endDate: dateStr };
    }
  }

  // ========================================
  // TODAY
  // ========================================
  if (lowerMessage.includes('hoy') || lowerMessage.includes('esta noche') || lowerMessage.includes('ahora')) {
    const dateStr = formatDate(today);
    console.log(`[Date] Detected "hoy": ${dateStr}`);
    return { type: 'today', startDate: dateStr, endDate: dateStr };
  }

  // ========================================
  // TOMORROW
  // ========================================
  if (lowerMessage.includes('mañana')) {
    const tomorrow = addDays(today, 1);
    const dateStr = formatDate(tomorrow);
    console.log(`[Date] Detected "mañana": ${dateStr}`);
    return { type: 'tomorrow', startDate: dateStr, endDate: dateStr };
  }

  // ========================================
  // THIS WEEKEND (Friday to Sunday)
  // ========================================
  if (lowerMessage.includes('fin de semana') || lowerMessage.includes('finde') || lowerMessage.includes('weekend')) {
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    let friday: Date;
    
    if (dayOfWeek === 0) { // Sunday - next weekend
      friday = addDays(today, 5);
    } else if (dayOfWeek === 6) { // Saturday - this weekend (today to tomorrow)
      friday = addDays(today, -1);
    } else { // Monday to Friday
      friday = addDays(today, 5 - dayOfWeek);
    }
    
    const sunday = addDays(friday, 2);
    console.log(`[Date] Detected "fin de semana": ${formatDate(friday)} to ${formatDate(sunday)}`);
    return { type: 'weekend', startDate: formatDate(friday), endDate: formatDate(sunday) };
  }

  // ========================================
  // THIS WEEK
  // ========================================
  if (lowerMessage.includes('esta semana') || lowerMessage.includes('próximos días') || lowerMessage.includes('proximos dias')) {
    const endOfWeek = addDays(today, 7);
    console.log(`[Date] Detected "esta semana": ${formatDate(today)} to ${formatDate(endOfWeek)}`);
    return { type: 'week', startDate: formatDate(today), endDate: formatDate(endOfWeek) };
  }

  // ========================================
  // NEXT WEEK
  // ========================================
  if (lowerMessage.includes('próxima semana') || lowerMessage.includes('proxima semana') || lowerMessage.includes('siguiente semana')) {
    const startNextWeek = addDays(today, 7 - today.getDay() + 1); // Next Monday
    const endNextWeek = addDays(startNextWeek, 6); // Next Sunday
    console.log(`[Date] Detected "próxima semana": ${formatDate(startNextWeek)} to ${formatDate(endNextWeek)}`);
    return { type: 'week', startDate: formatDate(startNextWeek), endDate: formatDate(endNextWeek) };
  }

  // ========================================
  // HOLIDAYS - CHRISTMAS
  // ========================================
  if (lowerMessage.includes('navidad') || lowerMessage.includes('noche buena') || lowerMessage.includes('nochebuena')) {
    const year = now.getMonth() === 11 && now.getDate() <= 25 ? now.getFullYear() : now.getFullYear() + 1;
    const startDate = `${year}-12-20`;
    const endDate = `${year}-12-25`;
    console.log(`[Date] Detected "navidad": ${startDate} to ${endDate}`);
    return { type: 'range', startDate, endDate };
  }

  // ========================================
  // HOLIDAYS - NEW YEAR
  // ========================================
  if (lowerMessage.includes('año nuevo') || lowerMessage.includes('fin de año') || lowerMessage.includes('reveillon')) {
    const year = now.getMonth() === 11 ? now.getFullYear() : now.getFullYear();
    const startDate = `${year}-12-28`;
    const endDate = `${year + 1}-01-02`;
    console.log(`[Date] Detected "año nuevo": ${startDate} to ${endDate}`);
    return { type: 'range', startDate, endDate };
  }

  // ========================================
  // THIS MONTH
  // ========================================
  if (lowerMessage.includes('este mes')) {
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const lastDay = getLastDayOfMonth(year, month);
    const startDate = formatDate(today); // From today, not start of month
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
    console.log(`[Date] Detected "este mes": ${startDate} to ${endDate}`);
    return { type: 'month', startDate, endDate };
  }

  // ========================================
  // SPECIFIC MONTH (enero, febrero, etc.)
  // ========================================
  const monthsMap: { [key: string]: number } = {
    'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4,
    'mayo': 5, 'junio': 6, 'julio': 7, 'agosto': 8,
    'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
  };

  for (const [monthName, monthNum] of Object.entries(monthsMap)) {
    if (lowerMessage.includes(monthName)) {
      const currentMonth = now.getMonth() + 1;
      let year = now.getFullYear();
      
      // If month already passed, use next year
      if (monthNum < currentMonth) {
        year = now.getFullYear() + 1;
      }

      // Check if year is mentioned in message
      const yearMatch = lowerMessage.match(/20\d{2}/);
      if (yearMatch) {
        year = parseInt(yearMatch[0]);
      }

      const lastDay = getLastDayOfMonth(year, monthNum);
      const startDate = `${year}-${monthNum.toString().padStart(2, '0')}-01`;
      const endDate = `${year}-${monthNum.toString().padStart(2, '0')}-${lastDay}`;

      console.log(`[Date] Detected month "${monthName}": ${startDate} to ${endDate}`);
      return { type: 'month', startDate, endDate };
    }
  }

  return { type: null };
}

// Detect district/location from query
function detectLocation(message: string): string | null {
  const lowerMessage = message.toLowerCase();
  
  const districts: { [key: string]: string[] } = {
    'Miraflores': ['miraflores'],
    'Barranco': ['barranco'],
    'San Isidro': ['san isidro', 'sanisidro'],
    'Surco': ['surco', 'santiago de surco'],
    'La Molina': ['la molina', 'lamolina'],
    'San Borja': ['san borja', 'sanborja'],
    'Jesús María': ['jesus maria', 'jesús maría', 'jesusmaria'],
    'Lince': ['lince'],
    'Magdalena': ['magdalena'],
    'Pueblo Libre': ['pueblo libre', 'pueblolibre'],
    'Chorrillos': ['chorrillos'],
    'San Miguel': ['san miguel', 'sanmiguel'],
    'Callao': ['callao'],
    'Centro de Lima': ['centro de lima', 'cercado', 'lima cercado', 'centro histórico', 'centro historico'],
    'Ate': ['ate', 'ate vitarte'],
    'La Victoria': ['la victoria', 'lavictoria'],
    'Breña': ['breña', 'brena'],
    'Rímac': ['rimac', 'rímac'],
    'San Juan de Lurigancho': ['san juan de lurigancho', 'sjl'],
    'Los Olivos': ['los olivos'],
    'Independencia': ['independencia'],
    'Comas': ['comas'],
    'Villa El Salvador': ['villa el salvador', 'ves'],
  };

  for (const [district, keywords] of Object.entries(districts)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        console.log(`[Location] Detected: ${district}`);
        return district;
      }
    }
  }

  return null;
}

// Detect price filter from query
function detectPriceFilter(message: string): { type: 'free' | 'cheap' | 'max' | null, maxPrice?: number } {
  const lowerMessage = message.toLowerCase();

  // Free events
  if (lowerMessage.includes('gratis') || lowerMessage.includes('gratuito') || 
      lowerMessage.includes('entrada libre') || lowerMessage.includes('sin costo') ||
      lowerMessage.includes('free')) {
    console.log(`[Price] Detected: free`);
    return { type: 'free' };
  }

  // Cheap events
  if (lowerMessage.includes('barato') || lowerMessage.includes('económico') || 
      lowerMessage.includes('economico') || lowerMessage.includes('accesible')) {
    console.log(`[Price] Detected: cheap (max S/ 30)`);
    return { type: 'cheap', maxPrice: 30 };
  }

  // Max price: "menos de 50 soles", "hasta 100 soles", "máximo 80"
  const priceMatch = lowerMessage.match(/(?:menos de|hasta|máximo|maximo|max)\s*(?:s\/\.?\s*)?(\d+)/);
  if (priceMatch) {
    const maxPrice = parseInt(priceMatch[1]);
    console.log(`[Price] Detected: max S/ ${maxPrice}`);
    return { type: 'max', maxPrice };
  }

  return { type: null };
}

// Filter events by location
function filterEventsByLocation(events: EventMatch[], district: string): EventMatch[] {
  return events.filter(event => {
    const searchTerm = district.toLowerCase();
    const fieldsToSearch = [
      event.district || '',
      event.venue_address || '',
      event.venue_name || '',
      event.title || '',
      event.description || ''
    ];
    
    return fieldsToSearch.some(field => field.toLowerCase().includes(searchTerm));
  });
}

// Filter events by max price
function filterEventsByPrice(events: EventMatch[], maxPrice: number): EventMatch[] {
  return events.filter(event => {
    const priceText = event.price_text || '';
    
    // Extract numbers from price text
    const priceMatch = priceText.match(/(\d+)/);
    if (!priceMatch) return true; // Include if no price found
    
    const price = parseInt(priceMatch[1]);
    return price <= maxPrice;
  });
}

// Find events by date range
async function findEventsByDate(
  supabase: ReturnType<typeof createClient>,
  startDate: string,
  endDate: string
): Promise<EventMatch[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .gte("event_date", startDate)
    .lte("event_date", endDate)
    .order("event_date", { ascending: true });

  if (error) {
    console.error("Error finding events by date:", error);
    throw error;
  }

  return (data || []).map(e => ({ ...e, similarity: 1.0 }));
}

// Find similar events using vector similarity search
async function findSimilarEvents(
  supabase: ReturnType<typeof createClient>,
  queryEmbedding: number[],
  matchThreshold: number = 0.1
): Promise<EventMatch[]> {
  const { data, error } = await supabase.rpc("match_events", {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: 100, // Get many results
  });

  if (error) {
    console.error("Error in match_events:", error);
    throw error;
  }

  return data || [];
}

// Check if results are good enough
function areResultsGood(events: EventMatch[]): boolean {
  if (events.length === 0) return false;
  if (events.length < MIN_GOOD_RESULTS) return false;

  // Check if at least some results have good similarity
  const goodResults = events.filter(e => e.similarity >= SIMILARITY_THRESHOLD);
  return goodResults.length >= MIN_GOOD_RESULTS;
}

// Search with Firecrawl and extract events directly from results
async function searchAndProcessWithFirecrawl(
  query: string,
  supabase: ReturnType<typeof createClient>
): Promise<{ newEventsFound: number; urlsProcessed: number }> {
  const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

  if (!firecrawlApiKey) {
    console.log("[Firecrawl] API key not configured, skipping web search");
    return { newEventsFound: 0, urlsProcessed: 0 };
  }

  if (!openaiApiKey) {
    console.log("[OpenAI] API key not configured, skipping event extraction");
    return { newEventsFound: 0, urlsProcessed: 0 };
  }

  // Search with Firecrawl
  const searchResults = await searchWithFirecrawl(query, firecrawlApiKey);

  if (!searchResults || !searchResults.success || searchResults.data.length === 0) {
    console.log("[Firecrawl] No results found");
    return { newEventsFound: 0, urlsProcessed: 0 };
  }

  console.log(`[Firecrawl] Found ${searchResults.data.length} results`);

  // Filter to get only event-related results
  const eventResults = filterFirecrawlResults(searchResults.data);
  console.log(`[Firecrawl] Filtered to ${eventResults.length} event results`);

  if (eventResults.length === 0) {
    // Si no hay resultados filtrados, usar los primeros 5 sin filtrar
    eventResults.push(...searchResults.data.slice(0, 5));
  }

  let newEventsFound = 0;
  const urlsProcessed = eventResults.length;

  // Combine all content for GPT extraction
  // Para redes sociales sin markdown, el título y descripción tienen la info clave
  const combinedContent = eventResults.map((r: { url: string; title: string; description: string; markdown?: string }) => {
    const hasUsefulMarkdown = r.markdown && r.markdown.length > 200;
    
    // Dar más peso al título y descripción (que siempre están presentes)
    let content = `--- FUENTE: ${r.url} ---\n`;
    content += `TÍTULO: ${r.title}\n`;
    content += `DESCRIPCIÓN: ${r.description}\n`;
    
    if (hasUsefulMarkdown) {
      content += `CONTENIDO ADICIONAL: ${r.markdown!.substring(0, 2000)}\n`;
    }
    
    return content;
  }).join('\n\n');

  if (!combinedContent.trim()) {
    console.log("[Firecrawl] No content to process");
    return { newEventsFound: 0, urlsProcessed: 0 };
  }

  // Use GPT to extract events from Firecrawl content
  const currentDate = new Date().toISOString().split('T')[0];
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().toLocaleString('es-PE', { month: 'long' });
  const today = new Date();
  const nextSaturday = new Date(today);
  nextSaturday.setDate(today.getDate() + (6 - today.getDay() + 7) % 7);
  const nextSaturdayStr = nextSaturday.toISOString().split('T')[0];
  
  const extractionPrompt = `Extrae EVENTOS CULTURALES del siguiente contenido web.
Hoy es ${currentDate} (${currentMonth} ${currentYear}). El próximo sábado es ${nextSaturdayStr}.

⚠️ FECHAS - MUY IMPORTANTE:
- event_date es OBLIGATORIO. Siempre intenta extraer o inferir una fecha.
- Si dice "diciembre" o "${currentMonth}", usa ${currentYear}
- Si dice "este fin de semana", usa ${nextSaturdayStr}
- Si dice "todos los fines de semana" o "temporada hasta [fecha]", usa la primera fecha disponible (${nextSaturdayStr})
- Si dice "hasta el 31 de diciembre", infiere que empieza HOY (${currentDate})
- Si menciona una TEMPORADA (ej: "temporada 2025"), usa la primera función como fecha
- Si NO hay fecha clara pero es un evento próximo, usa ${nextSaturdayStr} como estimado
- SOLO excluye event_date si realmente no hay ninguna pista de cuándo es

🎭 SOLO EVENTOS CULTURALES:
✅ INCLUIR: Teatro, Ópera, Ballet, Danza, Exposiciones de Arte, Museos, Galerías, Cine de Arte, Documentales, Literatura, Poesía, Orquestas, Música Clásica, Jazz, Música Criolla/Peruana, Festivales Culturales, Talleres Artísticos, Títeres, Teatro Infantil
❌ EXCLUIR: Conciertos masivos (reggaetón, pop, rock comercial), Eventos deportivos, Discotecas, Fiestas, Bares

📋 EXTRACCIÓN:
El contenido puede venir de redes sociales (Instagram, TikTok, Facebook). 
Extrae la información del TÍTULO y DESCRIPCIÓN aunque no haya contenido adicional.

Devuelve un JSON array. Cada evento debe tener:
- title: nombre del evento (obligatorio)
- description: descripción breve
- event_date: fecha YYYY-MM-DD (obligatorio - infiere si es necesario)
- event_time: hora HH:MM
- venue_name: nombre del lugar
- venue_address: dirección si está disponible
- district: distrito de Lima
- price_text: precio ("S/ 50", "Gratis", "Entrada libre")
- category: Teatro/Ballet/Arte/Museo/Danza/Ópera/Música Clásica/Jazz/Cine/Literatura/Festival/Taller/Infantil
- source_url: URL de la fuente

Si no encuentras eventos culturales válidos, devuelve [].

CONTENIDO:
${combinedContent}

Responde SOLO con el JSON array.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Eres un extractor de eventos culturales en Perú. Responde solo con JSON válido." },
          { role: "user", content: extractionPrompt }
        ],
        temperature: 0.1,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      console.error("[GPT] Extraction error:", await response.text());
      return { newEventsFound: 0, urlsProcessed };
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    // Parse JSON response
    let extractedEvents;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedEvents = JSON.parse(cleanContent);
    } catch {
      console.error("[GPT] Failed to parse events JSON:", content);
      return { newEventsFound: 0, urlsProcessed };
    }

    if (!Array.isArray(extractedEvents) || extractedEvents.length === 0) {
      console.log("[GPT] No events extracted");
      return { newEventsFound: 0, urlsProcessed };
    }

    console.log(`[GPT] Extracted ${extractedEvents.length} events from Firecrawl content`);

    // Insert events to database
    for (const event of extractedEvents) {
      if (!event.title) continue;

      try {
        // Check if event already exists (by title similarity)
        const { data: existing } = await supabase
          .from("events")
          .select("id")
          .ilike("title", `%${event.title.substring(0, 30)}%`)
          .limit(1);

        if (existing && existing.length > 0) {
          console.log(`[Skip] Event already exists: ${event.title}`);
          continue;
        }

        // Parse price
        const priceText = event.price_text || '';
        const isFree = priceText.toLowerCase().includes('gratis') || 
                       priceText.toLowerCase().includes('libre') ||
                       priceText === '0';
        
        // Insert event
        const { error: insertError } = await supabase
          .from("events")
          .insert({
            title: event.title,
            description: event.description || null,
            event_date: event.event_date || null,
            event_time: event.event_time || null,
            venue_name: event.venue_name || null,
            venue_address: event.venue_address || null,
            district: event.district || null,
            city: 'Lima',
            price_text: event.price_text || null,
            is_free: isFree,
            category: event.category || 'General',
            source_url: event.source_url || eventResults[0]?.url || null,
            source_name: 'Firecrawl Search',
            is_active: true,
          });

        if (insertError) {
          console.error(`[DB] Error inserting event "${event.title}":`, insertError);
        } else {
          newEventsFound++;
          console.log(`[Success] Inserted: ${event.title}`);
        }

      } catch (eventError) {
        console.error(`[Error] Processing event "${event.title}":`, eventError);
      }
    }

    // Save processed URLs
    for (const result of eventResults) {
      await supabase
        .from("discovered_urls")
        .upsert({
          url: result.url,
          source: 'firecrawl',
          search_query: query,
          processed: true,
          processed_at: new Date().toISOString(),
          metadata: {
            title: result.title,
          },
        }, { onConflict: 'url' });
    }

  } catch (error) {
    console.error("[Firecrawl] Processing error:", error);
  }

  return { newEventsFound, urlsProcessed };
}

// ============================================================
// SCRAPE DE FUENTES CONFIABLES DE EVENTOS CULTURALES
// ============================================================

/**
 * Scrapea fuentes confiables de eventos culturales según la consulta
 * Útil cuando sabemos exactamente qué páginas tienen eventos relevantes
 */
async function scrapeReliableSources(
  query: string,
  supabase: ReturnType<typeof createClient>
): Promise<{ newEventsFound: number; sourcesScraped: number }> {
  const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

  if (!firecrawlApiKey || !openaiApiKey) {
    console.log("[Scrape] API keys not configured");
    return { newEventsFound: 0, sourcesScraped: 0 };
  }

  // Obtener URLs relevantes según la consulta
  const urlsToScrape = getRelevantUrls(query);
  
  if (urlsToScrape.length === 0) {
    console.log("[Scrape] No relevant URLs for this query");
    return { newEventsFound: 0, sourcesScraped: 0 };
  }

  console.log(`[Scrape] Will scrape ${urlsToScrape.length} reliable sources:`, urlsToScrape);

  // Scrape múltiples fuentes en paralelo
  const scrapeResults = await scrapeMultipleSources(urlsToScrape, firecrawlApiKey);
  const sourcesScraped = scrapeResults.length;

  if (sourcesScraped === 0) {
    console.log("[Scrape] No sources could be scraped");
    return { newEventsFound: 0, sourcesScraped: 0 };
  }

  // Combinar todo el contenido para extracción
  const combinedContent = scrapeResults
    .filter(r => r.data && r.data.markdown)
    .map(r => `--- FUENTE: ${r.data!.url} ---\n${r.data!.markdown.substring(0, 5000)}`)
    .join('\n\n');

  if (!combinedContent.trim()) {
    console.log("[Scrape] No content extracted from sources");
    return { newEventsFound: 0, sourcesScraped };
  }

  // Usar GPT para extraer eventos
  const currentDate = new Date().toISOString().split('T')[0];
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().toLocaleString('es-PE', { month: 'long' });

  const extractionPrompt = `Extrae TODOS los eventos culturales del siguiente contenido.
Hoy es ${currentDate} (${currentMonth} ${currentYear}).

REGLAS:
- SOLO eventos futuros (del ${currentDate} en adelante)
- SOLO eventos culturales (teatro, ballet, ópera, exposiciones, museos, danza, música clásica, jazz, literatura, cine de arte)
- NO conciertos masivos comerciales
- Incluye TODOS los eventos que encuentres, no importa cuántos sean

Para cada evento devuelve:
- title: nombre del evento
- description: descripción breve
- event_date: fecha YYYY-MM-DD
- event_time: hora HH:MM
- venue_name: lugar
- venue_address: dirección
- district: distrito de Lima
- price_text: precio o "Gratis"
- category: Teatro/Ballet/Arte/Museo/Danza/Ópera/Música Clásica/Jazz/Cine/Literatura/Festival/Taller
- source_url: URL de donde viene

CONTENIDO:
${combinedContent}

Responde SOLO con JSON array.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Extractor de eventos culturales. Responde solo con JSON válido." },
          { role: "user", content: extractionPrompt }
        ],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      console.error("[GPT Scrape] Error:", await response.text());
      return { newEventsFound: 0, sourcesScraped };
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    let extractedEvents;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedEvents = JSON.parse(cleanContent);
    } catch {
      console.error("[GPT Scrape] Failed to parse JSON:", content.substring(0, 200));
      return { newEventsFound: 0, sourcesScraped };
    }

    if (!Array.isArray(extractedEvents)) {
      return { newEventsFound: 0, sourcesScraped };
    }

    console.log(`[Scrape] Extracted ${extractedEvents.length} events from reliable sources`);

    let newEventsFound = 0;

    // Insertar eventos
    for (const event of extractedEvents) {
      if (!event.title) continue;

      try {
        // Verificar si ya existe
        const { data: existing } = await supabase
          .from("events")
          .select("id")
          .ilike("title", `%${event.title.substring(0, 30)}%`)
          .limit(1);

        if (existing && existing.length > 0) continue;

        const priceText = event.price_text || '';
        const isFree = priceText.toLowerCase().includes('gratis') || 
                       priceText.toLowerCase().includes('libre');

        const { error } = await supabase
          .from("events")
          .insert({
            title: event.title,
            description: event.description || null,
            event_date: event.event_date || null,
            event_time: event.event_time || null,
            venue_name: event.venue_name || null,
            venue_address: event.venue_address || null,
            district: event.district || null,
            city: 'Lima',
            price_text: event.price_text || null,
            is_free: isFree,
            category: event.category || 'General',
            source_url: event.source_url || null,
            source_name: 'Firecrawl Scrape (Reliable Source)',
            is_active: true,
          });

        if (!error) {
          newEventsFound++;
          console.log(`[Scrape Success] ${event.title}`);
        }
      } catch (e) {
        console.error(`[Scrape Error] ${event.title}:`, e);
      }
    }

    return { newEventsFound, sourcesScraped };

  } catch (error) {
    console.error("[Scrape] Processing error:", error);
    return { newEventsFound: 0, sourcesScraped };
  }
}

// Generate embeddings for events without embeddings
async function generateMissingEmbeddings(
  supabase: ReturnType<typeof createClient>
): Promise<number> {
  try {
    // Get events without embeddings (limit to 5 to avoid timeout)
    const { data: eventsWithoutEmbedding } = await supabase
      .from("events")
      .select("id, title, description")
      .is("embedding", null)
      .eq("is_active", true)
      .limit(5);

    if (!eventsWithoutEmbedding || eventsWithoutEmbedding.length === 0) {
      return 0;
    }

    console.log(`[Embeddings] Generating for ${eventsWithoutEmbedding.length} events`);

    let generated = 0;

    for (const event of eventsWithoutEmbedding) {
      try {
        const textToEmbed = `${event.title} ${event.description || ''}`.substring(0, 8000);
        const embedding = await generateEmbedding(textToEmbed);

        await supabase
          .from("events")
          .update({
            embedding,
            embedding_generated: true
          })
          .eq("id", event.id);

        generated++;
        console.log(`[Embedding] Generated for event #${event.id}`);

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`[Embedding] Error for event #${event.id}:`, error);
      }
    }

    return generated;
  } catch (error) {
    console.error("[Embeddings] Error generating embeddings:", error);
    return 0;
  }
}

// Format events for the response
function formatEventsResponse(events: EventMatch[], query: string, detectedCategory: string | null): string {
  if (events.length === 0) {
    const categoryName = detectedCategory ? getCategoryDisplayName(detectedCategory) : 'eventos';
    return `No encontré ${categoryName} disponibles por ahora. Puedes activar la búsqueda web para ampliar los resultados. 🔎`;
  }

  // Simple intro - events will be shown as cards
  const categoryName = detectedCategory ? getCategoryDisplayName(detectedCategory) : 'eventos';
  return `¡Encontré ${events.length} ${categoryName} para ti! 🎉`;
}

// Get display name for category
function getCategoryDisplayName(categoryKey: string): string {
  const displayNames: { [key: string]: string } = {
    'teatro': 'obras de teatro',
    'arte': 'exposiciones de arte',
    'musica': 'eventos de música clásica/jazz',
    'danza': 'eventos de danza y ballet',
    'cine': 'proyecciones de cine',
    'literatura': 'eventos literarios',
    'infantil': 'eventos infantiles',
    'festival': 'festivales culturales',
    'taller': 'talleres artísticos',
    'gratis': 'eventos gratuitos'
  };
  return displayNames[categoryKey] || 'eventos culturales';
}

// Generate a conversational response using OpenAI
async function generateChatResponse(
  query: string,
  events: EventMatch[],
  detectedCategory: string | null,
  usedWebSearch: boolean = false,
  webSearchStats?: { newEventsFound: number; urlsProcessed: number }
): Promise<string> {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiApiKey) {
    // Fallback to formatted response if no API key
    return formatEventsResponse(events, query, detectedCategory);
  }

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.toLocaleString("es-PE", { month: "long" });
  const categoryName = detectedCategory ? getCategoryDisplayName(detectedCategory) : 'eventos';

  let systemPrompt = `Eres CultuChat, un asistente especializado en EVENTOS CULTURALES en Lima, Perú.
Hoy es ${currentDate.toLocaleDateString("es-PE")} (${currentMonth} ${currentYear}).

Tu especialidad: Teatro, Ópera, Ballet, Danza, Exposiciones de Arte, Museos, Galerías, Cine de Arte, Literatura, Música Clásica, Jazz, Música Peruana, Festivales Culturales, Talleres Artísticos.

⚠️ NO cubres: Conciertos masivos (reggaetón, pop comercial), eventos deportivos, discotecas, fiestas.

REGLAS CRÍTICAS:
1. Los eventos se mostrarán automáticamente como tarjetas visuales debajo de tu mensaje.
2. NO listes los eventos en tu respuesta. NO incluyas nombres, fechas, lugares ni precios.
3. Solo genera un mensaje BREVE (1-2 líneas máximo) indicando cuántos ${categoryName} encontraste.
4. Si hay ${events.length} eventos, di algo como: "¡Encontré ${events.length} ${categoryName} para ti! 🎭"
5. Si NO hay eventos (0 resultados), responde: "No encontré ${categoryName} disponibles por ahora. Puedes activar la búsqueda web para ampliar los resultados. 🔎"
6. NUNCA repitas la información de los eventos en texto.

Responde en español con emojis culturales (🎭🎨🎪🎬📚🎵).`;

  if (usedWebSearch && webSearchStats) {
    // Solo mencionar búsqueda web si HAY resultados después de filtros
    if (events.length > 0 && webSearchStats.newEventsFound > 0) {
      systemPrompt += `\n\nNOTA: Buscaste en la web y añadiste nuevos eventos a la base de datos. Menciona brevemente que buscaste en la web: "🌐 Busqué en la web y..."`;
    } else if (events.length === 0 && webSearchStats.urlsProcessed > 0) {
      systemPrompt += `\n\nNOTA: Buscaste en la web pero no encontraste ${categoryName} que coincidan con la búsqueda. Di: "Busqué en la web pero no encontré ${categoryName} disponibles. Intenta con otra búsqueda."`;
    }
  }

  const eventsContext = events.length > 0
    ? `\n\nSe encontraron ${events.length} ${categoryName}. Las tarjetas se mostrarán automáticamente.`
    : `\n\nNo se encontraron ${categoryName}.`;

  const messages = [
    { role: "system", content: systemPrompt + eventsContext },
    { role: "user", content: query }
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI chat error:", await response.text());
      return formatEventsResponse(events, query, detectedCategory);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error generating chat response:", error);
    return formatEventsResponse(events, query, detectedCategory);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, userId, forceWebSearch = false } = await req.json() as ChatRequest;

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`\n========================================`);
    console.log(`[Chat] Query: "${message}" (user: ${userId || "anonymous"})`);
    console.log(`========================================\n`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let events: EventMatch[] = [];
    let responseText: string;
    let usedWebSearch = false;
    let webSearchStats = { newEventsFound: 0, urlsProcessed: 0 };

    try {
      // Detect category from query (needed for all paths)
      const { category: detectedCategory, isFreeFilter } = detectStrictCategory(message);
      console.log(`[Category] Detected: ${detectedCategory || 'general'}, isFreeFilter: ${isFreeFilter}`);

      // Detect additional filters
      const detectedLocation = detectLocation(message);
      const priceFilter = detectPriceFilter(message);
      const dateQuery = detectDateQuery(message);

      console.log(`[Detect] Category: ${detectedCategory || 'none'}, Location: ${detectedLocation || 'none'}, Price: ${priceFilter.type || 'none'}, Date: ${dateQuery.type || 'none'}`);

      // Helper function to apply all filters
      const applyAllFilters = (eventsToFilter: EventMatch[]): EventMatch[] => {
        let filtered = eventsToFilter;

        // Apply category filter
        if (detectedCategory) {
          filtered = filterEventsByStrictCategory(filtered, detectedCategory);
          console.log(`[Filter] After category (${detectedCategory}): ${filtered.length} events`);
        } else if (isFreeFilter || priceFilter.type === 'free') {
          filtered = filterFreeEvents(filtered);
          console.log(`[Filter] After free filter: ${filtered.length} events`);
        }

        // Apply location filter
        if (detectedLocation) {
          filtered = filterEventsByLocation(filtered, detectedLocation);
          console.log(`[Filter] After location (${detectedLocation}): ${filtered.length} events`);
        }

        // Apply price filter (if not free)
        if (priceFilter.type === 'cheap' && priceFilter.maxPrice) {
          filtered = filterEventsByPrice(filtered, priceFilter.maxPrice);
          console.log(`[Filter] After cheap price (max ${priceFilter.maxPrice}): ${filtered.length} events`);
        } else if (priceFilter.type === 'max' && priceFilter.maxPrice) {
          filtered = filterEventsByPrice(filtered, priceFilter.maxPrice);
          console.log(`[Filter] After max price (max ${priceFilter.maxPrice}): ${filtered.length} events`);
        }

        return filtered;
      };

      // ========================================
      // PATH A: WEB SEARCH ACTIVATED - Go directly to Firecrawl
      // ========================================
      if (forceWebSearch) {
        console.log(`[Strategy] WEB SEARCH ACTIVATED - Going directly to Firecrawl...`);
        usedWebSearch = true;

        // Step 1A: Search web with Firecrawl (general search)
        webSearchStats = await searchAndProcessWithFirecrawl(message, supabase);
        console.log(`[Firecrawl Search] Processed ${webSearchStats.urlsProcessed} URLs, found ${webSearchStats.newEventsFound} new events`);

        // Step 1B: Scrape reliable sources (ticketeras, teatros, etc.)
        const scrapeStats = await scrapeReliableSources(message, supabase);
        console.log(`[Firecrawl Scrape] Scraped ${scrapeStats.sourcesScraped} sources, found ${scrapeStats.newEventsFound} new events`);

        // Combine stats
        webSearchStats.newEventsFound += scrapeStats.newEventsFound;
        webSearchStats.urlsProcessed += scrapeStats.sourcesScraped;

        // Step 2: Generate embeddings for new events
        if (webSearchStats.newEventsFound > 0) {
          const embeddingsGenerated = await generateMissingEmbeddings(supabase);
          console.log(`[Embeddings] Generated ${embeddingsGenerated} embeddings`);
        }

        // Step 3: Search in DB (now includes new events)
        const queryEmbedding = await generateEmbedding(message);
        const allEvents = await findSimilarEvents(supabase, queryEmbedding);
        console.log(`[Vector DB] Found ${allEvents.length} events`);

        // Step 4: Apply all filters
        events = applyAllFilters(allEvents);

        const categoryForResponse = detectedCategory || (isFreeFilter ? 'gratis' : priceFilter.type);
        responseText = await generateChatResponse(message, events, categoryForResponse, usedWebSearch, webSearchStats);

      // ========================================
      // PATH B: DATE QUERY - Search by date range
      // ========================================
      } else if (dateQuery.type && dateQuery.startDate && dateQuery.endDate) {
        console.log(`[Strategy] Date query detected (${dateQuery.type}): ${dateQuery.startDate} to ${dateQuery.endDate}`);
        const dateEvents = await findEventsByDate(supabase, dateQuery.startDate, dateQuery.endDate);
        console.log(`[Result] Found ${dateEvents.length} events in date range`);

        // Apply all filters
        events = applyAllFilters(dateEvents);
        
        const categoryForResponse = detectedCategory || (isFreeFilter ? 'gratis' : priceFilter.type);
        responseText = await generateChatResponse(message, events, categoryForResponse);

      // ========================================
      // PATH C: NORMAL QUERY - Vector search in DB
      // ========================================
      } else {
        console.log(`[Strategy] Normal query - Vector search...`);

        const queryEmbedding = await generateEmbedding(message);
        const allEvents = await findSimilarEvents(supabase, queryEmbedding);
        console.log(`[Vector DB] Found ${allEvents.length} events before filtering`);

        // Apply all filters
        events = applyAllFilters(allEvents);

        if (events.length > 0) {
          const avgSimilarity = events.reduce((sum, e) => sum + e.similarity, 0) / events.length;
          console.log(`[Vector DB] Average similarity: ${(avgSimilarity * 100).toFixed(1)}%`);
        }

        const categoryForResponse = detectedCategory || (isFreeFilter ? 'gratis' : priceFilter.type);
        responseText = await generateChatResponse(message, events, categoryForResponse);
      }
    } catch (searchError) {
      console.error("[Search] Error:", searchError);
      events = [];
      responseText = "Lo siento, hubo un error al buscar eventos. Por favor, intenta con una búsqueda diferente.";
    }

    // Store in chat history if userId provided
    if (userId) {
      try {
        await supabase.from("chat_history").insert({
          user_id: userId,
          message,
          response: responseText,
          events_found: events.length,
        });
      } catch (historyError) {
        console.error("[History] Error storing chat history:", historyError);
      }
    }

    console.log(`\n[Final] Returning ${events.length} events to user`);
    console.log(`========================================\n`);

    return new Response(
      JSON.stringify({
        response: responseText,
        events: events.map(e => ({
          id: e.id,
          title: e.title,
          description: e.description,
          event_date: e.event_date,
          event_time: e.event_time,
          venue_name: e.venue_name,
          venue_address: e.venue_address,
          district: e.district,
          city: e.city,
          price_text: e.price_text,
          is_free: e.is_free,
          category: e.category,
          image_url: e.image_url,
          source_url: e.source_url,
          latitude: e.latitude,
          longitude: e.longitude,
        })),
        eventsCount: events.length,
        metadata: {
          usedWebSearch,
          webSearchStats: usedWebSearch ? webSearchStats : undefined,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Chat] Function error:", error);
    return new Response(
      JSON.stringify({
        error: "Error processing request",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
