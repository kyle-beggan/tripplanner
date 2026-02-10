-- Function to check if a user is an admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 
    from public.profiles 
    where id = auth.uid() 
    and role = 'admin'
  );
$$;

-- Allow admins to update any profile
drop policy if exists "Admins can update any profile." on public.profiles;
create policy "Admins can update any profile."
  on public.profiles for update
  using ( public.is_admin() );
