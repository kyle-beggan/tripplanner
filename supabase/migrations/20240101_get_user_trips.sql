-- Function to get trips a user is involved in (Owner OR Participant)
create or replace function get_user_trips(query_user_id uuid)
returns setof trips
language sql
security definer
as $$
  select *
  from trips
  where 
    owner_id = query_user_id
    or
    id in (
      select trip_id 
      from trip_participants 
      where user_id = query_user_id
    )
  order by start_date asc;
$$;
