-- Add home_airport column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS home_airport TEXT;

-- Add comment
COMMENT ON COLUMN profiles.home_airport IS 'User''s preferred home airport usage for flight estimates';
