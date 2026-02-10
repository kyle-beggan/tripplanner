-- Add is_flying column to trip_participants table
ALTER TABLE trip_participants 
ADD COLUMN IF NOT EXISTS is_flying BOOLEAN DEFAULT TRUE;

-- Add comment
COMMENT ON COLUMN trip_participants.is_flying IS 'Indicates if the participant intends to fly to the trip destination';
