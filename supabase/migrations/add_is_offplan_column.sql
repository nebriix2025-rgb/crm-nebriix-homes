-- Add is_offplan column to properties table
-- This column indicates if the property is off-plan (under construction) or ready

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS is_offplan BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN properties.is_offplan IS 'Indicates if the property is off-plan (under construction) or ready for immediate move-in';
