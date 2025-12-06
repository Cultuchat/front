import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { searchWithTavily, filterEventUrls } from "../_shared/tavily.ts";
import { processUrlWithFirecrawl, insertEventsToDatabase } from "../_shared/firecrawl-processor.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ChatRequest {
  message: string;
  userId?: string;
  forceTavily?: boolean; // Forzar búsqueda con Tavily aunque haya buenos resultados
}

interface EventMatch {
  id: number;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  venue_name: string;
  venue_address: string;
  city: string;
  price_text: string;
  category: string;
  image_url: string;
  source_url: string;
  latitude: number;
  longitude: number;
  similarity: number;
}

// Umbral de similitud para considerar buenos resultados
const SIMILARITY_THRESHOLD = 0.4;
const MIN_GOOD_RESULTS = 3;

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

// Detect if query is asking for events by date/month
function detectDateQuery(message: string): { type: 'month' | 'range' | null, startDate?: string, endDate?: string } {
  const lowerMessage = message.toLowerCase();

  // Month names mapping
  const monthsMap: { [key: string]: number } = {
    'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4,
    'mayo': 5, 'junio': 6, 'julio': 7, 'agosto': 8,
    'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
  };

  // Check for month queries
  for (const [monthName, monthNum] of Object.entries(monthsMap)) {
    if (lowerMessage.includes(monthName)) {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;

      // Determine which year to use
      let year = currentYear;
      // If the mentioned month has already passed this year, assume next year
      if (monthNum < currentMonth) {
        year = currentYear + 1;
      }

      // Check if year is mentioned in message
      const yearMatch = lowerMessage.match(/20\d{2}/);
      if (yearMatch) {
        year = parseInt(yearMatch[0]);
      }

      const startDate = `${year}-${monthNum.toString().padStart(2, '0')}-01`;
      const endDate = `${year}-${monthNum.toString().padStart(2, '0')}-31`;

      console.log(`Detected month query: ${monthName} ${year} (${startDate} to ${endDate})`);
      return { type: 'month', startDate, endDate };
    }
  }

  // Check for "este mes" (this month)
  if (lowerMessage.includes('este mes')) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

    console.log(`Detected "este mes": ${startDate} to ${endDate}`);
    return { type: 'month', startDate, endDate };
  }

  return { type: null };
}

// Find events by date range
async function findEventsByDate(
  supabase: ReturnType<typeof createClient>,
  startDate: string,
  endDate: string,
  limit: number = 50
): Promise<EventMatch[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .gte("event_date", startDate)
    .lte("event_date", endDate)
    .order("event_date", { ascending: true })
    .limit(limit);

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
  matchCount: number = 10,
  matchThreshold: number = 0.2
): Promise<EventMatch[]> {
  const { data, error } = await supabase.rpc("match_events", {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });

  if (error) {
    console.error("Error in match_events:", error);
    throw error;
  }

  return data || [];
}

// Detect category from query
function detectCategory(query: string): string | null {
  const lowerQuery = query.toLowerCase();

  // Category keywords mapping
  const categoryKeywords: { [key: string]: string[] } = {
    'Arte & Cultura': ['arte', 'exposición', 'exposiciones', 'galería', 'museo', 'pintura', 'escultura'],
    'Concierto': ['concierto', 'conciertos', 'música', 'musical', 'show musical', 'recital'],
    'Teatro': ['teatro', 'obra', 'obras de teatro', 'comedia', 'drama', 'monólogo'],
    'Ballet': ['ballet', 'danza', 'baile clásico'],
    'Infantil': ['infantil', 'niños', 'familia', 'kids'],
    'Festival': ['festival', 'festivales'],
    'Deportes': ['deporte', 'deportes', 'fútbol', 'basketball', 'partido'],
  };

  // Check each category
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lowerQuery.includes(keyword)) {
        return category;
      }
    }
  }

  return null;
}

// Filter events by detected category
function filterEventsByCategory(events: EventMatch[], category: string | null): EventMatch[] {
  if (!category) return events;

  const filtered = events.filter(e =>
    e.category && e.category.toLowerCase().includes(category.toLowerCase())
  );

  // If filtering results in no events, return original results
  return filtered.length > 0 ? filtered : events;
}

// Check if results are good enough
function areResultsGood(events: EventMatch[]): boolean {
  if (events.length === 0) return false;
  if (events.length < MIN_GOOD_RESULTS) return false;

  // Check if at least some results have good similarity
  const goodResults = events.filter(e => e.similarity >= SIMILARITY_THRESHOLD);
  return goodResults.length >= MIN_GOOD_RESULTS;
}

// Search with Tavily and process new URLs
async function searchAndProcessWithTavily(
  query: string,
  supabase: ReturnType<typeof createClient>
): Promise<{ newEventsFound: number; urlsProcessed: number }> {
  const tavilyApiKey = Deno.env.get("TAVILY_API_KEY");
  const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");

  if (!tavilyApiKey) {
    console.log("[Tavily] API key not configured, skipping web search");
    return { newEventsFound: 0, urlsProcessed: 0 };
  }

  if (!firecrawlApiKey) {
    console.log("[Firecrawl] API key not configured, skipping URL processing");
    return { newEventsFound: 0, urlsProcessed: 0 };
  }

  // Search with Tavily
  const tavilyResults = await searchWithTavily(query, tavilyApiKey);

  if (!tavilyResults || tavilyResults.results.length === 0) {
    console.log("[Tavily] No results found");
    return { newEventsFound: 0, urlsProcessed: 0 };
  }

  console.log(`[Tavily] Found ${tavilyResults.results.length} potential URLs`);

  // Filter to get only event URLs
  const eventUrls = filterEventUrls(tavilyResults.results);
  console.log(`[Tavily] Filtered to ${eventUrls.length} event URLs`);

  let newEventsFound = 0;
  let urlsProcessed = 0;

  // Process each URL (limit to top 3 to avoid timeout)
  const urlsToProcess = eventUrls.slice(0, 3);

  for (const result of urlsToProcess) {
    try {
      // Check if URL was already processed
      const { data: existingUrl } = await supabase
        .from("discovered_urls")
        .select("id, processed")
        .eq("url", result.url)
        .single();

      if (existingUrl?.processed) {
        console.log(`[Skip] URL already processed: ${result.url}`);
        continue;
      }

      // Save URL to discovered_urls table
      const { data: urlRecord, error: urlError } = await supabase
        .from("discovered_urls")
        .upsert({
          url: result.url,
          source: 'tavily',
          search_query: query,
          metadata: {
            title: result.title,
            score: result.score,
            content_snippet: result.content.substring(0, 200),
          },
        }, { onConflict: 'url' })
        .select('id')
        .single();

      if (urlError) {
        console.error(`[DB] Error saving URL ${result.url}:`, urlError);
        continue;
      }

      // Process URL with Firecrawl
      const events = await processUrlWithFirecrawl(result.url, firecrawlApiKey);
      urlsProcessed++;

      if (events.length > 0) {
        // Insert events to database
        const { inserted, errors } = await insertEventsToDatabase(
          events,
          supabase,
          'Tavily + Firecrawl'
        );

        newEventsFound += inserted;

        console.log(`[Success] Processed ${result.url}: ${inserted} events inserted`);

        if (errors.length > 0) {
          console.error(`[Errors] ${errors.length} errors while inserting events`);
        }

        // Mark URL as processed
        await supabase
          .from("discovered_urls")
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
          })
          .eq('id', urlRecord.id);
      } else {
        console.log(`[No Events] No events found in ${result.url}`);
      }

      // Rate limiting between URLs
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`[Error] Processing URL ${result.url}:`, error);
    }
  }

  return { newEventsFound, urlsProcessed };
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
function formatEventsResponse(events: EventMatch[], query: string): string {
  if (events.length === 0) {
    return `No encontré eventos relacionados con "${query}". ¿Podrías reformular tu búsqueda o preguntar por otro tipo de evento?`;
  }

  let response = `Encontré ${events.length} evento${events.length > 1 ? "s" : ""} relacionados con tu búsqueda:\n\n`;

  events.forEach((event, index) => {
    const similarity = Math.round(event.similarity * 100);
    response += `**${index + 1}. ${event.title}**\n`;
    response += `📅 ${event.event_date}`;
    if (event.event_time) response += ` a las ${event.event_time}`;
    response += `\n`;
    response += `📍 ${event.venue_name}`;
    if (event.city) response += `, ${event.city}`;
    response += `\n`;
    if (event.price_text) response += `💰 ${event.price_text}\n`;
    if (event.category) response += `🏷️ ${event.category}\n`;
    response += `\n`;
  });

  return response;
}

// Generate a conversational response using OpenAI
async function generateChatResponse(
  query: string,
  events: EventMatch[],
  usedTavily: boolean = false,
  tavilyStats?: { newEventsFound: number; urlsProcessed: number }
): Promise<string> {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiApiKey) {
    // Fallback to formatted response if no API key
    return formatEventsResponse(events, query);
  }

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.toLocaleString("es-PE", { month: "long" });

  let systemPrompt = `Eres un asistente amigable especializado en eventos en Perú.
Hoy es ${currentDate.toLocaleDateString("es-PE")} (${currentMonth} ${currentYear}).
Tu rol es ayudar a los usuarios a encontrar eventos interesantes.

Si el usuario menciona un mes sin año, asume que se refiere a ${currentYear} o ${currentYear + 1} dependiendo de cuál esté más cerca.

REGLAS CRÍTICAS:
1. SIEMPRE menciona el número EXACTO de eventos que aparecen en la lista de "Eventos encontrados" más abajo.
2. NO cuentes solo los eventos que creas relevantes. Cuenta TODOS los eventos en la lista.
3. Genera SOLO un mensaje breve y amigable (1-2 líneas) mencionando cuántos eventos hay en total.
4. NO listes los eventos en tu respuesta, NO incluyas detalles como fechas, lugares, precios, etc.
5. Los eventos se mostrarán en tarjetas visuales debajo de tu mensaje.
6. Si NO hay eventos (lista vacía), genera un mensaje amigable sugiriendo alternativas o pidiendo más detalles.

Ejemplo de respuesta correcta cuando hay 5 eventos en la lista:
"¡Perfecto! Encontré 5 eventos que podrían interesarte. Aquí están:"

Ejemplo de respuesta correcta cuando hay 10 eventos en la lista:
"¡Excelente! Encontré 10 eventos culturales para ti. Échales un vistazo:"

Ejemplo de respuesta INCORRECTA (NO HACER):
"Encontré estos eventos:
1. La Granja de Zenón - 7 de diciembre...
2. Anuel AA - 7 de diciembre..."

Responde de forma natural y conversacional en español.
Incluye emojis para hacer la respuesta más atractiva.`;

  if (usedTavily && tavilyStats) {
    systemPrompt += `\n\nNOTA: También busqué en la web y encontré ${tavilyStats.newEventsFound} nuevos eventos que agregué a la base de datos. Estos eventos ahora están disponibles para futuras búsquedas.`;
  }

  const eventsContext = events.length > 0
    ? `\n\nEventos encontrados (${events.length} resultados):\n${JSON.stringify(events.map(e => ({
        title: e.title,
        date: e.event_date,
        time: e.event_time,
        venue: e.venue_name,
        city: e.city,
        price: e.price_text,
        category: e.category,
      })), null, 2)}`
    : "\n\nNo se encontraron eventos que coincidan con la búsqueda.";

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
      return formatEventsResponse(events, query);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error generating chat response:", error);
    return formatEventsResponse(events, query);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, userId, forceTavily = false } = await req.json() as ChatRequest;

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
    let usedTavily = false;
    let tavilyStats = { newEventsFound: 0, urlsProcessed: 0 };

    try {
      // STEP 1: Check if this is a date/month query
      const dateQuery = detectDateQuery(message);

      if (dateQuery.type === 'month' && dateQuery.startDate && dateQuery.endDate) {
        console.log(`[Strategy] Date range query detected`);
        events = await findEventsByDate(supabase, dateQuery.startDate, dateQuery.endDate, 50);
        console.log(`[Result] Found ${events.length} events in date range`);

        responseText = await generateChatResponse(message, events);
      } else {
        // STEP 2: Try vector search first
        console.log(`[Strategy] Trying vector search...`);

        const queryEmbedding = await generateEmbedding(message);
        let allEvents = await findSimilarEvents(supabase, queryEmbedding, 10, 0.2);

        console.log(`[Vector DB] Found ${allEvents.length} events`);

        // STEP 2.5: Detect and filter by category if applicable
        const detectedCategory = detectCategory(message);
        if (detectedCategory) {
          console.log(`[Category] Detected category: ${detectedCategory}`);
          events = filterEventsByCategory(allEvents, detectedCategory);
          console.log(`[Category] After filtering: ${events.length} events`);
        } else {
          events = allEvents;
        }

        if (events.length > 0) {
          const avgSimilarity = events.reduce((sum, e) => sum + e.similarity, 0) / events.length;
          console.log(`[Vector DB] Average similarity: ${(avgSimilarity * 100).toFixed(1)}%`);
        }

        // STEP 3: Use Tavily ONLY if user explicitly requested it
        if (forceTavily) {
          console.log(`[Decision] User requested web search with Tavily...`);

          // STEP 4: Use Tavily to find new events
          tavilyStats = await searchAndProcessWithTavily(message, supabase);
          usedTavily = true;

          console.log(`[Tavily] Processed ${tavilyStats.urlsProcessed} URLs, found ${tavilyStats.newEventsFound} new events`);

          // STEP 5: Generate embeddings for new events
          if (tavilyStats.newEventsFound > 0) {
            const embeddingsGenerated = await generateMissingEmbeddings(supabase);
            console.log(`[Embeddings] Generated ${embeddingsGenerated} embeddings`);

            // STEP 6: Search again in vector DB (now with new events)
            const newQueryEmbedding = await generateEmbedding(message);
            let newAllEvents = await findSimilarEvents(supabase, newQueryEmbedding, 10, 0.2);
            console.log(`[Vector DB] Re-searched: Found ${newAllEvents.length} events (including new ones)`);

            // Apply category filter again if detected
            if (detectedCategory) {
              events = filterEventsByCategory(newAllEvents, detectedCategory);
              console.log(`[Category] After re-filtering: ${events.length} events`);
            } else {
              events = newAllEvents;
            }
          }
        } else {
          console.log(`[Decision] Using vector search results (${events.length} events found)`);
        }

        // Generate response
        responseText = await generateChatResponse(message, events, usedTavily, tavilyStats);
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
          date: e.event_date,
          time: e.event_time,
          venue: e.venue_name,
          address: e.venue_address,
          city: e.city,
          price: e.price_text,
          category: e.category,
          image_url: e.image_url,
          source_url: e.source_url,
          latitude: e.latitude,
          longitude: e.longitude,
        })),
        eventsCount: events.length,
        metadata: {
          usedTavily,
          tavilyStats: usedTavily ? tavilyStats : undefined,
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
