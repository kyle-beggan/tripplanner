-- Function to check participation without triggering RLS recursion
create or replace function public.is_trip_participant(check_trip_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 
    from trip_participants 
    where trip_id = check_trip_id 
    and user_id = auth.uid()
  );
$$;

-- Update the trips policy to use the function
drop policy if exists "Trips are viewable by everyone if public or participant." on trips;

create policy "Trips are viewable by everyone if public or participant." on trips for select using ( 
    is_public = true 
    or 
    public.is_trip_participant(id)
    or
    owner_id = auth.uid()
    or 
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
