-- F6 — Row Level Security policies.
--
-- Policy matrix transcribed from docs/PRD.md §5E. Written idempotently
-- (enable RLS, then drop-if-exists + create) so the file can be re-run safely.
--
-- SECURITY NOTE (carried into Phase 4): `to authenticated` grants ANY
-- signed-up user, not one admin. The single-user admin requirement is NOT
-- enforced here — it needs an email/ID allowlist, and docs/PRD.md never
-- addresses whether public signup is open. Do not mistake these policies for an
-- admin guard.

-- ---------------------------------------------------------------------------
-- Grants
-- RLS filters rows, but it does not grant access: without privileges the roles
-- see nothing at all. Supabase grants these by default for tables created in
-- `public`, but stating them explicitly makes this migration deterministic on
-- any PostgreSQL instance and keeps the intent auditable next to the policies.
-- ---------------------------------------------------------------------------
grant select on public.projects to anon, authenticated;
grant insert, update, delete on public.projects to authenticated;

grant select on public.articles to anon, authenticated;
grant insert, update, delete on public.articles to authenticated;

grant insert on public.inbox_messages to anon;
grant select, update, delete on public.inbox_messages to authenticated;

grant select on public.site_configs to anon, authenticated;
grant insert, update, delete on public.site_configs to authenticated;

-- ---------------------------------------------------------------------------
-- public.projects
-- anon: SELECT only where is_published = true
-- authenticated: ALL
-- ---------------------------------------------------------------------------
alter table public.projects enable row level security;

drop policy if exists "Published projects are publicly readable" on public.projects;
create policy "Published projects are publicly readable"
  on public.projects
  for select
  to anon
  using (is_published = true);

drop policy if exists "Authenticated users manage projects" on public.projects;
create policy "Authenticated users manage projects"
  on public.projects
  for all
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- public.articles
-- anon: SELECT only where is_published = true
-- authenticated: ALL
-- ---------------------------------------------------------------------------
alter table public.articles enable row level security;

drop policy if exists "Published articles are publicly readable" on public.articles;
create policy "Published articles are publicly readable"
  on public.articles
  for select
  to anon
  using (is_published = true);

drop policy if exists "Authenticated users manage articles" on public.articles;
create policy "Authenticated users manage articles"
  on public.articles
  for all
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- public.inbox_messages
-- anon: INSERT (public contact form)
-- authenticated: SELECT, UPDATE, DELETE
-- ---------------------------------------------------------------------------
alter table public.inbox_messages enable row level security;

drop policy if exists "Anyone may submit a contact message" on public.inbox_messages;
create policy "Anyone may submit a contact message"
  on public.inbox_messages
  for insert
  to anon
  with check (true);

drop policy if exists "Authenticated users read messages" on public.inbox_messages;
create policy "Authenticated users read messages"
  on public.inbox_messages
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users update messages" on public.inbox_messages;
create policy "Authenticated users update messages"
  on public.inbox_messages
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users delete messages" on public.inbox_messages;
create policy "Authenticated users delete messages"
  on public.inbox_messages
  for delete
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- public.site_configs
-- anon: SELECT
-- authenticated: ALL
-- ---------------------------------------------------------------------------
alter table public.site_configs enable row level security;

drop policy if exists "Site config is publicly readable" on public.site_configs;
create policy "Site config is publicly readable"
  on public.site_configs
  for select
  to anon
  using (true);

drop policy if exists "Authenticated users manage site config" on public.site_configs;
create policy "Authenticated users manage site config"
  on public.site_configs
  for all
  to authenticated
  using (true)
  with check (true);
