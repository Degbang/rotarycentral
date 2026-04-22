-- Demo content for Routary Ghana MVP
-- Run AFTER:
-- 1) supabase/schema.sql
-- 2) supabase/seed.sql
-- 3) creating the staff profile in public.profiles
--
-- This file creates PUBLISHED events/projects with complete required fields and
-- internet-hosted demo images so viewers can immediately test browsing, cards,
-- detail pages, and filters.

with staff_user as (
  select id
  from public.profiles
  where email = 'staff@districtgh.org'
  limit 1
)

insert into public.events (
  id,
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
values
  (
    '10000000-0000-0000-0000-000000000001',
    'Community Health Walk and Blood Pressure Screening',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '2026-05-18',
    '08:30',
    false,
    'Accra Sports Stadium Forecourt, Accra',
    'A district wellness morning bringing together club members, families, and community residents for a health walk, blood pressure screening, and short health education sessions.',
    'Nana Yeboah · 024 000 9104',
    'PUBLISHED',
    (select id from staff_user),
    jsonb_build_object(
      'id', 'evt-health-flyer',
      'name', 'community-health-walk.jpg',
      'mimeType', 'image/jpeg',
      'size', 312000,
      'category', 'image',
      'dataUrl', 'https://picsum.photos/seed/rd9104-health-walk/1600/900',
      'uploadedAt', '2026-04-22T10:00:00Z'
    ),
    jsonb_build_array(
      jsonb_build_object(
        'id', 'evt-health-gallery-1',
        'name', 'health-walk-gallery-1.jpg',
        'mimeType', 'image/jpeg',
        'size', 288000,
        'category', 'image',
        'dataUrl', 'https://picsum.photos/seed/rd9104-health-gallery-1/1600/900',
        'uploadedAt', '2026-04-22T10:00:00Z'
      ),
      jsonb_build_object(
        'id', 'evt-health-gallery-2',
        'name', 'health-walk-gallery-2.jpg',
        'mimeType', 'image/jpeg',
        'size', 276000,
        'category', 'image',
        'dataUrl', 'https://picsum.photos/seed/rd9104-health-gallery-2/1600/900',
        'uploadedAt', '2026-04-22T10:00:00Z'
      )
    ),
    jsonb_build_array(
      jsonb_build_object(
        'id', 'evt-health-doc-1',
        'name', 'screening-programme.pdf',
        'mimeType', 'application/pdf',
        'size', 13264,
        'category', 'pdf',
        'dataUrl', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        'uploadedAt', '2026-04-22T10:00:00Z'
      )
    )
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'District Literacy Book Drive',
    '33333333-3333-3333-3333-333333333333',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '2026-03-14',
    '10:00',
    false,
    'University of Ghana Primary School, Legon',
    'A completed literacy event featuring reading circles, book donations, and volunteer-led storytelling for lower primary pupils.',
    'Akosua Mensah · 020 100 9104',
    'PUBLISHED',
    (select id from staff_user),
    jsonb_build_object(
      'id', 'evt-literacy-flyer',
      'name', 'district-literacy-book-drive.jpg',
      'mimeType', 'image/jpeg',
      'size', 301000,
      'category', 'image',
      'dataUrl', 'https://picsum.photos/seed/rd9104-literacy-drive/1600/900',
      'uploadedAt', '2026-04-22T10:05:00Z'
    ),
    jsonb_build_array(
      jsonb_build_object(
        'id', 'evt-literacy-gallery-1',
        'name', 'reading-circle.jpg',
        'mimeType', 'image/jpeg',
        'size', 255000,
        'category', 'image',
        'dataUrl', 'https://picsum.photos/seed/rd9104-literacy-gallery-1/1600/900',
        'uploadedAt', '2026-04-22T10:05:00Z'
      )
    ),
    '[]'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'Green Corridor Tree Planting Day',
    '44444444-4444-4444-4444-444444444444',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '2026-06-06',
    '07:30',
    false,
    'KNUST Green Belt, Kumasi',
    'A district environmental service day focused on tree planting, sanitation, and sustainability education with student volunteers and partner clubs.',
    'Yaw Ofori · 055 910 4004',
    'PUBLISHED',
    (select id from staff_user),
    jsonb_build_object(
      'id', 'evt-green-flyer',
      'name', 'green-corridor-tree-planting.jpg',
      'mimeType', 'image/jpeg',
      'size', 318000,
      'category', 'image',
      'dataUrl', 'https://picsum.photos/seed/rd9104-tree-planting/1600/900',
      'uploadedAt', '2026-04-22T10:10:00Z'
    ),
    jsonb_build_array(
      jsonb_build_object(
        'id', 'evt-green-gallery-1',
        'name', 'sapling-team.jpg',
        'mimeType', 'image/jpeg',
        'size', 294000,
        'category', 'image',
        'dataUrl', 'https://picsum.photos/seed/rd9104-tree-planting-gallery-1/1600/900',
        'uploadedAt', '2026-04-22T10:10:00Z'
      ),
      jsonb_build_object(
        'id', 'evt-green-gallery-2',
        'name', 'watering-line.jpg',
        'mimeType', 'image/jpeg',
        'size', 286000,
        'category', 'image',
        'dataUrl', 'https://picsum.photos/seed/rd9104-tree-planting-gallery-2/1600/900',
        'uploadedAt', '2026-04-22T10:10:00Z'
      )
    ),
    '[]'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    'Membership and Public Image Open House',
    '22222222-2222-2222-2222-222222222222',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '2026-02-20',
    '18:00',
    false,
    'Lancaster Hotel Meeting Room, Kumasi',
    'A district showcase evening introducing Rotary and Rotaract service work to invited guests, prospective members, and local partners.',
    'Efua Sarpong · 026 000 9104',
    'PUBLISHED',
    (select id from staff_user),
    jsonb_build_object(
      'id', 'evt-membership-flyer',
      'name', 'membership-open-house.jpg',
      'mimeType', 'image/jpeg',
      'size', 274000,
      'category', 'image',
      'dataUrl', 'https://picsum.photos/seed/rd9104-open-house/1600/900',
      'uploadedAt', '2026-04-22T10:15:00Z'
    ),
    jsonb_build_array(
      jsonb_build_object(
        'id', 'evt-membership-gallery-1',
        'name', 'guest-networking.jpg',
        'mimeType', 'image/jpeg',
        'size', 248000,
        'category', 'image',
        'dataUrl', 'https://picsum.photos/seed/rd9104-open-house-gallery-1/1600/900',
        'uploadedAt', '2026-04-22T10:15:00Z'
      )
    ),
    '[]'::jsonb
  )
on conflict (id) do update set
  title = excluded.title,
  club_id = excluded.club_id,
  theme_id = excluded.theme_id,
  date = excluded.date,
  time = excluded.time,
  is_all_day = excluded.is_all_day,
  location = excluded.location,
  description = excluded.description,
  contact_person = excluded.contact_person,
  status = excluded.status,
  owner_user_id = excluded.owner_user_id,
  flyer = excluded.flyer,
  images = excluded.images,
  documents = excluded.documents,
  updated_at = now();

with staff_user as (
  select id
  from public.profiles
  where email = 'staff@districtgh.org'
  limit 1
)
insert into public.projects (
  id,
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
values
  (
    '20000000-0000-0000-0000-000000000001',
    'Community Reading Corner Upgrade',
    '33333333-3333-3333-3333-333333333333',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Active',
    'Madina Cluster of Schools, Accra',
    '2026-01-15',
    'A literacy-focused project upgrading reading corners with shelves, age-appropriate books, floor mats, and volunteer reading sessions.',
    'PUBLISHED',
    (select id from staff_user),
    jsonb_build_object(
      'id', 'proj-reading-cover',
      'name', 'community-reading-corner.jpg',
      'mimeType', 'image/jpeg',
      'size', 322000,
      'category', 'image',
      'dataUrl', 'https://picsum.photos/seed/rd9104-reading-corner/1600/900',
      'uploadedAt', '2026-04-22T10:20:00Z'
    ),
    jsonb_build_array(
      jsonb_build_object(
        'id', 'proj-reading-image-1',
        'name', 'library-shelf-before.jpg',
        'mimeType', 'image/jpeg',
        'size', 244000,
        'category', 'image',
        'dataUrl', 'https://picsum.photos/seed/rd9104-reading-corner-before/1600/900',
        'uploadedAt', '2026-04-22T10:20:00Z'
      ),
      jsonb_build_object(
        'id', 'proj-reading-image-2',
        'name', 'reading-session-after.jpg',
        'mimeType', 'image/jpeg',
        'size', 268000,
        'category', 'image',
        'dataUrl', 'https://picsum.photos/seed/rd9104-reading-corner-after/1600/900',
        'uploadedAt', '2026-04-22T10:20:00Z'
      )
    ),
    jsonb_build_array(
      jsonb_build_object(
        'id', 'proj-reading-doc-1',
        'name', 'reading-corner-proposal.pdf',
        'mimeType', 'application/pdf',
        'size', 13264,
        'category', 'pdf',
        'dataUrl', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        'uploadedAt', '2026-04-22T10:20:00Z'
      )
    )
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'Mothers First Mobile Screening Days',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Planning',
    'Tema New Town and Ashaiman outreach points',
    '2026-05-03',
    'A maternal and child health outreach project planning mobile screening days for expectant mothers, newborn advice clinics, and health referrals.',
    'PUBLISHED',
    (select id from staff_user),
    jsonb_build_object(
      'id', 'proj-mothers-cover',
      'name', 'mothers-first-screening.jpg',
      'mimeType', 'image/jpeg',
      'size', 314000,
      'category', 'image',
      'dataUrl', 'https://picsum.photos/seed/rd9104-mothers-first/1600/900',
      'uploadedAt', '2026-04-22T10:25:00Z'
    ),
    jsonb_build_array(
      jsonb_build_object(
        'id', 'proj-mothers-image-1',
        'name', 'screening-prep.jpg',
        'mimeType', 'image/jpeg',
        'size', 251000,
        'category', 'image',
        'dataUrl', 'https://picsum.photos/seed/rd9104-mothers-first-gallery-1/1600/900',
        'uploadedAt', '2026-04-22T10:25:00Z'
      )
    ),
    '[]'::jsonb
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    'District Tree Recovery Initiative',
    '44444444-4444-4444-4444-444444444444',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Completed',
    'Kumasi South green belt corridor',
    '2025-11-10',
    'A completed environmental project focused on tree planting, recovery of damaged green spaces, and community awareness on long-term maintenance.',
    'PUBLISHED',
    (select id from staff_user),
    jsonb_build_object(
      'id', 'proj-tree-cover',
      'name', 'district-tree-recovery.jpg',
      'mimeType', 'image/jpeg',
      'size', 327000,
      'category', 'image',
      'dataUrl', 'https://picsum.photos/seed/rd9104-tree-recovery/1600/900',
      'uploadedAt', '2026-04-22T10:30:00Z'
    ),
    jsonb_build_array(
      jsonb_build_object(
        'id', 'proj-tree-image-1',
        'name', 'tree-line-before.jpg',
        'mimeType', 'image/jpeg',
        'size', 262000,
        'category', 'image',
        'dataUrl', 'https://picsum.photos/seed/rd9104-tree-recovery-before/1600/900',
        'uploadedAt', '2026-04-22T10:30:00Z'
      ),
      jsonb_build_object(
        'id', 'proj-tree-image-2',
        'name', 'tree-line-after.jpg',
        'mimeType', 'image/jpeg',
        'size', 289000,
        'category', 'image',
        'dataUrl', 'https://picsum.photos/seed/rd9104-tree-recovery-after/1600/900',
        'uploadedAt', '2026-04-22T10:30:00Z'
      )
    ),
    jsonb_build_array(
      jsonb_build_object(
        'id', 'proj-tree-doc-1',
        'name', 'tree-recovery-report.pdf',
        'mimeType', 'application/pdf',
        'size', 13264,
        'category', 'pdf',
        'dataUrl', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        'uploadedAt', '2026-04-22T10:30:00Z'
      )
    )
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    'Young Entrepreneurs Skills Lab',
    '22222222-2222-2222-2222-222222222222',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'Active',
    'Kumasi Business Resource Centre',
    '2026-02-08',
    'A youth-focused economic development project offering short practical sessions in bookkeeping, customer service, pricing, and business presentation.',
    'PUBLISHED',
    (select id from staff_user),
    jsonb_build_object(
      'id', 'proj-skills-cover',
      'name', 'young-entrepreneurs-skills-lab.jpg',
      'mimeType', 'image/jpeg',
      'size', 296000,
      'category', 'image',
      'dataUrl', 'https://picsum.photos/seed/rd9104-skills-lab/1600/900',
      'uploadedAt', '2026-04-22T10:35:00Z'
    ),
    jsonb_build_array(
      jsonb_build_object(
        'id', 'proj-skills-image-1',
        'name', 'skills-session.jpg',
        'mimeType', 'image/jpeg',
        'size', 239000,
        'category', 'image',
        'dataUrl', 'https://picsum.photos/seed/rd9104-skills-lab-gallery-1/1600/900',
        'uploadedAt', '2026-04-22T10:35:00Z'
      )
    ),
    '[]'::jsonb
  )
on conflict (id) do update set
  title = excluded.title,
  club_id = excluded.club_id,
  theme_id = excluded.theme_id,
  project_status = excluded.project_status,
  location = excluded.location,
  start_date = excluded.start_date,
  description = excluded.description,
  status = excluded.status,
  owner_user_id = excluded.owner_user_id,
  cover_image = excluded.cover_image,
  images = excluded.images,
  documents = excluded.documents,
  updated_at = now();
