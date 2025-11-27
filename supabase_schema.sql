-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Identity, Score, Settings)
create table profiles (
  id uuid references auth.users not null primary key,
  identity text,
  resilience_score integer default 50,
  streak integer default 0,
  shields integer default 0,
  settings jsonb, -- { theme, soundEnabled, soundType, soundVolume, goal }
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using ( auth.uid() = id );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

create policy "Users can insert own profile"
  on profiles for insert
  with check ( auth.uid() = id );

-- 2. HABITS (Micro-Habits Repository)
create table habits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  content text not null,
  category text, -- 'high', 'medium', 'low', 'current'
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table habits enable row level security;

create policy "Users can view own habits"
  on habits for select
  using ( auth.uid() = user_id );

create policy "Users can insert own habits"
  on habits for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own habits"
  on habits for update
  using ( auth.uid() = user_id );

create policy "Users can delete own habits"
  on habits for delete
  using ( auth.uid() = user_id );

-- 3. LOGS (History & Daily Completions)
create table logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  date date not null,
  completed_indices jsonb, -- [0, 1, 2]
  note text,
  energy_rating text,
  intention text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table logs enable row level security;

create policy "Users can view own logs"
  on logs for select
  using ( auth.uid() = user_id );

create policy "Users can insert own logs"
  on logs for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own logs"
  on logs for update
  using ( auth.uid() = user_id );
