-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    category VARCHAR(100),
    subcategory VARCHAR(100),
    tags TEXT[],

    -- Date and time
    event_date TIMESTAMP,
    event_end_date TIMESTAMP,
    event_time VARCHAR(50),

    -- Location
    venue_name VARCHAR(300),
    venue_address TEXT,
    district VARCHAR(100),
    city VARCHAR(100) DEFAULT 'Lima',

    -- Pricing
    price_min DECIMAL(10,2),
    price_max DECIMAL(10,2),
    price_text VARCHAR(200),
    is_free BOOLEAN DEFAULT false,

    -- Source
    source_name VARCHAR(100),
    source_url TEXT,
    image_url TEXT,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_district ON events(district);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);
CREATE INDEX IF NOT EXISTS idx_events_is_free ON events(is_free);

-- Create unique constraint to avoid duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_unique ON events(title, event_date, source_name)
WHERE event_date IS NOT NULL;

-- Add full-text search column
ALTER TABLE events ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create index for full-text search
CREATE INDEX IF NOT EXISTS idx_events_search ON events USING gin(search_vector);

-- Create function to update search vector
CREATE OR REPLACE FUNCTION events_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.category, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search_vector
DROP TRIGGER IF EXISTS events_search_update ON events;
CREATE TRIGGER events_search_update
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION events_search_trigger();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Events can be inserted with service role" ON events;
DROP POLICY IF EXISTS "Events can be updated with service role" ON events;

-- Create policy to allow read access to everyone
CREATE POLICY "Events are viewable by everyone" ON events
    FOR SELECT USING (true);

-- Create policy to allow insert/update only with service role
CREATE POLICY "Events can be inserted with service role" ON events
    FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Events can be updated with service role" ON events
    FOR UPDATE USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
