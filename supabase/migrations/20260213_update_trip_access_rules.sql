-- Update get_user_trips to handle admin role and public trip visibility
drop function if exists get_user_trips(uuid);

create or replace function get_user_trips(query_user_id uuid)
returns table (
  id uuid,
  name text,
  description text,
  start_date date,
  end_date date,
  is_public boolean,
  activities jsonb,
  locations jsonb,
  agenda jsonb,
  owner_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  owner_name text
)
language sql
security definer
as $$
  select 
    t.id,
    t.name,
    t.description,
    t.start_date,
    t.end_date,
    t.is_public,
    t.activities,
    t.locations,
    t.agenda,
    t.owner_id,
    t.created_at,
    t.updated_at,
    coalesce(nullif(p.full_name, ''), nullif(p.username, ''), 'Host') as owner_name
  from trips t
  left join profiles p on t.owner_id = p.id
  where 
    -- Admins see everything
    exists (select 1 from profiles where id = query_user_id and role = 'admin')
    or
    -- Owners see their own trips (private or public)
    t.owner_id = query_user_id
    or
    -- Everyone sees public trips
    t.is_public = true
    or
    -- Participants see trips they are invited to or joined
    t.id in (
      select trip_id 
      from trip_participants 
      where user_id = query_user_id
    )
  order by t.start_date asc;
$$;

-- Ensure consistency in RLS policies for direct table access
drop policy if exists "Trips are viewable by everyone if public or participant." on trips;
create policy "Trips are viewable by everyone if public or participant." on trips for select using ( 
    is_public = true 
    or 
    owner_id = auth.uid()
    or
    exists (select 1 from trip_participants where trip_id = trips.id and user_id = auth.uid())
    or 
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
