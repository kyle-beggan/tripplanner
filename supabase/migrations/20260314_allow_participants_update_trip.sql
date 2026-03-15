-- Allow participants with 'going' status to update trips
-- This enables attendees to add activities to the daily schedule
drop policy if exists "Admins and Owners can update trips." on trips;
drop policy if exists "Admins, Owners, and Participants can update trips." on trips;

create policy "Admins, Owners, and Participants can update trips." on trips for update using ( 
    owner_id = auth.uid() 
    or 
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    or
    exists (
        select 1 from trip_participants 
        where trip_id = trips.id 
        and user_id = auth.uid() 
        and status = 'going'
    )
);
