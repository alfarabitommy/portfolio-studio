# Phase 1 Implementation Plan — Foundation, Design Tokens, Database Typings & Supabase Client

| | |
| --- | --- |
| **Status** | Approved — 2026-10-08 |
| **Scope** | `docs/ROADMAP.md` Phase 1 (§1.1–1.4, tooling excluded per §1.3 below) |
| **Authoritative sources** | `docs/PRD.md`, `docs/ROADMAP.md`, `docs/UX_UX_Spec.md` |
| **Stack** | TanStack Start 1.168.60, React 19, Vite 8, Nitro 3, Tailwind CSS 4.1.18, TypeScript 6 (strict) |
| **Note on references** | The brief cited `docs/UI_UX_SPEC.md`. That path does not exist; the real file is `docs/UX_UX_Spec.md`. The same stale reference in `docs/ROADMAP.md` §1.2 has been corrected. |

---

# 1. Executive Objective & Scope Breakdown

## 1.1 Objective
Establish the verified foundation for a portfolio/studio site: a dual-theme design-token system, TypeScript typings for the four database tables, and an SSR-safe Supabase client — so that Phases 2–4 build on a stable, type-checked base rather than retrofitting tokens, types, and client wiring.

## 1.2 In Scope

| Item | Deliverable |
| --- | --- |
| Design tokens + theme engine | `src/styles/app.css`, dark default, class-based Light toggle, no FOUC |
| Database typings | `src/types/database.ts` covering all 4 tables |
| Supabase client integration | `src/lib/supabase.ts` (+ one flagged sibling, §3.5) |
| Schema, RLS, buckets | `supabase/migrations/*.sql` |
| Wired-up consequences | `src/routes/__root.tsx` stylesheet import + pre-hydration theme script |

## 1.3 Out of Scope
Public UI, drawer/bottom-sheet, motion system, article engine, `/admin` routes, contact form, SEO/JSON-LD, real page data fetching — all Phase 2–4 per `docs/ROADMAP.md`. ESLint/Prettier setup (`docs/ROADMAP.md` §1.1) is also excluded; no linter or formatter exists in this repo today.

## 1.4 Approved Decisions (D)

- **D1** Keep `src/`; adopt the inventory subpaths: `src/styles/app.css`, `src/types/database.ts`, `src/lib/supabase.ts`. The existing `src/styles.css` is **renamed**, not duplicated.
- **D2** Tokens are **CSS-first** via `@theme`; therefore **no `tailwind.config.js`/`.ts` is created** — see §2.1.
- **D3** Scope includes `supabase/migrations` SQL for tables, RLS policies, and Storage buckets.

## 1.5 Approved Assumptions (A)

- **A1** Add `@supabase/ssr` (latest 0.12.7; peer `@supabase/supabase-js ^2.114.0`, satisfied by the installed 2.117.3). Rationale: it is the only documented way to make the session cookie readable on the server, which `docs/ROADMAP.md` §1.4 requires and Phase 4 depends on. Installing it now avoids rewriting `src/lib/supabase.ts` later.
- **A2** The env var keeps the existing name `VITE_SUPABASE_ANON_KEY` rather than Supabase's sample name `VITE_SUPABASE_PUBLISHABLE_KEY`, because `.env` already defines the former. Same credential class.
- **A3** Fonts load from Google Fonts via `<link rel="preconnect">` + `display=swap`, exposed as `--font-display` / `--font-sans` / `--font-mono` tokens. Self-hosting is deferred to Phase 5 (`docs/ROADMAP.md` §5.1).
- **A4** Types are **hand-authored**, not generated: no Supabase CLI, no Docker, and no linked project in this environment. They are written in the exact shape `supabase gen types` emits so regeneration is a drop-in replacement.
- **A5** `site_configs` key names are specified nowhere in `docs/`. This plan proposed `availability` and `cv`; execution found the deployed database already contains `availability` and **`resume`**, so the CV key is `resume` — see §8.
- **A6** `.env.example` is **not** created. `README.md`'s dangling reference to it remains as-is and is not part of this phase.

## 1.6 Constraints Verified in This Checkout (hard facts)

- No Tailwind config file exists. Tailwind is **v4.1.18** via `@tailwindcss/vite`; `@tailwindcss/typography` is a **devDependency**, so it must load through CSS (`@plugin`), not a JS config.
- `src/` contains **zero** occurrences of `supabase`, `createServerFn`, `import.meta.env`, or `process.env`.
- **`getWebRequest` does not exist** in TanStack Start 1.168.60. Server helpers come from `@tanstack/react-start/server`: `getRequest`, `getCookies`, `getCookie`, `setCookie`, `deleteCookie`, `setResponseHeader`. They throw `No StartEvent found in AsyncLocalStorage…` when called outside request handling.
- `tsconfig.json` sets `strict`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` — so type-only imports **must** use `import type`, and placeholder/demo exports will fail `tsc --noEmit`.
- No Docker, no Supabase CLI, not a git repository, no test runner. `npm run typecheck` (`tsc --noEmit`) exists; `npm run dev`, `npm run build`, `npm run preview`, `npm run generate-routes` are the only other scripts.

---

# 2. Files Inventory

## 2.1 Note on `tailwind.config.js` / `.ts` — Substituted by D2

The requirement is satisfied **without** a config file. Tailwind v4 is CSS-first: `@theme` in the stylesheet both declares tokens and generates utilities, and the typography plugin loads via `@plugin "@tailwindcss/typography";`. Creating `tailwind.config.ts` would need a `@config` shim and reintroduce the dual-source-of-truth problem v4 removes. If a JS surface is later wanted (e.g. typography plugin options), it can be added additively without touching the tokens.

## 2.2 New Files

| # | Path | Purpose |
| --- | --- | --- |
| F1 | `src/styles/app.css` | Renamed from `src/styles.css`; tokens, dark variant, typography plugin, base layer |
| F2 | `src/types/database.ts` | `Database` interface + row aliases for all 4 tables |
| F3 | `src/lib/supabase.ts` | Client-safe Supabase factories + typed query helpers |
| F4 | `src/lib/supabase.server.ts` | **Flagged deviation — see §3.5.** Server-only factories |
| F5 | `supabase/migrations/20261008120000_init_schema.sql` | 4 tables, indexes, `updated_at` trigger |
| F6 | `supabase/migrations/20261008120100_rls_policies.sql` | RLS enable + policies per PRD §5E |
| F7 | `supabase/migrations/20261008120200_storage_buckets.sql` | Buckets `portfolios`, `articles`, `assets` + `storage.objects` policies |

## 2.3 Modified Files

| # | Path | Change |
| --- | --- | --- |
| M1 | `src/routes/__root.tsx` | `../styles.css?url` → `../styles/app.css?url`; `class="dark"` default; pre-hydration theme script; font links; `suppressHydrationWarning` |
| M2 | `package.json` | Add `@supabase/ssr` dependency only |

`src/styles.css` is deleted by M1's rename (F1). No other file is touched.

---

# 3. Technical Implementation Details per File

## 3.1 F1 — `src/styles/app.css`

**Layer 1: raw tokens on `:root`, overridden in `.dark`.** Raw vars stay outside `@theme` so they can be swapped per theme. All 11 values are transcribed from `docs/UX_UX_Spec.md` §2A. Dark values are listed second precisely so the Dark column is the default surface when the `dark` class is present.

```css
:root {
  --bg-base: #fafafa;      --bg-subtle: #f4f4f5;   --surface-card: #ffffff;
  --surface-glass: rgba(255,255,255,0.70);
  --border-subtle: rgba(0,0,0,0.08);  --border-hover: rgba(0,0,0,0.20);
  --text-primary: #09090b; --text-secondary: #52525b; --text-muted: #a1a1aa;
  --accent-emerald: #16a34a; --accent-glow: rgba(22,163,74,0.25);
  color-scheme: light;
}
.dark {
  --bg-base: #09090b;  --bg-subtle: #121215; --surface-card: #18181b;
  --surface-glass: rgba(9,9,11,0.65);
  --border-subtle: rgba(255,255,255,0.08); --border-hover: rgba(255,255,255,0.22);
  --text-primary: #fafafa; --text-secondary: #a1a1aa; --text-muted: #71717a;
  --accent-emerald: #22c55e; --accent-glow: rgba(34,197,94,0.35);
  color-scheme: dark;
}
```

| Token | Dark (default) | Light | Role |
| --- | --- | --- | --- |
| `--bg-base` | `#09090b` | `#fafafa` | Main canvas |
| `--bg-subtle` | `#121215` | `#f4f4f5` | Alternating section bg |
| `--surface-card` | `#18181b` | `#ffffff` | Cards, modal, drawer |
| `--surface-glass` | `rgba(9,9,11,0.65)` | `rgba(255,255,255,0.70)` | Floating glass containers |
| `--border-subtle` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.08)` | Hairline structural borders |
| `--border-hover` | `rgba(255,255,255,0.22)` | `rgba(0,0,0,0.20)` | Interactive hover highlight |
| `--text-primary` | `#fafafa` | `#09090b` | Headlines, titles |
| `--text-secondary` | `#a1a1aa` | `#52525b` | Body copy, summaries |
| `--text-muted` | `#71717a` | `#a1a1aa` | Labels, timestamps, indices |
| `--accent-emerald` | `#22c55e` | `#16a34a` | *Available for Work* indicator |
| `--accent-glow` | `rgba(34,197,94,0.35)` | `rgba(22,163,74,0.25)` | Status pill pulse glow |

**Layer 2: bridge raw vars into Tailwind utilities with `@theme inline`.** `inline` is load-bearing here: it makes generated utilities emit `var(--bg-base)` directly rather than copying a resolved value into `:root`, which is what allows the `.dark` block to actually cascade.

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@custom-variant dark (&:where(.dark, .dark *));

@theme inline {
  --color-bg-base: var(--bg-base);
  --color-bg-subtle: var(--bg-subtle);
  --color-surface-card: var(--surface-card);
  --color-surface-glass: var(--surface-glass);
  --color-border-subtle: var(--border-subtle);
  --color-border-hover: var(--border-hover);
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-muted: var(--text-muted);
  --color-accent-emerald: var(--accent-emerald);
  --color-accent-glow: var(--accent-glow);
  --font-display: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, monospace;
}
```

This yields `bg-bg-base`, `bg-surface-card`, `border-border-subtle`, `text-text-primary`, `text-accent-emerald`, `font-display`, `font-mono`, etc. Token **names** keep the spec's exact vocabulary while utility names follow Tailwind's `--color-*` / `--font-*` namespaces.

**Layer 3: `@layer base`** — default `border-color`, plus `body` background/color/font, and the typography scale from `docs/UX_UX_Spec.md` §2C. Existing `box-sizing` and `min-height` rules are preserved verbatim.

## 3.2 M1 — Theme engine in `src/routes/__root.tsx`

- Set `<html lang="en" class="dark" suppressHydrationWarning>` — Dark is the spec default.
- Insert a **blocking** inline script as the first child of `<head>` (via the route's `head().scripts` config, or `dangerouslySetInnerHTML`) that reads `localStorage.getItem('theme')`, falls back to `matchMedia('(prefers-color-scheme: dark)')`, toggles the `dark` class, and sets `color-scheme`. Running before hydration is what prevents FOUC; `suppressHydrationWarning` is required because it mutates `<html>`.
- Update the stylesheet link to the new path (D1).
- Add the three Google Fonts `preconnect` / `<link>` tags (A3).
- The theme **toggle UI** is Phase 2 (`docs/ROADMAP.md` §2.1, View Transitions API). Phase 1 ships the state engine only; the inline script is its origin.

## 3.3 F2 — `src/types/database.ts`

Shape mirrors `supabase gen types` output exactly (A4) so it is replaceable:

```ts
export type Json =
  | string | number | boolean | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: { /* projects, articles, inbox_messages, site_configs */ }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Project       = Database['public']['Tables']['projects']['Row']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']
// …same triad for Article, InboxMessage, SiteConfig
```

**`Row` is derived mechanically from PRD §5 SQL. `Insert` / `Update` differ only where the DB supplies a default or the column is nullable:**

| Table | `Row`-only non-null columns | Nullable / defaulted (⇒ optional in `Insert`) |
| --- | --- | --- |
| `projects` | `id`, `title`, `slug`, `category`, `summary`, `problem_statement`, `solution_statement`, `cover_image_url`, `tech_stack`, `is_published`, `created_at`, `updated_at` | `gallery_images`, `live_url`, `repo_url`, `display_order` |
| `articles` | `id`, `title`, `slug`, `excerpt`, `content`, `cover_image_url`, `reading_time_minutes`, `created_at`, `updated_at` | `tags`, `is_published`, `published_at` |
| `inbox_messages` | `id`, `name`, `email`, `message`, `is_read`, `created_at` | `intent_type` |
| `site_configs` | `key`, `value`, `updated_at` | — |

`Update` makes every column optional. Array columns are `string[]`; `site_configs.value` is `Json`; `Relationships: []` on each table.

Two deliberate typing choices:

- **`updated_at` and all `timestamptz` columns are `string`**, not `Date` — PostgREST returns ISO strings.
- **`intent_type` is typed `string`**, matching the `text` column in PRD §5C. The UX spec's pills (*Freelance / Fulltime / Consulting*) suggest a narrower union, but adding a Postgres `CHECK` constraint or enum is not in the PRD — proposing that belongs with the Phase 2 contact form.

## 3.4 F3 / F4 — Supabase Client Integration

**Env access rules (strict split):**

| Context | Mechanism | Variables |
| --- | --- | --- |
| Browser bundle | `import.meta.env.*` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| Server request | `process.env.*` **inside** the handler | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| Server only | `process.env.*` **inside** the handler | `SUPABASE_SERVICE_ROLE_KEY` |

Two facts drive this. First, `import.meta.env.VITE_*` is statically inlined at build time **into the server bundle as well**, so it is frozen at build time and never runtime-configurable. Second, the `VITE_` prefix filter applies to the server build too — `import.meta.env.SUPABASE_SERVICE_ROLE_KEY` is always `undefined`, which is a useful safety net: the service-role key is structurally unable to leak through `import.meta.env`. In production, Vercel injects real runtime `process.env`.

**No module-level singleton.** `@supabase/ssr`'s own types state that a server client must be created per request ("never share a client across requests"), because the cookie cache headers are delivered with the first cookie write only. Every server export is therefore a **factory**:

```ts
// src/lib/supabase.ts — client-safe, browser-importable
import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
  )
}
```

```ts
// src/lib/supabase.server.ts — server-only; importing this from client code must fail
import { createServerClient } from '@supabase/ssr'
import { getCookies, setCookie, setResponseHeader } from '@tanstack/react-start/server'

export function createSupabaseServerClient() {
  return createServerClient<Database>(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => Object.entries(getCookies()).map(([name, value]) => ({ name, value })),
        setAll: (cookies, headers) => {
          cookies.forEach(({ name, value, options }) => setCookie(name, value, options))
          Object.entries(headers).forEach(([name, value]) => setResponseHeader(name, value))
        },
      },
    },
  )
}
```

A third factory, `createSupabaseAdminClient()`, uses plain `createClient` from `@supabase/supabase-js` with `auth: { persistSession: false, autoRefreshToken: false }` and `process.env.SUPABASE_SERVICE_ROLE_KEY`, and belongs in the same server-only file. Supabase's guidance is explicit that `@supabase/ssr` is **not** the right tool for a service-role client.

**Typed read helpers** (`getPublishedProjects`, `getPublishedArticles`, `getSiteConfig`) live in `supabase.server.ts` and filter `is_published = true` / select single `site_configs` keys — keeping the RLS policy assumptions in one reviewable place.

## 3.5 F4 — The One Flagged Deviation

The brief names a single `src/lib/supabase.ts`. That module **cannot** hold the server factories: importing `@tanstack/react-start/server` from a module that a client component also imports pulls server utilities into the browser bundle, which TanStack Start treats as a build error or runtime crash. This plan therefore keeps `src/lib/supabase.ts` exactly as specified as the client-safe entry point, and adds `src/lib/supabase.server.ts` as a sibling.

Alternative if preferred: `src/lib/supabase/{client,server,admin}.ts` — the layout Supabase's own TanStack Start sample uses. Either form is a one-file change to reverse; the literal single-file version is not viable as written.

**The split is enforced, not conventional.** TanStack Start ships a side-effect marker — `import '@tanstack/react-start/server-only'` — which marks a module server-only. If any client-environment module reaches it, the build fails with `[import-protection] Import denied in client environment` and a full import chain. That marker is at the top of `src/lib/supabase.server.ts`, and the plugin's own remediation text names this exact layout ("Move the server-only import out of this file into a separate `.server.ts` module that is not imported by any client code"). Verified in execution: see §8.

## 3.6 F5–F7 — Migrations

**F5 `…_init_schema.sql`** — `create table if not exists` for all 4 tables with the exact PRD §5 columns, plus:

- `create extension if not exists pgcrypto` (for `gen_random_uuid()`).
- A unique index on each `slug`; an index on `is_published`.
- A reusable `set_updated_at()` trigger function with `before update` triggers on `projects`, `articles`, `site_configs` — the PRD declares `updated_at` defaults but never a mechanism to maintain them.

**F6 `…_rls_policies.sql`** — RLS per PRD §5E, written idempotently (`alter table … enable row level security`, then `drop policy if exists` + `create policy`):

| Table | `anon` | `authenticated` |
| --- | --- | --- |
| `projects`, `articles` | `SELECT` where `is_published = true` | `ALL` |
| `inbox_messages` | `INSERT` | `SELECT`, `UPDATE`, `DELETE` |
| `site_configs` | `SELECT` | `ALL` |

> **Security note for Phase 4:** `to authenticated` grants **any** signed-up user, so it is not by itself a single-admin guard. The single-user restriction needs an email/ID allowlist check. The PRD calls for single-user admin access but never addresses public signup — flagged here so it is not mistaken for solved.

**F7 `…_storage_buckets.sql`** — `insert into storage.buckets … on conflict do nothing` for `portfolios`, `articles`, `assets`, plus `storage.objects` policies: public `SELECT` on the three buckets, writes restricted to `authenticated`.

**How these get applied (important):** Docker and the Supabase CLI are both absent in this environment, so these files are **authored artifacts only** — there is no way to execute or test them here. They apply via the Supabase SQL editor, or `supabase db push` once a project is linked and the CLI installed.

---

# 4. Step-by-Step Execution Sequence

Each step ends in a check; a failed check stops the sequence. (This document's own creation is not listed — it is complete.)

| # | Step | Check |
| --- | --- | --- |
| 4.1 | Rename `src/styles.css` → `src/styles/app.css` | Old path gone, new path present |
| 4.2 | Rewrite `src/styles/app.css` with the §3.1 layers | `npm run dev` boots, page still styled |
| 4.3 | Update M1 `__root.tsx`: stylesheet path, `class="dark"`, theme script, font links | Dev server 200; `<html class="dark">` in view-source |
| 4.4 | Author F2 `src/types/database.ts` (§3.3) | `npm run typecheck` clean |
| 4.5 | Install `@supabase/ssr` (M2) | Resolves; lockfile updated |
| 4.6 | Author F3 `src/lib/supabase.ts` + F4 `src/lib/supabase.server.ts` (§3.4) | `npm run typecheck` clean |
| 4.7 | Author F5 → F6 → F7 migrations, in dependency order (§3.6) | SQL parses (manual review) |
| 4.8 | Exercise a temporary smoke read (`getPublishedProjects`) through a `createServerFn` — loaders run on the client too — then **remove it** before finishing | Returns `[]` or data, not an error |
| 4.9 | Full gate: `npm run typecheck` && `npm run build` | Both exit 0 |
| 4.10 | Confirm no server-only leak: scan `.output/public` for the service-role key name | 0 matches |
| 4.11 | Review the final diff; delete build artifacts (`.output`) | Only M1 / M2 + F1–F7 remain |

---

# 5. Verification & Testing Strategy

## 5.1 TypeScript compile check
`npm run typecheck` (`tsc --noEmit`) — exit 0 required after 4.4, 4.6, and 4.9. `verbatimModuleSyntax` means `import type { Database }`; `noUnusedLocals` means F3/F4 must export only what is used or the step fails.

## 5.2 Local dev runtime validation
`npm run dev` (port 3000), then:

- `curl -s localhost:3000/ | grep -ao "<h1"` → returns `<h1`, proving SSR still renders after the stylesheet move. Use `-a`: the HTML is detected as binary and a plain `grep -o` prints `binary file matches` **instead of** the match.
- View-source contains `class="dark"` on `<html>`.
- Manual: set `theme` in `localStorage`, reload → correct theme with **no flash**.
- Manual: with an OS light preference and no stored `theme`, the first load resolves to **Light** (resolution order is stored → OS → Dark). The authored Dark default applies when JS is unavailable or no colour-scheme preference can be read — see §8.

## 5.3 Build & bundle-boundary validation
`npm run build` must exit 0 — this is the real test of D2 (`@theme inline` compiles) and of §3.5 (server-only imports stay server-side). Then grep `.output/public/**` for `SUPABASE_SERVICE_ROLE_KEY`; zero matches expected.

## 5.4 What Cannot Be Verified Here

- **SQL / RLS / buckets (F5–F7):** no Docker, no Supabase CLI, no linked project. Correctness is by review against PRD §5; execution is a manual step performed in the Supabase dashboard.
- **No test runner exists** in this repo, so this phase ships **no automated tests**. Claiming "tests pass" for Phase 1 would be false; verification is typecheck + build + the manual checks above.

---

# 6. Potential Risks & Mitigation Measures

| # | Risk | Impact | Mitigation |
| --- | --- | --- | --- |
| R1 | Server-only module pulled into the browser bundle | Build failure, or leaked service-role key | Enforce the §3.5 split; verify at 4.10 by scanning `.output/public`; never re-export server factories from `src/lib/supabase.ts` |
| R2 | `@theme` copies resolved values into `:root`, so `.dark` never applies | Tokens silently stuck on one theme | Use `@theme inline`; if a token fails to swap, that is the first thing to check (4.2) |
| R3 | FOUC / theme flash on cold load | Fails NFR §6.2 | Blocking inline head script + `suppressHydrationWarning`; verified manually at 5.2 |
| R4 | `setCookie` option types: `@supabase/ssr` passes `cookie`-package options into TanStack's `cookie-es` `CookieSerializeOptions` | `tsc` error at 4.6 | Types are structurally compatible; if TS objects, add one narrow cast and comment it. Flagged as unverified by research — typecheck early |
| R5 | Cookie/session state shared across concurrent requests via a singleton | Cross-request data leak | Factories everywhere on the server; the browser client is a singleton by design and is the only permitted one |
| R6 | `import.meta.env` read at module scope | Undefined on edge runtimes; risk of inlining into the client | Read env inside handlers only; `process.env` for anything server-only |
| R7 | Reusing the `VITE_` prefix for a secret | Key ships to the browser | `SUPABASE_SERVICE_ROLE_KEY` is unprefixed; the prefix filter makes it structurally unreadable via `import.meta.env` |
| R8 | Non-idempotent migrations re-run by hand | Failed or partial schema | `if not exists`, `drop policy if exists`, guarded bucket inserts, numbered filenames in dependency order |
| R9 | Hand-authored types drift from the live schema | Silent query bugs | Match `supabase gen types` shape exactly (A4); regenerate once a project is linked |
| R10 | Rename breaks the `?url` stylesheet import | Site renders unstyled | Rename and update `__root.tsx` in the same step (4.1–4.3), verified at 5.2 |
| R11 | `to authenticated` mistaken for a single-admin guard | Any signed-up user can mutate content | Documented in §3.6; enforce an admin allowlist in Phase 4 |

---

# 7. Decisions Confirmed at Approval

1. **§3.5 split** — `src/lib/supabase.server.ts` sibling is accepted (alternative layout `src/lib/supabase/{client,server,admin}.ts` remains available if wanted later).
2. **A1** — `@supabase/ssr` is added now, in Phase 1, rather than deferred to Phase 4.
3. **A5** — `site_configs` keys are `availability` and **`resume`** (confirmed against the deployed database during execution; supersedes the `cv` name proposed earlier).
4. **A3** — Google Fonts CDN now; self-hosting deferred to Phase 5.
5. **A6** — `.env.example` is not added in this phase; `README.md`'s dangling reference stays as-is.

---

# 8. Post-Execution Corrections

Recorded after executing Steps 4.1–4.11. Nothing here changes the file inventory (F1–F7, M1–M2); these are corrections to claims in this document that execution proved wrong.

1. **The Supabase project is already provisioned.** Anon-key reads against `VITE_SUPABASE_URL` succeeded for all four tables (`projects`, `articles`, `inbox_messages`: 0 rows; `site_configs`: 2 rows). Therefore F5–F7 are **no-op-safe documentation** of an existing schema rather than a first-time provisioning step — which is exactly why every statement in them is idempotent (`if not exists`, `drop policy if exists`, `on conflict do nothing`). Do not assume applying them creates anything.
2. **All 47 columns in §3.3 were verified to exist** in the live schema by selecting the exact declared column list per table. The hand-authored `Row` types match the deployed database; the A4/ R9 drift risk did not materialise.
3. **The CV key is `resume`, not `cv`** (A5 above). The live row is `resume = {"url":null,"updated_at":null}` — the same shape this plan assigned to `cv`. Because the seed is `on conflict (key) do nothing`, applying it will not create a duplicate or overwrite the live row.
4. **The `availability` seed label is inert on this environment.** Live value is `{"label":"Available for Projects"}`; the seeded `"Available for Q4 Projects"` (your addendum) applies only to a fresh database, since the seed never clobbers. Confirmed as the intended behaviour.
5. **§5.2's dark-mode expectation was wrong and is corrected above.** The inline script resolves stored → OS preference → Dark, so a first visit on a light-preference OS renders Light. `docs/ROADMAP.md` §1.2 requires that OS detection; `docs/PRD.md` §6.2's "Tema default: Dark Mode" is satisfied only as the last-resort fallback. Changing this is a one-line edit to `THEME_INIT_SCRIPT`.
6. **§3.5's enforcement is now verified, not assumed** — see the note in §3.5. A deliberate client-graph import of `src/lib/supabase.server.ts` failed the build with exit code 1 and a named import chain; removing it restored a green build.
7. **R4 did not occur.** No cast was needed: `@supabase/ssr`'s `CookieOptions` (from `cookie`) is assignable to TanStack's `setCookie` option type in this configuration. `npm run typecheck` passed on the first attempt.
8. **F5–F7 have never executed.** No Supabase CLI and no Docker in this environment, so the migration SQL is unreviewed by a database engine. §5.4 stands unchanged.
9. **`SUPABASE_SERVICE_ROLE_KEY` is unset** in `.env`, so `createSupabaseAdminClient()` throws until it is configured. This is expected — `docs/ROADMAP.md` §6.1 places it in Vercel — but it means the admin client is untested.
10. **The theme toggle UI does not exist yet.** Phase 1 ships only the state engine and the `localStorage` contract (`theme` = `"dark"` | `"light"`). Phase 2 (`docs/ROADMAP.md` §2.1) owns the control.
