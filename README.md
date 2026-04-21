# Rotary Ghana District Platform (MVP)

Private Rotary district workspace for Ghana: clubs, events, and projects behind login.

## Tech
- Frontend: React + TypeScript + Vite + Radix primitives
- Backend: Supabase (Auth + Postgres + Storage)

## Supabase Setup
1. Create a Supabase project.
2. In Supabase SQL editor, run:
   - `supabase/schema.sql`
   - `supabase/seed.sql`
3. Create two auth users (Supabase Dashboard → Authentication → Users):
   - `viewer@districtgh.org` / `DemoPass123`
   - `staff@districtgh.org` / `DemoPass123`
4. In the SQL editor, query the auth ids:
   - `select id, email from auth.users where email in ('viewer@districtgh.org','staff@districtgh.org');`
5. Insert matching rows into `public.profiles` using the example in `supabase/seed.sql`.
6. Storage (attachments):
   - Create a private bucket named `attachments` (Dashboard → Storage → Buckets).
   - Create Storage policies in the UI (Dashboard → Storage → Policies). Running `supabase/storage.sql` in the SQL editor may fail with `must be owner of table objects` in some Supabase projects.
   - Important: do NOT use a blanket read policy like `bucket_id = 'attachments'` alone. Use the stricter read expression shown in `supabase/storage.sql` so users can only read:
     - their own uploads, or
     - files referenced by PUBLISHED events/projects.

## Security Notes (MVP)
- `public.profiles` is not user-editable in MVP. Do not add a profile update policy; it would allow privilege escalation via `permissions`.
- Supabase Auth session tokens are stored in `sessionStorage` (not `localStorage`) to reduce persistence. This is still not the same as `httpOnly` cookies (SPAs can’t do that safely without a server).
- Storage read policy must be strict (see `supabase/storage.sql`). Do not allow bucket-wide reads.
- Signed URLs are short-lived (10 minutes) and are re-issued as needed.

## Security Checklist (Before You Share the Demo)
Supabase:
1. `public.profiles`: verify there is no UPDATE policy for authenticated users.
2. `storage.objects` SELECT policy: use the strict `USING (...)` expression in `supabase/storage.sql`.
3. `attachments` bucket must be Private.
4. RLS is enabled on `events` and `projects` (from `supabase/schema.sql`).

Cloudflare Pages:
1. Ensure `public/_headers` is deployed (CSP + clickjacking protection + no-cache for service worker/manifest).
2. Ensure `public/_redirects` is deployed (SPA route refresh works).

## Loading Ghana Clubs
The club picker supports search-as-you-type, so it works well with long lists.

Recommended workflow:
1. Collect the full Ghana club list (Rotary + Rotaract) into a CSV.
2. Import into `public.clubs` using Supabase Dashboard → Table Editor → `clubs` → Import data (CSV).
3. Ensure required columns exist in your CSV:
   - `name` (e.g. `Rotary Club of Accra-Airport`)
   - `short_name` (e.g. `Accra-Airport`)
   - `type` (`Rotary Club` or `Rotaract Club`)
   - `location`
   - `description`
   - `contact_email`
   - `color_tone` (`rotary` or `rotaract`)

## Local Dev
1. Create `.env.local`:
   - `VITE_SUPABASE_URL=...`
   - `VITE_SUPABASE_ANON_KEY=...`
   Get these from Supabase Dashboard → Project Settings → API.
2. Install deps: `npm install`
3. Run: `npm run dev`

## Deploy (Cloudflare Pages)
1. Cloudflare Dashboard → Pages → Create a project → Connect your GitHub repo.
2. Framework preset: `Vite`
3. Build command: `npm run build`
4. Build output directory: `dist`
5. Environment variables (Production + Preview):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. SPA routing:
   - This repo includes `public/_redirects` so refreshing `/login`, `/events`, etc. works.
7. PWA install reliability:
   - This repo includes `public/_headers` to prevent stale caching of `sw.js` and the manifest.

## Supabase Auth Settings (Required After Deploy)
Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://<your-cloudflare-pages-domain>`
- Redirect URLs: add
  - `https://<your-cloudflare-pages-domain>/*`

## Login
The app requires `email + password + Rotary ID`.

## Notes
- Storage bucket is private. The UI uses signed URLs for previews/downloads.
- Roles/permissions are read from `public.profiles` and used for staff-only creation/editing.

## Brand Compliance (Rotary / Rotaract)
- Club/district/zone logos must be created from official Brand Center templates; do not use the Masterbrand Signature alone for club identity.
- The Rotary wheel is the Mark of Excellence (secondary). For social profile pictures, use the Mark of Excellence as recommended; keep the club/district logo nearby where possible.
- Event/project lockups are allowed to show relationships, but lockups are not official club/district logos.
- Naming rule (hard enforced on publish in this app): if an event/project title uses `Rotary` or `Rotarian`, the title must include the full club name you selected (e.g. `Rotary Club of Accra-Airport ...`).
