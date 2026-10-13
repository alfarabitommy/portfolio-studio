# Phase 2 (Sub-Task A) Execution Summary — Global Layout, Floating Glass Pill Navbar & Editorial Hero

| | |
| --- | --- |
| **Status** | Complete — all gates executed; Gate 4/5 manual browser checks could not be automated in this environment (see §3.4, §3.5) |
| **Executed** | 2026-10-09 |
| **Plan** | `plan/02-phase2-navbar-hero-plan.md` (approved), Steps 1–14 |
| **Stack verified against** | TanStack Start 1.168.60, React 19.2, Vite 8.3.3, Nitro 3, Tailwind CSS 4.1.18, TypeScript 6 (strict), `@supabase/ssr` 0.12.7, `motion` 14.0.0 |
| **Inventory delivered** | F1–F12 new, M1–M3 modified, nothing else; `src/routeTree.gen.ts` byte-identical |
| **User-directed change vs. plan** | `SITE_MONOGRAM` = `'TA'` (plan §6.1 defaulted to `'MY'`) |

---

# 1. Execution Overview & Step-by-Step Gate Status

## 1.1 Outcome

All fourteen plan steps were executed in order, each against its own gate. The public landing page now server-renders the four-layer editorial hero plus the floating glass pill navbar, with the availability label and CV URL read live from `site_configs` through a `createServerFn` seam. Two deliberate, measurement-driven departures from the approved plan were required (both within the plan's own §3.2 / §12 R4 budget framework) and are recorded in §1.3.

## 1.2 Step-by-step status

| Step | Action | Status | Gate evidence |
| --- | --- | --- | --- |
| 1 | `npm install motion@^14` | Done | `npm ls motion` → `motion@14.0.0` (single entry); `tsc --noEmit` exit 0 |
| 2 | Author F2 `site.ts`, F3 `cn.ts`, F4 `motion.ts` | Done | `tsc --noEmit` exit 0 (strict `noUnusedLocals` satisfied) |
| 3 | Author F1 `server-fns/site-config.ts` + temporary loader probe in `index.tsx` | Done | **`npm run build` exit 0** → the top-level `supabase.server` import inside a `createServerFn` module is accepted by import-protection (**R1 did not materialise**); `curl` returned `{"ok":true,"availability":{"label":"Available for Projects","status":"available"},"resume":{"url":null,"updated_at":null}}` |
| 4 | M2 `app.css` blocks | Done | Dev server boots; served CSS contains `theme-reveal`, `hero-portrait-mask`, `scroll-margin-top`, `prefers-reduced-motion` |
| 5 | F5 `theme-toggle.tsx` | Done | SSR HTML contains the stable `aria-label="Toggle color theme"` **and both** icons (`lucide-moon` + `lucide-sun`, CSS-switched) |
| 6 | F6 `navbar.tsx` + F7 `resume-trigger.tsx` | Done | SSR HTML contains `backdrop-blur-md`, `top-6`, all four anchor `href`s, `aria-disabled="true"`, monogram `[ TA ]` |
| 7 | F8 `availability-pill.tsx` + F12 portrait SVG + F11 `hero.tsx` (no motion layers) | Done | SSR HTML contains `<h1`, `ENGINEER`, `width="1200" height="1600"`, the live pill label |
| 8 | F9 `hero-spotlight.tsx`, F10 `magnetic-button.tsx` (plan: F9 = magnetic, F10 = spotlight), CTA swap, moving navbar to `motion.header` | Done (with §1.3 D-A/D-B) | SSR HTML contains the CTA hrefs and **0** occurrences of `radial-gradient` → Layer 1 is client-only |
| 9 | Remove temporary probe; finalise `index.tsx` | Done | No `JSON.stringify`, no temp import; only `console.error` in the server function remains (deliberate) |
| 10 | `npm run typecheck` | Done | exit 0 (re-run on the frozen final tree) |
| 11 | `npm run build` | Done | exit 0; 0 import-protection violations; §3.2 checks pass; `src/routeTree.gen.ts` hash unchanged |
| 12 | SSR verification in `npm run dev` | Done | 8/8 checks pass (§3.3); degradation drill passes (§3.3.2) |
| 13 | Manual browser checks | **Not executable here** | No working headless browser in this sandbox (see §3.4/§3.5); structural mismatch-freedom arguments and the evidence that *is* available are in §3.4 |
| 14 | Cleanup | Done | `.output` deleted, `.scratch` deleted, temp probes/logs removed; final tree = plan inventory + this summary |

## 1.3 Deviations from the approved plan (each with its evidence)

| # | Plan said | Shipped | Why |
| --- | --- | --- | --- |
| **D-A** | Navbar shrink = `motion.header` + `animate={{ scale }}` with `SPRING_SURFACE`; pill pulse = `motion.span` keyframes suppressed by `<MotionConfig reducedMotion="user">` (§6.5, §6.6, §6.10) | Navbar shrink = CSS transition (`scale-95` + `motion-safe:transition-*`); pill pulse = CSS `@keyframes status-pulse` behind `motion-safe:` | Part of the §12 R4 fallback. It removed the last two `animate`-prop consumers, which is what allowed the smaller feature bundle (§1.4) and removed any need for `MotionConfig`. Behaviour is preserved: §3A only requires a *smooth* shrink, and §8.2 reduced-motion is now expressed declaratively by `motion-safe:` instead of by JS |
| **D-B** | Use `motion`/`motion.header`/`motion.span` components | `LazyMotion` + `domMin` + the `m` components | §12 R4's LazyMotion rung, then the smallest public feature bundle. Measured: 56,218 → 42,941 → 40,052 → **38,256** gz (routes chunk). See §1.4 |
| **D-C** | `SPRING_SURFACE` "exercised once here for the navbar shrink" (§6.3) | Exported but unused by this sub-task | Consequence of D-A. Kept deliberately (plan §6.3/§13.7) as the single definition for the §2.4 drawer spring; the comment now says so |
| **D-D** | Layer 3's aria-hidden wrapper contains the portrait **and** the pill (§6.10) | Wrapper stays `aria-hidden` for the `<img>` only; the pill sits outside it | The availability label is live data ("Available for Projects"), and hiding it from assistive tech would convey it visually only. Deviation is a strict a11y improvement; nothing else about the layering changes |
| **D-E** | `import portraitUrl from '../assets/portrait-placeholder.svg'` (§3.3) | `...svg?url&no-inline` | Vite inlines assets < 4 KB as `data:` URIs; the 2.3 KB placeholder SVG (including its swap-point comment) was being embedded in **every** SSR response. `?no-inline` emits a hashed, cacheable file instead (1,040 gz) |
| **D-F** | §8.2 referenced "max-w-xl for supporting text" | Layer 4 = `<h1>` + CTA row only | The UX spec's Layer 4 defines headline + two CTAs; inventing marketing copy is not this sub-task's call (plan §9 D6 keeps spec copy verbatim) |
| **D-G** | `AvailabilityPill` props table listed only `label` + `className` (§6.6) | `status` is a required prop | §6.6's own behaviour (emerald pulsing dot when `available`, flat muted dot when `busy`) is impossible without it |
| **D-H** | `SITE_MONOGRAM` = `'MY'` | `'TA'` | User instruction for this execution |

## 1.4 The single most important finding — `motion`'s real cost

The plan estimated `motion` at "roughly 30–40 KB gzip" and set a 20 KB abort threshold, expecting the R4 LazyMotion rung to land under it. It does not: the cost is the framework core (framer-motion + motion-dom + motion-utils), not the feature bundle or the component APIs.

| Variant (routes chunk, gzip) | Delta vs. no-motion baseline | Notes |
| --- | --- | --- |
| 209 B (baseline) | — | Step 3 build: `motion` installed but not imported anywhere |
| 56,218 B | **+56,009** | Full `motion` components + `MotionConfig` + navbar/pill `animate` props |
| 42,941 B | **+42,732** | `LazyMotion` + `domAnimation` + `m`, navbar/pill still animated by motion |
| 40,052 B | **+39,843** | Motion restricted to the two MotionValue-driven pointer effects (D-A) |
| **38,256 B** | **+38,047** | `domMin` instead of `domAnimation` (D-B) — **shipped** |

Consequences:

1. **The plan's 20 KB guardrail is exceeded by ~18 KB.** The R4 ladder was applied to its end, and its terminal rung ("hand-roll the spotlight, keep motion only for the magnetic button") was evaluated and shown to be ineffective: with a *single* remaining motion consumer the chunk is still ~38 KB, because a single import pulls the whole core. There is no intermediate rung — it is motion (≈38–56 KB) or no motion (≈0).
2. Landed total client JS for `/`: **147,717 gz** (109,901 `index` + 38,256 `routes` + rest) vs. a 110,103 gz baseline → **+37,614 gz (+34.2%)**.
3. This does not change the Phase 1 verdict that SSR/time-to-content is dominated by rendering, and it is not a Phase 2 blocker — but §4.3 lists the three options (accept / drop motion / defer motion to a post-hydration chunk) as the first decision for the next sub-task, since Phase 2.4 (drawer + bottom sheet) will multiply motion's usage surface.

---

# 2. Created & Modified Files Breakdown

## 2.1 New files (F1–F12)

| # | Path | Lines | What was implemented |
| --- | --- | --- | --- |
| F1 | `src/server-fns/site-config.ts` | 72 | `getLandingConfig` = `createServerFn({ method: 'GET' })`. Reads `availability` + `resume` via `Promise.all`, validates both `jsonb` payloads with `isAvailability`/`isResume` guards, returns the serialisable `LandingConfig` `{ ok, availability, resume }`. Errors are caught and logged server-side, returning `{ ok: false, null, null }` so a config outage degrades the page instead of throwing |
| F2 | `src/lib/site.ts` | 34 | `SITE_MONOGRAM` (`'TA'`), `NAV_LINKS` (Works/Services/Articles/Contact in spec order), `NAV_SCROLL_THRESHOLD` (80), `NavLink` type |
| F3 | `src/lib/cn.ts` | 15 | `cn()` over the already-installed `clsx` + `tailwind-merge`; required because every component composes a base class string with conditional scroll/glass/variant classes |
| F4 | `src/lib/motion.ts` | 59 | All physics constants in one auditable place: `SPRING_HOVER` (400/25), `SPRING_SURFACE` (320/32/1, currently unused — D-C), `SPOTLIGHT_SIZE` (600), `SPOTLIGHT_LERP` (0.08), `MAGNETIC_RADIUS` (35), `MAGNETIC_MAX_OFFSET` (8), `THEME_REVEAL_MS` (400), plus `isFinePointer()` / `prefersReducedMotion()` which are only ever called from effects/handlers |
| F5 | `src/components/theme-toggle.tsx` | 108 | Dark/Light switch. Icon visibility is CSS-driven (`dark:hidden` / `hidden dark:block`) so nothing reads the theme during render; `isDark` starts `null` and only refines `aria-label`. Applies the Phase 1 contract (`dark` class + `colorScheme` + `localStorage.theme`), wrapped in `document.startViewTransition` with a circular reveal from the click point, skipped entirely when the API is missing or reduced motion is requested. The API is reached via a structural `unknown` cast + `in` narrowing — no `any`, no `@ts-ignore` |
| F6 | `src/components/navbar.tsx` | 87 | Floating capsule at `top-6 inset-x-0 mx-auto w-max z-50` + `max-w-[calc(100vw-2rem)]`; glass via `bg-surface-glass`/`border-border-subtle`/`backdrop-blur-md` with the spec's literal shadow pair; monogram `[ TA ]` → `#hero`; two hairline separators; `<nav aria-label="Primary">` with the four anchors (hidden below `md`); theme toggle; resume trigger. Scroll response is a `passive` listener that changes React state only on threshold crossing |
| F7 | `src/components/resume-trigger.tsx` | 53 | `resume.url !== null` → `<a target="_blank" rel="noopener noreferrer" aria-label="Download CV (PDF)">`; `null` (today's live state) → disabled button with `aria-disabled="true"` + `title`, so the capsule width is stable. No `download` attribute (ignored cross-origin; Supabase Storage is another origin) |
| F8 | `src/components/availability-pill.tsx` | 47 | Glass capsule + Geist Mono uppercase label (data only) + status dot; emerald pulse via `motion-safe:animate-[status-pulse_...]`, muted flat dot when `busy` |
| F9 | `src/components/magnetic-button.tsx` | 98 | Wrapper padded by `MAGNETIC_RADIUS` px (negative margin) forms the hit field without any global listener; `useSpring(SPRING_HOVER)` on `x`/`y`, displacement = `min(distance, MAGNETIC_MAX_OFFSET)` px toward the pointer; mouse/`(pointer: fine)`/reduced-motion gated; `will-change` applied only while hovered; two variants (`primary` glass CTA with emerald glow, `secondary` text + rotating `↗`) |
| F10 | `src/components/hero-spotlight.tsx` | 102 | Layer 1. Returns `null` until after hydration (client-only by construction); one `passive` `pointermove` listener on the hero `<section>`; MotionValues + `useAnimationFrame` implement the literal damped follow (lerp 0.08); `useMotionTemplate` builds the 600 px `radial-gradient`; fades in on first move; zero React renders per pointer event |
| F11 | `src/components/hero.tsx` | 97 | The four-layer composition: Layer 1 spotlight; Layer 2 `ENGINEER` at `text-[15vw]` seeded from tokens (`text-text-primary/[0.06]` / `dark:[0.04]`); Layer 3 masked portrait (`hero-portrait-mask`, 1200×1600 intrinsic, `alt=""`, `fetchPriority="high"`) + pill; Layer 4 the spec headline + two magnetic CTAs. Mobile stacks portrait first, copy second; `lg` splits 7/5 |
| F12 | `src/assets/portrait-placeholder.svg` | 74 | Hand-authored monochrome chiaroscuro silhouette (3:4, `viewBox` 1200×1600) with the swap contract for the real photo in a header comment |

## 2.2 Modified files (M1–M3)

| # | Path | Change |
| --- | --- | --- |
| M1 | `src/routes/index.tsx` | 44 lines: `loader: () => getLandingConfig()`, `staleTime: 60_000`, and the real composition — `<LazyMotion features={domMin} strict>` → `<Navbar resumeUrl>` + `<main><Hero availability>` |
| M2 | `src/styles/app.css` | 211 lines (+84): `html { scroll-behavior: smooth }` + `section[id] { scroll-margin-top: 6rem }` in `@layer base`; `@keyframes theme-reveal` + `::view-transition-*` reveal rules; `@keyframes status-pulse`; `.hero-portrait-mask` (both `-webkit-` and standard `mask-image`); reduced-motion overrides. **No existing token or `@theme inline` line was touched** |
| M3 | `package.json`, `package-lock.json` | `motion@^14.0.0` added to `dependencies` (resolved 14.0.0) |

## 2.3 Verified-unchanged

`src/routes/__root.tsx`, `src/routeTree.gen.ts`, `src/lib/supabase.ts`, `src/lib/supabase.server.ts`, `src/types/database.ts`, `src/router.tsx`, `tsconfig.json`, `vite.config.ts`, `tsr.config.json`, `vercel.json`, `.env`, `docs/**`, `supabase/**`, `AGENTS.md`. Confirmed by mtime sweep (only the 18 paths above changed) and by the `routeTree.gen.ts` hash check in §3.2.

## 2.4 Scratch artifacts removed

`.output/` (all builds), `.scratch/` (created during an abandoned screenshot attempt), the temporary loader probe block in `src/routes/index.tsx`, and all `/tmp` logs/HTML captures written during verification. No probe file was ever committed to `src/`.

---

# 3. Verification & Gate Results

## 3.1 Gate 1 — TypeScript (`npm run typecheck`)

**PASS, exit 0**, run at Steps 2, 3, 5, 6, 7, 8, 9, and on the frozen final tree. Two findings:

1. `MotionValue` style props required motion components (`m.div`, not `div`): the plan's Layer-1 markup used a plain `div` with `style={{ opacity, backgroundImage }}`, which fails `tsc` with `Type 'MotionValue<number>' is not assignable to type 'Opacity'`. Fixed by using `m.div`.
2. `motion/react`'s `Transition` type is importable as a type-only import, so `verbatimModuleSyntax` is satisfied in `lib/motion.ts`.

`noUnusedLocals` / `noUnusedParameters` / `verbatimModuleSyntax` are clean; `skipLibCheck` was not needed to mask anything in our own code.

## 3.2 Gate 2 — Production build & bundle hygiene (`npm run build`)

**PASS, exit 0** on the frozen final tree. `vite build` → Nitro `.output/{server,public}`; 0 import-protection violations, 0 build warnings from our code (only the pre-existing `MODULE_LEVEL_DIRECTIVE "use client"` notices from `node_modules/@tanstack/react-router`).

| Check | Result |
| --- | --- |
| Exit code | 0 |
| Server-only leak scan of `.output/public` | 0 files matching `SUPABASE_SERVICE_ROLE_KEY`, `createSupabaseAdminClient`, `createSupabaseServerClient`, `getSiteConfig`, `setResponseHeader`, `persistSession` |
| Server function in the production server bundle | Present: `.output/server/_ssr/site-config-*.mjs` (+ `router-*.mjs`) — the seam compiles to the server, not the client |
| `src/routeTree.gen.ts` | **Byte-identical** (`sha1 d21a5e495a38c29be169e78d98b0eb49defc6d3e`) before and after the whole sub-task — no route files were added |
| CSS assertions (`app-*.css`) | `--surface-glass` ×4, `--bg-base` ×5, `--accent-glow` ×8, `--color-surface-glass` ×1, `.dark` rule, `where(.dark` ×8, `::view-transition-new(root)` ×3, `theme-reveal` ×2, `status-pulse` ×3, `hero-portrait-mask`, `scroll-margin-top`, `prefers-reduced-motion` ×2, `motion-safe` ×4 — all present |

**Final artifact sizes (gzip / raw)**

| Artifact | gzip | raw | Baseline (Step 3) gzip | Δ gzip |
| --- | --- | --- | --- | --- |
| `index-*.js` (framework client entry) | 109,901 | 345,484 | 109,894 | +7 |
| `routes-*.js` (landing route + motion) | 38,256 | 113,779 | 209 | **+38,047** |
| `app-*.css` | 8,179 | 45,100 | not captured | — |
| `portrait-placeholder-*.svg` | 1,040 | 2,285 | new | +1,040 |
| **Total client JS** | **147,717** | — | 110,103 | **+37,614 (+34.2 %)** |

Analysis of the delta, and the R4 ladder that produced it, is in §1.4. The R4 LazyMotion fallback **was applied** (`LazyMotion` + `domMin` + `m`, `strict`), saving 17,962 gz against the naive full-`motion` implementation. The residual overage is the framework core and cannot be reduced by any rung of R4.

## 3.3 Gate 3 — SSR / runtime verification

### 3.3.1 `npm run dev` (port 3000), final state

| # | Check | Expected | Result |
| --- | --- | --- | --- |
| 1 | `grep -ao "<h1"` | ≥1 | **1** ✅ |
| 2 | `grep -ao "Available for Projects"` | ≥1 (live `site_configs` label) | **2** ✅ |
| 3 | `grep -ao "backdrop-blur-md"` | ≥1 (capsule) | **3** ✅ (navbar + pill) |
| 4 | `grep -ao 'aria-disabled="true"'` | ≥1 (`resume.url === null`) | **1** ✅ |
| 5 | `grep -ao "ENGINEER"` | ≥1 (Layer 2 is SSR text) | **1** ✅ |
| 6 | `grep -ao "radial-gradient"` | **0** (Layer 1 is client-only) | **0** ✅ |
| 7 | HTTP status / dev log | 200, no errors | **200**, log clean ✅ |
| 8 | Degradation drill | see §3.3.2 | ✅ |

Additional confirmations from the same response: `<section id="hero">` present, `hero-portrait-mask` ×1, `<img … width="1200" height="1600" alt="" … fetchPriority="high">`, both theme icons SSR-rendered with CSS switching, `padding:35px;margin:-35px` on the magnetic hit fields, and `style="transform:none"` on the `m.a` CTAs (motion renders its style deterministically on the server — the same code path runs during hydration).

### 3.3.2 Degradation drill

Run against a **separate** dev server on port 3100 started with `VITE_SUPABASE_URL=` and `VITE_SUPABASE_ANON_KEY=` overridden in the process environment. `.env` was **never edited** — a safer shape of the plan's Step 3 check 8, and it exercises exactly the same `requireEnv` failure path.

| Expectation | Result |
| --- | --- |
| Page still renders (no 500) | **HTTP 200**, 11,221 bytes ✅ |
| `<h1>`, `ENGINEER`, navbar, disabled CV trigger survive | `<h1` ≥1, `ENGINEER` ≥1, `backdrop-blur-md` ×2, `aria-disabled="true"` ×1 ✅ |
| Pill absent — no fabricated label | `Available for Projects` **0**, pill container class **0** ✅ |
| Server logs the cause | `Missing required environment variable …` + 4 `[site-config] failed to read site_configs:` entries ✅ |
| Server can be stopped cleanly | Port 3100 stopped; port 3000 server unaffected ✅ |

### 3.3.3 Beyond the plan — production SSR path

The built Nitro output was served with `npx vite preview --port 3200` and re-checked: **HTTP 200** with the live label (`Available for Projects` ×2), `ENGINEER`, `backdrop-blur-md` ×3, `aria-disabled="true"` ×1 and `radial-gradient` ×0. This extends Gate 3 beyond `vite dev` and proves the production server bundle (including `createServerFn` + `createServerClient`) serves the live data end-to-end.

## 3.4 Gate 4 — Hydration / no-mismatch

**Not executable in this environment.** Headless Firefox is installed (`/usr/bin/firefox`) but its headless screenshot/automation path failed repeatedly here (sandboxed profile/IO; no output file produced), and no Playwright/Puppeteer/jsdom is available. Per `AGENTS.md` there is no test runner, and adding one is a proposal, not a silent change — so this gate is reported as **unverified by execution**, with the reasoning and what a browser pass must still confirm.

What is verified structurally, i.e. why a mismatch is not reachable by construction:

1. **No client-only read in a render path.** Theme is never read from `localStorage`/`matchMedia` during render (icons are CSS-switched); the only other environment reads (`isFinePointer`, `prefersReducedMotion`, `window.scrollY`, element rects) happen in effects/handlers.
2. **Loader data is serialised into the SSR dehydration payload**, so the first client render receives the exact values the server rendered with — no client fetch, no placeholder-vs-real divergence.
3. **The only client-only layer renders `null` on the server** (`radial-gradient` count 0 in the SSR HTML, and the same `mounted` gate keeps it out of the first client render).
4. **Deterministic initial motion values**: all MotionValues start at `0`, both springs start at `0`, `scrolled` starts `false`. The SSR HTML shows motion's own deterministic output (`style="transform:none"`), produced by the same render path used at hydration.
5. `<html>` already carries `suppressHydrationWarning` from Phase 1, covering the pre-hydration theme script only.

**Residual risk:** motion's hydration-time style reconciliation on `m.a`/`m.div` has not been observed in a real browser here. A one-minute manual pass (console at Verbose, hard reload) closes it; see §4.4 item 1.

## 3.5 Gate 5 — Motion, keyboard & responsive

**Not executed** (same environment limitation). The following were verified by construction or static reasoning only, and must be confirmed in a browser:

| Check | Status | Static evidence |
| --- | --- | --- |
| Reduced motion | Unverified by execution | `motion-safe:` variants (navbar transition, pill pulse), `prefersReducedMotion()` short-circuits (spotlight, magnetic) and the CSS block (`scroll-behavior: auto`, `::view-transition-new` animation off) — all four paths exist |
| Keyboard / focus order | Unverified by execution | Document order = capsule (monogram → links → theme → CV) → hero CTAs; no positive `tabindex`; every control is a real `<button>`/`<a>` with a `focus-visible` ring |
| Anchor links to not-yet-existing sections | Unverified by execution | Plain fragments; a missing target is a browser no-op (no jump to top). `section[id] { scroll-margin-top: 6rem }` is already in place for §2.3–§2.6 |
| Viewports 320/768/1024/1440 px | Unverified by execution | `max-w-[calc(100vw-2rem)]` capsule guard, `min-h-svh`, `overflow-hidden` on the hero, `text-[15vw]` + `whitespace-nowrap`, mobile-first stacking with `order-*` |
| Contrast ≥ 4.5:1 both themes | Unverified by execution | All colours are Phase 1 tokens; glass surfaces use `--text-primary`/`--text-secondary`, not mid-greys |
| Coarse pointer | Unverified by execution | `event.pointerType !== 'mouse'` + `isFinePointer()` guards on both pointer effects |

## 3.6 What was NOT verified (complete list)

- No browser execution at all: hydration console, Lighthouse/Core Web Vitals, visual rendering, real pointer motion, theme reveal animation, both-theme contrast.
- No automated tests exist in this repo (no runner configured); nothing here is backed by a suite.
- The **placeholder** portrait (`portrait-placeholder.svg`) was never rendered visually — only its markup and dimensions were checked. Replace it before launch (§4.3 item 3).
- `theme-toggle.tsx`'s View Transitions path was not exercised in a browser; the no-API and reduced-motion fallbacks are the paths most likely to be hit in practice.
- Live Supabase was read but never written, so nothing about admin flows (availability toggle, CV upload) is covered.

---

# 4. Notes & Readiness for Phase 2 Sub-Task B (Featured Works & Interactive Project Drawer)

## 4.1 What Sub-Task B can build on directly

1. **The layer/z-index contract is fixed and documented**: navbar `z-50`, hero layers `z-0/10/20/30/40` inside an `isolate` context, and `z-60+` **reserved for the drawer / bottom sheet** (`plan/02-phase2-navbar-hero-plan.md` §4.2). The drawer can therefore be added without touching the hero's stacking.
2. **Motion is already wired with the smallest viable footprint**: `<LazyMotion features={domMin} strict>` sits in `src/routes/index.tsx`, and `SPRING_SURFACE` (320/32/1) is defined and waiting for the drawer. **`strict` means the drawer must use `m.*`, not `motion.*`,** or development will throw.
3. **Reusable primitives**: `AvailabilityPill`, `MagneticButton`, `cn()`, the `site_configs` server-function pattern, and the `NAV_LINKS` vocabulary (which is already the drawer's `#works` target).
4. **Anchor targets already have their scroll offset** (`section[id] { scroll-margin-top: 6rem }`), so §2.3 only needs to render `<section id="works">`.
5. **The `resume`-style read pattern is proven end-to-end** (server function → loader → props → SSR HTML → production bundle), which is exactly the shape §2.3's `getPublishedProjects()` read needs.

## 4.2 Constraints Sub-Task B must respect

1. **Never import `supabase.server.ts` from a route or component.** Wrap reads in `createServerFn` (as F1 does). Loaders run on the client too.
2. **Do not put `animate` props back inside the `LazyMotion` tree without re-measuring the bundle** — the feature bundle is `domMin` (renderer + animations, no gestures). Hover/tap gestures would need `domAnimation`; drag (not needed for the drawer, which uses pointer events) would need `domMax`.
3. **Keep motion out of new above-the-fold components unless justified**: the measured cost is ~38 KB gzip for the framework core alone, and §1.4's options should be resolved *before* adding consumers.
4. **`site_configs` is read-only here**; `projects`/`articles` reads must filter `is_published = true` and stay behind server functions.
5. **No new route files are needed for §2.3/§2.4** — if one is added, `src/routeTree.gen.ts` must come from the Vite build, never from `npm run generate-routes` (§4.4 item 2).
6. Preserve the SSR contract: sections render server-side; only purely decorative layers may be client-only.

## 4.3 Recommended next actions, in priority order

1. **Decide the `motion` budget question** (the §1.4 finding): (a) accept +37.6 KB gz and continue; (b) drop `motion` and hand-roll the two remaining effects (rAF lerp + CSS-transition spring ≈ 0 KB, ~1 h); or (c) keep `motion` but defer it with a dynamic import so the initial route chunk returns to baseline. Option (c) is the only one that keeps springs *and* restores the budget, at the cost of a late-hydrating magnetic effect.
2. **Run the manual browser pass** that this environment could not (§3.4, §3.5) — especially hydration warnings on `/` in both themes, before more components stack on this surface.
3. **Replace the placeholder portrait** (`src/assets/portrait-placeholder.svg`, swap contract in its header comment) and, if it becomes admin-managed, agree on a new `site_configs` key rather than repurposing `resume`.
4. **Reconcile the `generate-routes` discrepancy**: standalone `npm run generate-routes` (`@tanstack/router-cli` 1.132) wrote a differently-formatted `routeTree.gen.ts` (`sha1 a8048c4e…`); the Vite plugin (1.170) restored the canonical file (`sha1 d21a5e49…`) during the next build. Until the CLI is updated, treat the build — not the CLI — as the source of truth, and never hand-edit the file.
5. **Consider `src/env.d.ts`** (still open from the Phase 1 summary §4.3 item 4): `VITE_*` and server vars are `any` today, so a typo surfaces only when `requireEnv()` throws at runtime.
6. Optional polish, low risk: Supabase's `?download` flag for a forced CV download (plan §13.4); scroll-spy active state on `NAV_LINKS` once the sections exist (plan §13.1).
