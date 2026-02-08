-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 
-- 1. TABLES CREATION
--

-- Profiles
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  username text unique,
  first_name text,
  last_name text,
  full_name text,
  phone_number text,
  avatar_url text,
  role text default 'user' check (role in ('user', 'admin')),
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trips
create table if not exists trips (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  description text,
  start_date date,
  end_date date,
  is_public boolean default false,
  deposit_amount numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trip Participants
create table if not exists trip_participants (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  status text default 'invited' check (status in ('invited', 'going', 'declined')),
  role text default 'attendee' check (role in ('owner', 'organizer', 'attendee')),
  joined_at timestamptz default now(),
  unique(trip_id, user_id)
);

-- 
-- 2. RLS POLICIES (Drop first to avoid collision)
--

-- Profiles
alter table profiles enable row level security;
drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone." on profiles for select using ( true );

drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

drop policy if exists "Users can insert own profile." on profiles;
create policy "Users can insert own profile."
  on profiles for insert
  with check ( auth.uid() = id );

-- Trips
alter table trips enable row level security;
drop policy if exists "Trips are viewable by everyone if public or participant." on trips;
create policy "Trips are viewable by everyone if public or participant." on trips for select using ( 
    is_public = true 
    or 
    exists (select 1 from trip_participants where trip_id = trips.id and user_id = auth.uid())
    or
    owner_id = auth.uid()
    or 
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Admins and Owners can update trips." on trips;
create policy "Admins and Owners can update trips." on trips for update using ( 
    owner_id = auth.uid() 
    or 
    exists (select 1 from profiles where id = auth.uid() and role = 'admin') 
);

drop policy if exists "Admins and Owners can delete trips." on trips;
create policy "Admins and Owners can delete trips." on trips for delete using ( 
    owner_id = auth.uid() 
    or 
    exists (select 1 from profiles where id = auth.uid() and role = 'admin') 
);

drop policy if exists "Admins and Authenticated users can insert trips." on trips;
create policy "Admins and Authenticated users can insert trips." on trips for insert with check ( auth.uid() = owner_id );

-- Trip Participants
alter table trip_participants enable row level security;
drop policy if exists "Participants viewable by trip members." on trip_participants;
create policy "Participants viewable by trip members." on trip_participants for select using (
    exists (select 1 from trips where id = trip_participants.trip_id and (is_public = true or owner_id = auth.uid()))
    or
    user_id = auth.uid()
    or
    exists (select 1 from trip_participants tp where tp.trip_id = trip_participants.trip_id and tp.user_id = auth.uid())
);

drop policy if exists "Users can join public trips." on trip_participants;
create policy "Users can join public trips." on trip_participants for insert with check (
    user_id = auth.uid()
    and
    exists (select 1 from trips where id = trip_id and is_public = true)
);

-- 
-- 3. NEW USER HANDLER (Trigger)
--
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role, status)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'user',
    'pending'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: Drop first to ensure cleanliness
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 
-- 4. STORAGE (Avatars)
--
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatar images are publicly accessible." on storage.objects;
create policy "Avatar images are publicly accessible." on storage.objects for select using ( bucket_id = 'avatars' );

drop policy if exists "Anyone can upload an avatar." on storage.objects;
create policy "Anyone can upload an avatar." on storage.objects for insert with check ( bucket_id = 'avatars' );

drop policy if exists "Anyone can update their own avatar." on storage.objects;
create policy "Anyone can update their own avatar." on storage.objects for update using ( auth.uid() = owner ) with check ( bucket_id = 'avatars' );
