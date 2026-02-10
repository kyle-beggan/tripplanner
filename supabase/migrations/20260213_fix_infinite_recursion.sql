-- Fix infinite recursion by using a security definer function for the participation check
-- This breaks the cycle between trips policy <-> trip_participants policy

create or replace function public.is_trip_participant(check_trip_id uuid, check_user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 
    from trip_participants 
    where trip_id = check_trip_id 
    and user_id = check_user_id
  );
$$;

-- Drop the recursive policy
drop policy if exists "Trips are viewable by everyone if public or participant." on trips;

-- Re-create the policy using the function
create policy "Trips are viewable by everyone if public or participant." on trips for select using ( 
    is_public = true 
    or 
    owner_id = auth.uid()
    or
    public.is_trip_participant(id, auth.uid())
    or 
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
