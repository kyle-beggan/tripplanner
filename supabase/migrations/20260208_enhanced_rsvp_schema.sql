-- Add activities column to trips table for defining available activities
alter table trips
add column if not exists activities jsonb default '[]'::jsonb;

-- Add columns to trip_participants for detailed RSVP info
alter table trip_participants
add column if not exists arrival_date timestamptz,
add column if not exists departure_date timestamptz,
add column if not exists guests jsonb default '[]'::jsonb, -- Array of objects: { name: string, age: number }
add column if not exists interested_activities jsonb default '[]'::jsonb; -- Array of activity IDs or names
