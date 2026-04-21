-- Routary Ghana MVP schema (Supabase)
-- Run this in the Supabase SQL editor.

create extension if not exists pgcrypto;

do $$ begin
  create type record_status as enum ('DRAFT', 'SUBMITTED', 'CHANGES_REQUESTED', 'PUBLISHED', 'ARCHIVED');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type club_type as enum ('Rotary Club', 'Rotaract Club');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type project_progress_status as enum ('Planning', 'Active', 'Completed', 'Paused');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  email text not null,
  rotary_id text not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','DISABLED')),
  roles text[] not null default array[]::text[],
  permissions text[] not null default array[]::text[],
  club_ids uuid[] not null default array[]::uuid[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(rotary_id),
  unique(email)
);

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text not null,
  type club_type not null,
  location text not null,
  description text not null,
  contact_email text not null,
  color_tone text not null check (color_tone in ('rotary','rotaract')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.themes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(name)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  club_id uuid not null references public.clubs(id),
  theme_id uuid not null references public.themes(id),
  date date not null,
  time time,
  is_all_day boolean not null default false,
  location text not null,
  description text not null,
  contact_person text not null,
  status record_status not null default 'DRAFT',
  owner_user_id uuid not null references auth.users(id),
  change_note text,
  flyer jsonb,
  images jsonb not null default '[]'::jsonb,
  documents jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  club_id uuid not null references public.clubs(id),
  theme_id uuid not null references public.themes(id),
  project_status project_progress_status not null default 'Planning',
  location text not null,
  start_date date not null,
  description text not null,
  status record_status not null default 'DRAFT',
  owner_user_id uuid not null references auth.users(id),
  change_note text,
  cover_image jsonb,
  images jsonb not null default '[]'::jsonb,
  documents jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists set_clubs_updated_at on public.clubs;
create trigger set_clubs_updated_at before update on public.clubs
for each row execute procedure public.set_updated_at();

drop trigger if exists set_themes_updated_at on public.themes;
create trigger set_themes_updated_at before update on public.themes
for each row execute procedure public.set_updated_at();

drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at before update on public.events
for each row execute procedure public.set_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at before update on public.projects
for each row execute procedure public.set_updated_at();

create or replace function public.is_staff(uid uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid
      and p.status = 'ACTIVE'
      and p.permissions @> array['staff.access']::text[]
  );
$$;

alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.themes enable row level security;
alter table public.events enable row level security;
alter table public.projects enable row level security;

-- Profiles
drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles
for select to authenticated
using (id = auth.uid());

drop policy if exists "profiles update own" on public.profiles;
-- NOTE: We intentionally do NOT allow self-service profile updates in MVP.
-- Otherwise any user could escalate privileges by editing `roles` / `permissions`.

-- Clubs / themes are readable to all authenticated; write is intentionally disabled in MVP.
drop policy if exists "clubs read" on public.clubs;
create policy "clubs read" on public.clubs
for select to authenticated
using (true);

drop policy if exists "clubs write staff" on public.clubs;

drop policy if exists "themes read" on public.themes;
create policy "themes read" on public.themes
for select to authenticated
using (true);

drop policy if exists "themes write staff" on public.themes;

-- Events
drop policy if exists "events read published or owner or staff" on public.events;
create policy "events read published or owner or staff" on public.events
for select to authenticated
using (
  status = 'PUBLISHED'
  or owner_user_id = auth.uid()
);

drop policy if exists "events insert staff" on public.events;
create policy "events insert staff" on public.events
for insert to authenticated
with check (public.is_staff(auth.uid()) and owner_user_id = auth.uid());

drop policy if exists "events update owner or staff" on public.events;
create policy "events update owner or staff" on public.events
for update to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

-- Projects
drop policy if exists "projects read published or owner or staff" on public.projects;
create policy "projects read published or owner or staff" on public.projects
for select to authenticated
using (
  status = 'PUBLISHED'
  or owner_user_id = auth.uid()
);

drop policy if exists "projects insert staff" on public.projects;
create policy "projects insert staff" on public.projects
for insert to authenticated
with check (public.is_staff(auth.uid()) and owner_user_id = auth.uid());

drop policy if exists "projects update owner or staff" on public.projects;
create policy "projects update owner or staff" on public.projects
for update to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());
