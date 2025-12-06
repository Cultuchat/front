/**
 * Firecrawl Search API Integration
 * Búsqueda web + scraping en un solo paso
 * Docs: https://docs.firecrawl.dev
 */

// ============================================================
// DOMINIOS PRIORITARIOS DE EVENTOS CULTURALES EN LIMA
// Ordenados por confiabilidad y actualización
// ============================================================
const PRIORITY_DOMAINS = [
  // === AGENDAS CULTURALES ESPECIALIZADAS ===
  'enlima.pe',                    // Agenda diaria arte, teatro, música, exposiciones gratis
  
  // === TICKETERAS PRINCIPALES ===
  'teleticket.com.pe',            // Calendario espectáculos, conciertos, teatro
  'joinnus.com',                  // Eventos arte y cultura
  'passline.com',                 // Ticketera
  'eventbrite.com.pe',            // Festivales, talleres culturales
  'ticketmaster.pe',              // Óperas, folklore, eventos culturales
  
  // === INSTITUCIONES GUBERNAMENTALES ===
  'gob.pe/institucion/cultura',   // Ministerio de Cultura - Agenda oficial
  'eventos.bnp.gob.pe',           // Biblioteca Nacional del Perú
  'cultura.gob.pe',               // Portal cultura
  
  // === TEATROS Y ESPACIOS CULTURALES ===
  'granteatronacional.pe',        // Gran Teatro Nacional
  'teatromunicipallima.pe',       // Teatro Municipal de Lima
  'teatrobritanico.edu.pe',       // Teatro Británico
  'laplaza.com.pe',               // Teatro La Plaza
  'teatromarsano.com',            // Teatro Marsano
  
  // === MUSEOS ===
  'mali.pe',                      // Museo de Arte de Lima
  'maclima.pe',                   // Museo de Arte Contemporáneo
  'museolarco.org',               // Museo Larco
  'lum.cultura.pe',               // Lugar de la Memoria
  
  // === MUNICIPALIDADES ===
  'munlima.gob.pe',               // Municipalidad Metropolitana de Lima
  'miraflores.gob.pe',            // Miraflores
  'munibarranco.gob.pe',          // Barranco
  'msi.gob.pe',                   // San Isidro
  'munisanborja.gob.pe',          // San Borja
  'munisurco.gob.pe',             // Surco
  'munijesusmaria.gob.pe',        // Jesús María
  'munimagdalena.gob.pe',         // Magdalena
  'muniplibre.gob.pe',            // Pueblo Libre
  'munilosolivos.gob.pe',         // Los Olivos
  'munipuentepiedra.gob.pe',      // Puente Piedra
  'munimolina.gob.pe',            // La Molina
  
  // === CENTROS CULTURALES ===
  'centroculturalpucp.com',       // Centro Cultural PUCP
  'afperu.org',                   // Alianza Francesa
  'icpna.edu.pe',                 // ICPNA
  'ccplima.org.pe',               // Centro Cultural Peruano Británico
  'nodosculturalesperu.com',      // Mapeo centros culturales por distritos
  
  // === MEDIOS DE PRENSA - SECCIÓN CULTURAL ===
  'elcomercio.pe/luces',
  'larepublica.pe/cultural',
  'peru21.pe/cultura',
];

export interface FirecrawlSearchResult {
  url: string;
  title: string;
  description: string;
  markdown?: string;
}

export interface FirecrawlSearchResponse {
  success: boolean;
  data: FirecrawlSearchResult[];
}

/**
 * Busca en la web usando Firecrawl Search API
 * Retorna resultados con contenido markdown listo para LLM
 */
export async function searchWithFirecrawl(
  query: string,
  apiKey: string
): Promise<FirecrawlSearchResponse | null> {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.toLocaleString('es-PE', { month: 'long' });
    
    // Detectar distrito si se menciona
    const districts = ['miraflores', 'barranco', 'san isidro', 'surco', 'la molina', 
                       'san borja', 'jesus maria', 'lince', 'magdalena', 'pueblo libre',
                       'chorrillos', 'san miguel', 'callao', 'centro de lima'];
    const lowerQuery = query.toLowerCase();
    const mentionedDistrict = districts.find(d => lowerQuery.includes(d));
    
    // Detectar mes específico
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                   'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const mentionedMonth = months.find(m => lowerQuery.includes(m));
    
    // Construir query optimizado para eventos culturales en Perú
    const locationPart = mentionedDistrict ? `${mentionedDistrict} Lima` : 'Lima';
    const datePart = mentionedMonth || currentMonth;
    const enhancedQuery = `${query} eventos culturales ${locationPart} Perú ${datePart} ${currentYear} agenda cartelera`;
    
    console.log(`[Firecrawl Search] Query: "${enhancedQuery}"`);

    // Usar la Search API de Firecrawl
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: enhancedQuery,
        lang: 'es',
        country: 'pe',
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Firecrawl Search] API error: ${response.status} - ${errorText}`);
      return null;
    }

    const result = await response.json();
    
    if (!result.success) {
      console.error('[Firecrawl Search] Search failed:', result);
      return null;
    }

    // La respuesta viene en result.data.web para búsquedas
    const webResults = result.data?.web || result.data || [];
    
    console.log(`[Firecrawl Search] Found ${webResults.length} results`);
    
    // Mapear resultados al formato esperado
    const mappedResults: FirecrawlSearchResult[] = webResults.map((r: any) => ({
      url: r.url || '',
      title: r.title || '',
      description: r.description || r.snippet || '',
      markdown: r.markdown || r.content || r.description || '',
    }));

    // Ordenar: priorizar dominios confiables
    const sortedResults = mappedResults.sort((a, b) => {
      const aIsPriority = PRIORITY_DOMAINS.some(d => a.url.includes(d));
      const bIsPriority = PRIORITY_DOMAINS.some(d => b.url.includes(d));
      if (aIsPriority && !bIsPriority) return -1;
      if (!aIsPriority && bIsPriority) return 1;
      return 0;
    });

    return {
      success: true,
      data: sortedResults
    };

  } catch (error) {
    console.error('[Firecrawl Search] Error:', error);
    return null;
  }
}

// ============================================================
// FIRECRAWL SCRAPE API - Para fuentes confiables específicas
// ============================================================

export interface FirecrawlScrapeResponse {
  success: boolean;
  data: {
    url: string;
    markdown: string;
    metadata?: {
      title?: string;
      description?: string;
    };
  } | null;
}

/**
 * URLs específicas de agendas culturales en Lima
 * Estas son páginas que siempre tienen eventos actualizados
 * Organizadas por tipo y distrito
 */
export const LIMA_CULTURAL_URLS = {
  // ========================================
  // AGENDAS CULTURALES ESPECIALIZADAS
  // ========================================
  enlima: 'https://www.enlima.pe',                    // Agenda diaria gratis
  
  // ========================================
  // TICKETERAS - Siempre actualizadas
  // ========================================
  teleticketTodos: 'https://teleticket.com.pe/todos',
  teleticketConciertos: 'https://teleticket.com.pe/conciertos',
  teleticketTeatro: 'https://teleticket.com.pe/eventos/teatro',
  teleticketCultural: 'https://teleticket.com.pe/eventos/cultural',
  joinnusArte: 'https://joinnus.com/events/arte',
  joinnusTeatros: 'https://joinnus.com/events/teatros',
  eventbrite: 'https://www.eventbrite.com.pe/d/peru--lima/events/',
  ticketmasterCulturales: 'https://www.ticketmaster.pe/page/categoria-culturales',
  
  // ========================================
  // INSTITUCIONES GUBERNAMENTALES
  // ========================================
  minCultura: 'https://www.gob.pe/institucion/cultura/colecciones/44-agenda-cultural',
  bibliotecaNacional: 'https://eventos.bnp.gob.pe',
  
  // ========================================
  // TEATROS Y ESPACIOS CULTURALES
  // ========================================
  gtn: 'https://granteatronacional.pe/eventos',
  teatroMunicipal: 'https://teatromunicipallima.pe',
  
  // ========================================
  // MUNICIPALIDADES - AGENDA CULTURAL
  // ========================================
  muniLima: 'https://www.munlima.gob.pe',
  miraflores: 'https://miraflores.gob.pe/category/cultura/',
  sanIsidro: 'https://www.msi.gob.pe',
  barranco: 'https://www.munibarranco.gob.pe',
  sanBorja: 'https://www.munisanborja.gob.pe',
  surco: 'https://www.munisurco.gob.pe',
  
  // ========================================
  // MEDIOS DE PRENSA - SECCIÓN CULTURAL
  // ========================================
  elComercioLuces: 'https://elcomercio.pe/luces/',
  laRepublicaCultural: 'https://larepublica.pe/cultural/',
  peru21Cultura: 'https://peru21.pe/cultura/',
};

/**
 * Scrapea una URL específica usando Firecrawl Scrape API
 * Útil para fuentes confiables conocidas
 */
export async function scrapeWithFirecrawl(
  url: string,
  apiKey: string
): Promise<FirecrawlScrapeResponse | null> {
  try {
    console.log(`[Firecrawl Scrape] Scraping: ${url}`);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 2000, // Esperar 2s para páginas con JS
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Firecrawl Scrape] API error: ${response.status} - ${errorText}`);
      return null;
    }

    const result = await response.json();
    
    if (!result.success) {
      console.error('[Firecrawl Scrape] Scrape failed:', result);
      return null;
    }

    console.log(`[Firecrawl Scrape] Successfully scraped ${url}`);
    
    return {
      success: true,
      data: {
        url: url,
        markdown: result.data?.markdown || '',
        metadata: result.data?.metadata || {},
      }
    };

  } catch (error) {
    console.error('[Firecrawl Scrape] Error:', error);
    return null;
  }
}

/**
 * Scrapea múltiples fuentes confiables en paralelo
 * Útil para obtener eventos de todas las fuentes conocidas
 */
export async function scrapeMultipleSources(
  urls: string[],
  apiKey: string
): Promise<FirecrawlScrapeResponse[]> {
  const results = await Promise.allSettled(
    urls.map(url => scrapeWithFirecrawl(url, apiKey))
  );
  
  return results
    .filter((r): r is PromiseFulfilledResult<FirecrawlScrapeResponse | null> => 
      r.status === 'fulfilled' && r.value !== null
    )
    .map(r => r.value!);
}

/**
 * Obtiene URLs relevantes según el tipo de búsqueda
 * Prioriza las fuentes más confiables y actualizadas
 */
export function getRelevantUrls(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  const urls: string[] = [];
  
  // === SIEMPRE INCLUIR: Agenda general más completa ===
  urls.push(LIMA_CULTURAL_URLS.enlima);  // Agenda diaria gratis
  
  // === TICKETERAS: Siempre actualizadas ===
  urls.push(LIMA_CULTURAL_URLS.teleticketTodos);
  urls.push(LIMA_CULTURAL_URLS.joinnusArte);
  
  // === BÚSQUEDAS ESPECÍFICAS ===
  
  // Teatro
  if (lowerQuery.includes('teatro') || lowerQuery.includes('obra') || lowerQuery.includes('comedia')) {
    urls.push(LIMA_CULTURAL_URLS.teleticketTeatro);
    urls.push(LIMA_CULTURAL_URLS.joinnusTeatros);
    urls.push(LIMA_CULTURAL_URLS.gtn);
  }
  
  // Conciertos/Música
  if (lowerQuery.includes('concierto') || lowerQuery.includes('música') || lowerQuery.includes('musica')) {
    urls.push(LIMA_CULTURAL_URLS.teleticketConciertos);
    urls.push(LIMA_CULTURAL_URLS.gtn);
  }
  
  // Ballet, Ópera, Danza - Gran Teatro Nacional
  if (lowerQuery.includes('ballet') || lowerQuery.includes('opera') || 
      lowerQuery.includes('ópera') || lowerQuery.includes('danza') ||
      lowerQuery.includes('sinfon') || lowerQuery.includes('orquesta')) {
    urls.push(LIMA_CULTURAL_URLS.gtn);
  }
  
  // Eventos culturales generales
  if (lowerQuery.includes('cultural') || lowerQuery.includes('exposicion') || 
      lowerQuery.includes('exposición') || lowerQuery.includes('arte')) {
    urls.push(LIMA_CULTURAL_URLS.teleticketCultural);
    urls.push(LIMA_CULTURAL_URLS.minCultura);
  }
  
  // Biblioteca Nacional - Libros, conversatorios
  if (lowerQuery.includes('libro') || lowerQuery.includes('literatura') || 
      lowerQuery.includes('conversatorio') || lowerQuery.includes('biblioteca')) {
    urls.push(LIMA_CULTURAL_URLS.bibliotecaNacional);
  }
  
  // Talleres, festivales
  if (lowerQuery.includes('taller') || lowerQuery.includes('festival') || lowerQuery.includes('feria')) {
    urls.push(LIMA_CULTURAL_URLS.eventbrite);
  }
  
  // === BÚSQUEDAS POR DISTRITO ===
  if (lowerQuery.includes('miraflores')) {
    urls.push(LIMA_CULTURAL_URLS.miraflores);
  }
  if (lowerQuery.includes('san isidro')) {
    urls.push(LIMA_CULTURAL_URLS.sanIsidro);
  }
  if (lowerQuery.includes('barranco')) {
    urls.push(LIMA_CULTURAL_URLS.barranco);
  }
  if (lowerQuery.includes('san borja')) {
    urls.push(LIMA_CULTURAL_URLS.sanBorja);
  }
  if (lowerQuery.includes('surco')) {
    urls.push(LIMA_CULTURAL_URLS.surco);
  }
  if (lowerQuery.includes('centro') || lowerQuery.includes('cercado') || lowerQuery.includes('lima metropolitana')) {
    urls.push(LIMA_CULTURAL_URLS.muniLima);
  }
  
  // === GRATIS ===
  if (lowerQuery.includes('gratis') || lowerQuery.includes('gratuito') || lowerQuery.includes('libre')) {
    urls.push(LIMA_CULTURAL_URLS.enlima);  // Especializado en eventos gratis
    urls.push(LIMA_CULTURAL_URLS.minCultura);
  }
  
  // Limitar a 4 URLs para balance entre cobertura y costo API
  return [...new Set(urls)].slice(0, 4);
}

/**
 * Filtra resultados de Firecrawl
 * Excluye redes sociales (muy engañosas con fechas)
 * Excluye contenido de años/meses pasados
 */
export function filterFirecrawlResults(results: FirecrawlSearchResult[]): FirecrawlSearchResult[] {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  
  return results.filter(r => {
    const description = (r.description || '').toLowerCase();
    const title = (r.title || '').toLowerCase();
    const url = r.url.toLowerCase();
    const combinedText = `${title} ${description}`;
    
    // ========================================
    // EXCLUIR REDES SOCIALES (muy engañosas con fechas)
    // ========================================
    const socialMediaDomains = [
      'instagram.com',
      'tiktok.com',
      'facebook.com',
      'twitter.com',
      'x.com',
      'youtube.com/shorts',
      'threads.net'
    ];
    
    if (socialMediaDomains.some(domain => url.includes(domain))) {
      console.log(`[Filter] Excluded social media: ${url}`);
      return false;
    }
    
    // ========================================
    // EXCLUIR AÑOS PASADOS EN TEXTO
    // ========================================
    const pastYears = ['2024', '2023', '2022', '2021', '2020'];
    
    for (const year of pastYears) {
      if (combinedText.includes(year) && !combinedText.includes(currentYear.toString())) {
        console.log(`[Filter] Excluded past year (${year}): ${r.title.substring(0, 50)}...`);
        return false;
      }
    }
    
    // ========================================
    // EXCLUIR MESES PASADOS DE ESTE AÑO
    // ========================================
    const monthsData = [
      { name: 'enero', num: 1 },
      { name: 'febrero', num: 2 },
      { name: 'marzo', num: 3 },
      { name: 'abril', num: 4 },
      { name: 'mayo', num: 5 },
      { name: 'junio', num: 6 },
      { name: 'julio', num: 7 },
      { name: 'agosto', num: 8 },
      { name: 'septiembre', num: 9 },
      { name: 'octubre', num: 10 },
      { name: 'noviembre', num: 11 },
      { name: 'diciembre', num: 12 },
    ];
    
    for (const { name, num } of monthsData) {
      const monthYearPattern = new RegExp(`${name}\\s*(de\\s*)?${currentYear}`, 'i');
      if (monthYearPattern.test(combinedText) && num < currentMonth) {
        console.log(`[Filter] Excluded past month (${name} ${currentYear}): ${r.title.substring(0, 50)}...`);
        return false;
      }
    }
    
    return true;
  });
}
