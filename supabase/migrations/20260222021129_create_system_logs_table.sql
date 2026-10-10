create table if not exists public.system_logs (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    action text not null,
    category text not null,
    level text not null check (level in ('info', 'warning', 'error')),
    message text not null,
    details jsonb default '{}'::jsonb,
    user_id uuid references public.profiles(user_id) on delete set null
);

-- Enable RLS
alter table public.system_logs enable row level security;

-- Policies
create policy "Admins can view all system logs"
    on public.system_logs for select
    using ( exists (
        select 1 from public.profiles
        where profiles.user_id = auth.uid()
        and profiles.is_admin = true
    ) );

create policy "Admins can insert system logs"
    on public.system_logs for insert
    with check ( exists (
        select 1 from public.profiles
        where profiles.user_id = auth.uid()
        and profiles.is_admin = true
    ) );

-- Allow authenticated users to insert logs if they are making actions? Actually, some apps allow anyone to insert a log but for now let's allow service role or admins.
-- Edge functions using service_role key will bypass RLS anyway.
