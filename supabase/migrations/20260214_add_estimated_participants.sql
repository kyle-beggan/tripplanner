-- Add estimated_participants column to trips table
alter table trips
add column estimated_participants integer;

-- Update get_user_trips to include estimated_participants
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
  estimated_participants integer,
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
    t.estimated_participants,
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
