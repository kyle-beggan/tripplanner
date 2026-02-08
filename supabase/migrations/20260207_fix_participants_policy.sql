-- Allow trip owners to add participants (including themselves)
-- This is necessary for creating private trips and adding yourself as a participant
create policy "Trip owners can add participants." on trip_participants for insert with check (
    exists (select 1 from trips where id = trip_id and owner_id = auth.uid())
);

-- Ensure the helper function has proper search_path to avoid any ambiguity
create or replace function public.is_trip_participant(check_trip_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 
    from trip_participants 
    where trip_id = check_trip_id 
    and user_id = auth.uid()
  );
$$;
