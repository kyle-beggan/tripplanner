-- Migration to update locations from string array to object array (legs)
-- Data shape: { name: string, start_date: date, end_date: date, activities: text[] }

alter table trips 
rename column locations to locations_old;

alter table trips
add column locations jsonb default '[]'::jsonb;

-- Migrate existing data
do $$
declare
    trip_record record;
    leg_item jsonb;
    new_locations jsonb;
begin
    for trip_record in select id, locations_old, start_date, end_date from trips loop
        new_locations := '[]'::jsonb;
        if trip_record.locations_old is not null and jsonb_array_length(trip_record.locations_old) > 0 then
            -- For existing trips, we create legs from the strings
            -- We fallback to trip dates if available
            for leg_item in select jsonb_array_elements(trip_record.locations_old) loop
                new_locations := new_locations || jsonb_build_object(
                    'name', leg_item #>> '{}',
                    'start_date', trip_record.start_date,
                    'end_date', trip_record.end_date,
                    'activities', '[]'::jsonb
                );
            end loop;
        end if;
        
        update trips set locations = new_locations where id = trip_record.id;
    end loop;
end $$;

-- Drop old column
alter table trips drop column locations_old;

-- Update the RPC function to handle the new jsonb structure
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
