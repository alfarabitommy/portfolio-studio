-- F7 — Supabase Storage buckets and their access policies.
--
-- Buckets come from docs/PRD.md §3 and docs/ROADMAP.md §1.3:
--   portfolios — project cover images and galleries
--   articles   — article covers and in-editor drag-and-drop uploads
--   assets     — the downloadable CV (PDF)
--
-- All three are PUBLIC-READ: the site serves their objects directly, and RLS on
-- the content tables (F6) is what protects unpublished content, not the files.
--
-- PRIVILEGE NOTE: the `storage` schema is owned by Supabase's internal
-- `supabase_storage_admin` role. Run this as the project owner (SQL editor /
-- migration with the `postgres` role); a restricted role will fail on the
-- `storage.buckets` insert.

-- ---------------------------------------------------------------------------
-- Buckets — idempotent, never clobbers an existing bucket's settings.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('portfolios', 'portfolios', true),
  ('articles', 'articles', true),
  ('assets', 'assets', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Object access policies
-- ---------------------------------------------------------------------------

-- Public (anon) read for every bucket the site serves.
drop policy if exists "Public read access to site media" on storage.objects;
create policy "Public read access to site media"
  on storage.objects
  for select
  to anon
  using (bucket_id in ('portfolios', 'articles', 'assets'));

-- Uploads and deletions are admin-only surfaces (Phase 4). Like F6, `to
-- authenticated` is NOT a single-admin guard on its own.
drop policy if exists "Authenticated users manage site media" on storage.objects;
create policy "Authenticated users manage site media"
  on storage.objects
  for all
  to authenticated
  using (bucket_id in ('portfolios', 'articles', 'assets'))
  with check (bucket_id in ('portfolios', 'articles', 'assets'));
