-- Create user_history table to track visited events
CREATE TABLE IF NOT EXISTS user_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,

    -- Interaction tracking
    visited_at TIMESTAMP DEFAULT NOW(),
    interested BOOLEAN DEFAULT false,
    attended BOOLEAN DEFAULT false,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Unique constraint: one history entry per user per event
    UNIQUE(user_id, event_id)
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_user_history_user_id ON user_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_history_event_id ON user_history(event_id);
CREATE INDEX IF NOT EXISTS idx_user_history_visited_at ON user_history(visited_at DESC);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_user_history_updated_at ON user_history;
CREATE TRIGGER update_user_history_updated_at
    BEFORE UPDATE ON user_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE user_history ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view their own history
CREATE POLICY "Users can view their own history" ON user_history
    FOR SELECT USING (auth.uid() = user_id);

-- Policies: Users can insert their own history
CREATE POLICY "Users can insert their own history" ON user_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies: Users can update their own history
CREATE POLICY "Users can update their own history" ON user_history
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies: Users can delete their own history
CREATE POLICY "Users can delete their own history" ON user_history
    FOR DELETE USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE user_history IS 'User event viewing and interaction history';
COMMENT ON COLUMN user_history.interested IS 'User marked as interested in the event';
COMMENT ON COLUMN user_history.attended IS 'User attended the event';
COMMENT ON COLUMN user_history.rating IS 'User rating (1-5 stars)';
