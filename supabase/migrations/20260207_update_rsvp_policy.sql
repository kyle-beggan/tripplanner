-- Allow users to update their own participation status (e.g. going/declined)
-- This policy is necessary for users to RSVP to trips they are invited to or joined
create policy "Users can update their own participation." on trip_participants for update using (
  user_id = auth.uid()
);
