-- Add geocoding columns to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8);
ALTER TABLE events ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8);

-- Create index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_events_location ON events(latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Create function to validate coordinates
CREATE OR REPLACE FUNCTION validate_coordinates()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure both coordinates are provided or both are NULL
  IF (NEW.latitude IS NULL) != (NEW.longitude IS NULL) THEN
    RAISE EXCEPTION 'Both latitude and longitude must be provided or both must be NULL';
  END IF;

  -- Validate coordinate ranges
  IF NEW.latitude IS NOT NULL THEN
    IF NEW.latitude < -90 OR NEW.latitude > 90 THEN
      RAISE EXCEPTION 'Latitude must be between -90 and 90';
    END IF;
    IF NEW.longitude < -180 OR NEW.longitude > 180 THEN
      RAISE EXCEPTION 'Longitude must be between -180 and 180';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for coordinate validation
DROP TRIGGER IF EXISTS validate_events_coordinates ON events;
CREATE TRIGGER validate_events_coordinates
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION validate_coordinates();

-- Add comment for documentation
COMMENT ON COLUMN events.latitude IS 'Geographic latitude coordinate (WGS84)';
COMMENT ON COLUMN events.longitude IS 'Geographic longitude coordinate (WGS84)';
