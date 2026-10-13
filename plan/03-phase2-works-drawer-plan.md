# Phase 2 — Sub-Task B Technical Implementation Plan

## Featured Works Showcase & Interactive Project Detail Drawer / Mobile Bottom Sheet

| | |
| --- | --- |
| **Status** | Approved — execution not started |
| **Scope** | ROADMAP §2.3 (Featured Works), §2.4 (Project Detail Drawer & Bottom Sheet), landing-page composition |
| **Depends on** | Sub-Task A complete — `src/routes/index.tsx` (`<LazyMotion features={domMin} strict>`, loader), `src/server-fns/site-config.ts` seam, `src/lib/motion.ts` (`SPRING_SURFACE`), `src/lib/cn.ts`, `#works` anchor already in `NAV_LINKS`, `section[id] { scroll-margin-top: 6rem }` already in `app.css` |
| **Target stack** | TanStack Start 1.168.60 · React 19.2 · Vite 8.3.3 · Nitro 3 · Tailwind 4.1.18 · TypeScript 6 strict · `motion` 14.0.0 |
| **Deliverable of this document** | An executable, step-ordered plan with per-step gates. **No production code is written until this plan is approved.** |

---

## 1. Objective, Scope & Definition of Done

### 1.1 Objective

Render the third public surface of `/`: a server-rendered, cinematic single-column Featured Works list, whose cards open a case-study overlay — a right-edge slide-over drawer on desktop and a rounded-top anchored bottom sheet on mobile — with in-drawer project cycling, full keyboard semantics, and zero added animation features to the existing `LazyMotion` bundle.

### 1.2 In Scope

1. `src/server-fns/projects.ts` — `getFeaturedProjects` server function over `getPublishedProjects()`.
2. `src/components/featured-works.tsx` — `<section id="works">` with editorial index numbering, category tags, Geist Mono tech badges, grayscale→color card hover, and the case-study trigger.
3. `src/components/project-drawer.tsx` — desktop slide-over + mobile bottom sheet, sticky header, challenge/solution/stack/gallery content, in-drawer previous/next cycling, focus trap, `Escape`, scroll lock/restore.
4. `src/routes/index.tsx` — loader extension and composition (receding page shell, `inert` background, drawer mount).
5. Supporting modules: `src/lib/works.ts` (constants + helpers), `src/lib/use-project-drawer.ts` (selection state), and the small CSS additions these require.

### 1.3 Out of Scope (explicitly, to prevent creep)

| Not in this sub-task | Owner |
| --- | --- |
| A `/projects/:slug` route or any URL/history deep-link for the drawer | not specified for Phase 2; see §3.2 A2 |
| Gallery **lightbox zoom** (UX spec §4A item 6) — this plan ships the preview grid only | follow-up; see §3.2 A4 |
| `Core Competencies` (§2.5), `Contact` (§2.6), article section (§3.1) | ROADMAP §2.5–§2.6, §3.1 |
| JSON-LD / OG / per-route `head()` for projects | ROADMAP §3.4 |
| Admin CRUD for `projects`, Storage uploads | ROADMAP §4.2 |
| New route files — `src/routeTree.gen.ts` must stay byte-identical | — |
| ESLint / Prettier / Vitest | not configured in this repo (AGENTS.md) |

### 1.4 Definition of Done (this sub-task)

- [ ] `npm run typecheck` exits 0.
- [ ] `npm run build` exits 0; client bundle contains no server-only needle (`SUPABASE_SERVICE_ROLE_KEY`, `createSupabaseServerClient`, `getPublishedProjects`); `src/routeTree.gen.ts` hash unchanged.
- [ ] Routes-chunk gzip delta vs. the Sub-Task A baseline (38,256 gz) is **< 8 KB**, and no `domAnimation` / `domMax` / gesture feature is added (§11).
- [ ] `curl -s localhost:3000/` contains `id="works"`, the editorial index `[ 01 / 02 ]`, both seeded project titles, and `aria-haspopup="dialog"` — the cards are server-rendered.
- [ ] The same SSR HTML contains **no** drawer body (`role="dialog"`, `The Challenge`) — proving the drawer is client-only and therefore mismatch-free.
- [ ] `curl … | grep -c "radial-gradient"` is still **0** (Hero Layer 1 stays client-only).
- [ ] `#works` is reachable: the Hero's "Explore Works" CTA now scrolls to the section.
- [ ] Keyboard pass: `Tab` reaches each card title → `Enter` opens the drawer → focus lands inside → `Tab`/`Shift+Tab` cycle within the panel → `Escape` closes → focus returns to the triggering card.
- [ ] Body scroll is frozen while open and restored (same `scrollY`) on close.
- [ ] `prefers-reduced-motion: reduce`: the drawer fades instead of sliding; the background recede transition is absent.
- [ ] Viewports 375 / 768 / 1024 / 1440 px: bottom sheet with `rounded-t-3xl` + drag handle below `md`; 55vw (min 640px) right slide-over at `md`+.
- [ ] `.output/` and all scratch artifacts removed; only the inventory in §4.4 exists.

---

## 2. Verified Baseline (facts read from this checkout)

### 2.1 Repository / tooling facts

- `src/` now holds `components/` (`navbar`, `hero`, `hero-spotlight`, `availability-pill`, `magnetic-button`, `resume-trigger`, `theme-toggle`), `lib/` (`cn`, `motion`, `site`, `supabase`, `supabase.server`), `server-fns/site-config.ts`, `routes/{__root,index}.tsx`, `styles/app.css`, `types/database.ts`, `assets/portrait-placeholder.svg`.
- `src/routes/index.tsx` is 44 lines: `loader: () => getLandingConfig()`, `staleTime: 60_000`, `<LazyMotion features={domMin} strict>` → `<Navbar>` + `<main><Hero/></main>`.
- Scripts: `dev`, `typecheck`, `build`, `preview`, `generate-routes`. No linter, no formatter, **no test runner**.
- `tsconfig.json`: `strict` + `noUnusedLocals` + `noUnusedParameters` + `verbatimModuleSyntax` → type-only imports must be `import type`; no dead binding survives `typecheck`.
- Existing code uses **relative imports** (`../lib/cn`); this plan follows that style.
- `src/routeTree.gen.ts` canonical sha1 is `d21a5e495a38c29be169e78d98b0eb49defc6d3e` (Sub-Task A §3.2).

### 2.2 Contracts this sub-task must honor

1. **`<LazyMotion features={domMin} strict>`** wraps the page. `strict` throws in development on any `motion.*` component; only `m.*` (or pure CSS) is legal inside.
2. **`domMin` = `{ renderer, animations, exit }`** — verified in `node_modules/framer-motion/dist/es/render/dom/features-min.mjs` and `.../motion/features/animations.mjs`. Therefore, inside this tree, `initial` / `animate` / `exit` / `transition` (including springs) and `AnimatePresence` **all work**; `whileHover` / `whileTap` / `whileFocus` / `whileInView` / `drag` / `layout` **do not** (those live in `domAnimation` / `domMax`).
3. **Z-index contract** (plan 02 §4.2): navbar `z-50`, hero layers `z-0/10/20/30/40` inside an `isolate` root, **`z-60+` reserved for the drawer/sheet**.
4. **`SPRING_SURFACE` = `{ type: 'spring', stiffness: 320, damping: 32, mass: 1 }`** already exists in `src/lib/motion.ts`, exported-but-unused, explicitly reserved for this drawer.
5. **Server-only seam**: `src/lib/supabase.server.ts` carries `import '@tanstack/react-start/server-only'`; it may only be imported from a `createServerFn` module (the pattern proven by `src/server-fns/site-config.ts`).
6. **Loader data is serialised into the SSR dehydration payload** → `Route.useLoaderData()` on the client returns exactly what the server used.
7. **Reduced motion** is expressed declaratively where possible: `motion-safe:` variants for CSS, `prefersReducedMotion()` inside effects/handlers in `src/lib/motion.ts`.
8. `src/lib/site.ts` already ships `NAV_LINKS` with `{ label: 'Works', href: '#works' }`, and `app.css` already sets `section[id] { scroll-margin-top: 6rem }` + `html { scroll-behavior: smooth }` → §2.3 needs to render `<section id="works">` and nothing else.

### 2.3 Data facts

- `public.projects` columns/typing: `src/types/database.ts` `Project` — `cover_image_url text not null`, `gallery_images text[] | null`, `tech_stack text[] not null`, `live_url`/`repo_url`/`display_order`/`is_published` nullable, `created_at`/`updated_at` `string`.
- `getPublishedProjects()` already filters `is_published = true` and orders `display_order asc` (RLS: `anon` SELECT where published).
- Storage bucket `portfolios` is public-read → `cover_image_url` / `gallery_images` are servable URLs.
- 2 published rows are seeded in the live project; `gallery_images` may be `{}` or `null` → the gallery must degrade.
- RLS/grants already permit the anon read; **no migration change is required by this sub-task.**

### 2.4 Motion API facts verified in `node_modules` (used below)

- `motion/react` exports `m`, `LazyMotion`, `AnimatePresence`, `domMin`, `useReducedMotion`, `useMotionValue`, `useMotionValueEvent`, `useSpring`, `animate` (checked against `framer-motion/dist/index.d.ts`).
- `MotionValue` emits `animationComplete` (`framer-motion/dist/index.d.ts:2433`) — available through `useMotionValueEvent(value, 'animationComplete', cb)`.
- `@types/react` declares `inert?: boolean | undefined` (`index.d.ts:2948`).

---

## 3. Decisions & Assumptions (recorded; veto any at approval)

### 3.1 Decided by the brief (not re-litigated)

| # | Decision | Consequence |
| --- | --- | --- |
| D1 | **`motion` is retained at `domMin`; the drawer adds no feature bundle.** | The §1.4 "motion budget" question from Sub-Task A is answered for this sub-task: `domMin` already contains `animations` + `exit`, so `initial`/`animate`/`exit`/`AnimatePresence` cost ≈0 extra gzip. `SPRING_SURFACE` is used as specified. |
| D2 | **Swipe-down is hand-rolled with pointer events, not motion's `drag`.** | `drag` lives in `domMax` (`features-max.mjs` → `drag.mjs` + `layout.mjs`); pulling it in would grow the bundle beyond the `domMin` contract. Pointer events give the same UX at zero feature cost. |
| D3 | **Card hover is pure CSS** (`group-hover:` / `group-focus-within:` + `transition-[filter,transform]`). | `whileHover` would require `domAnimation` (gesture features). CSS satisfies §3C ("transisi mulus") exactly and is declarative for reduced motion via `motion-safe:`. |

### 3.2 Decisions taken here (defaults, documented)

| # | Decision | Rationale |
| --- | --- | --- |
| A1 | **Background recede (`scale-[0.97] blur-[2px]`) applies to the page content only, excludes the fixed navbar, and is `md`+ only.** | A `transform`/`filter` on an ancestor makes `position: fixed` descendants position relative to that ancestor — the navbar would stop being viewport-fixed and vanish while the user is scrolled down. The floating pill therefore stays outside the transformed wrapper (and is still dimmed by the backdrop). On mobile the sheet + backdrop cover the screen, so the expensive filter is skipped entirely. |
| A2 | **Drawer state is in-page React state only** (no `?project=` / hash / history entry). | PRD §4A.1 defines the drawer as an in-page overlay; Phase 2 adds no routes, and URL state would add hydration/back-button surface. Flagged as a follow-up in §14. |
| A3 | **Drawer body content is client-only; the cards are the SSR/crawlable surface.** | The overlay has no route, so its narrative text is not in the initial HTML. SEO for projects is ROADMAP §3.4's remit (JSON-LD + per-entity routes); duplicating case-study prose into hidden SSR markup would bloat every response. `title`, `category`, `summary`, `tech_stack` **are** server-rendered on the cards. |
| A4 | **Gallery ships as a preview grid; the lightbox is deferred.** | The brief lists "Gallery preview". A nested modal adds a second focus trap and nesting rules for a feature with no seeded data yet. |
| A5 | **One visible section heading, copy `Featured Works`, centralised in `src/lib/works.ts`.** | UX spec §3C names the section "Featured Works"; the vocabulary is the spec's. One-line change if the user prefers other copy (alternative: `sr-only` heading only). |
| A6 | **No section renders when `projects` is empty / `ok:false`.** | Mirrors the availability-pill degradation (plan 02 §5.4): a data outage degrades the page, never 500s it. |
| A7 | **Feature states in the drawer header use the `ResumeTrigger` precedent**: disabled `<button disabled aria-disabled="true" title="…">` when `live_url`/`repo_url` is null. | Keeps the header layout stable and never renders a dead link. |

### 3.3 New constants (single home: `src/lib/works.ts`)

| Export | Value | Source |
| --- | --- | --- |
| `WORKS_SECTION_TITLE` | `'Featured Works'` | UX spec §3C vocabulary |
| `DRAWER_DESKTOP_QUERY` | `'(min-width: 768px)'` | §4A/§4B breakpoint |
| `SHEET_HEIGHT` | `'92svh'` | §4B "ketinggian 92% viewport" |
| `SHEET_DISMISS_DISTANCE_RATIO` | `0.25` (× panel height) | gesture threshold, tunable |
| `SHEET_DISMISS_VELOCITY` | `0.5` px/ms | flick-to-dismiss |
| `formatEditorialIndex(index, total)` | `'[ 01 / 02 ]'` (`padStart(2,'0')`) | §3C "Nomor indeks editorial" |
| `cycleIndex(current, delta, total)` | wrap-around index | §4A item 7 "Previous/Next" |

---

## 4. Architecture

### 4.1 Data flow & render tree

```
                       (server request for "/")
                                 │
        src/routes/index.tsx     ▼
        loader ──► Promise.all([ getLandingConfig(), getFeaturedProjects() ])
                        │                    │
                        │                    └─► createServerFn (GET)
                        │                          │ in-process on the server
                        │                          ▼
                        │            src/lib/supabase.server.ts
                        │              getSiteConfig('availability'), getSiteConfig('resume')
                        │              getPublishedProjects()          ─ anon SELECT, is_published=true
                        │
        loader data ── serialised into the SSR dehydration payload
                        │
   ┌────────────────────┴─────────────────────────────────────┐
   ▼                                                          ▼
<Navbar resumeUrl>                                  <FeaturedWorks projects onOpenProject>
<main>                                                  └─ <article> … cards (SSR)
  <Hero availability>                                   └─ title <button aria-haspopup="dialog">
  <FeaturedWorks …>                                   </main>
</main>                                                     ▲
                                                            │ index
                                            useProjectDrawer(total)  (client state, starts null)
                                                            │
                                              <ProjectDrawer projects activeIndex onClose onNext onPrevious>
                                                  └─ <AnimatePresence> backdrop + panel (client-only)
```

No component fetches. Every value used in the first client render comes from the dehydration payload; the only client-only subtree renders **nothing** until the user clicks.

### 4.2 Layering & z-index contract (extends plan 02 §4.2)

| Layer | Element | z-index | Notes |
| --- | --- | --- | --- |
| Navbar | `<Navbar>` | `z-50` | fixed; **outside** the recede wrapper (A1) |
| Page content | `<main>` inside a recede wrapper | auto | `md:scale-[0.97] md:blur-[2px]` while open |
| Backdrop | `m.div` | `z-60` | `bg-black/60 backdrop-blur-xl` (§2B) |
| Drawer panel / sheet | `m.aside` / `m.div` | `z-70` | `role="dialog"` `aria-modal="true"` |

The panel and backdrop are siblings inside `AnimatePresence`, both direct children of `<LazyMotion>` (which renders **no** DOM node) → their `position: fixed` resolves against the viewport, and neither the hero's `isolate` nor the recede wrapper can affect them.

### 4.3 Client state model

| Concern | Owner | Shape |
| --- | --- | --- |
| Which project is open | `useProjectDrawer(projects.length)` in `index.tsx` | `useState<number | null>(null)` → **`null` on the server and on the first client render** (mismatch-free by construction) |
| Open animation | `AnimatePresence` + `m.*` `initial`/`animate`/`exit` | per-breakpoint `x` (desktop) / `y` (mobile) |
| Mobile drag offset | `useMotionValue(0)` inside the panel child (remounts per open → always starts at 0) | written via `style={{ y }}`; zero React renders per pointermove |
| Breakpoint | `useMediaQuery(DRAWER_DESKTOP_QUERY)` — `false` first render, corrected in an effect | read from `matchMedia` in an effect only; the component is mounted at page load, so the value is correct long before any click |
| Reduced motion | motion's `useReducedMotion()` + `motion-safe:` CSS | `true` → opacity-only enter/exit, no recede transition |
| Body scroll | effect in `ProjectDrawer`, keyed on `isOpen` (not `activeIndex`) | saves & restores `overflow` (+ `paddingRight` = scrollbar width) |

### 4.4 File inventory

**New (F)**

| # | Path | Purpose |
| --- | --- | --- |
| F1 | `src/server-fns/projects.ts` | `getFeaturedProjects` + `FeaturedProject` type + normalisation |
| F2 | `src/lib/works.ts` | §3.3 constants + `formatEditorialIndex` / `cycleIndex` |
| F3 | `src/lib/use-project-drawer.ts` | `useProjectDrawer(total)` — selection state, `open/close/next/previous` |
| F4 | `src/components/featured-works.tsx` | `#works` section + editorial cards |
| F5 | `src/components/project-drawer.tsx` | drawer + sheet + focus trap + drag (contains an internal `DrawerPanel`) |

**Modified (M)**

| # | Path | Change |
| --- | --- | --- |
| M1 | `src/routes/index.tsx` | loader `Promise.all`, drawer state, recede wrapper + `inert`, `<FeaturedWorks>`, `<ProjectDrawer>` |
| M2 | `src/lib/motion.ts` | comment only: `SPRING_SURFACE` is no longer unused (now consumed by `project-drawer.tsx`) |
| M3 | `src/styles/app.css` | only if a step needs it (e.g. a reduced-motion guard for the recede transition); expected to be empty — the step gates on that |

**Verified-unchanged (re-check at the end)**

`src/routes/__root.tsx`, **`src/routeTree.gen.ts`**, `src/router.tsx`, `src/lib/{supabase.ts,supabase.server.ts,site.ts,cn.ts}`, `src/components/{navbar,hero,hero-spotlight,availability-pill,magnetic-button,resume-trigger,theme-toggle}.tsx`, `src/types/database.ts`, `tsconfig.json`, `vite.config.ts`, `tsr.config.json`, `vercel.json`, `package.json`, `package-lock.json`, `supabase/**`, `docs/**`, `AGENTS.md`.

---

## 5. Step-by-Step Implementation Plan (each step ends at a gate)

### Step 0 — Pre-flight baseline

1. `npm run typecheck` and `npm run build` on the untouched tree; record routes-chunk gzip (`*.js` in `.output/public/assets`, the chunk containing `src/routes/index.tsx`).
2. Record `sha1` of `src/routeTree.gen.ts`.
3. **Gate**: both commands exit 0 and the baseline numbers are written down (needed by §11).

### Step 1 — F2 `src/lib/works.ts`

1. Author the §3.3 exports; `formatEditorialIndex` returns `[ 01 / 02 ]`; `cycleIndex` normalises negative deltas.
2. **Gate**: `npm run typecheck` exit 0 (`noUnusedLocals` forces every export to be consumed by the end of the sub-task).

### Step 2 — F1 `src/server-fns/projects.ts` (the SSR seam)

1. Header comment citing PRD §5A/§5E and ROADMAP §2.3; mirror the `site-config.ts` structure.
2. Type stays tied to the DB:
   ```ts
   export type FeaturedProject = Pick<Project,
     'id' | 'title' | 'slug' | 'category' | 'summary'
     | 'problem_statement' | 'solution_statement'
     | 'cover_image_url' | 'tech_stack' | 'live_url' | 'repo_url'
   > & { gallery_images: string[] }
   export interface FeaturedProjectsResult { ok: boolean; projects: FeaturedProject[] }
   ```
3. `toFeaturedProject(row)`: copies the picked columns and normalises the one nullable array (`gallery_images: row.gallery_images ?? []`). Drops `display_order` / `is_published` / `created_at` / `updated_at` (server-only noise). Result is pure JSON primitives — safe for the dehydration payload, no `Date`, no `undefined`.
4. `getFeaturedProjects = createServerFn({ method: 'GET' }).handler(async (): Promise<FeaturedProjectsResult> => …)`:
   - `const rows = await getPublishedProjects()` (top-level `import` of `supabase.server`, the pattern Sub-Task A proved against import-protection);
   - `slice(0, MAX_FEATURED_PROJECTS /* 12 */)` as a layout/DoS guard, then `map(toFeaturedProject)`;
   - `catch` → `console.error('[projects] failed to read projects:', error)` + `{ ok: false, projects: [] }` (never 500 the landing page).
5. **Temporary probe** (removed in Step 10): point `src/routes/index.tsx`'s loader at `getFeaturedProjects()` only and render `<pre>{JSON.stringify(data)}</pre>`.
6. **Gate**: `npm run typecheck` exit 0; `npm run build` exit 0 (proves the seam's import shape again); `npm run dev` → `curl -s localhost:3000/` shows `ok:true` with **2** project objects including `cover_image_url`, `tech_stack`, and `gallery_images` as an array. Record the real `gallery_images` length for the gallery check.

### Step 3 — F3 `src/lib/use-project-drawer.ts`

1. `useState<number | null>(null)` + `useCallback`s: `open(i)` clamps to `[0, total-1]`, `close()`, `next()`/`previous()` via `cycleIndex(prev, ±1, total)` (no-ops when `prev === null` or `total < 2`).
2. Return `{ activeIndex, isOpen: activeIndex !== null, open, close, next, previous }`.
3. **Gate**: `npm run typecheck` exit 0. Nothing observes `window` during render → still SSR-safe.

### Step 4 — F4 `src/components/featured-works.tsx` (SSR, no drawer yet)

1. Props `{ projects: FeaturedProject[]; onOpenProject: (index: number) => void }`; `if (projects.length === 0) return null` (A6).
2. `<section id="works" className="relative border-t border-border-subtle px-6 py-24 sm:px-10 lg:px-16">`.
3. Section header: `<h2>` at the spec's Section Heading scale (`text-3xl sm:text-4xl font-bold tracking-tight`) = `WORKS_SECTION_TITLE`, plus a mono eyebrow `[ WORKS ]` (`font-mono text-xs tracking-widest text-text-muted`).
4. Card (`<article className="group relative …">`, one per project, single-column, `py-16`, separated by hairline borders):
   - **Header row**: `formatEditorialIndex(index, projects.length)` in `font-mono text-xs sm:text-sm tracking-widest text-text-muted` + category in `font-mono text-xs uppercase tracking-widest text-text-secondary`.
   - **Media window** `aspect-[16/10] overflow-hidden rounded-2xl border border-border-subtle bg-surface-card` with `<img width={1600} height={1000} alt="" loading="lazy" decoding="async">` — explicit dims keep CLS 0 and the `bg-surface-card` is the load placeholder.
   - **Hover/focus reveal** (D3): the `<img>` carries `grayscale transition-[filter,transform] duration-500 ease-out motion-safe:group-hover:scale-[1.02] group-hover:grayscale-0 group-focus-within:grayscale-0 motion-safe:group-focus-within:scale-[1.02]`.
   - **Content meta**: `<h3>` project title (`text-2xl sm:text-3xl font-bold tracking-tight`), `summary` (`text-text-secondary`), `tech_stack` as Geist Mono pills `[ Next.js ]` (`font-mono text-[11px] uppercase tracking-widest text-text-muted`), and a "View Case Study" affordance with `ArrowUpRight` rotating 45° on `group-hover`/`group-focus-within`.
5. **Trigger pattern (a11y-critical)**: the `<h3>` contains the real `<button type="button" aria-haspopup="dialog" onClick={() => onOpenProject(index)} className="… after:absolute after:inset-0 after:content-[''] …">`; the `::after` overlay makes the whole card clickable while the accessible name stays exactly the project title, the focus ring lands on the title, and no interactive element is nested inside another.
6. **Gate**: `npm run typecheck` exit 0; `npm run dev` → `curl` shows `id="works"`, `[ 01 / 02 ]`, both titles, `aria-haspopup="dialog"`, and the category/tech strings; `width="1600" height="1000"` present. Clicking is still a no-op (prop wired in Step 6).

### Step 5 — F5 `src/components/project-drawer.tsx` — desktop slide-over

1. Props: `{ projects; activeIndex; onClose; onNext; onPrevious }`; hooks (`useMediaQuery`, `useReducedMotion`, refs, effects) run **unconditionally**, then:
   ```tsx
   const project = activeIndex === null ? null : projects[activeIndex] ?? null
   return (
     <AnimatePresence>
       {project !== null && <m.div key="project-drawer-backdrop" … />}
       {project !== null && <DrawerPanel key="project-drawer-panel" project={project} … />}
     </AnimatePresence>
   )
   ```
   Two keyed siblings make `AnimatePresence` animate both in and out independently; `AnimatePresence` keeps the last children while exiting, so the exiting panel keeps its `project` props (no `lastProject` ref needed).
2. **Backdrop**: `fixed inset-0 z-60 bg-black/60 backdrop-blur-xl`, `initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}`, `onClick={onClose}`, `aria-hidden="true"`.
3. **Panel** (`DrawerPanel`, an internal component that mounts per open):
   - geometry: `fixed inset-y-0 right-0 z-70 flex w-[55vw] min-w-[640px] max-w-[100vw] flex-col border-l border-border-subtle bg-surface-card/95 backdrop-blur-xl`;
   - motion: `initial={isDesktop && !reduced ? { x: '100%' } : { opacity: 0 }}`, `animate={isDesktop && !reduced ? { x: 0 } : { opacity: 1 }}`, `exit={isDesktop && !reduced ? { x: '100%' } : { opacity: 0 }}`, `transition={SPRING_SURFACE}` (an `x`-only transition cost ≈0 because `domMin` already ships the animation engine);
   - a11y: `role="dialog"`, `aria-modal="true"`, `aria-labelledby={headingId}` (`useId()`), `tabIndex={-1}`, `ref={panelRef}`.
4. **Content**:
   - **Sticky header** (`sticky top-0 z-10 … border-b border-border-subtle bg-surface-card/95 px-5 py-3 backdrop-blur-md`): `<button type="button" aria-label="Close case study">` with `X` (`lucide-react`) + a visible mono `ESC` hint; `ml-auto` group with Live Demo / Source Code following A7 (real `<a target="_blank" rel="noopener noreferrer">` when non-null, else `disabled` + `aria-disabled` + `title`).
   - **Scroll body** (`flex-1 overflow-y-auto overscroll-contain px-5 pb-12 sm:px-8`): cover `<img>` at `aspect-[16/10]` + category tag; `<h2 id={headingId}>` title; `summary`; then three labelled sections — `<h3>The Challenge</h3>` → `problem_statement`, `<h3>The Architecture</h3>` → `solution_statement`, `<h3>Tech Stack</h3>` → the chips; then `<h3>Gallery</h3>` (A4) rendering `gallery_images` as a 2-col grid of `aspect-[16/10]` lazy images, and **nothing** when the array is empty.
   - **Footer nav** (`border-t … flex items-center justify-between`): `← Previous Project` / mono index / `Next Project →`; both `disabled` when `projects.length < 2`. Handlers call `onPrevious`/`onNext` and reset the body's `scrollTop` to 0 (instant, per §4A item 7).
   - **Mobile handle** (added in Step 7): `aria-hidden="true"` drag bar above the header.
5. **Gate**: `npm run typecheck` exit 0; `npm run dev` → clicking a card opens the panel; `curl` still shows **no** `role="dialog"` and no `The Challenge` in the SSR HTML (the client-only proof); `radial-gradient` count still 0.

### Step 6 — Wire the state in M1 `src/routes/index.tsx`

1. Final loader:
   ```ts
   loader: async () => {
     const [config, featured] = await Promise.all([getLandingConfig(), getFeaturedProjects()])
     return { ...config, projects: featured.projects, projectsOk: featured.ok }
   }
   ```
2. `Home`: `const { availability, resume, projects } = Route.useLoaderData()`; `const drawer = useProjectDrawer(projects.length)`.
3. Composition (A1):
   ```tsx
   <LazyMotion features={domMin} strict>
     <div inert={drawer.isOpen || undefined}>
       <Navbar resumeUrl={resume?.url ?? null} />
       <div className={cn(
         'motion-safe:transition-[transform,filter] motion-safe:duration-300 motion-safe:ease-out',
         drawer.isOpen && 'md:scale-[0.97] md:blur-[2px]',
       )}>
         <main>
           <Hero availability={availability} />
           <FeaturedWorks projects={projects} onOpenProject={drawer.open} />
         </main>
       </div>
     </div>
     <ProjectDrawer projects={projects} activeIndex={drawer.activeIndex}
       onClose={drawer.close} onNext={drawer.next} onPrevious={drawer.previous} />
   </LazyMotion>
   ```
4. `inert` removes the whole background (navbar included) from the tab order **and** the accessibility tree while open — belt-and-braces on top of the manual trap (§10). `|| undefined` avoids React emitting `inert="false"`.
5. **Gate**: `npm run typecheck` exit 0; `curl` shows `id="works"` + the cards and still no drawer markup; the inline theme script, `ENGINEER`, `backdrop-blur-md`, `aria-disabled="true"` counts from Sub-Task A §3.3.1 are unchanged.

### Step 7 — Mobile bottom sheet + swipe-down (inside F5)

1. In `DrawerPanel`, when `!isDesktop`: geometry swaps to `fixed inset-x-0 bottom-0 z-70 h-[92svh] rounded-t-3xl border-t border-border-subtle bg-surface-card`, with `initial/animate/exit` on **`y`** (`'100%'` → `0` → `'100%'`) instead of `x`.
2. **Drag surface**: the `aria-hidden` handle bar at the top of the sheet (`h-11`, centred `h-1 w-10 rounded-full bg-text-muted/40`, `touch-action: none cursor-grab`). Pointer handlers:
   - `onPointerDown`: `dragging = true`, record `startY`, `lastSample = { y, t }`, `setPointerCapture(pointerId)`;
   - `onPointerMove`: `dragY.set(Math.max(0, e.clientY - startY))` (direct 1:1, no spring lag), update the sample;
   - `onPointerUp`/`onPointerCancel`: `dragging = false`; `distance = Math.max(0, e.clientY - startY)`, `velocity = (y - sample.y) / max(1, t - sample.t)`;
     - dismiss when `distance > panelHeight * SHEET_DISMISS_DISTANCE_RATIO` **or** `velocity > SHEET_DISMISS_VELOCITY` → `onClose()` (the `exit` spring starts from the panel's current position and slides the rest of the way off-screen — no jump); `dragY` stays as-is because the panel unmounts;
     - otherwise spring back with `animate(dragY, 0, SPRING_SURFACE)` (controls kept in a ref and `.stop()`ed before each new call).
3. `dragY` lives in `DrawerPanel`, which mounts per open → it always starts at `0`; the sheet body uses `overscroll-contain` so pull-to-refresh cannot fire from inside.
4. Interpretation recorded: §4B's "internal scroll locked until the sheet is pulled fully up" is satisfied structurally — the sheet opens at 92% height (already "expanded"), so the body scrolls immediately and the handle owns the dismiss gesture.
5. **Gate**: `npm run typecheck` exit 0; at 375 px the sheet renders with `rounded-t-3xl`, drags down, and dismisses; at 1440 px the right slide-over is unchanged.

### Step 8 — M3 `src/styles/app.css`

1. Expected outcome: **no change**. Only add a rule if a gate exposes a need (most likely candidate: a `.dark`-safe backdrop tint, or `scrollbar-gutter` on the drawer body). Anything added must live outside `@theme inline` and must not touch existing tokens.
2. **Gate**: `npm run build`, then confirm the built `app-*.css` still contains the Sub-Task A markers (`--surface-glass`, `hero-portrait-mask`, `theme-reveal`, `status-pulse`, `prefers-reduced-motion`) and any new selector.

### Step 9 — M2 `src/lib/motion.ts`

1. Update only the `SPRING_SURFACE` doc comment: no longer "currently UNUSED"; now consumed by the drawer/sheet in `src/components/project-drawer.tsx`.
2. **Gate**: `npm run typecheck` exit 0; no constant values changed.

### Step 10 — Remove the temporary probe

1. Delete the `JSON.stringify` probe and the temporary loader from Step 2.
2. **Gate**: `grep -n "JSON.stringify" src/routes/index.tsx` → none; the only remaining `console.error` is the deliberate one in the server functions.

### Step 11 — Full typecheck

1. `npm run typecheck`.
2. **Gate**: exit 0 on the frozen tree. Watch for: `inert` typing (verify `@types/react` accepts it — confirmed present at `index.d.ts:2948`), `MotionValue`-in-`style` props requiring `m.*` (Sub-Task A hit this in `hero-spotlight.tsx` — the drawer's `style={{ y: dragY }}` must be on an `m.div`), and `verbatimModuleSyntax` on the new `import type` lines.

### Step 12 — Production build, bundle delta & hygiene

1. `npm run build`; then measure the routes chunk gzip and compare with Step 0.
2. Leak scan of `.output/public`: `SUPABASE_SERVICE_ROLE_KEY`, `createSupabaseServerClient`, `createSupabaseAdminClient`, `getPublishedProjects`, `persistSession` → **0 files**. The server function must appear in `.output/server/_ssr/projects-*.mjs`.
3. `sha1` of `src/routeTree.gen.ts` must equal Step 0's.
4. Source-level feature audit: no `domAnimation` / `domMax` / `whileHover` / `whileTap` / `whileInView` / `drag=` / `motion.` (non-`m.`) inside the tree.
5. **Gate**: exit 0, 0 leaks, routeTree byte-identical, routes-chunk delta **< 8 KB gz** (see §11 for the fallback if it is larger).

### Step 13 — SSR / runtime verification

`npm run dev` (port 3000), then `curl -s localhost:3000/`:

| # | Grep | Expected |
| --- | --- | --- |
| 1 | `<section id="works"` | 1 |
| 2 | `[ 01 / 02 ]` | ≥1 |
| 3 | both seeded project titles | 2 |
| 4 | `aria-haspopup="dialog"` | 2 |
| 5 | `aspect-[16/10]` markers / `width="1600"` | ≥2 |
| 6 | `role="dialog"` / `The Challenge` | **0** (drawer is client-only) |
| 7 | `radial-gradient` | **0** (unchanged from Sub-Task A) |
| 8 | `Available for Projects`, `ENGINEER`, `backdrop-blur-md`, `aria-disabled="true"` | unchanged counts |
| 9 | HTTP status / dev log | 200, no errors |

Also re-run Sub-Task A's degradation drill in a second dev server with `VITE_SUPABASE_URL=` / `VITE_SUPABASE_ANON_KEY=` blanked: the page must still render, the hero/navbar intact, and `#works` absent (not an empty shell) — proving A6.

### Step 14 — Manual browser, keyboard & responsive pass

This environment could not run a headless browser for Sub-Task A (§3.4/§3.5), and that has not changed — **this step is executed by the user**; structural evidence is listed in §10. Checklist:

1. Console at Verbose, hard reload: zero hydration warnings in dark and light theme.
2. Keyboard: `Tab` order hero CTAs → card titles → (open) inside the drawer only → `Escape` closes → focus back on the card title.
3. Reduced motion (`prefers-reduced-motion: reduce`): drawer fades, no slide; no recede animation.
4. 375 / 768 / 1024 / 1440 px: sheet vs. drawer geometry; the 768–1024 px band (where `min-w-[640px]` nearly fills the viewport) is the one to eyeball.
5. Both themes: drawer surface/backdrop contrast ≥ 4.5:1 (UX spec §8.3).
6. Cover images actually load; the `bg-surface-card` placeholder is the failure state if any URL 404s.
7. `prefers-reduced-motion` + coarse pointer: no drag while the body scrolls normally.

### Step 15 — Cleanup

1. Delete `.output/`, any `.scratch/`, temp probes, `/tmp` captures.
2. Confirm the final tree equals §4.4 exactly (mtime sweep), `src/routeTree.gen.ts` untouched, and no new dependency in `package.json`.
3. **Gate**: the §1.4 checklist can be ticked (except Step 14, which is handed to the user).

---

## 6. Data Fetching Seam — Contract (F1)

| Aspect | Specification |
| --- | --- |
| Definition | `export const getFeaturedProjects = createServerFn({ method: 'GET' }).handler(async () => …)` |
| Imports | top-level `import { getPublishedProjects } from '../lib/supabase.server'` + `import type { Project } from '../types/database'` |
| Read | one query, RLS-filtered, already ordered `display_order asc`; `slice(0, MAX_FEATURED_PROJECTS)` for layout safety |
| Return | `{ ok: boolean; projects: FeaturedProject[] }` — pure JSON (`string`/`string[]`/`null`), no `Date`, no class instance, no `undefined` |
| Normalisation | `gallery_images: row.gallery_images ?? []`; every other field is copied verbatim from a non-null DDL column |
| Serialisation safety | `Project` is JSON-native; no mapper crossing the wire, so the dehydration payload is lossless and equality-stable across server/client |
| Error policy | `try/catch` → `console.error` server-side + `{ ok: false, projects: [] }`; the section then renders nothing (A6) |
| Degradation | missing env var / Supabase outage / RLS change / zero published rows → landing page still 200s |
| Why not `head()`/route loader | no new route; SEO machinery is ROADMAP §3.4 |

---

## 7. Featured Works — Component Contract (F4)

| Aspect | Specification |
| --- | --- |
| Props | `{ projects: FeaturedProject[]; onOpenProject: (index: number) => void }` |
| Empty state | `projects.length === 0` → `null` (A6) |
| Root | `<section id="works">`, `border-t border-border-subtle`, `px-6 py-24 sm:px-10 lg:px-16` (`scroll-margin-top` already global) |
| Heading | visible `<h2>` (`text-3xl sm:text-4xl font-bold tracking-tight`) + mono eyebrow; copy from `WORKS_SECTION_TITLE` (A5) |
| Card | `<article className="group relative …">` + hairline `border-t` between items; single column at every breakpoint (§3C cinematic list) |
| Index | `formatEditorialIndex(index, projects.length)` → `[ 01 / 02 ]` |
| Category | `font-mono text-xs uppercase tracking-widest text-text-secondary` (§3C `FINTECH / HIGH-SCALE ARCHITECTURE` style) |
| Media | `aspect-[16/10] overflow-hidden rounded-2xl border border-border-subtle bg-surface-card`, `<img width={1600} height={1000} alt="" loading="lazy" decoding="async">` |
| Hover | `grayscale` → `group-hover:grayscale-0` (+ `group-focus-within:grayscale-0`) with `transition-[filter,transform] duration-500 ease-out`; `motion-safe:group-hover:scale-[1.02]` |
| Tech badges | `[ Next.js ]` Geist Mono pills from `tech_stack` |
| Trigger | `<h3>` → `<button type="button" aria-haspopup="dialog">` with `after:absolute after:inset-0` overlay = whole-card hit area, accessible name = title (§5 Step 4.5) |
| Reduced motion | transform suppressed via `motion-safe:`; the grayscale→color change is a `filter` transition and stays (it is not motion) |

---

## 8. Project Drawer / Bottom Sheet — Component Contract (F5)

| Aspect | Specification |
| --- | --- |
| Props | `{ projects: FeaturedProject[]; activeIndex: number | null; onClose(): void; onNext(): void; onPrevious(): void }` |
| Presence | `AnimatePresence` with two keyed children (backdrop `z-60`, panel `z-70`); nothing rendered server-side or before the first click |
| Desktop (≥768px) | `fixed inset-y-0 right-0 w-[55vw] min-w-[640px] max-w-[100vw]`, `border-l border-border-subtle bg-surface-card/95 backdrop-blur-xl`, slide `x: '100%' → 0 → '100%'` with `SPRING_SURFACE` |
| Mobile (<768px) | `fixed inset-x-0 bottom-0 h-[92svh] rounded-t-3xl border-t`, slide `y`; `aria-hidden` drag handle (44 px) with pointer-event swipe-down |
| Backdrop | `fixed inset-0 bg-black/60 backdrop-blur-xl`, opacity spring, click-to-close, `aria-hidden` |
| Header | sticky, opaque-ish (`bg-surface-card/95 backdrop-blur-md`), close button + `ESC` hint, Live Demo / Source Code (A7), always reachable while the body scrolls |
| Body | `flex-1 overflow-y-auto overscroll-contain`; cover + category tag, `<h2>` title, summary, **The Challenge**, **The Architecture**, **Tech Stack**, **Gallery** (grid or omitted) |
| Footer | `← Previous Project` / index / `Next Project →`; `disabled` when `< 2` projects; navigation resets body `scrollTop` and does **not** close the drawer or re-animate |
| Navigation semantics | `onPrevious`/`onNext` mutate `activeIndex` only → the panel key is unchanged, so content swaps instantly (§4A item 7) |
| Focus on open | panel `tabIndex={-1}` receives focus |
| Text safety | all drawer text is rendered as text nodes (no `dangerouslySetInnerHTML`); markdown sanitisation is Phase 3 (articles) |

---

## 9. Responsive & Gesture Specification

| Concern | Spec |
| --- | --- |
| Breakpoint source | `useMediaQuery(DRAWER_DESKTOP_QUERY)` — `false` on the first render, corrected in an effect; read only after mount, so SSR/first render agree |
| Enter/exit direction | desktop `x`, mobile `y`; `reduced` → opacity only (no translate) |
| Drag start | only the handle bar; `touch-action: none`, `setPointerCapture` |
| Drag follow | direct 1:1 via `useMotionValue` written to `style={{ y }}` on an inner `m.div` (zero React renders per `pointermove`) |
| Dismiss rule | released distance > `25%` of panel height **or** downward velocity > `0.5 px/ms` |
| Spring-back | `animate(dragY, 0, SPRING_SURFACE)` via the imperative `animate` from `motion/react`; previous controls `.stop()`ed first |
| Overscroll | body `overscroll-contain`; page scroll locked while open |
| Resize while open | `isDesktop` flipping re-targets the animation; accepted edge case (documented) |
| `svh` | `h-[92svh]`; if a target browser lacks `svh`, a `vh` fallback is a one-class change (Phase 5 cross-browser gate) |

---

## 10. Accessibility Specification

| Requirement | Implementation | Evidence available without a browser |
| --- | --- | --- |
| Dialog semantics | `role="dialog"` + `aria-modal="true"` + `aria-labelledby` on the panel | not in SSR HTML (client-only) — verified by markup review |
| Focus trap | `Tab`/`Shift+Tab` wrapped inside the panel against a `FOCUSABLE_SELECTOR` list (`a[href], button:not([disabled]), …[tabindex]:not([tabindex="-1"])`) | handler code review |
| Background isolation | `inert` on the wrapper containing Navbar + main while open (removes both tab order and AT reach), plus the trap as defence in depth | `inert` typed in `@types/react` 19; markup check |
| `Escape` | window `keydown` listener registered only while open; also closes with the header button | handler code review |
| Focus restore | the element focused at open time (`document.activeElement`) is re-focused in the effect cleanup | handler code review |
| Scroll restoration | body `overflow` (+ `paddingRight`) saved and restored; `scrollY` is never altered by `overflow: hidden`, so the page returns to the same offset | effect code review |
| Reduced motion | `useReducedMotion()` → opacity-only enter/exit; `motion-safe:` for the recede transition; the grayscale reveal is not motion and stays | UX spec §8.2 mapping |
| Keyboard reachability | every control is a real `<button>`/`<a>`; the trigger is the card title; no positive `tabindex` | SSR HTML (Step 13 #4) |
| Visible focus | `focus-visible:ring-1 focus-visible:ring-text-primary/40 focus-visible:outline-none` on every control, both themes | shared class audit |
| Contrast | drawer text uses `text-text-primary` / `text-text-secondary` on `bg-surface-card`; glass surfaces use the Phase 1 tokens, not mid-greys | token audit; Step 14 #5 |

---

## 11. Bundle & Performance Considerations

1. **No new animation features.** `domMin` already provides `renderer + animation + exit`; the drawer's `initial/animate/exit` + `AnimatePresence` therefore add ~0 gzip of engine. Expected routes-chunk delta: the new component code plus `AnimatePresence`'s presence bookkeeping — **target < 8 KB gz** on a 38,256 gz baseline.
2. **Forbidden imports inside the tree**: `domAnimation`, `domMax`, `whileHover`, `whileTap`, `whileFocus`, `whileInView`, `drag=`, and `motion.*` (throws under `strict`). Each would either add a feature bundle or violate the `domMin` contract.
3. **Images**: `loading="lazy"` + `decoding="async"` for cards and gallery (below the fold); explicit `width`/`height` + `aspect-[16/10]` ⇒ CLS 0; only the Hero keeps `fetchPriority="high"` (PRD §6, ROADMAP §Risk).
4. **Recede cost control**: the `blur(2px)`/`scale` is `md`+ only and present only while the modal is open (A1); `motion-safe:` keeps the transition off the reduced-motion path.
5. **Interaction cost**: pointermove drives MotionValues only (no React state) — the patterns already proven in `hero-spotlight.tsx` / `magnetic-button.tsx`.
6. **Payload**: `FeaturedProject` drops the four server-only columns; two projects ≈ a few KB of JSON in the dehydration payload.
7. **Fallback if the delta exceeds 8 KB**: replace the drawer's `initial/animate/exit` props with a `data-state="open|closed"` attribute + CSS transitions (translate + opacity) driven by a mount/`useEffect` toggle, keeping `AnimatePresence` only for unmount timing — i.e. the same CSS-first posture Sub-Task A adopted for the navbar (`D-A`).

---

## 12. Verification Gates (command → expectation)

| # | Command | Expectation |
| --- | --- | --- |
| G1 | `npm run typecheck` | exit 0 on the frozen tree (Steps 1–11) |
| G2 | `npm run build` | exit 0; 0 import-protection violations; `.output/server/_ssr/projects-*.mjs` exists |
| G3 | gzip size of the routes chunk | delta < 8 KB vs. Step 0 baseline (38,256 gz) |
| G4 | `sha1 src/routeTree.gen.ts` | `d21a5e495a38c29be169e78d98b0eb49defc6d3e` |
| G5 | `curl -s localhost:3000/` greps | §5 Step 13 table — 9 checks |
| G6 | degradation drill (blank Supabase env, port 3100) | 200; `#works` absent; hero/navbar intact |
| G7 | `preview` of the built output | live projects in the SSR HTML of the production server bundle |
| G8 | manual browser/keyboard/responsive pass | §5 Step 14 — **user-executed** (no browser in this environment) |
| G9 | `.output/` + scratch removed | final tree = §4.4 inventory |

---

## 13. Risks & Fallbacks

| # | Risk | Fallback |
| --- | --- | --- |
| R1 | Server-fn import-protection rejects the `supabase.server` import | Reuse the proven `site-config.ts` shape; if it regresses, `await import('../lib/supabase.server')` inside the handler body (plan 02 §12 R1) |
| R2 | `inert` prop rejected by React/TS at runtime | Drop `inert`, keep `aria-hidden` on the wrapper + the manual focus trap |
| R3 | The recede wrapper breaks the fixed navbar | Already designed out by A1 (navbar outside the transformed wrapper); worst case the recede applies to `<main>` only |
| R4 | iOS Safari ignores `overflow: hidden` body lock | Fall back to the `position: fixed` + saved-`scrollY` technique; verify in the Phase 5 cross-browser gate |
| R5 | Breakpoint read lands after a very fast first click | `useMediaQuery` corrects in a mount effect that runs before any human click; the effect also re-checks on `change` |
| R6 | A `cover_image_url` / gallery URL 404s | `alt=""` + `bg-surface-card` placeholder means the card degrades to a clean surface; optionally an `onError` that hides the `<img>` |
| R7 | `grayscale` ↔ `grayscale-0` transition repaints the whole card on low-end mobile | Reduce `duration-500` → `duration-300` if the Step 14 visual pass shows jank; the property set stays `filter,transform` only |
| R8 | `svh` unsupported | Swap `h-[92svh]` for `h-[92vh]` (one class) |
| R9 | Resize while the drawer is open flips `isDesktop` mid-flight | Accepted: the panel re-targets on the next render; the `initial` prop is only read at mount |
| R10 | Stale `activeIndex` after data changes | `open()` clamps and the drawer derives `projects[activeIndex] ?? null` → renders nothing rather than crashing |

---

## 14. Handoff Notes & Follow-ups

1. **Sub-Task A items still open that this sub-task validates**: `SPRING_SURFACE` finally gets a consumer (M2); the `z-60+` reservation is honoured; the manual browser pass (Sub-Task A §3.4/§3.5) is still owed and is expanded by §5 Step 14 here.
2. **Drawer deep-linking** (A2): if projects later need shareable case-study URLs, the natural Phase 3 step is a `/projects/:slug` route + `head()`/JSON-LD, with the drawer becoming the preview state of that route — which also resolves A3's SEO gap.
3. **Gallery lightbox** (A4): add as a nested modal only after a reusable focus-trap hook is extracted (Phase 4 admin modals need the same primitive).
4. **Recommended extraction once a second consumer exists**: `useMediaQuery` (Phase 2.5/2.6 may need it) and the focus trap (Phase 4 modals) out of `project-drawer.tsx` into `src/lib/`.
5. **Do not** run `npm run generate-routes` — the Vite build is the source of truth for `routeTree.gen.ts` (Sub-Task A §4.4 item 4), and this sub-task adds no route files.
