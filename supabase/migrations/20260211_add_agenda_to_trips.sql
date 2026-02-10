-- Add agenda column to trips table
alter table trips
add column if not exists agenda jsonb default '[]'::jsonb;

-- Comment for clarity
comment on column trips.agenda is 'Storage for specific places/restaurants added from search results (array of objects)';
