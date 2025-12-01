import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ChatRequest {
  message: string;
  userId?: string;
}

interface EventMatch {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  city: string;
  price: string;
  category: string;
  image_url: string;
  source_url: string;
  latitude: number;
  longitude: number;
  similarity: number;
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

// Find similar events using vector similarity search
async function findSimilarEvents(
  supabase: ReturnType<typeof createClient>,
  queryEmbedding: number[],
  matchCount: number = 10,
  matchThreshold: number = 0.3
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

// Format events for the response
function formatEventsResponse(events: EventMatch[], query: string): string {
  if (events.length === 0) {
    return `No encontré eventos relacionados con "${query}". ¿Podrías reformular tu búsqueda o preguntar por otro tipo de evento?`;
  }

  let response = `Encontré ${events.length} evento${events.length > 1 ? "s" : ""} relacionados con tu búsqueda:\n\n`;

  events.forEach((event, index) => {
    const similarity = Math.round(event.similarity * 100);
    response += `**${index + 1}. ${event.title}**\n`;
    response += `📅 ${event.date}`;
    if (event.time) response += ` a las ${event.time}`;
    response += `\n`;
    response += `📍 ${event.venue}`;
    if (event.city) response += `, ${event.city}`;
    response += `\n`;
    if (event.price) response += `💰 ${event.price}\n`;
    if (event.category) response += `🏷️ ${event.category}\n`;
    response += `\n`;
  });

  return response;
}

// Generate a conversational response using OpenAI
async function generateChatResponse(
  query: string,
  events: EventMatch[],
  _conversationHistory: Array<{ role: string; content: string }>
): Promise<string> {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiApiKey) {
    // Fallback to formatted response if no API key
    return formatEventsResponse(events, query);
  }

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.toLocaleString("es-PE", { month: "long" });

  const systemPrompt = `Eres un asistente amigable especializado en eventos en Perú. 
Hoy es ${currentDate.toLocaleDateString("es-PE")} (${currentMonth} ${currentYear}).
Tu rol es ayudar a los usuarios a encontrar eventos interesantes.

Si el usuario menciona un mes sin año, asume que se refiere a ${currentYear} o ${currentYear + 1} dependiendo de cuál esté más cerca.

Responde de forma natural y conversacional en español.
Incluye emojis para hacer la respuesta más atractiva.
Si hay eventos disponibles, preséntalos de forma clara y concisa.
Si no hay eventos, sugiere alternativas o pide más detalles.`;

  const eventsContext = events.length > 0
    ? `\n\nEventos encontrados:\n${JSON.stringify(events.map(e => ({
        title: e.title,
        date: e.date,
        time: e.time,
        venue: e.venue,
        city: e.city,
        price: e.price,
        category: e.category,
        similarity: Math.round(e.similarity * 100) + "%"
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
    const { message, userId } = await req.json() as ChatRequest;

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing query: "${message}" for user: ${userId || "anonymous"}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if embeddings are available
    const { data: embeddingCheck } = await supabase
      .from("events")
      .select("id")
      .not("embedding", "is", null)
      .limit(1);

    let events: EventMatch[] = [];
    let responseText: string;

    if (embeddingCheck && embeddingCheck.length > 0) {
      // Use semantic search with embeddings
      console.log("Using semantic search with embeddings");
      
      // Generate embedding for the user's query
      const queryEmbedding = await generateEmbedding(message);
      
      // Find similar events
      events = await findSimilarEvents(supabase, queryEmbedding, 10, 0.2);
      console.log(`Found ${events.length} similar events`);

      // Generate conversational response
      responseText = await generateChatResponse(message, events, []);
    } else {
      // Fallback to basic text search if no embeddings
      console.log("Embeddings not available, using text search fallback");
      
      const { data: textSearchResults } = await supabase
        .from("events")
        .select("*")
        .or(`title.ilike.%${message}%,description.ilike.%${message}%,category.ilike.%${message}%`)
        .order("date", { ascending: true })
        .limit(10);

      events = (textSearchResults || []).map(e => ({ ...e, similarity: 0.5 }));
      responseText = await generateChatResponse(message, events, []);
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
        console.error("Error storing chat history:", historyError);
        // Don't fail the request if history storage fails
      }
    }

    return new Response(
      JSON.stringify({
        response: responseText,
        events: events.map(e => ({
          id: e.id,
          title: e.title,
          description: e.description,
          date: e.date,
          time: e.time,
          venue: e.venue,
          address: e.address,
          city: e.city,
          price: e.price,
          category: e.category,
          image_url: e.image_url,
          source_url: e.source_url,
          latitude: e.latitude,
          longitude: e.longitude,
        })),
        eventsCount: events.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Error processing request",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
