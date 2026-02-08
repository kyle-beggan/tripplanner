-- Create feedback table
create table if not exists feedback (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) not null,
    title text not null,
    description text not null,
    type text check (type in ('bug', 'feature_request', 'general')) not null default 'general',
    status text check (status in ('open', 'in_progress', 'closed')) not null default 'open',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create feedback comments table
create table if not exists feedback_comments (
    id uuid primary key default gen_random_uuid(),
    feedback_id uuid references feedback(id) on delete cascade not null,
    user_id uuid references auth.users(id) not null,
    content text not null,
    created_at timestamptz default now()
);

-- Enable RLS
alter table feedback enable row level security;
alter table feedback_comments enable row level security;

-- Policies for feedback
create policy "Anyone can view feedback"
    on feedback for select using (true);

create policy "Authenticated users can create feedback"
    on feedback for insert with check (auth.uid() = user_id);

create policy "Users can update their own feedback"
    on feedback for update using (auth.uid() = user_id);

create policy "Admins can update any feedback"
    on feedback for update using (
        exists (
            select 1 from profiles
            where id = auth.uid() and role = 'admin'
        )
    );

create policy "Users can delete their own feedback"
    on feedback for delete using (auth.uid() = user_id);
    
create policy "Admins can delete any feedback"
    on feedback for delete using (
        exists (
            select 1 from profiles
            where id = auth.uid() and role = 'admin'
        )
    );

-- Policies for comments
create policy "Anyone can view comments"
    on feedback_comments for select using (true);

create policy "Authenticated users can create comments"
    on feedback_comments for insert with check (auth.uid() = user_id);

create policy "Users can delete their own comments"
    on feedback_comments for delete using (auth.uid() = user_id);

create policy "Admins can delete any comment"
    on feedback_comments for delete using (
        exists (
            select 1 from profiles
            where id = auth.uid() and role = 'admin'
        )
    );
