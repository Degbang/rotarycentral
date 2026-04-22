-- Reset content (events, projects, announcements) for a clean demo.
-- Safe: does not touch clubs, themes, or profiles.
--
-- Run in Supabase SQL editor as `postgres`.

delete from public.announcements;
delete from public.events;
delete from public.projects;

-- Optional: remove all stored attachments in the bucket.
-- This may be blocked depending on your Supabase permissions; if so, delete from Storage UI.
-- delete from storage.objects where bucket_id = 'attachments';

