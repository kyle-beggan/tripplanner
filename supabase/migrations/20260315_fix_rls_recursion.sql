-- Fix RLS recursion by using security definer functions
-- This breaks circular dependencies between 'trips' and 'trip_participants' policies

-- 1. Helper for ownership check
create or replace function public.is_trip_owner(check_trip_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 
    from trips 
    where id = check_trip_id 
    and owner_id = auth.uid()
  );
$$;

-- 2. Helper for 'going' status check
create or replace function public.is_going_participant(check_trip_id uuid)
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
    and status = 'going'
  );
$$;

-- 3. Update the trips select policy to use the secure function
-- This prevents matching against trip_participants directly which could recurse
drop policy if exists "Trips are viewable by everyone if public or participant." on trips;

create policy "Trips are viewable by everyone if public or participant." on trips for select using ( 
    is_public = true 
    or 
    owner_id = auth.uid()
    or
    public.is_admin()
    or
    public.is_trip_participant(id)
);

-- 4. Correct the trips update policy to avoid recursion
-- Drop the problematic policy from the previous migration
drop policy if exists "Admins, Owners, and Participants can update trips." on trips;

create policy "Admins, Owners, and Participants can update trips." on trips for update using ( 
    owner_id = auth.uid() 
    or 
    public.is_admin()
    or
    public.is_going_participant(id)
);

-- 5. Update trip_participants select policy
-- This is critical to break the loop from the other side
drop policy if exists "Participants viewable by trip members." on trip_participants;
drop policy if exists "Participants viewable by trip members and public trip viewers." on trip_participants;

create policy "Participants viewable by trip members and public trip viewers." on trip_participants for select using (
    user_id = auth.uid() -- I can see myself
    or
    public.is_admin() -- Admins can see
    or
    public.is_trip_participant(trip_id) -- I can see others if I am a participant
    or
    public.is_trip_owner(trip_id) -- Owner can see all
);
