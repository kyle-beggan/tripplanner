-- Create activities table
create table if not exists activities (
    id uuid not null default gen_random_uuid(),
    name text not null,
    category text, -- e.g., 'Outdoor', 'Food', 'Nightlife'
    requires_gps boolean default false,
    created_at timestamptz not null default now(),
    constraint activities_pkey primary key (id),
    constraint activities_name_unique unique (name)
);

-- Enable RLS
alter table activities enable row level security;

-- Policies
-- Admins can do everything
create policy "Admins can do everything on activities"
    on activities
    for all
    using (
        exists (
            select 1 from profiles
            where id = auth.uid()
            and role = 'admin'
        )
    );

-- Authenticated users can view activities
create policy "Authenticated users can view activities"
    on activities
    for select
    using (
        auth.role() = 'authenticated'
    );
