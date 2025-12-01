import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Generar embedding usando OpenAI
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY no está configurado')
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${response.statusText} - ${error}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      query,
      matchCount = 10,
      matchThreshold = 0.5,
      filterCategory,
      filterDistrict,
      filterDateFrom,
      filterDateTo,
      useHybrid = true // Por defecto usar búsqueda híbrida
    } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query es requerido y debe ser un string' },
        { status: 400 }
      )
    }

    console.log('🔍 Búsqueda:', query)

    // Generar embedding de la consulta
    const queryEmbedding = await generateEmbedding(query)
    console.log('✅ Embedding generado:', queryEmbedding.length, 'dimensiones')

    let results

    if (useHybrid) {
      // Búsqueda híbrida (texto + embeddings)
      console.log('📊 Usando búsqueda híbrida...')

      const { data, error } = await supabase.rpc('search_events_hybrid', {
        search_query: query,
        query_embedding: queryEmbedding,
        match_count: matchCount,
        filter_date_from: filterDateFrom || null,
        filter_date_to: filterDateTo || null,
      })

      if (error) {
        console.error('Error en búsqueda híbrida:', error)
        throw error
      }

      results = data
    } else {
      // Búsqueda pura por embeddings
      console.log('🎯 Usando búsqueda por embeddings...')

      const { data, error } = await supabase.rpc('match_events', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
        filter_category: filterCategory || null,
        filter_district: filterDistrict || null,
        filter_date_from: filterDateFrom || null,
        filter_date_to: filterDateTo || null,
      })

      if (error) {
        console.error('Error en búsqueda por embeddings:', error)
        throw error
      }

      results = data
    }

    console.log(`✅ Encontrados ${results?.length || 0} eventos`)

    return NextResponse.json({
      success: true,
      query,
      count: results?.length || 0,
      events: results || [],
    })

  } catch (error: unknown) {
    console.error('❌ Error en búsqueda:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error en la búsqueda'
    const errorDetails = error instanceof Error ? error.toString() : String(error)

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    )
  }
}

// GET method para búsqueda simple
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || searchParams.get('query')

    if (!query) {
      return NextResponse.json(
        { error: 'Parámetro "q" o "query" es requerido' },
        { status: 400 }
      )
    }

    const matchCount = parseInt(searchParams.get('limit') || '10')
    const matchThreshold = parseFloat(searchParams.get('threshold') || '0.5')

    // Reutilizar la lógica del POST
    return POST(
      new NextRequest(request.url, {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify({
          query,
          matchCount,
          matchThreshold,
          useHybrid: true,
        }),
      })
    )

  } catch (error: unknown) {
    console.error('Error en GET /api/search:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error en la búsqueda'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
