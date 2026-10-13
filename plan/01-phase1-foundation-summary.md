# Phase 1 Execution Summary — Foundation, Design Tokens, Database Typings & Supabase Client

| | |
| --- | --- |
| **Status** | Complete — all 11 steps executed, all gates green |
| **Executed** | 2026-10-08 |
| **Plan** | `plan/01-phase1-foundation-plan.md` (approved), Steps 4.1–4.11 |
| **Stack verified against** | TanStack Start 1.168.60, React 19, Vite 8, Nitro 3, Tailwind CSS 4.1.18, TypeScript 6 (strict), `@supabase/ssr` 0.12.7 |
| **Inventory delivered** | F1–F7 new, M1–M2 modified, `index.tsx` untouched (temporary probe reverted) |

---

# 1. Execution Overview & Status

## 1.1 Outcome

All eleven planned steps completed in order, each against its own gate. Every file in the plan's inventory exists at the specified path, and no file outside that inventory was modified.

| Step | Action | Status | Gate result |
| --- | --- | --- | --- |
| 4.1 | Rename `src/styles.css` → `src/styles/app.css` | Done | Old path absent, new path present |
| 4.2 | Write token layers into `app.css` | Done | Dev server boots; `--bg-base` present in served CSS |
| 4.3 | Update `__root.tsx` (path, `class="dark"`, theme script, fonts) | Done | HTTP 200; `<html lang="en" class="dark">` in SSR output |
| 4.4 | Author `src/types/database.ts` | Done | `typecheck` exit 0 |
| 4.5 | Install `@supabase/ssr` | Done | 0.12.7 resolved and recorded in `package.json` |
| 4.6 | Author `src/lib/supabase.ts` + `supabase.server.ts` | Done | `typecheck` exit 0 |
| 4.7 | Author migrations F5–F7 incl. `site_configs` seed | Done | 4 tables, 12 policies, 3 buckets; SQL reviewed by hand |
| 4.8 | Temporary smoke read, then remove | Done | Live data returned; probe and its `index.tsx` edit fully reverted |
| 4.9 | `typecheck` + `build` | Done | Both exit 0 |
| 4.10 | Server-only bundle-boundary scan | Done | 0 leaks — plus a **negative test** proving the guard fires |
| 4.11 | Final review, remove `.output` | Done | Repo contains no build or scratch artifacts |

## 1.2 Scope Confirmation

**In scope and delivered:** design tokens + theme engine, database typings, Supabase client integration, migrations for schema/RLS/buckets.

**Out of scope and untouched, as planned:** public UI, drawer/bottom-sheet, motion system, article engine, `/admin`, contact form, SEO/JSON-LD, ESLint/Prettier, `.env.example`.

## 1.3 The Single Most Important Finding

**The target Supabase project already has this schema deployed.** An anon-key read against `VITE_SUPABASE_URL` succeeded for all four tables on the first attempt.

| Table | Anon-readable | Rows |
| --- | --- | --- |
| `projects` | yes | 0 |
| `articles` | yes | 0 |
| `inbox_messages` | yes | 0 |
| `site_configs` | yes | 2 |

Consequences that shaped the rest of this phase:

1. **F5–F7 are no-op-safe documentation, not provisioning.** Everything in them is idempotent (`create table if not exists`, `drop policy if exists`, `on conflict do nothing`), so applying them to the live project changes schema shape only where the live project already diverges.
2. **The CV key is `resume`, not `cv`.** Live value: `resume = {"url":null,"updated_at":null}` — identical in shape to the `cv` name the plan assumed. You chose to adopt `resume` everywhere, so `SiteConfigValueMap` and the F5 seed both use it. Had the seed kept `cv`, it would have added a redundant third row.
3. **The seeded availability label will not take effect on this project.** Live value is `{"label":"Available for Projects"}`; the addendum's `"Available for Q4 Projects"` is now only the initial value for a fresh database, because you chose to keep `on conflict do nothing` so a re-run can never clobber admin-set values.

## 1.4 A Second Correction Made Before Completion

Plan §3.2 (hence `docs/ROADMAP.md` §1.2) specifies OS preference detection, while plan §5.2 expected Dark regardless of OS preference. These cannot both hold. I implemented §3.2 — resolution order **stored → OS preference → Dark** — and corrected §5.2 in the plan, because §3.2 is the normative implementation spec and the ROADMAP explicitly requires system detection. The authored Dark default now applies only when JS is unavailable or no colour-scheme preference can be read. This is a one-line change in `THEME_INIT_SCRIPT` if you want literal always-Dark-on-first-visit instead.

---

# 2. Created & Modified Files Breakdown

## 2.1 New Files (F1–F7)

| # | Path | Lines | What was implemented |
| --- | --- | --- | --- |
| F1 | `src/styles/app.css` | 127 | Token system in three layers: `.dark`-overridable raw custom properties on `:root`/`.dark` (all 11 values from `docs/UX_UX_Spec.md` §2A), an `@theme inline` bridge generating `bg-bg-base` / `text-text-primary` / `font-display`-style utilities, and a `@layer base` with the box-sizing/border-colour reset, body surface, heading and mono elements. Also carries `@plugin "@tailwindcss/typography"` and `@custom-variant dark (&:where(.dark, .dark *))`. |
| F2 | `src/types/database.ts` | 230 | `Database` interface in exact `supabase gen types` shape — `Tables` with `Row`/`Insert`/`Update`/`Relationships` for `projects`, `articles`, `inbox_messages`, `site_configs`, plus empty `Views`/`Functions`/`Enums`/`CompositeTypes`. Exports 12 row aliases and the `SiteConfigValueMap` narrowing the two canonical config keys (`availability`, `resume`). |
| F3 | `src/lib/supabase.ts` | 30 | Client-safe entry point: `createSupabaseBrowserClient()` via `@supabase/ssr`'s `createBrowserClient<Database>`, reading only `VITE_`-prefixed `import.meta.env` values. Importable from browser code by design. |
| F4 | `src/lib/supabase.server.ts` | 147 | Server-only module, guarded by `import '@tanstack/react-start/server-only'`. Contains `requireEnv()`, per-request `createSupabaseServerClient()` with the `getCookies`/`setCookie`/`setResponseHeader` cookie adapter, session-less `createSupabaseAdminClient()` on `@supabase/supabase-js`, and the three typed read helpers `getPublishedProjects()`, `getPublishedArticles()`, `getSiteConfig()`. |
| F5 | `supabase/migrations/20261008120000_init_schema.sql` | 139 | 4 tables with columns copied exactly from `docs/PRD.md` §5; `pgcrypto`; three published-row indexes; the `set_updated_at()` function and its three `before update` triggers (the PRD declares `updated_at` defaults but no maintenance mechanism); and the idempotent `site_configs` seed for `availability` + `resume`. |
| F6 | `supabase/migrations/20261008120100_rls_policies.sql` | 131 | RLS enabled on all 4 tables with the §5E matrix — 10 policies, all `drop if exists` + `create` — plus explicit `grant` statements so the migration is deterministic on any PostgreSQL instance rather than depending on Supabase's default privileges. |
| F7 | `supabase/migrations/20261008120200_storage_buckets.sql` | 46 | The three public-read buckets (`portfolios`, `articles`, `assets`) via `on conflict (id) do nothing`, and 2 `storage.objects` policies separating anon read from authenticated write. |

## 2.2 Modified Files (M1–M2)

| # | Path | Change |
| --- | --- | --- |
| M1 | `src/routes/__root.tsx` | Stylesheet import repointed to `../styles/app.css?url`; `<html>` now carries `className="dark"` + `suppressHydrationWarning`; blocking `THEME_INIT_SCRIPT` added through `head().scripts`; two `preconnect` hints and the Google Fonts stylesheet for Plus Jakarta Sans, Inter, and Geist Mono. |
| M2 | `package.json` | `@supabase/ssr` `^0.12.7` added to `dependencies`. No other field changed. |

## 2.3 Verified-Unchanged

- `src/routes/index.tsx` — temporarily instrumented for Step 4.8 and **restored byte-for-byte** to its original 14 lines, confirmed by re-reading the file after cleanup.
- `src/routeTree.gen.ts` — regenerated with identical content by the build; not hand-edited.
- `tsconfig.json`, `vite.config.ts`, `tsr.config.json`, `vercel.json` — untouched.

## 2.4 Scratch Artifacts Removed

Two temporary probes were created and deleted; both were confirmed absent from the final tree:

- `src/lib/supabase.smoke.ts` — Step 4.8 read probe.
- `src/lib/boundary-probe.ts` — Step 4.10 negative test.

External scratch (`/tmp/probe.mjs`, `/tmp/cols.mjs`, `/tmp/boundary-fail.log`, HTML/log captures) was also removed. `.output` was deleted after verification.

---

# 3. Verification & Gate Results

## 3.1 Gate 1 — TypeScript (`npm run typecheck`)

**Result: PASS (exit 0).** Run three times — after Step 4.4, after Step 4.6, and on the final state. Notably it passed on the **first** attempt for the Supabase client, so **risk R4 did not materialise**: no cast was required, because `@supabase/ssr`'s `CookieOptions` (the `cookie` package's `Partial<SerializeOptions>`) is assignable to TanStack's `cookie-es` `CookieSerializeOptions` in this configuration. `verbatimModuleSyntax` and `noUnusedLocals` are satisfied — all type imports use `import type`, and no export is unused.

## 3.2 Gate 2 — Production Build (`npm run build`)

**Result: PASS (exit 0).** Nitro emits `.output/server` + `.output/public` + `nitro.json`. The built stylesheet proves the D2 token strategy compiled correctly:

| Check on `.output/public/assets/app-*.css` | Result |
| --- | --- |
| `--bg-base` custom property present | yes |
| `.dark` rule emitted | yes |
| `where(.dark` (the `@custom-variant` selector) emitted | yes |

The third row is the meaningful one: it confirms the class-based Dark variant compiled, and that `@theme inline` emitted `var(--token)` references rather than frozen values — so the `.dark` override cascades as intended (risk R2).

## 3.3 Gate 3 — Bundle Boundary Scan (`.output/public`)

**Result: PASS — 0 leaks, and the guard is proven to fire.**

The plain scan of the client bundle returned zero matches for all six server-only needles:

| Needle | Files in `.output/public` |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | 0 |
| `createSupabaseAdminClient` | 0 |
| `createSupabaseServerClient` | 0 |
| `No StartEvent found` | 0 |
| `setResponseHeader` | 0 |
| `persistSession` | 0 |

Taken alone this pass is **vacuous** — after Step 4.8's probe was removed, nothing imports `supabase.server.ts`, so it is never bundled and would never appear. I therefore added a deliberate **negative test (R1)**:

1. `src/lib/boundary-probe.ts` imported `createSupabaseServerClient` from `supabase.server.ts`.
2. `src/routes/index.tsx` imported that probe, placing it in the client graph.
3. `npm run build` → **exit 1**, with a precise diagnostic:

```
[plugin tanstack-start-core:import-protection]
[import-protection] Import denied in client environment
  Importer: src/lib/boundary-probe.ts:2:36
  Resolved: src/lib/supabase.server.ts
    1. src/router.tsx:2:28 (entry) (import "./routeTree.gen")
    2. src/routeTree.gen.ts:2:44 (import "./routes/index")
    3. src/routes/index.tsx:1:32 (import "../lib/boundary-probe")
    4. src/lib/boundary-probe.ts:2:36 (import "./supabase.server")
```

The plugin's remediation text also names this layout explicitly: *"Move the server-only import out of this file into a separate `.server.ts` module that is not imported by any client code."* Removing the probe restored a green build. The §3.5 split is therefore **enforced at build time**, not merely conventional, and the chosen `supabase.server.ts` naming is the plugin's own recommendation.

## 3.4 Gate 4 — SSR / Runtime Validation

**Result: PASS.** With `npm run dev` on port 3000:

| Check | Result |
| --- | --- |
| `curl -s localhost:3000/` | HTTP 200 |
| Server-rendered heading (`grep -ao "<h1"`) | present |
| `<html>` attributes in SSR output | `<html lang="en" class="dark">` |
| Pre-hydration theme script | present (`prefers-color-scheme: dark` inlined) |
| Font hints | `fonts.gstatic.com` preconnect + stylesheet present |
| Token utility generation | `text-text-muted` compiled to `color: var(--text-muted)` |
| Dev-server errors / import violations | none |

## 3.5 Gate 5 — Live Integration Smoke Test (Step 4.8)

**Result: PASS — end-to-end against the real Supabase project.** The probe ran inside a `createServerFn` (not a route loader, since loaders execute on the client too) and returned:

```json
{"ok":true,"projectCount":0,
 "availability":{"label":"Available for Projects","status":"available"},
 "resume":{"url":null,"updated_at":null}}
```

This single result simultaneously confirms: `VITE_` env vars resolve on the server; the anon key authenticates; the anon RLS `SELECT` policies permit the reads; `getPublishedProjects()` and `getSiteConfig()` work; and the `resume` key chosen from your decision reads correctly through the typed helper.

## 3.6 Schema Fidelity Check (R9 — hand-authored types vs. reality)

**Result: PASS — 47/47 columns match.** Rather than trusting the PRD transcription, I selected the *exact* column list declared in `src/types/database.ts` for each table against the live database:

| Table | Declared columns | Live schema |
| --- | --- | --- |
| `projects` | 16 | all present |
| `articles` | 12 | all present |
| `inbox_messages` | 7 | all present |
| `site_configs` | 3 | all present |

The R9 drift risk is closed for Phase 1: the types describe the deployed schema.

## 3.7 What Was NOT Verified

- **The migration SQL has never executed.** No Supabase CLI and no Docker in this environment, so F5–F7 are hand-reviewed, not engine-validated. In particular the F5 `updated_at` triggers and the F6 `grant` statements are unexercised, and the F7 storage policies may duplicate policies the live project already defines under different names.
- **`createSupabaseAdminClient()` is untested** — `SUPABASE_SERVICE_ROLE_KEY` is unset in `.env` (expected; `docs/ROADMAP.md` §6.1 places it in Vercel).
- **No automated tests exist** in this repo, so nothing here is backed by a test suite. Verification is typecheck + build + bundle scan + live read, all described above.
- **The theme toggle UI was not exercised**, because it does not exist yet — only the state engine and its `localStorage` contract (`theme` = `"dark"` | `"light"`) are in place.

## 3.8 Pre-existing Issue Observed

`npm audit` reports 2 moderate advisories for `postcss-selector-parser` reached through `@tailwindcss/typography`. This is **pre-existing and unrelated** to this phase — it was present before `@supabase/ssr` was added, and the fix path (`@tailwindcss/typography@0.5.4`) is a breaking downgrade. Not addressed here.

---

# 4. Notes / Next Steps Readiness for Phase 2

## 4.1 What Phase 2 Can Now Build On

- **Token vocabulary is live.** `bg-bg-base`, `bg-surface-card`, `bg-surface-glass`, `border-border-subtle`, `border-border-hover`, `text-text-primary`, `text-text-secondary`, `text-text-muted`, `text-accent-emerald`, `font-display`, `font-sans`, `font-mono` all generate from the spec's own token names. Phase 2's components need no new token work.
- **The theme contract is fixed.** Any control toggles the `dark` class on `<html>` and writes the string `"dark"` or `"light"` to `localStorage` under the key `theme`. FOUC safety is already handled, so §2.1's Theme Switcher only needs to add the View Transitions animation.
- **Data access has one reviewable seam.** `getPublishedProjects()`, `getPublishedArticles()`, and `getSiteConfig()` are the only blessed read paths, and they centralise the `is_published = true` assumption.
- **Types are ready for CRUD.** `ProjectInsert`/`ProjectUpdate` and the article/message equivalents exist, so Phase 4's admin forms have their shapes.

## 4.2 Constraints Phase 2 Must Respect

1. **Never import `supabase.server.ts` from client-reachable code.** The build enforces it, but the fix is architectural: wrap server reads in `createServerFn`. Route loaders run on the client as well as the server, so a raw loader cannot call these helpers directly.
2. **Read env inside handlers**, never at module scope — required on edge runtimes.
3. **The `availability` label is user data, not a constant.** Read it from `site_configs`; do not hardcode `"Available for Q4 Projects"`.
4. **The CV key is `resume`.** Any Phase 2 download button must read `resume`, not `cv`.

## 4.3 Recommended Next Actions, in Priority Order

1. **Reconcile the live schema with F5–F7 before applying anything.** The project is already provisioned, so diff the live schema against the migration SQL (columns, constraints, trigger and index names) and apply only real deltas. Blindly running F5 could add a duplicate `updated_at` trigger, and F6/F7 could add duplicate policies if the live project already defines equivalents under other names.
2. **Decide the `NOT NULL` question.** Several defaulted columns (`is_published`, `display_order`, `tags`, `reading_time_minutes`, `is_read`) have `DEFAULT` without `NOT NULL`, so the types carry `| null` for them. If you add `NOT NULL` to the live schema, update `src/types/database.ts` to match — otherwise every `is_published` check needs null handling.
3. **Address the single-admin gap flagged in F6/F7** before Phase 4: `to authenticated` permits *any* signed-up user, and the PRD never states whether public signup is open. Setting an email allowlist in the RLS policies is the robust fix.
4. **Add `src/env.d.ts`** augmenting `ImportMetaEnv` and `NodeJS.ProcessEnv` with the four Supabase variables. Today they are typed `any`, so a typo like `VITE_SUPABASE_URLL` silently yields `undefined` until `requireEnv()` throws at runtime.
5. **Self-host the fonts in Phase 5** (`docs/ROADMAP.md` §5.1). The Google Fonts `<link>` is the pragmatic Phase 1 choice but adds a third-party connection to the LCP path.
6. **Optional:** adopt the `#/*` → `./src/*` alias for new imports. It is configured in `package.json`/`tsconfig.json` but unused; this phase kept relative imports to match the existing code style.
