-- Fix relationships to point to profiles instead of auth.users
-- This allows PostgREST to properly embed profile data

-- Drop old constraints (assuming standard naming convention or from previous migration)
alter table feedback
    drop constraint if exists feedback_user_id_fkey;

alter table feedback_comments
    drop constraint if exists feedback_comments_user_id_fkey;

-- Add new constraints referencing public.profiles
alter table feedback
    add constraint feedback_user_id_fkey
    foreign key (user_id)
    references public.profiles(id)
    on delete cascade;

alter table feedback_comments
    add constraint feedback_comments_user_id_fkey
    foreign key (user_id)
    references public.profiles(id)
    on delete cascade;
