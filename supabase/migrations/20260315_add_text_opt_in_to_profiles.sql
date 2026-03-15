-- Add text_opt_in column to profiles
alter table public.profiles 
add column if not exists text_opt_in boolean default false;
