-- Seed data for clubs and themes (safe to rerun).
-- Run AFTER supabase/schema.sql.

insert into public.clubs (id, name, short_name, type, location, description, contact_email, color_tone)
values
  ('11111111-1111-1111-1111-111111111111', 'Rotary Club of Accra-Airport', 'Accra-Airport', 'Rotary Club', 'Accra, Greater Accra Region',
   'A district club focused on leadership, community service, and professional fellowship.', 'accra-airport@districtgh.org', 'rotary'),
  ('22222222-2222-2222-2222-222222222222', 'Rotary Club of Kumasi-Premier', 'Kumasi-Premier', 'Rotary Club', 'Kumasi, Ashanti Region',
   'A Rotary club driving health and economic empowerment programmes in Kumasi.', 'kumasi-premier@districtgh.org', 'rotary'),
  ('33333333-3333-3333-3333-333333333333', 'Rotaract Club of Legon', 'Legon', 'Rotaract Club', 'Legon, Greater Accra Region',
   'A Rotaract club with a strong youth service and campus engagement footprint.', 'legon@districtgh.org', 'rotaract'),
  ('44444444-4444-4444-4444-444444444444', 'Rotaract Club of KNUST', 'KNUST', 'Rotaract Club', 'Kumasi, Ashanti Region',
   'A Rotaract club supporting education, innovation, and community outreach projects.', 'knust@districtgh.org', 'rotaract')
on conflict (id) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  type = excluded.type,
  location = excluded.location,
  description = excluded.description,
  contact_email = excluded.contact_email,
  color_tone = excluded.color_tone,
  updated_at = now();

insert into public.themes (id, name, description)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Maternal and Child Health', 'Health-focused programmes, clinics, screenings, and awareness events.'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Basic Education and Literacy', 'School, library, literacy, and mentorship work.'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Environment', 'Tree planting, sustainability, sanitation, and clean-up activities.'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Membership and Public Image', 'Membership drives, orientation, and public image initiatives.'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Community Economic Development', 'Livelihood, empowerment, enterprise, and skills training initiatives.')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  updated_at = now();

-- Create two auth users in Supabase first (Authentication -> Users):
-- - viewer@districtgh.org / DemoPass123
-- - staff@districtgh.org / DemoPass123
--
-- Then link profiles by id:
-- select id, email from auth.users where email in ('viewer@districtgh.org', 'staff@districtgh.org');
-- Use those ids below.

-- Example (replace the UUIDs with real auth.users ids):
-- insert into public.profiles (id, display_name, email, rotary_id, roles, permissions, club_ids)
-- values
--   ('<viewer-auth-uuid>', 'Akosua Boateng', 'viewer@districtgh.org', '910400100', array['VIEWER'], array['event.read','project.read'], array[]::uuid[]),
--   ('<staff-auth-uuid>', 'Nana Yeboah', 'staff@districtgh.org', '910400101', array['STAFF'],
--     array[
--       'event.read','event.create','event.edit.own','event.publish',
--       'project.read','project.create','project.edit.own','project.publish',
--       'staff.access'
--     ],
--     array[
--       '11111111-1111-1111-1111-111111111111'::uuid,
--       '22222222-2222-2222-2222-222222222222'::uuid,
--       '33333333-3333-3333-3333-333333333333'::uuid,
--       '44444444-4444-4444-4444-444444444444'::uuid
--     ]
--   )
-- on conflict (id) do update set
--   display_name = excluded.display_name,
--   rotary_id = excluded.rotary_id,
--   roles = excluded.roles,
--   permissions = excluded.permissions,
--   club_ids = excluded.club_ids,
--   status = 'ACTIVE',
--   updated_at = now();
