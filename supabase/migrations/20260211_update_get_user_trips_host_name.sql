-- Final update for get_user_trips with name fallbacks and corrected types
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
    t.owner_id = query_user_id
    or
    t.id in (
      select trip_id 
      from trip_participants 
      where user_id = query_user_id
    )
  order by t.start_date asc;
$$;
