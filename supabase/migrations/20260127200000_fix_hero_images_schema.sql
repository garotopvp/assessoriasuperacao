-- Create table if not exists
create table if not exists public.hero_images (
    id uuid default gen_random_uuid() primary key,
    pagina text not null,
    url text not null,
    posicao text not null default '50% 50%',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Safely add unique constraint on pagina
do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'hero_images_pagina_key') then
        alter table public.hero_images add constraint hero_images_pagina_key unique (pagina);
    end if;
end $$;

-- Enable RLS
alter table public.hero_images enable row level security;

-- Drop existing policies to avoid conflicts if they exist with different names
drop policy if exists "Enable read access for all users" on public.hero_images;
drop policy if exists "Enable insert for authenticated users only" on public.hero_images;
drop policy if exists "Enable update for authenticated users only" on public.hero_images;
drop policy if exists "Enable delete for authenticated users only" on public.hero_images;

-- Create Policies
create policy "Enable read access for all users"
on public.hero_images for select
using (true);

create policy "Enable insert for authenticated users only"
on public.hero_images for insert
with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users only"
on public.hero_images for update
using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users only"
on public.hero_images for delete
using (auth.role() = 'authenticated');
