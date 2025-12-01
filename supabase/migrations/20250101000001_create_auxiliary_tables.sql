-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, slug, description, icon) VALUES
    ('Música', 'musica', 'Conciertos, recitales y eventos musicales', '🎵'),
    ('Teatro', 'teatro', 'Obras de teatro y espectáculos escénicos', '🎭'),
    ('Arte', 'arte', 'Exposiciones, galerías y arte visual', '🎨'),
    ('Danza', 'danza', 'Espectáculos de danza y ballet', '💃'),
    ('Gastronomía', 'gastronomia', 'Festivales gastronómicos y eventos culinarios', '🍽️'),
    ('Festivales', 'festivales', 'Festivales culturales y eventos masivos', '🎪'),
    ('Cine', 'cine', 'Proyecciones y festivales de cine', '🎬'),
    ('Talleres', 'talleres', 'Talleres culturales y educativos', '📚')
ON CONFLICT (slug) DO NOTHING;

-- Create districts table
CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    zone VARCHAR(50), -- Norte, Sur, Este, Oeste, Centro
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert Lima districts
INSERT INTO districts (name, slug, zone) VALUES
    -- Centro
    ('Cercado de Lima', 'cercado-de-lima', 'Centro'),
    ('Breña', 'brena', 'Centro'),
    ('Jesús María', 'jesus-maria', 'Centro'),
    ('Lince', 'lince', 'Centro'),
    ('La Victoria', 'la-victoria', 'Centro'),
    ('Rímac', 'rimac', 'Centro'),
    -- Sur
    ('Miraflores', 'miraflores', 'Sur'),
    ('San Isidro', 'san-isidro', 'Sur'),
    ('Barranco', 'barranco', 'Sur'),
    ('Surco', 'surco', 'Sur'),
    ('San Borja', 'san-borja', 'Sur'),
    ('Surquillo', 'surquillo', 'Sur'),
    ('Chorrillos', 'chorrillos', 'Sur'),
    ('Villa El Salvador', 'villa-el-salvador', 'Sur'),
    ('Villa María del Triunfo', 'villa-maria-del-triunfo', 'Sur'),
    -- Oeste
    ('Magdalena', 'magdalena', 'Oeste'),
    ('Pueblo Libre', 'pueblo-libre', 'Oeste'),
    ('San Miguel', 'san-miguel', 'Oeste'),
    ('Callao', 'callao', 'Oeste'),
    -- Norte
    ('Los Olivos', 'los-olivos', 'Norte'),
    ('Independencia', 'independencia', 'Norte'),
    ('Comas', 'comas', 'Norte'),
    ('San Martín de Porres', 'san-martin-de-porres', 'Norte'),
    -- Este
    ('La Molina', 'la-molina', 'Este'),
    ('Ate', 'ate', 'Este'),
    ('San Juan de Lurigancho', 'san-juan-de-lurigancho', 'Este'),
    ('San Luis', 'san-luis', 'Este')
ON CONFLICT (slug) DO NOTHING;

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Districts are viewable by everyone" ON districts;

-- Create policies for read access
CREATE POLICY "Categories are viewable by everyone" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Districts are viewable by everyone" ON districts
    FOR SELECT USING (true);
