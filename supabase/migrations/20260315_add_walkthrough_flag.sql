-- Add walkthrough flag to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS has_seen_trip_walkthrough boolean DEFAULT false;
