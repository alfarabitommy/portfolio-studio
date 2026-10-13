-- F5 — Phase 1 initial schema.
--
-- Source of truth for these columns: docs/PRD.md §5 (tables A–D).
-- Column definitions are copied EXACTLY from the PRD, including which columns are
-- nullable: several defaulted columns (`is_published`, `display_order`, `tags`,
-- `reading_time_minutes`, `is_read`) use DEFAULT without NOT NULL, which is why
-- src/types/database.ts types them as `| null`.
--
-- Idempotent: safe to re-run. Apply via the Supabase SQL editor, or
-- `supabase db push` once a project is linked (the Supabase CLI is NOT installed
-- in this environment and Docker is unavailable, so this file is an artifact and
-- has never been executed here).

-- gen_random_uuid() built into PostgreSQL 13+ (Supabase runs 15+); kept for
-- portability to older/self-hosted instances. No-op if already installed.
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- A. public.projects
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  category text not null,
  summary text not null,
  problem_statement text not null,
  solution_statement text not null,
  cover_image_url text not null,
  gallery_images text[] default '{}',
  tech_stack text[] not null,
  live_url text,
  repo_url text,
  display_order int default 0,
  is_published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- B. public.articles
-- ---------------------------------------------------------------------------
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  excerpt text not null,
  content text not null, -- Markdown content
  cover_image_url text not null,
  tags text[] default '{}',
  reading_time_minutes int default 1,
  is_published boolean default false,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- C. public.inbox_messages
-- ---------------------------------------------------------------------------
create table if not exists public.inbox_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  intent_type text not null default 'general',
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- D. public.site_configs
-- ---------------------------------------------------------------------------
create table if not exists public.site_configs (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- `slug` uniqueness is declared inline above; these support the published-row
-- filters used by every public read (see src/lib/supabase.server.ts).
-- ---------------------------------------------------------------------------
create index if not exists projects_published_display_order_idx
  on public.projects (is_published, display_order);

create index if not exists articles_published_at_idx
  on public.articles (is_published, published_at desc);

create index if not exists inbox_messages_created_at_idx
  on public.inbox_messages (created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- The PRD declares `updated_at ... default now()` but provides no mechanism to
-- keep it current, so a shared trigger function supplies one.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists set_articles_updated_at on public.articles;
create trigger set_articles_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();

drop trigger if exists set_site_configs_updated_at on public.site_configs;
create trigger set_site_configs_updated_at
  before update on public.site_configs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Seed: the two canonical site_configs keys.
-- These drive the availability pill (docs/UX_UX_Spec.md §3B) and the dynamic CV
-- download (§3F / §7). Typed by SiteConfigValueMap in src/types/database.ts.
--
-- NOTE: the deployed project already contains both rows, and its CV key is
-- `resume` (not `cv`), so this seed matches that name. `on conflict do nothing`
-- keeps this idempotent and never clobbers live values — the live
-- `availability` label ("Available for Projects") therefore wins over the text
-- below, which only initialises a fresh database.
-- ---------------------------------------------------------------------------
insert into public.site_configs (key, value)
values
  ('availability', '{"status": "available", "label": "Available for Q4 Projects"}'::jsonb),
  ('resume', '{"url": null, "updated_at": null}'::jsonb)
on conflict (key) do nothing;
