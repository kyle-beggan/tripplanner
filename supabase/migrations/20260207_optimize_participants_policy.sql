-- Optimizing trip_participants policy to avoid self-recursion
-- We use the security definer function for the participation check instead of a direct table query

drop policy if exists "Participants viewable by trip members." on trip_participants;

create policy "Participants viewable by trip members." on trip_participants for select using (
    user_id = auth.uid() -- I can see myself
    or
    public.is_trip_participant(trip_id) -- I can see others if I am a participant (uses secure function)
    or
    exists (select 1 from trips where id = trip_participants.trip_id and owner_id = auth.uid()) -- Owner can see
);
