-- =============================================
-- CONFIGURACIÓN DE PGVECTOR PARA BÚSQUEDA SEMÁNTICA
-- Ejecutar en el SQL Editor de Supabase
-- =============================================

-- 1. Habilitar la extensión pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Agregar columna de embedding a events
ALTER TABLE events ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 3. Crear índice para búsqueda de vectores (IVFFlat es más rápido para datasets medianos)
CREATE INDEX IF NOT EXISTS idx_events_embedding ON events 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 4. Función para buscar eventos similares por embedding
CREATE OR REPLACE FUNCTION match_events(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10,
  filter_category text DEFAULT NULL,
  filter_district text DEFAULT NULL,
  filter_date_from timestamp DEFAULT NULL,
  filter_date_to timestamp DEFAULT NULL
)
RETURNS TABLE (
  id bigint,
  title varchar,
  description text,
  category varchar,
  district varchar,
  event_date timestamp,
  event_time varchar,
  venue_name varchar,
  venue_address text,
  price_text varchar,
  is_free boolean,
  source_url text,
  image_url text,
  latitude decimal,
  longitude decimal,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.title,
    e.description,
    e.category,
    e.district,
    e.event_date,
    e.event_time,
    e.venue_name,
    e.venue_address,
    e.price_text,
    e.is_free,
    e.source_url,
    e.image_url,
    e.latitude,
    e.longitude,
    1 - (e.embedding <=> query_embedding) as similarity
  FROM events e
  WHERE 
    e.is_active = true
    AND e.embedding IS NOT NULL
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
    AND (filter_category IS NULL OR e.category ILIKE '%' || filter_category || '%')
    AND (filter_district IS NULL OR e.district ILIKE '%' || filter_district || '%')
    AND (filter_date_from IS NULL OR e.event_date >= filter_date_from)
    AND (filter_date_to IS NULL OR e.event_date <= filter_date_to)
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 5. Función para buscar eventos por texto (híbrida: full-text + vector)
CREATE OR REPLACE FUNCTION search_events_hybrid(
  search_query text,
  query_embedding vector(1536) DEFAULT NULL,
  match_count int DEFAULT 10,
  filter_date_from timestamp DEFAULT NULL,
  filter_date_to timestamp DEFAULT NULL
)
RETURNS TABLE (
  id bigint,
  title varchar,
  description text,
  category varchar,
  district varchar,
  event_date timestamp,
  event_time varchar,
  venue_name varchar,
  source_url text,
  image_url text,
  score float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.title,
    e.description,
    e.category,
    e.district,
    e.event_date,
    e.event_time,
    e.venue_name,
    e.source_url,
    e.image_url,
    CASE 
      WHEN query_embedding IS NOT NULL AND e.embedding IS NOT NULL 
      THEN (ts_rank(e.search_vector, plainto_tsquery('spanish', search_query)) * 0.4 
            + (1 - (e.embedding <=> query_embedding)) * 0.6)
      ELSE ts_rank(e.search_vector, plainto_tsquery('spanish', search_query))
    END as score
  FROM events e
  WHERE 
    e.is_active = true
    AND (
      e.search_vector @@ plainto_tsquery('spanish', search_query)
      OR e.title ILIKE '%' || search_query || '%'
      OR (query_embedding IS NOT NULL AND e.embedding IS NOT NULL AND 1 - (e.embedding <=> query_embedding) > 0.3)
    )
    AND (filter_date_from IS NULL OR e.event_date >= filter_date_from)
    AND (filter_date_to IS NULL OR e.event_date <= filter_date_to)
  ORDER BY score DESC
  LIMIT match_count;
END;
$$;

-- 6. Añadir campo para marcar si el embedding fue generado
ALTER TABLE events ADD COLUMN IF NOT EXISTS embedding_generated boolean DEFAULT false;

-- 7. Crear índice parcial para eventos sin embedding (para procesamiento batch)
CREATE INDEX IF NOT EXISTS idx_events_no_embedding ON events(id) 
WHERE embedding IS NULL AND is_active = true;

COMMENT ON COLUMN events.embedding IS 'Vector embedding de 1536 dimensiones generado por OpenAI text-embedding-3-small';
