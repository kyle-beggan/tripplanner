-- Fix participant visibility bug for public trips
-- Current policy prevents non-participants from seeing others even on public trips
-- This causes "N People Going" to show 0 until the user RSVPs

drop policy if exists "Participants viewable by trip members." on trip_participants;

create policy "Participants viewable by trip members and public trip viewers." on trip_participants for select using (
    user_id = auth.uid() -- I can see myself
    or
    public.is_trip_participant(trip_id) -- I can see others if I am a participant
    or
    exists (select 1 from trips where id = trip_participants.trip_id and (owner_id = auth.uid() or is_public = true)) -- Owner can see all, and everyone can see all on public trips
    or 
    exists (select 1 from profiles where id = auth.uid() and role = 'admin') -- Admins can see
);
