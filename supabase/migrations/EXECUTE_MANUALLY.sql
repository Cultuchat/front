-- =============================================
-- EJECUTAR ESTE SQL EN EL DASHBOARD DE SUPABASE
-- SQL Editor > New Query > Paste & Run
-- =============================================

-- 1. Función para updated_at (si no existe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Agregar columnas de geocoding a events (si no existen)
ALTER TABLE events ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE events ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE events ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMP;
ALTER TABLE events ADD COLUMN IF NOT EXISTS geocode_source VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_events_location ON events(latitude, longitude);

-- 3. Crear tabla user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE,
    full_name VARCHAR(200),
    avatar_url TEXT,
    bio TEXT,
    preferred_categories TEXT[],
    preferred_districts TEXT[],
    notification_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT false,
    theme VARCHAR(20) DEFAULT 'system',
    language VARCHAR(10) DEFAULT 'es',
    profile_visibility VARCHAR(20) DEFAULT 'public',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public profiles are viewable by everyone' AND tablename = 'user_profiles') THEN
        CREATE POLICY "Public profiles are viewable by everyone" ON user_profiles
            FOR SELECT USING (profile_visibility = 'public' OR auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own profile' AND tablename = 'user_profiles') THEN
        CREATE POLICY "Users can insert their own profile" ON user_profiles
            FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own profile' AND tablename = 'user_profiles') THEN
        CREATE POLICY "Users can update their own profile" ON user_profiles
            FOR UPDATE USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own profile' AND tablename = 'user_profiles') THEN
        CREATE POLICY "Users can delete their own profile" ON user_profiles
            FOR DELETE USING (auth.uid() = id);
    END IF;
END
$$;

-- 4. Crear tabla user_favorites
CREATE TABLE IF NOT EXISTS user_favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    notes TEXT,
    reminder_enabled BOOLEAN DEFAULT false,
    reminder_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_event_id ON user_favorites(event_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON user_favorites(created_at DESC);

DROP TRIGGER IF EXISTS update_user_favorites_updated_at ON user_favorites;
CREATE TRIGGER update_user_favorites_updated_at
    BEFORE UPDATE ON user_favorites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own favorites' AND tablename = 'user_favorites') THEN
        CREATE POLICY "Users can view their own favorites" ON user_favorites
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own favorites' AND tablename = 'user_favorites') THEN
        CREATE POLICY "Users can insert their own favorites" ON user_favorites
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own favorites' AND tablename = 'user_favorites') THEN
        CREATE POLICY "Users can update their own favorites" ON user_favorites
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own favorites' AND tablename = 'user_favorites') THEN
        CREATE POLICY "Users can delete their own favorites" ON user_favorites
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END
$$;

-- 5. Crear tabla user_history
CREATE TABLE IF NOT EXISTS user_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    visited_at TIMESTAMP DEFAULT NOW(),
    interested BOOLEAN DEFAULT false,
    attended BOOLEAN DEFAULT false,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_user_history_user_id ON user_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_history_event_id ON user_history(event_id);
CREATE INDEX IF NOT EXISTS idx_user_history_visited_at ON user_history(visited_at DESC);

DROP TRIGGER IF EXISTS update_user_history_updated_at ON user_history;
CREATE TRIGGER update_user_history_updated_at
    BEFORE UPDATE ON user_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE user_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own history' AND tablename = 'user_history') THEN
        CREATE POLICY "Users can view their own history" ON user_history
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own history' AND tablename = 'user_history') THEN
        CREATE POLICY "Users can insert their own history" ON user_history
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own history' AND tablename = 'user_history') THEN
        CREATE POLICY "Users can update their own history" ON user_history
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own history' AND tablename = 'user_history') THEN
        CREATE POLICY "Users can delete their own history" ON user_history
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END
$$;

-- 6. Trigger para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ¡LISTO! Las tablas están creadas
SELECT 'Tablas creadas exitosamente!' as status;
