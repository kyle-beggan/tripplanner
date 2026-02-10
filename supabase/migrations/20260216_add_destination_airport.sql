-- Add destination_airport_code column to trips table
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS destination_airport_code TEXT;

-- Add comment
COMMENT ON COLUMN trips.destination_airport_code IS 'Manual override or fallback for the trip destination airport IATA code';
