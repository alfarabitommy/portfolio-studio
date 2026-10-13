# Phase 2 (Sub-Task B) Execution Summary — Featured Works Showcase & Interactive Project Detail Drawer / Mobile Bottom Sheet

| | |
| --- | --- |
| **Status** | Complete — all automated gates pass; the manual browser pass (Step 14) is handed to the user (no browser in this environment) |
| **Executed** | 2026-10-09 |
| **Plan** | `plan/03-phase2-works-drawer-plan.md` (approved), Steps 0–15 |
| **Stack verified against** | TanStack Start 1.168.60, React 19.2, Vite 8.3.3, Nitro 3, Tailwind CSS 4.1.18, TypeScript 6 (strict), `@supabase/ssr` 0.12.7, `motion` 14.0.0 |
| **Inventory delivered** | F1–F5 new, M1–M2 modified, M3 not required; `src/routeTree.gen.ts` byte-identical |
| **User-directed change vs. plan** | none |

---

# 1. Execution Overview & Step-by-Step Gate Status

## 1.1 Outcome

The landing page now server-renders `<section id="works">` — an editorial single-column Featured Works list whose cards open a case-study overlay: a right-edge slide-over on desktop and a rounded top-anchored bottom sheet with swipe-down dismissal on mobile. Project data crosses the SSR seam through a dedicated `getFeaturedProjects` `createServerFn`; the drawer body is client-only, so the overlay adds nothing to the initial HTML and cannot produce a hydration mismatch.

Two measurement-driven departures from the approved plan were required. Both stay inside the plan's own intent: §11 (no new animation features; keep the drawer's bundle cost near zero) and §10 (spec-exact springs). They are recorded in §1.3.

## 1.2 Step-by-step status

| Step | Action | Status | Gate evidence |
| --- | --- | --- | --- |
| 0 | Pre-flight baseline | Done | `tsc --noEmit` exit 0; `vite build` exit 0; routes chunk **38,257 gz**, index chunk 109,901 gz; `routeTree.gen.ts` sha1 `d21a5e49…` |
| 1 | F2 `src/lib/works.ts` | Done | `tsc --noEmit` exit 0 |
| 2 | F1 `src/server-fns/projects.ts` + temporary loader probe | Done | `tsc --noEmit` exit 0; **`vite build` exit 0** → the top-level `supabase.server` import inside a `createServerFn` module is accepted (**R1 did not materialise**); `curl` returned `ok:true` with 2 projects |
| 3 | F3 `src/lib/use-project-drawer.ts` | Done | `tsc --noEmit` exit 0 |
| 4 | F4 `src/components/featured-works.tsx` (SSR, no drawer) | Done | See Gate G5 rows 1–5: `#works`, `[ 01 / 02 ]`, both titles, `aria-haspopup="dialog"`, image dims |
| 5 | F5 `src/components/project-drawer.tsx` — desktop slide-over | Done | `tsc --noEmit` exit 0; SSR HTML contains **0** `role="dialog"` / `The Challenge` |
| 6 | M1 `src/routes/index.tsx` wiring | Done | `tsc --noEmit` exit 0; Sub-Task A markers unchanged (G5 row 8) |
| 7 | Mobile bottom sheet + swipe-down | Done | `tsc --noEmit` exit 0; `h-[92svh]`, `rounded-t-3xl`, `touch-action:none` all emitted in CSS (G3 CSS table) |
| 8 | M3 `src/styles/app.css` | Done — **no change required** | `app.css` still 211 lines (Sub-Task A's 211); every new utility is generated from existing tokens + Tailwind scales |
| 9 | M2 `src/lib/motion.ts` comment | Done | `SPRING_SURFACE` doc now names `project-drawer.tsx`; constant values untouched |
| 10 | Remove temporary probe | Done | No `JSON.stringify` in `src/`; the only `console.error` calls are the deliberate ones in the two server functions |
| 11 | Full typecheck | Done | `tsc --noEmit` exit 0 on the frozen tree |
| 12 | Build, bundle delta, leaks, hygiene | Done | See §3.2 — exit 0, 0 leaks, +5,107 gz routes delta, `projects-*.mjs` present, routeTree unchanged |
| 13 | SSR runtime verification | Done | See §3.4 — 9/9 checks with 0 regressions on Sub-Task A markers |
| 14 | Manual browser / keyboard / responsive pass | **Handed to the user** | No working browser automation in this sandbox (same limitation as Sub-Task A §3.4/§3.5); structural evidence in §1.4 |
| 15 | Cleanup | Done | `.output` and `.scratch` removed; all `/tmp` captures removed; final tree = §2.3 |

## 1.3 Deviations from the approved plan (each with its measured evidence)

| # | Plan said | Shipped | Why |
| --- | --- | --- | --- |
| **D-A** | §9 "Spring-back: `animate(dragY, 0, SPRING_SURFACE)` via the imperative `animate` from `motion/react`"; §9 "Drag follow: direct 1:1 via `useMotionValue`" | Drag offset is `useSpring(dragTarget, SPRING_SURFACE)` (target written by the finger); enter/exit unchanged | **Measured**: importing the imperative `animate()` costs **+3,978 gz** on the routes chunk — 44 % of the drawer's total cost — because it pulls motion v12's animation-subject machinery. `useSpring` is already in the page bundle via `magnetic-button.tsx` (≈0 extra). The routes delta fell from **+9,065 gz to +5,107 gz**, clearing the §11 gate. Applied *instead of* the §11.7 CSS fallback, which would have saved far less while sacrificing the §6A `SPRING_SURFACE` spring (the fallback replaces `initial`/`animate`/`exit`, worth only ~1.6 gz-k above the `animate()` removal). Trade-off accepted and documented: the drag follow is now spring-weighted (the §6A drawer physics, i.e. UX spec §1.3 "materials with mass") rather than a literal 1:1 pointer lock. |
| **D-B** | §4.3 / §9 imply the breakpoint is resolved where the component is mounted at page load | `useMediaQuery` is called in `ProjectDrawer` (mounted with the page) and passed to the panel as a prop | Self-inflicted defect caught during review: the panel mounts **per open**, so a breakpoint resolved inside it would be `false` on its first frame — a desktop click would flash a bottom sheet and then re-target the animation. Hoisting restores the plan's stated guarantee. |
| **D-C** | §3.3 `SHEET_HEIGHT = '92svh'` | `SHEET_HEIGHT_CLASS = 'h-[92svh]'` | The constant is consumed as a Tailwind class; storing the bare `92svh` would force an inline style. Tailwind v4's automatic source detection scans `src/lib/works.ts`, so the utility is generated (verified in the built CSS). |
| **D-D** | §5 Step 5.4 "Live Demo / Source Code" links (no icon named) | `ExternalLink` + `Code` from `lucide-react` | `lucide-react@1.53` no longer ships brand icons — `Github` does not exist (TS2305 at Step 5). Generic icons keep the dependency footprint unchanged. |
| **D-E** | §5 Step 6.1 `return { ...config, projects: featured.projects, projectsOk: featured.ok }` | `return { ...config, projects: featured.projects }` | `projects: []` already encodes the failure and `FeaturedWorks` treats it as "render nothing" (§3.2 A6), so `projectsOk` would have been a dead field in the dehydration payload on every request. |
| **D-F** | §8 "Header: sticky" and §8 "Footer nav" as separate rows | The mobile drag handle and the footer nav are flex siblings **outside** the scroll container; the header is a true `sticky top-0` element **inside** it | The only structure where both work: a sticky element must live inside the scroll container to stick, while the drag handle and the footer must not scroll away. |
| **D-G** | §7 card rows separated by hairline borders | `border-t` with `first:border-t-0` on the list items | Without the `first:` reset the first card would double up against the section's own top border. |
| **D-H** | §9 "released distance > 25 % of panel height **or** downward velocity > 0.5 px/ms" | Velocity is sampled from the last `pointermove` pair into a ref, not computed from the `pointerup` delta | A `pointerup` delta is ~0 ms after the final move, so it always reads as a slow drag and the flick-to-dismiss branch would be dead code. |

## 1.4 What is structurally verified vs. what is not

**Verified by execution** (§3): typecheck, production build, bundle sizes, leak scan, server-bundle composition, `routeTree.gen.ts` identity, dev-SSR HTML content, blank-env degradation, production-preview SSR HTML, generated CSS assertions, source-level feature audit.

**Not executable here** (unchanged from Sub-Task A §3.4/§3.5): no headless browser is available in this sandbox and this repo has no test runner, so the following are reasoned by construction and must be confirmed manually in Step 14:

1. Zero hydration warnings on `/` in both themes (the drawer renders `null` on the server and on the first client render by construction).
2. Real pointer behaviour of the swipe-down gesture and the spring feel of `SPRING_SURFACE`.
3. Focus trap / `inert` / `Escape` / focus restoration under real keyboard input.
4. Visual rendering at 375/768/1024/1440 px and contrast ≥ 4.5:1 in both themes.
5. iOS Safari specifics (body-scroll lock; Safari does not focus buttons on click, so focus restoration after close falls back to `<body>`).

---

# 2. Created & Modified Files Breakdown

## 2.1 New files (F1–F5)

| # | Path | Lines | What was implemented |
| --- | --- | --- | --- |
| F1 | `src/server-fns/projects.ts` | 99 | `getFeaturedProjects` = `createServerFn({ method: 'GET' })`. Reads `getPublishedProjects()` (RLS-filtered `is_published = true`, ordered `display_order asc`), slices to `MAX_FEATURED_PROJECTS` (12) as a layout guard, maps through `toFeaturedProject`, and returns the serialisable `{ ok, projects }`. `FeaturedProject` is `Pick<Project, …> & { gallery_images: string[] }` so the DB row type stays the single source of truth and only the one nullable array is normalised (`?? []`). `display_order` / `is_published` / `created_at` / `updated_at` never cross the dehydration boundary. Errors are caught, logged server-side, and degrade to `{ ok: false, projects: [] }` |
| F2 | `src/lib/works.ts` | 49 | §2.3/§2.4 literals in one auditable place: `WORKS_SECTION_TITLE`, `WORKS_SECTION_EYEBROW`, `DRAWER_DESKTOP_QUERY` (`(min-width: 768px)`), `SHEET_HEIGHT_CLASS` (`h-[92svh]`), `SHEET_DISMISS_DISTANCE_RATIO` (0.25), `SHEET_DISMISS_VELOCITY` (0.5 px/ms), plus `formatEditorialIndex(index, total)` → `[ 01 / 02 ]` and wrap-around `cycleIndex(current, delta, total)` |
| F3 | `src/lib/use-project-drawer.ts` | 51 | `useProjectDrawer(total)` → `{ activeIndex, isOpen, open, close, next, previous }`. `activeIndex` starts `null` (identical on server and first client render), `open()` clamps into `[0, total-1]`, `next`/`previous` are no-ops while closed or with a single project. Reads nothing from `window` during render |
| F4 | `src/components/featured-works.tsx` | 126 | `<section id="works">` — mono eyebrow `[ WORKS ]` + `<h2>Featured Works</h2>`, then one `<article>` per project: editorial index, category, 16:10 media window, title/summary/tech pills, "View Case Study" affordance. Returns `null` for an empty list. Hover/focus reveal is pure CSS (`group-hover:` / `group-focus-within:` + `transition-[filter,transform]`, scale behind `motion-safe:`). The trigger is the **title** inside `<h3>` with an `after:absolute after:inset-0` overlay, so the whole card is clickable while the accessible name stays the project title and no interactive element nests inside another |
| F5 | `src/components/project-drawer.tsx` | 515 | `ProjectDrawer` (presence + modal side effects + breakpoint) and the internal `ProjectDrawerPanel` (per-open, owns the drag). `AnimatePresence` holds two keyed siblings — backdrop `z-60` (`bg-black/60 backdrop-blur-xl`) and panel `z-70`. Desktop: `w-[55vw] min-w-[640px]` right slide-over on `x`; mobile: `h-[92svh] rounded-t-3xl` sheet on `y` with an `aria-hidden` drag handle. Content: sticky header (close/Esc, Live Demo, Source Code), cover + category + title + summary, The Challenge, The Architecture, Tech Stack, Gallery preview grid (omitted when empty), footer previous/next with the editorial index. Modal side effects: body scroll lock + scrollbar compensation, focus move to the panel, focus restore, `Escape`, and a `Tab`/`Shift+Tab` trap — all keyed on `isOpen`, so in-drawer navigation does not re-run them |

## 2.2 Modified files (M1–M3)

| # | Path | Change |
| --- | --- | --- |
| M1 | `src/routes/index.tsx` | 44 → 85 lines. Loader is now `Promise.all([getLandingConfig(), getFeaturedProjects()])` returning `{ …config, projects }`. `Home` owns `useProjectDrawer(projects.length)`. Composition: `<div inert={drawer.isOpen \|\| undefined}>` wrapping `<Navbar>` + a recede wrapper (`motion-safe:transition-[transform,filter]` + `md:scale-[0.97] md:blur-[2px]`) around `<main>` (Hero + FeaturedWorks), with `<ProjectDrawer>` as a sibling. The Navbar is deliberately outside the transformed wrapper so `position: fixed` keeps resolving against the viewport |
| M2 | `src/lib/motion.ts` | Comment only: `SPRING_SURFACE` is no longer "currently UNUSED" and now names its consumer (`project-drawer.tsx`). No constant value changed |
| M3 | `src/styles/app.css` | **Not modified** — plan Step 8 expected this. All new utilities (`z-60`, `z-70`, `h-[92svh]`, `touch-action:none`, `overscroll-behavior:contain`, `rounded-t-3xl`, `md:scale-[0.97]`, `md:blur-[2px]`, `bg-surface-card/95`) generate from the Phase 1 `@theme inline` tokens and Tailwind's own scales |

## 2.3 Verified-unchanged

`src/routeTree.gen.ts` (**sha1 `d21a5e495a38c29be169e78d98b0eb49defc6d3e`**, identical before and after the whole sub-task), `src/routes/__root.tsx`, `src/router.tsx`, `src/lib/{site.ts,cn.ts,supabase.ts,supabase.server.ts}`, `src/components/{navbar,hero,hero-spotlight,availability-pill,magnetic-button,resume-trigger,theme-toggle}.tsx`, `src/types/database.ts`, `src/assets/portrait-placeholder.svg`, `src/styles/app.css`, `tsconfig.json`, `vite.config.ts`, `tsr.config.json`, `vercel.json`, `package.json`, `package-lock.json` (no new dependency), `supabase/**`, `docs/**`, `AGENTS.md`.

## 2.4 Scratch artifacts removed

`.output/` (all builds), `.scratch/` (never created), `.output` from the intermediate ablation builds, and every `/tmp` capture written during verification (`probe.html`, `ssr.html`, `prod.html`, `prod2.html`, `blank.html`, `dev-*.log`, `preview*.log`, plus the two file backups used for the ablation experiments). No probe file ever existed inside `src/` beyond the Step 2 loader probe, which was removed at Step 10.

---

# 3. Verification & Gate Results

## 3.1 G1 — TypeScript (`npm run typecheck`)

**PASS, exit 0**, run at Steps 0, 1, 2, 3, 4, 5, 6/7, 9, 11 and on the frozen final tree. Findings that the gates caught:

1. `lucide-react@1.53` no longer exports `Github` (`TS2305`) → replaced with `Code` / `ExternalLink` (D-D).
2. No `MotionValue`-in-`style` error: the drag offset is applied on an `m.div`, matching the pattern Sub-Task A needed in `hero-spotlight.tsx`.
3. `inert` typechecked against `@types/react@19` (`inert?: boolean | undefined`), so no cast was needed.

## 3.2 G2/G3/G4 — Production build, bundle, leaks, hygiene

**PASS, exit 0** on the frozen final tree. `vite build` → Nitro `.output/{server,public}`; 0 import-protection violations; the only build output is the pre-existing `MODULE_LEVEL_DIRECTIVE "use client"` notices from `node_modules/framer-motion`.

| Check | Result |
| --- | --- |
| Exit code | 0 |
| Server-only leak scan of `.output/public` | **0 files** matching `SUPABASE_SERVICE_ROLE_KEY`, `createSupabaseServerClient`, `createSupabaseAdminClient`, `getPublishedProjects`, `getSiteConfig`, `persistSession` |
| Server function in the production server bundle | Present: `.output/server/_ssr/projects-*.mjs` (+ `site-config-*.mjs`) |
| `src/routeTree.gen.ts` | **Byte-identical** (`sha1 d21a5e495a38c29be169e78d98b0eb49defc6d3e`) before and after |
| Source-level feature audit | 0 code references to `domAnimation`, `domMax`, `whileHover`, `whileTap`, `whileFocus`, `whileInView`, `drag=`, `MotionConfig` or `motion.*` — every textual match is a comment. Imports from `motion/react` are exactly: `LazyMotion`/`domMin` (route), `m`/`useAnimationFrame`/`useMotionTemplate`/`useMotionValue` (spotlight), `m`/`useSpring` (magnetic button), `AnimatePresence`/`m`/`useMotionValue`/`useReducedMotion`/`useSpring` (drawer), `type Transition` |

**Artifact sizes (gzip / raw)**

| Artifact | gzip | raw | Sub-Task A baseline gzip | Δ gzip |
| --- | --- | --- | --- | --- |
| `routes-*.js` (landing route + motion) | **43,364** | 131,413 | 38,257 | **+5,107** |
| `index-*.js` (framework client entry) | 110,017 | 345,668 | 109,901 | +116 |
| `app-*.css` | 9,025 | 50,263 | 8,179 | +846 |
| `portrait-placeholder-*.svg` | 1,040 | 2,285 | 1,040 | 0 |
| **Total client JS** | **153,381** | — | 148,158 | **+5,223** |

The §11 gate (**< 8 KB** routes delta) passes at **+5,107 gz**. The §11.7 CSS fallback was **not** needed; see §1.3 D-A for the measurement that made it unnecessary.

## 3.3 Bundle attribution (measured, not estimated)

Each number is a real build of the frozen tree with one thing removed:

| Variant (routes chunk, gzip) | Cost of the removed piece |
| --- | --- |
| Full implementation | 47,322 → after D-A, **43,364** | — |
| without `AnimatePresence` | 45,729 | **1,593 gz** |
| without imperative `animate()` | 43,344 | **3,978 gz** ← removed by D-A |
| without `useReducedMotion` | 47,285 | 37 gz |
| Featured Works section only (no drawer) | 39,152 | drawer = **4,212 gz** |
| Sub-Task A baseline (no works, no drawer) | 38,257 | works section = **+895 gz** |

Conclusion: the drawer's remaining 4,212 gz is its own component code plus `AnimatePresence`; **no new animation feature bundle was added**, which is exactly the `domMin` contract from §11.2.

## 3.4 G5 — SSR runtime verification (`npm run dev`, port 3000)

HTTP **200**, 23,667 bytes, dev log clean.

| # | Check | Expected | Result |
| --- | --- | --- | --- |
| 1 | `<section id="works"` | 1 | **1** ✅ |
| 2 | `[ 01 / 02 ]` / `[ 02 / 02 ]` | present | **1 / 1** ✅ |
| 3 | Both seeded titles rendered inside `<h3><button …>` | 2 cards | **2** ✅ (`Gloster Enterprise Logistics`, `AurumFlow Financial Core`); each title also appears once in the hydration payload, as expected |
| 4 | `aria-haspopup="dialog"` | 2 | **2** ✅ |
| 5 | Card covers with explicit dims | `width="1600" height="1000" loading="lazy" decoding="async"` | **2** ✅ |
| 6 | Drawer body absent | `role="dialog"`, `The Challenge`, `The Architecture`, `Tech Stack`, `Gallery` all 0 | **0** each ✅ (client-only proof) |
| 7 | `radial-gradient` | 0 | **0** ✅ (Hero Layer 1 still client-only) |
| 8 | Sub-Task A markers intact | `Available for Projects` 2, `ENGINEER` 1, `backdrop-blur-md` 3, `aria-disabled="true"` 1, `<h1` 1, `id="hero"` 1 | ✅ unchanged |
| 9 | Structure | `#works` inside `<main>`, after `#hero`; `inert` absent while closed | ✅ |

Additional confirmations from the same response: 10 tech-stack pills rendered as Geist Mono `[ Next.js ]`-style chips (5 per project), the categories `SUPPLY CHAIN / ARCHITECTURE` and `FINTECH / REAL-TIME SETTLEMENT`, 2× "View Case Study" affordances, and the section heading `Featured Works`.

**Live data observed** (Step 2 probe, later removed): 2 published projects; both have `gallery_images.length === 2`, 5 `tech_stack` entries, and non-null `live_url` / `repo_url` — so the drawer's Live Demo / Source Code links render as real anchors and the gallery grid renders (the disabled-action branch in `DrawerActionLink` was not exercised by live data).

## 3.5 G6 — Degradation drill

Run against a **separate** dev server on port 3100 with `VITE_SUPABASE_URL=` and `VITE_SUPABASE_ANON_KEY=` blanked in the process environment. `.env` was **never edited**.

| Expectation | Result |
| --- | --- |
| Page still renders (no 500) | **HTTP 200**, 11,449 bytes ✅ |
| Hero / navbar survive | `<h1` 1, `ENGINEER` 1, `backdrop-blur-md` 2, `aria-disabled="true"` 1 ✅ |
| Availability pill absent — no fabricated label | `Available for Projects` **0** ✅ |
| Works section absent — not an empty shell | `<section id="works"` **0**, `aria-haspopup="dialog"` **0**, `Featured Works` **0** ✅ |
| Server logs the cause | `Missing required environment variable "VITE_SUPABASE_URL"` ×2, `[site-config] failed to read site_configs:` ×1, `[projects] failed to read projects:` ×1 ✅ |
| Server can be stopped cleanly | Port 3100 stopped; nothing else affected ✅ |

This proves §3.2 A6 (the empty-projects degradation) end to end.

## 3.6 G7 — Production preview

The built Nitro output was served with `npx vite preview --port 3200` and re-checked: **HTTP 200**, 18,544 bytes, and **14/14** checks pass — `<section id="works"` 1, `[ 01 / 02 ]` 1, `[ 02 / 02 ]` 1, `aria-haspopup="dialog"` 2, both titles in `<h3><button>`, 10 tech chips, 2 cover images at `1600×1000` lazy, `role="dialog"` 0, `The Challenge` 0, `radial-gradient` 0, `inert` 0 (closed), `Available for Projects` 2, `ENGINEER` 1, and **0** dev-only `data-tsd-source` attributes.

## 3.7 CSS assertions (built `app-*.css`)

| Assertion | Result |
| --- | --- |
| `z-index:60` / `z-index:70` | present ✅ (Tailwind v4 bare numeric z-index) |
| `h-[92svh]` | present ✅ |
| `touch-action:none`, `overscroll-behavior:contain` | present ✅ |
| `rounded-t-3xl` | `border-top-left-radius/right-radius: var(--radius-3xl)` ✅ |
| `md:scale-[0.97]` | `@media (width>=48rem){ … .md\:scale-\[0\.97\]{scale:.97} … }` ✅ |
| `md:blur-[2px]` | `@media (width>=48rem){ … --tw-blur:blur(2px) … }` ✅ |
| `bg-surface-card/95` | `background-color: color-mix(in oklab, var(--surface-card) 95%, transparent)` ✅ |
| `aspect-[16/10]` | present ✅ |
| `motion-safe:` gating | all `motion-safe:` utilities live inside `@media (prefers-reduced-motion:no-preference)`; the card scale composes with `@media (hover:hover)` for `group-hover` ✅ |
| Reduced-motion block | `@media (prefers-reduced-motion:reduce)` still present ✅ |
| Sub-Task A tokens/markers | `--surface-glass` ×4, `hero-portrait-mask`, `theme-reveal` ×2, `status-pulse` ×5 ✅ |

## 3.8 G8 — Manual browser, keyboard & responsive pass

**Not executable in this environment.** No headless browser or test runner is available (identical to Sub-Task A §3.4/§3.5). The checklist from plan §5 Step 14 is handed to the user:

1. Console at Verbose, hard reload on `/`: zero hydration warnings, dark and light.
2. Keyboard: hero CTAs → card titles → `Enter` opens → focus inside the panel → `Tab`/`Shift+Tab` cycle within → `Escape` closes → focus returns to the triggering title.
3. `prefers-reduced-motion: reduce`: the drawer fades (no slide) and the background recede transition is absent.
4. 375 / 768 / 1024 / 1440 px: bottom sheet below `md`, right slide-over at `md`+; the 768–1024 px band (where `min-w-[640px]` nearly fills the viewport) is the one to eyeball.
5. Swipe-down dismissal on a touch device, including the sub-threshold spring-back.
6. Both themes: drawer surface/backdrop contrast ≥ 4.5:1; cover images load (a 404 falls back to the `bg-surface-card` surface).

## 3.9 G9 — Cleanup

`.output/`, `.scratch/` (never created) and all `/tmp` artifacts removed. Final `src/` tree:

```
src/components/featured-works.tsx      126   (new, F4)
src/components/project-drawer.tsx      515   (new, F5)
src/lib/works.ts                        49   (new, F2)
src/lib/use-project-drawer.ts           51   (new, F3)
src/server-fns/projects.ts              99   (new, F1)
src/routes/index.tsx                    85   (modified, M1)
src/lib/motion.ts                       59   (modified, M2)
src/styles/app.css                     211   (unchanged — M3 not required)
```

Total for the sub-task: **5 new files, 2 modified, 0 new dependencies.**

---

# 4. Notes & Readiness for Phase 2 Sub-Task C (Core Competencies & Interactive Contact Section)

## 4.1 What Sub-Task C can build on directly

1. **The section pattern is now proven twice.** `FeaturedWorks` is the template for §2.5 `#services`: server-rendered `<section id={…}>` fed by loader data, `null` when its data is empty, mono eyebrow + display heading, hairline-separated editorial rows.
2. **Anchor infrastructure is already complete.** `NAV_LINKS` already carries `#services` and `#contact`, and `section[id] { scroll-margin-top: 6rem }` is global in `app.css` — §2.5/§2.6 only need to render the two `<section>` elements.
3. **The `createServerFn` seam has two working examples** (`site-config.ts`, `projects.ts`) with the same shape: top-level `supabase.server` import, `try/catch`, `console.error` server-side, a serialisable `{ ok, … }` result, and a degradation path proven by the blank-env drill (§3.5). The contact form's POST function should copy it verbatim.
4. **Overlay primitives exist and are reusable.** `ProjectDrawer` contains a working modal kit: focus trap, `Escape`, scroll lock + scrollbar compensation, focus save/restore, and `inert` background isolation. §2.6's form is in-flow, but Phase 4's admin modals will want exactly this — extract it to `src/lib/use-focus-trap.ts` before a second consumer appears (plan §14.4).
5. **`AnimatePresence` is already paid for** (1,593 gz on the routes chunk) and `domMin` already ships `animations` + `exit`. §2.6 can animate submission states at ~0 extra bundle.
6. **`useMediaQuery`** (currently module-local in `project-drawer.tsx`) is available for any responsive behaviour §2.5 needs; move it to `src/lib/` at that point.
7. **Shared vocabulary**: `formatEditorialIndex`, `cycleIndex`, `cn()`, `MagneticButton`, `AvailabilityPill`, and the `DrawerActionLink` disabled-affordance pattern (`<button disabled aria-disabled="true" title=…>`) for controls whose data is missing.

## 4.2 Constraints Sub-Task C must respect

1. **Keep `<LazyMotion features={domMin} strict>`.** Do **not** import `domAnimation` / `domMax`, and do **not** use `whileHover` / `whileTap` / `whileInView` / `drag` — measured, each pulls a feature bundle (plan §11.2). Hover/focus affordances stay pure CSS via `group-hover:` / `group-focus-within:` + `motion-safe:`.
2. **Never import `supabase.server.ts` from a route or component.** Loaders run on the client; wrap every read/write in a `createServerFn` (as F1 does).
3. **Do not add the imperative `animate()` from `motion/react`** without measuring: it is +3,978 gz on this chunk (§3.3). `useSpring` / `useMotionValue` / `useAnimationFrame` are already in the bundle and cost ~0.
4. **Keep the payload serialisable**: only JSON primitives across the dehydration boundary, no `Date`, no class instances, no `undefined`.
5. **No new route files for §2.5/§2.6.** If one is ever added, `routeTree.gen.ts` must come from the Vite build, never from `npm run generate-routes` (Sub-Task A §4.4 item 4).
6. **Preserve the SSR contract**: sections render server-side; only purely decorative layers (Hero Layer 1, the drawer) may be client-only.
7. **`inert` + recede wrapper are owned by `routes/index.tsx`.** If §2.6 introduces a second overlay, the `inert={isOpen || undefined}` wrapper and the recede class need to account for it — the current implementation assumes the projects drawer is the only modal.

## 4.3 Recommended next actions, in priority order

1. **Run the manual browser pass** (§3.8) — especially the hydration console in both themes and the real swipe gesture, before more interactive surface stacks on this page.
2. **Decide on Zod before §2.6.** PRD §6.3 requires two-sided validation for the contact form and ROADMAP §2.6 names Zod, but **Zod is not installed** and the backend does not exist yet (`articles` scaffolding aside, there is no `zod` dependency). This is a new-dependency decision for the user.
3. **Extract the modal kit** (focus trap + scroll lock + focus restore) out of `project-drawer.tsx` into `src/lib/` when §2.6 or Phase 4 needs it a second time; the current file is 515 lines and the two concerns are already cleanly separable.
4. **Revisit the drag follow** (D-A): if a literal 1:1 pointer lock is wanted, the options are (a) accept the imperative `animate()` at +3,978 gz, or (b) hand-roll a critically-damped integrator with the already-bundled `useAnimationFrame` (the pattern Sub-Task A used for the spotlight). Neither is required by the spec.
5. **Consider `src/env.d.ts`** (still open from Phase 1 §4.3 item 4): `VITE_*` and server vars are `any` today, so a typo surfaces only when `requireEnv()` throws at runtime — the blank-env drill in §3.5 is the only current safety net.
6. Optional polish, low risk: mirror the drawer's deep-linking gap (plan §14.2) with a `/projects/:slug` route in Phase 3, which would also let the case-study prose become server-rendered for SEO (plan §3.2 A3).
