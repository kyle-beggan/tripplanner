-- Restore participant visibility for public trips
-- This fix ensures that anyone who can view a trip (because it's public) 
-- can also see the participants to accurately count "N People Going".

-- 1. Create a helper for public trip check if it doesn't exist
-- Using security definer to avoid RLS recursion
create or replace function public.is_public_trip(check_trip_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 
    from trips 
    where id = check_trip_id 
    and is_public = true
  );
$$;

-- 2. Update the trip_participants select policy
-- Re-adding the public check that was lost during recursion fixing
drop policy if exists "Participants viewable by trip members and public trip viewers." on trip_participants;

create policy "Participants viewable by trip members and public trip viewers." on trip_participants for select using (
    user_id = auth.uid() -- I can see myself
    or
    public.is_admin() -- Admins can see
    or
    public.is_trip_participant(trip_id) -- I can see others if I am a participant
    or
    public.is_trip_owner(trip_id) -- Owner can see all
    or
    public.is_public_trip(trip_id) -- Everyone can see all on public trips
);
