-- Migration: Convert temperature/humidity columns to JSON data column
-- This allows flexible storage of any sensor data as JSON

-- Step 1: Add new data column (JSONB for PostgreSQL)
ALTER TABLE device_data ADD COLUMN IF NOT EXISTS data JSONB;

-- Step 2: Migrate existing data to JSON format (if you have existing data)
-- This combines temperature and humidity into a JSON object
UPDATE device_data 
SET data = jsonb_build_object(
    'temperature', temperature,
    'humidity', humidity
)
WHERE data IS NULL 
  AND (temperature IS NOT NULL OR humidity IS NOT NULL);

-- Step 3: Drop old columns (optional - uncomment if you want to remove old columns)
-- ALTER TABLE device_data DROP COLUMN IF EXISTS temperature;
-- ALTER TABLE device_data DROP COLUMN IF EXISTS humidity;

-- Note: If you want to keep old columns for backward compatibility, you can leave them
-- The application will use the 'data' column for new entries
