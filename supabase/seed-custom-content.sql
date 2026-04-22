-- Custom content seed (events, projects, announcements)
-- Run AFTER:
-- 1) supabase/schema.sql
-- 2) supabase/seed.sql (clubs/themes/etc)
-- 3) creating at least one auth user + matching row in public.profiles
--
-- Notes:
-- - Required foreign keys:
--   - events.club_id / projects.club_id -> public.clubs(id)
--   - events.theme_id / projects.theme_id -> public.themes(id)
--   - events.owner_user_id / projects.owner_user_id / announcements.owner_user_id -> auth.users(id)
-- - Attachment JSON fields (flyer/cover_image/images/documents) can use either:
--   - `dataUrl` (public URL), OR
--   - `bucket` + `objectPath` (Supabase Storage); the app will sign URLs at runtime.

-- Helper: pick a staff user (adjust email)
with staff_user as (
  select id
  from public.profiles
  where email = 'staff@districtgh.org'
  limit 1
)

-- ======================================
-- EVENTS
-- ======================================
insert into public.events (
  title,
  club_id,
  theme_id,
  date,
  time,
  is_all_day,
  location,
  description,
  contact_person,
  status,
  owner_user_id,
  flyer,
  images,
  documents
)
values (
  'REPLACE: Event title',
  'REPLACE: club_id uuid',
  'REPLACE: theme_id uuid',
  '2026-05-01',
  '10:00',
  false,
  'REPLACE: location',
  'REPLACE: description',
  'REPLACE: contact person',
  'PUBLISHED',
  (select id from staff_user),
  jsonb_build_object(
    'id', 'evt-flyer-1',
    'name', 'event-flyer.jpg',
    'mimeType', 'image/jpeg',
    'size', 0,
    'category', 'image',
    -- Choose one:
    -- 'dataUrl', 'https://example.com/event-flyer.jpg',
    -- OR (if you uploaded to Supabase Storage):
    -- 'bucket', 'attachments',
    -- 'objectPath', 'REPLACE: <userId>/flyers/<file>',
    'uploadedAt', '2026-04-22T10:00:00Z'
  ),
  '[]'::jsonb,
  '[]'::jsonb
);

-- ======================================
-- PROJECTS
-- ======================================
with staff_user as (
  select id
  from public.profiles
  where email = 'staff@districtgh.org'
  limit 1
)
insert into public.projects (
  title,
  club_id,
  theme_id,
  project_status,
  location,
  start_date,
  description,
  status,
  owner_user_id,
  cover_image,
  images,
  documents
)
values (
  'REPLACE: Project title',
  'REPLACE: club_id uuid',
  'REPLACE: theme_id uuid',
  'Active',
  'REPLACE: location',
  '2026-05-01',
  'REPLACE: description',
  'PUBLISHED',
  (select id from staff_user),
  jsonb_build_object(
    'id', 'proj-cover-1',
    'name', 'project-cover.jpg',
    'mimeType', 'image/jpeg',
    'size', 0,
    'category', 'image',
    -- Choose one:
    -- 'dataUrl', 'https://example.com/project-cover.jpg',
    -- OR (if you uploaded to Supabase Storage):
    -- 'bucket', 'attachments',
    -- 'objectPath', 'REPLACE: <userId>/covers/<file>',
    'uploadedAt', '2026-04-22T10:10:00Z'
  ),
  '[]'::jsonb,
  '[]'::jsonb
);

-- ======================================
-- ANNOUNCEMENTS
-- ======================================
with staff_user as (
  select id
  from public.profiles
  where email = 'staff@districtgh.org'
  limit 1
)
insert into public.announcements (
  title,
  body,
  scope,
  club_id,
  status,
  owner_user_id
)
values (
  'REPLACE: Announcement title',
  'REPLACE: Announcement body',
  'DISTRICT',
  null,
  'PUBLISHED',
  (select id from staff_user)
);

