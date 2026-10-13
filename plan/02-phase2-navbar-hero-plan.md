# Phase 2 — Sub-Task A Technical Implementation Plan

## Global Layout, Floating Glass Pill Navbar & Editorial Hero Section

| | |
| --- | --- |
| **Status** | Approved — execution not started |
| **Scope** | ROADMAP §2.1 (Global Layout & Floating Glass Pill Navbar), §2.2 (Hero Section, Editorial Layering Experience), landing-page integration |
| **Depends on** | Phase 1 complete — tokens + `@theme inline` (`src/styles/app.css`), theme engine (`src/routes/__root.tsx`), Supabase SSR clients (`src/lib/supabase.ts`, `src/lib/supabase.server.ts`), `SiteConfigValueMap` (`src/types/database.ts`) |
| **Target stack** | TanStack Start 1.168.60 · React 19.2 · Vite 8 · Nitro 3 · Tailwind 4.1.18 · TypeScript 6 strict · `motion` 14 |
| **Deliverable of this document** | An executable, step-ordered plan with per-step gates. **No production code is written until this plan is approved.** |

---

## 1. Objective, Scope & Definition of Done

### 1.1 Objective

Render the first real public surface of the site: an SSR landing page (`/`) whose layout is built from four composited hero layers, fronted by a floating glassmorphism navigation pill that also owns the theme switch and the dynamic CV download trigger.

### 1.2 In Scope

1. `src/components/navbar.tsx` — centered floating capsule at `top-6`, glass surface, monogram, anchor links (Works, Services, Articles, Contact), theme toggle, resume trigger, scroll-shrink response.
2. `src/components/hero.tsx` — Layer 1 damped cursor spotlight, Layer 2 massive background typography, Layer 3 monochrome portrait cutout + dynamic Availability Pill, Layer 4 value proposition + magnetic CTAs.
3. `src/routes/index.tsx` — `createServerFn`-backed loader that reads `availability` and `resume` from `site_configs`, composed with zero client hydration mismatch.
4. Supporting modules: server function seam, motion constants, class-name helper, site constants, placeholder portrait asset, and the small CSS additions the above requires.

### 1.3 Out of Scope (explicitly, to prevent creep)

| Not in this sub-task | Owner |
| --- | --- |
| Works / Services / Articles / Contact **sections** and their `id` targets | ROADMAP §2.3–§2.6 |
| Project detail Drawer + mobile Bottom Sheet | ROADMAP §2.4 |
| `Project`/`Article` reads, article cards, contact form + Zod server function | ROADMAP §2.3–§2.6 |
| JSON-LD (`Schema.org/Person`), OG metadata, per-route SEO `head()` machinery | ROADMAP §3.4 |
| Self-hosted font migration | ROADMAP §5.1 |
| New route files (no `src/routes/**` additions) — `src/routeTree.gen.ts` must stay byte-identical | — |
| ESLint / Prettier / Vitest | not configured in this repo (AGENTS.md) |

### 1.4 Definition of Done (this sub-task)

- [ ] `npm run typecheck` exits 0.
- [ ] `npm run build` exits 0; client bundle contains no server-only needle (`SUPABASE_SERVICE_ROLE_KEY`, `createSupabaseServerClient`, `getSiteConfig`).
- [ ] `curl -s localhost:3000/` returns the pill label **read from the live `site_configs` row** (grep for the live string `Available for Projects`) — proving the label is data, not a constant.
- [ ] SSR HTML contains the navbar capsule, the hero `<h1>`, and the background typography layer — content is server-rendered, not client-mounted.
- [ ] Browser console shows zero React hydration mismatch errors on `/` in both themes.
- [ ] `prefers-reduced-motion: reduce` disables the spotlight, magnetic offset, scroll shrink animation and the theme circular reveal.
- [ ] Keyboard-only pass: `Tab` reaches monogram → 4 anchors → theme toggle → resume trigger; focus ring visible; no trap.
- [ ] `.output/` and all scratch artifacts removed; only the inventory in §4.3 exists.

---

## 2. Verified Baseline (facts read from this checkout)

### 2.1 Repository / tooling facts

- `src/` currently contains: `router.tsx`, `routes/__root.tsx`, `routes/index.tsx` (14-line placeholder), `styles/app.css`, `lib/supabase.ts`, `lib/supabase.server.ts`, `types/database.ts`, `routeTree.gen.ts`.
- **No `src/components/`, no `public/`, no `hooks/` directory exists yet.**
- `package.json` dependencies already include `clsx` and `tailwind-merge` (installed, currently unused) and `lucide-react`. **No animation library is installed.**
- `motion` latest is `14.0.0`, `peerDependencies: react ^18 || ^19` (checked against the npm registry from this environment).
- Scripts: `dev`, `typecheck`, `build`, `preview`, `generate-routes`. No linter, no formatter, **no test runner**.
- Path aliases `#/*` and `@/*` resolve to `./src/*`, but existing code uses relative imports; this plan follows the existing style.
- `tsconfig.json` is `strict` with `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` → type-only imports must be `import type`, and no dead constant may survive `typecheck`.

### 2.2 Phase 1 contracts this plan must honor

1. **Token vocabulary is live.** `bg-bg-base`, `bg-surface-glass`, `border-border-subtle`, `border-border-hover`, `text-text-primary`, `text-text-secondary`, `text-text-muted`, `text-accent-emerald`, `text-accent-glow`, `font-display`, `font-sans`, `font-mono` all generate from `@theme inline`. The `.dark` block in `src/styles/app.css` is the default surface, switched by the `dark` class on `<html>`.
2. **Theme contract is fixed.** Toggling means `classList.toggle('dark', isDark)` + `style.colorScheme` + `localStorage.setItem('theme', 'dark' | 'light')`. FOUC is already prevented by the blocking `THEME_INIT_SCRIPT`; first-visit resolve order is stored → OS preference → dark.
3. **Server-only seam.** `src/lib/supabase.server.ts` carries `import '@tanstack/react-start/server-only'`; Phase 1 proved the build **fails** if a client-environment module imports it. Route loaders run on the client too, so a loader must not call those helpers directly.
4. **Server functions only.** `createSupabaseServerClient()` uses `getCookies`/`setCookie`/`setResponseHeader`, which throw outside request handling.
5. **CV config key is `resume`** (live: `{"url": null, "updated_at": null}`) and the **availability label is user data**: live `{"label":"Available for Projects","status":"available"}`. Neither may be hardcoded.
6. **`createServerFn` API in 1.168.60**: `createServerFn({ method: 'GET' | 'POST' })` → `.handler(fn)`; `inputValidator` exists but is unnecessary for a no-input read.

### 2.3 Import-protection behaviour relevant to the data seam (verified in `node_modules`)

`@tanstack/start-plugin-core`'s import-protection plugin special-cases **server-function lookup modules**: an import resolved while pre-transforming a `createServerFn` module is recorded in `env.serverFnLookupModules` and the violation is *deferred* rather than fatal (`plugin.js:857–860`, `:950`, `:1091`). That is what makes the documented pattern — top-level `import { getSiteConfig } from '../lib/supabase.server'` inside a server-function module — legal in the client build.

This is a **mechanism-level** reading, not an end-to-end run: §10 Step 3 gates on a real `npm run build`, and §12 R1 defines the fallback (dynamic `await import()` inside the handler).

### 2.4 Decisions taken with the user (recorded)

| Decision | Chosen | Consequence |
| --- | --- | --- |
| Motion engine | **Install `motion` (Framer Motion successor) v14** | New dependency; springs (`stiffness`/`damping`) per UX spec §6A; §11.2 measures the client-chunk delta with `LazyMotion` as the documented fallback |
| Hero portrait source | **Bundled placeholder in `src/assets/`** | No schema change, no new `site_configs` key; one documented swap point; explicit dimensions keep CLS at 0 |
| Navbar mount point | **Landing-scoped, rendered from `src/routes/index.tsx`** | Smallest verifiable diff; Phase 3 lifts it into a root layout when `/articles` exists. `__root.tsx` is **not modified** |

---

## 3. Dependencies & Assets

### 3.1 New dependency

| Package | Version | Why | Gate |
| --- | --- | --- | --- |
| `motion` | `^14.0.0` | Spring physics for spotlight damping, magnetic CTA, navbar shrink, and `MotionConfig reducedMotion="user"` | `npm install motion@^14` resolves; `npm ls motion` prints one entry; lockfile updated |

Imports come from the React entry point only: `motion/react` (`motion`, `MotionConfig`, `useMotionValue`, `useMotionTemplate`, `useMotionValueEvent`, `useAnimationFrame`, `useSpring`, `useScroll`). Not from `framer-motion` (same package, legacy name) — avoids duplicate copies in the bundle.

### 3.2 Bundle budget discipline

PRD §6 targets LCP < 1.5s, CLS = 0. `motion`'s full component adds roughly 30–40 KB gzip. §11.2 therefore records the gzip size of the landing chunk before/after; if the delta exceeds 20 KB gzip, §12 R4's ladder applies: `LazyMotion` + `domAnimation` with `m`, then (last resort) hand-rolled rAF for the spotlight only.

### 3.3 Portrait asset

| Item | Value |
| --- | --- |
| Path | `src/assets/portrait-placeholder.svg` |
| Nature | Hand-authored monochrome chiaroscuro silhouette (dark→darker vertical ramp + soft rim light), `viewBox="0 0 1200 1600"` (3:4), no text |
| Import | `import portraitUrl from '../assets/portrait-placeholder.svg'` — Vite emits a hashed, cacheable URL |
| Swap point | One comment block above the import in `hero.tsx` stating the replacement contract: 3:4 (or consistent ratio), monochrome, high contrast, ≥1200 px wide |
| Why SVG | Authorable/reviewable as text in this environment, deterministic bytes, no unexplained binary blob checked in |

---

## 4. Architecture

### 4.1 Data flow and render tree

```
                      (server request for "/")
                                │
        src/routes/index.tsx    ▼
        loader  ──► getLandingConfig()  ──►  createServerFn (GET)
                          │                      │  executes in-process on the server
                          │                      ▼
                          │            src/lib/supabase.server.ts
                          │              getSiteConfig('availability')  ─┐  anon-key RLS SELECT
                          │              getSiteConfig('resume')        ─┘
                          │
        loader data (serialised into the SSR dehydration payload)
                          │
   ┌──────────────────────┴──────────────────────┐
   ▼                                             ▼
<Navbar resumeUrl={...} />                   <Hero availability={...} />
   ├─ Monogram                                   ├─ <HeroSpotlight />       Layer 1 (client-only, decorative)
   ├─ <NavLink>×4                                ├─ background type layer   Layer 2 (SSR text)
   ├─ <ThemeToggle />                            ├─ portrait + <AvailabilityPill />  Layer 3 (SSR)
   └─ <ResumeTrigger />                          └─ <h1> + <MagneticButton>×2        Layer 4 (SSR)
```

No component on this page performs its own fetch: `availability`/`resume` are serialised by the router's SSR dehydration and read on the client from `Route.useLoaderData()`, so the first client render uses the **same values** the server did → structurally mismatch-free.

### 4.2 Layering & z-index contract

| Layer | Element | z-index | Pointer events |
| --- | --- | --- | --- |
| Fixed navigation pill | `<Navbar>` | `z-50` | yes |
| Hero Layer 1 — spotlight | `<HeroSpotlight>` | `z-0` | none (`pointer-events-none`, `aria-hidden`) |
| Hero Layer 2 — massive typography | background span | `z-10` | none (`select-none pointer-events-none`, `aria-hidden`) |
| Hero Layer 3 — portrait + pill | `<img>` + `<AvailabilityPill>` | `z-20` (pill `z-30`) | none |
| Hero Layer 4 — copy + CTAs | `<h1>`, CTAs | `z-40` | yes |
| Reserved for Phase 2.4 | Drawer / Bottom Sheet | `z-60`+ | — |

Hero root uses `isolate` so these values are scoped and cannot fight the future drawer's stacking context.

### 4.3 File inventory

**New (F)**

| # | Path | Purpose |
| --- | --- | --- |
| F1 | `src/server-fns/site-config.ts` | `getLandingConfig` server function + runtime shape guards |
| F2 | `src/lib/site.ts` | `SITE_MONOGRAM`, `NAV_LINKS`, `NAV_SCROLL_THRESHOLD` |
| F3 | `src/lib/cn.ts` | `cn()` = `clsx` + `twMerge` (both already installed) |
| F4 | `src/lib/motion.ts` | Spring/lerp constants transcribed from UX spec §6 + pointer-capability helpers |
| F5 | `src/components/theme-toggle.tsx` | Dark/Light switch + View Transitions circular reveal |
| F6 | `src/components/navbar.tsx` | Floating glass capsule (composition root for F5 + F7) |
| F7 | `src/components/resume-trigger.tsx` | CV download affordance bound to `resume.url` |
| F8 | `src/components/availability-pill.tsx` | Dynamic status pill (Layer 3) |
| F9 | `src/components/magnetic-button.tsx` | Magnetic glass CTA / secondary link |
| F10 | `src/components/hero-spotlight.tsx` | Layer 1 damped cursor spotlight |
| F11 | `src/components/hero.tsx` | Layer composition (Layers 2–4 + F8–F10) |
| F12 | `src/assets/portrait-placeholder.svg` | Placeholder portrait (§3.3) |

**Modified (M)**

| # | Path | Change |
| --- | --- | --- |
| M1 | `src/routes/index.tsx` | Real route: `loader` + `Route.useLoaderData()` + `<Navbar>`/`<Hero>` composition |
| M2 | `src/styles/app.css` | `::view-transition-*` reveal keyframes, `.hero-portrait-mask`, `scroll-behavior` + `section[id]` `scroll-margin-top`, reduced-motion guards |
| M3 | `package.json`, `package-lock.json` | `motion@^14` |

**Verified-unchanged (re-check at the end)**

`src/routes/__root.tsx`, `src/routeTree.gen.ts`, `src/lib/supabase.ts`, `src/lib/supabase.server.ts`, `src/types/database.ts`, `tsconfig.json`, `vite.config.ts`, `tsr.config.json`, `vercel.json`, `docs/**`, `supabase/**`.

---

## 5. SSR Data-Fetching Seam

### 5.1 `src/server-fns/site-config.ts` — contract

| Aspect | Specification |
| --- | --- |
| Definition | `export const getLandingConfig = createServerFn({ method: 'GET' }).handler(async () => { … })` |
| Imports | **Top-level** `import { getSiteConfig } from '../lib/supabase.server'` — legal per §2.3, verified by the build in §10 Step 3; fallback in §12 R1 |
| Reads | `Promise.all([getSiteConfig('availability'), getSiteConfig('resume')])` — two anon-key SELECTs, both `maybeSingle()` under the hood |
| Shape guards | `availability` arrives as `jsonb`; local `isAvailability(v): v is SiteConfigValueMap['availability']` requires `typeof label === 'string'` and `status === 'available' \| 'busy'`; equivalent `isResume`. Keeps an admin typo from rendering `[object Object]`. |
| Return shape | Plain serialisable object only: `{ ok, availability, resume }`. No `Date`, no class instances, no `undefined` values. |
| Error policy | Body wrapped in `try/catch`. On throw (missing env var, network, RLS change): `console.error` **server-side**, then `{ ok: false, availability: null, resume: null }`. A config outage degrades the pill and CV button; it must not 500 the landing page. |
| Types | `export interface LandingConfig { ok: boolean; availability: SiteConfigValueMap['availability'] \| null; resume: SiteConfigValueMap['resume'] \| null }` — consumed with `import type` (`verbatimModuleSyntax`). |

### 5.2 Route loader in `src/routes/index.tsx`

```
export const Route = createFileRoute('/')({
  loader: () => getLandingConfig(),
  staleTime: 60_000,
  component: Home,
})
```

- `loader` (not `beforeLoad`) because it feeds render-time data.
- `staleTime: 60_000` lets client-side navigations reuse the payload; it does not affect the initial SSR render.
- `component: Home` consumes `const { availability, resume } = Route.useLoaderData()`.
- `RouterOptions.defaultPreloadStaleTime: 0` in `router.tsx` concerns preloading other routes; unchanged.
- **No `head()`** in this sub-task (SEO machinery is Phase 3; adding it now would collide with §3.4's work).

### 5.3 Hydration contract (zero mismatch)

Three rules — they are why the components in §6 look the way they do:

1. **No client-only read in first render.** Theme is never read from `localStorage`/`matchMedia` during render (R3 enumerates the rejected alternatives).
2. **Server-shape = client-shape.** The spotlight (Layer 1) mounts **after** hydration via an effect, contributing nothing to the SSR HTML. All other layers render identical markup because their only inputs are loader data.
3. **Pointer/scroll-dependent values start at a deterministic value** (`0` offsets, `scrolled = false`) and are corrected in effects; `useScroll()` reports `0` on the server, matching a fresh client render.

### 5.4 Degradation matrix

| Failure | Render result |
| --- | --- |
| `availability` absent / malformed / `ok: false` | Pill is **not** rendered; hero keeps reserved space (no shift, no fabricated label) |
| `resume.url === null` (today's live state) | Resume trigger renders disabled, `aria-disabled="true"`, explanatory `title` — never a dead link |
| Supabase env vars missing (fresh clone) | Same as `ok: false`; page renders; server logs the `requireEnv` error |

---

## 6. Component Specifications

All components are interactive but **SSR-renderable**; none uses effect-gated rendering except `HeroSpotlight`, which is deliberately client-only.

### 6.1 `src/lib/site.ts` (F2)

| Export | Value | Note |
| --- | --- | --- |
| `SITE_MONOGRAM` | `'MY'` | From UX spec §3A wireframe (`[ MY ]`); one-line change for real initials |
| `NAV_LINKS` | `Works#works`, `Services#services`, `Articles#articles`, `Contact#contact` (as `{ label, href }[]`) | Order/vocabulary fixed by spec; targets land in §2.3–§2.6 |
| `NAV_SCROLL_THRESHOLD` | `80` | UX spec §3A: shrink at `y > 80px` |

Plain anchors (not router `<Link>`) because every target is a same-document fragment on `/`.

### 6.2 `src/lib/cn.ts` (F3)

`export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }` — needed because several components compose base classes with conditional glass/scroll/motion-off states.

### 6.3 `src/lib/motion.ts` (F4)

Single place where the spec's physics numbers live, so UX spec §6A/§6B are auditable against one file.

| Export | Value | Spec source |
| --- | --- | --- |
| `SPRING_HOVER` | `{ type: 'spring', stiffness: 400, damping: 25 }` | §6A "Scale & Hover Feedback" |
| `SPRING_SURFACE` | `{ type: 'spring', stiffness: 320, damping: 32, mass: 1 }` | §6A "Drawer & Modal" (reserved for 2.4; exercised once here for the navbar shrink) |
| `SPOTLIGHT_SIZE` | `600` px | §3B Layer 1 |
| `SPOTLIGHT_LERP` | `0.08` | §3B Layer 1 |
| `MAGNETIC_RADIUS` | `35` px | §6B |
| `MAGNETIC_MAX_OFFSET` | `8` px | §6B |
| `THEME_REVEAL_MS` | `400` | §6C |
| `isFinePointer()` | `matchMedia('(pointer: fine)')` | desktop-pointer gating for §6B |
| `prefersReducedMotion()` | `matchMedia('(prefers-reduced-motion: reduce)')` | UX spec §8.2 |

Both helpers are **called inside effects/handlers**, never during render (they touch `window`).

### 6.4 `src/components/theme-toggle.tsx` (F5)

| Prop | Type | Default |
| --- | --- | --- |
| `className` | `string \| undefined` | `undefined` |

**State model (mismatch-free):** `const [isDark, setIsDark] = useState<boolean | null>(null)`.

- `null` on the server and first client render → the *visible* icon is decided purely by CSS via the `.dark` class: `<Moon className="h-4 w-4 dark:hidden" />` + `<Sun className="hidden h-4 w-4 dark:block" />`, both `aria-hidden`.
- A `useEffect` syncs `isDark` from `document.documentElement.classList.contains('dark')`; `null` is only ever a post-hydration instant.
- `aria-label` = `isDark === null ? 'Toggle color theme' : isDark ? 'Switch to light theme' : 'Switch to dark theme'` — stable initial text, so SSR and client agree; the refinement after hydration cannot cause a mismatch (effects never participate in hydration comparison).

**Toggle behaviour (`onClick`)**

1. `const next = !document.documentElement.classList.contains('dark')` — resolved from the DOM at click time so the handler is never stale.
2. `applyTheme(next)`: `classList.toggle('dark', next)`; `style.colorScheme = next ? 'dark' : 'light'`; `localStorage.setItem('theme', next ? 'dark' : 'light')` — exactly the Phase 1 contract, no second source of truth.
3. If `startViewTransition` is unavailable **or** reduced motion is requested → `applyTheme(next)` directly, no animation, no flicker.
4. Otherwise set `--vt-x`/`--vt-y` on `document.documentElement` from the click's `clientX/clientY`, then `document.startViewTransition(applyTheme(next))`; the reveal is pure CSS (§6.12 M2). `startViewTransition` is reached through a locally declared interface + `'startViewTransition' in document` narrowing (no `any`, no `@ts-ignore`), so TS 6's `lib.dom` typings are never a hard requirement.
5. `setIsDark(next)` only for the `aria-label` refinement (never used for styling).

**A11y**: real `<button type="button">`, ≥36×36 px target, `focus-visible:ring-1 ring-text-primary/40` (legible in both themes), label always present.

### 6.5 `src/components/navbar.tsx` (F6)

| Prop | Type | Default |
| --- | --- | --- |
| `resumeUrl` | `string \| null` | required |
| `className` | `string \| undefined` | `undefined` |

**Outer element**

```
<header className={cn(
  'fixed inset-x-0 top-6 z-50 mx-auto w-max max-w-[calc(100vw-2rem)]',
  'rounded-full border border-border-subtle bg-surface-glass backdrop-blur-md',
  'shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.37)]',
  scrolled && 'border-border-hover backdrop-blur-lg',
)}>
```

- Geometry from UX spec §3A: `top-6 inset-x-0 mx-auto w-max z-50`.
- `max-w-[calc(100vw-2rem)]` is an addition so the capsule never clips at 320 px (D3 in §9).
- Glass values map through Phase 1 tokens (`bg-surface-glass` = `rgba(9,9,11,0.65)` dark / `rgba(255,255,255,0.70)` light) instead of the spec's literal `bg-zinc-950/60` / `bg-white/70`; the shadow pair keeps the spec's literal values because no shadow token exists (D1).

**Anatomy (inside, `flex items-center gap-1 px-2 py-2`)**

| Order | Element | Notes |
| --- | --- | --- |
| 1 | Monogram `[ MY ]` | `font-mono text-xs tracking-widest text-text-secondary`, `select-none` |
| 2 | Hairline separator | `hidden h-5 w-px bg-border-subtle md:block` |
| 3 | 4 anchor links | container `hidden items-center gap-1 md:flex`; each `rounded-full px-3.5 py-2 text-sm text-text-secondary transition-colors hover:bg-text-primary/5 hover:text-text-primary focus-visible:ring-1 focus-visible:ring-text-primary/40` |
| 4 | Hairline separator | as above |
| 5 | `<ThemeToggle />` | §6.4 |
| 6 | `<ResumeTrigger resumeUrl={resumeUrl} />` | §6.7 |

**Scroll response (UX spec §3A)**: `const { scrollY } = useScroll()` + `useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > NAV_SCROLL_THRESHOLD))`, guarded to fire only on threshold crossing (React state, never per frame). Render: `<motion.header animate={{ scale: scrolled ? 0.95 : 1 }} transition={SPRING_SURFACE} …>`. `scrolled` starts `false` → SSR/client agree; a reload restored at a scrolled position corrects on the first listener tick.

**Mobile behaviour (default, no hamburger)**: below `md` the capsule renders monogram + theme toggle + resume trigger only. A mobile menu is specified nowhere in `docs/`, and inventing a second navigation pattern would conflict with Phase 3's extract-to-root-layout step. Links return at `md`+.

### 6.6 `src/components/availability-pill.tsx` (F8)

| Prop | Type | Notes |
| --- | --- | --- |
| `label` | `string` | **Data only** — never a constant; live value today `"Available for Projects"` |
| `className` | `string \| undefined` | positioning from the parent |

- `rounded-full border border-border-subtle bg-surface-glass backdrop-blur-md` capsule, 6 px status dot + `font-mono text-[11px] uppercase tracking-widest` label.
- Dot: `bg-accent-emerald` when `status === 'available'`, plus a `motion.span` ring with `animate={{ scale: [1, 2.4], opacity: [0.55, 0] }}`, `transition={{ duration: 2.4, ease: 'easeOut', repeat: Infinity }}`; when `status === 'busy'` only the flat dot (`bg-text-muted`), no pulse.
- Reduced motion: the pulse sits inside the `MotionConfig reducedMotion="user"` subtree (§6.10), so motion suppresses it without any server/client-visible branch.
- A11y: plain text in a `<span>`, **no** `aria-live` (load-time data, not an event).
- Contrast: emerald on the glass surface with the label in `text-text-secondary` meets §8.3's 4.5:1 (spot-checked in §11.5).

### 6.7 `src/components/resume-trigger.tsx` (F7)

| Prop | Type |
| --- | --- |
| `resumeUrl` | `string \| null` |

- `resumeUrl !== null` → `<a href={resumeUrl} target="_blank" rel="noopener noreferrer" aria-label="Download CV (PDF)">` with the `Download` icon + `sr-only` text, styled like the theme toggle.
- `resumeUrl === null` (today's live state) → `<button type="button" disabled aria-disabled="true" title="CV not uploaded yet">` at `opacity-40 cursor-not-allowed`. Disabled-but-present keeps capsule width stable across states and surfaces the affordance before the PDF exists.
- **No `download` attribute**: ignored for cross-origin URLs, and Supabase Storage is a different origin. If a forced attachment is wanted later, Supabase's `?download` query flag is the supported mechanism (§13).
- The URL is used exactly as stored in `site_configs`; this component never rewrites admin data.

### 6.8 `src/components/magnetic-button.tsx` (F9)

| Prop | Type | Default |
| --- | --- | --- |
| `children` | `React.ReactNode` | required |
| `href` | `string` | required |
| `variant` | `'primary' \| 'secondary'` | `'primary'` |
| `className` | `string \| undefined` | `undefined` |

- Renders `<motion.a href={href} style={{ x, y }} …>` inside a wrapper `<span className="relative inline-flex p-9 -m-9">`: `p-9` (36 px ≈ the spec's 35 px radius) + negative margin gives the extended hit field **without** a global `pointermove` listener.
- `onPointerMove`: ignore when `e.pointerType !== 'mouse'`, `!isFinePointer()`, or reduced motion. Otherwise compute the centre→pointer vector, normalise, set targets to `clamp(length, 0, MAGNETIC_MAX_OFFSET)` px along it; `useSpring(SPRING_HOVER)` supplies the suck-in. `onPointerLeave`/`onBlur` resets to `0`.
- Both springs start at `0` and the wrapper geometry is static → SSR and first client render are identical. Transform via motion's `x`/`y`; `will-change: transform` is applied only while hovered.
- Variants:
  - `primary` — "Start a Project": `rounded-full border border-accent-emerald/40 bg-surface-glass px-6 py-3 font-medium text-text-primary backdrop-blur-md` + emerald glow on hover (`box-shadow: 0 0 0 1px var(--accent-glow), 0 8px 32px var(--accent-glow)`).
  - `secondary` — "Explore Works": text + `↗`-style arrow rotating 45° on hover (`transition-transform`), transparent surface.
- A11y: real anchors with `focus-visible` rings in both themes; the offset is decorative and keyboard activation is unaffected.

### 6.9 `src/components/hero-spotlight.tsx` (F10)

| Prop | Type | Default |
| --- | --- | --- |
| `className` | `string \| undefined` | `undefined` |
| `size` | `number` | `SPOTLIGHT_SIZE` (600) |
| `lerp` | `number` | `SPOTLIGHT_LERP` (0.08) |

- **Client-only by construction**: `const [mounted, setMounted] = useState(false)` + `useEffect(() => setMounted(true), [])`; returns `null` until mounted. This layer has zero SSR value (an unpositioned radial gradient), and gating it removes an entire class of mismatch risk for the least load-bearing layer. §12 R2 records the rejected alternative (SSR-render at a fixed centre).
- Implementation: `useMotionValue` for target `(tx, ty)` and current `(x, y)`; `useAnimationFrame(() => { x.set(x.get() + (tx.get() - x.get()) * lerp); … })` — the literal damped lerp `0.08` from UX spec §3B, which a spring cannot express; `useMotionTemplate` produces `` radial-gradient(600px circle at ${x}px ${y}px, var(--accent-glow), transparent 70%) `` for `backgroundImage`; `style={{ opacity }}` is a MotionValue animating `0 → 1` on the first `pointermove` (~250 ms) so the layer never flashes in a corner.
- Listeners: one `window` `pointermove` with `{ passive: true }`, removed on unmount; ignored when `!isFinePointer()` or reduced motion is requested. The loop runs while mounted (motion suspends rAF on hidden tabs) and performs two `set()` calls per frame with **zero** React renders; the idle-stop alternative is rejected in §12 R5.
- A11y: `aria-hidden="true"`, `pointer-events-none`, `absolute inset-0 z-0`.

### 6.10 `src/components/hero.tsx` (F11)

| Prop | Type |
| --- | --- |
| `availability` | `LandingConfig['availability']` (`null` allowed) |

Root: `<section id="hero" className="relative isolate flex min-h-svh items-center overflow-hidden">`

| Layer | Markup | Key classes |
| --- | --- | --- |
| 1 | `<HeroSpotlight />` | `absolute inset-0 z-0` |
| 2 | `<div aria-hidden className="pointer-events-none absolute inset-0 z-10 flex select-none items-center justify-center">` → `<span>ENGINEER</span>` | `font-display text-[15vw] font-extrabold leading-[0.8] tracking-tighter whitespace-nowrap text-text-primary/[0.06] dark:text-text-primary/[0.04]` |
| 3 | wrapper `relative z-20` → portrait `<img>` + pill | img: `hero-portrait-mask h-auto w-[min(42vw,420px)] object-cover grayscale contrast-125`, `width={1200} height={1600}`, `alt=""` (decorative — the pill carries the only real information here), `decoding="async"`, `loading="eager"`, `fetchPriority="high"`; wrapper `aria-hidden` |
| 3b | `<AvailabilityPill label={availability.label} className="absolute -bottom-3 left-4 z-30" />` | rendered **only** when `availability !== null` |
| 4 | Copy block: `<h1>` + CTA row | `<h1 className="max-w-3xl font-display text-5xl leading-[0.95] font-extrabold tracking-tighter sm:text-7xl lg:text-8xl">Crafting high-impact digital systems with architectural precision.</h1>` (UX spec §3B) + "Start a Project" (`href="#contact"`, primary) and "Explore Works" (`href="#works"`, secondary) |

- Layout: `grid grid-cols-1 items-center gap-12 lg:grid-cols-12`; copy in `lg:col-span-7`, portrait in `lg:col-span-5` (asymmetric centre-right per spec §3B). Below `lg`: typography layer → portrait (`max-w-[60vw]`, opacity `0.9`) → copy, so mobile still reads as layered without collisions.
- `<MotionConfig reducedMotion="user">` wraps the hero, so the pill pulse and magnetic springs honour the OS setting declaratively and identically on server and client.
- The `<h1>` is the page's single H1 and uses the spec's headline verbatim.

### 6.11 `src/routes/index.tsx` (M1)

```
export const Route = createFileRoute('/')({
  loader: () => getLandingConfig(),
  staleTime: 60_000,
  component: Home,
})

function Home() {
  const { availability, resume } = Route.useLoaderData()
  return (
    <>
      <Navbar resumeUrl={resume?.url ?? null} />
      <main>
        <Hero availability={availability} />
      </main>
    </>
  )
}
```

- `<main>` is the single page landmark; `Navbar` renders `<header>`, so the outline is `header` → `main`.
- The old placeholder markup is fully removed; no debug output survives (§10 Step 9).

### 6.12 `src/styles/app.css` additions (M2)

Three clearly commented blocks; no existing token or `@theme inline` line is touched.

| Block | Content | Why not a utility |
| --- | --- | --- |
| View Transition reveal | `::view-transition-old(root) { animation: none }`, `::view-transition-new(root) { animation: theme-reveal 400ms cubic-bezier(.22,1,.36,1) }`, `@keyframes theme-reveal { from { clip-path: circle(0% at var(--vt-x) var(--vt-y)) } to { clip-path: circle(150% at var(--vt-x) var(--vt-y)) } }` — the `400ms` is a CSS literal that must stay in sync with `THEME_REVEAL_MS` in F4 | View Transition pseudo-elements are not addressable by utilities |
| Reduced-motion guard | `::view-transition-new(root) { animation: none }`, `html { scroll-behavior: auto }` | Media-query-scoped override of the rules above |
| Smooth in-page navigation | `html { scroll-behavior: smooth }` in `@layer base` + `section[id] { scroll-margin-top: 6rem }` | Global, not per-element; `6rem` clears the fixed capsule (`top-6` + ~3rem) once Phase 2.3+ sections exist |
| `.hero-portrait-mask` | `-webkit-mask-image` **and** `mask-image: linear-gradient(to bottom, #000 68%, transparent 100%)` | Cross-browser mask needs both properties; a utility emits only one |

The reveal animates only `clip-path`/`animation` — no layout-affecting property — so CLS stays 0.

---

## 7. Motion & Interaction Strategy

### 7.1 Physics inventory (one row per animated surface)

| Surface | Mechanism | Parameters | Reduced-motion behaviour |
| --- | --- | --- | --- |
| Spotlight follow | rAF damped lerp (motion `useAnimationFrame`) | `lerp 0.08`, 600 px diameter | Layer never fades in |
| Magnetic CTA | `useSpring` on `x`/`y` | `stiffness 400, damping 25`, radius 35 px, max 8 px | Offsets stay 0; handler no-ops |
| Navbar shrink | `motion.header animate` on `scale` | `stiffness 320, damping 32, mass 1`; threshold `y > 80` | Scale stays 1; colours only |
| Pill pulse | `animate` keyframes, `repeat: Infinity` | 2.4 s `easeOut`, scale 1→2.4 | Suppressed by `MotionConfig reducedMotion="user"` |
| Theme switch | View Transitions API + CSS `clip-path` circle | 400 ms `cubic-bezier(.22,1,.36,1)` | Direct class swap, no transition object |
| Link/button hover | CSS transitions | `transition-colors`, 150–200 ms | Unchanged (colour only) |

### 7.2 Performance guardrails

1. **No React state on pointer moves.** Every per-frame value is a MotionValue written to the DOM by motion; React re-renders only on threshold crossings (`scrolled`) — at most once per scroll direction.
2. **One listener per concern**, all `{ passive: true }`, all cleaned up on unmount.
3. **`will-change` is transient** (set while hovered, removed on leave) — no permanent compositor layers.
4. **No animation of layout properties**: only `transform`, `opacity`, `clip-path`, `background-image`, colours.
5. **The rAF loop is bounded by mount**: F10 unmounts with the route, and motion suspends rAF for hidden tabs.

---

## 8. Accessibility, Responsive & Theming Rules

### 8.1 Keyboard & semantics

| Requirement | Implementation |
| --- | --- |
| Logical tab order | Document order = capsule (monogram → links → theme → resume) → hero CTAs; no positive `tabindex` |
| Visible focus | `focus-visible:ring-1` with `--text-primary` alpha (legible both themes); no `outline: none` without a replacement |
| Icon-only controls | Theme toggle and resume trigger always carry `aria-label`; icons `aria-hidden` |
| Decorative layers | Layers 1–3 `aria-hidden`; accessible hero content is `<h1>` + CTA copy |
| Status information | Pill is plain text (no `aria-live`) — load-time data, not an event |
| Landmarks | one `<header>`, one `<main>`, one `<h1>` |

### 8.2 Responsive rules

| Breakpoint | Navbar | Hero |
| --- | --- | --- |
| `< md` (<768 px) | Capsule = monogram + theme + resume; links hidden; `max-w-[calc(100vw-2rem)]` | Single column: typography layer, portrait (`max-w-[60vw]`), copy block; spotlight off (coarse pointer) |
| `md`–`lg` | Full anatomy | Grid separates; portrait `w-[min(42vw,420px)]` |
| `≥ lg` | Full anatomy | 12-col grid, copy `col-span-7`, portrait `col-span-5` (asymmetric centre-right per spec §3B) |

Copy is capped (`max-w-3xl` for the `<h1>`, max-w-xl for supporting text) so `lg:text-8xl` cannot push past the CTA row on ultra-wide screens. `text-[15vw]` + `whitespace-nowrap` + `overflow-hidden` on the section prevents a horizontal scrollbar.

### 8.3 Theme rules

- Every colour comes from a Phase 1 token; the only literals in the tree are the two shadow pairs and the mask gradient stops (no shadow token exists).
- Glass surfaces keep §2B's contrast requirement (4.5:1): `bg-surface-glass` dark is `rgba(9,9,11,0.65)` over `#09090b`, and nav/pill text uses `--text-primary`/`--text-secondary`, not a mid-grey.
- No component reads `localStorage`/`matchMedia` during render (§5.3 rule 1).

---

## 9. Token Mapping & Deliberate Deviations from the Literal Spec

Ratified here so approval covers them explicitly; each preserves visual intent and names the alternative.

| # | Spec text | Plan | Rationale | Alternative if you prefer literals |
| --- | --- | --- | --- | --- |
| D1 | `bg-zinc-950/60` / `bg-white/70`, `border-white/10` / `border-black/10` (UX §2B) | `bg-surface-glass border-border-subtle` | Phase 1's tokens are the ratified, slightly subtler versions of the same values (`rgba(9,9,11,0.65)`, `0.08` alpha); one source of truth, in sync with the rest of the site | Hardcode the zinc/white literals in the navbar only |
| D2 | `text-zinc-900/60 dark:text-zinc-900/40` (UX §3B Layer 2) | `text-text-primary/[0.06] dark:text-text-primary/[0.04]` | The spec's literals are theme-blind (zinc-900 is a *dark* ink): correct in light mode, a barely-visible wash in dark mode. Token alpha preserves "low-saturation watermark" in both themes | Apply the literal zinc classes verbatim |
| D3 | `top-6 inset-x-0 mx-auto w-max z-50` (UX §3A) | identical + `max-w-[calc(100vw-2rem)]` | The wireframe does not cover 320 px-wide viewports, where the capsule would overflow | Drop the `max-w-*` |
| D4 | Portrait source unspecified | Bundled placeholder SVG (§3.3) | Nothing in the repo or DB provides the photo; you approved a bundled placeholder | New `site_configs.portrait` key (schema change, deferrable) |
| D5 | Navbar shrink "background blur menguat" | `backdrop-blur-md → backdrop-blur-lg` | `-md` is the spec's stated base (§2B); `-lg` is the next step up and expresses "menguat" | Constant `backdrop-blur-md` |
| D6 | Headline/CTA copy (UX §3B) | verbatim | Content is spec-owned, not invented here | — |

---

## 10. Execution Steps (ordered, with per-step gates)

| # | Step | Files | Gate |
| --- | --- | --- | --- |
| 0 | Write this plan to `plan/02-phase2-navbar-hero-plan.md` (blocked in plan mode) | — | File exists byte-identical to the approved plan |
| 1 | `npm install motion@^14` | M3 | `npm ls motion` shows exactly one entry; `npm run typecheck` still exits 0 |
| 2 | Author leaf modules `src/lib/site.ts`, `src/lib/cn.ts`, `src/lib/motion.ts` | F2–F4 | `npm run typecheck` exits 0 (`noUnusedLocals` will reject any dead constant) |
| 3 | Author `src/server-fns/site-config.ts` + a **temporary** loader and `<pre>{JSON.stringify(data)}</pre>` in `index.tsx` | F1, M1 (partial) | **`npm run build` exits 0** → §2.3's import-protection reading confirmed end-to-end; if it fails, apply §12 R1 first. Then `npm run dev` + `curl -s localhost:3000/` shows the live label |
| 4 | Add the §6.12 CSS blocks to `src/styles/app.css` | M2 | Dev server boots (no PostCSS error); Phase 1 tokens still present in served CSS |
| 5 | Author `theme-toggle.tsx`; render in the temp page | F5 | `typecheck` clean; SSR HTML contains the stable `aria-label` and **both** icon elements (proves CSS-driven icon switching) |
| 6 | Author `resume-trigger.tsx` + `navbar.tsx` | F6, F7 | `curl` HTML contains capsule classes (`backdrop-blur-md`, `top-6`), the 4 anchors, and `aria-disabled="true"` (today's `resume.url === null`) |
| 7 | Author `availability-pill.tsx` + `portrait-placeholder.svg` + `hero.tsx` **without** motion layers | F8, F11, F12 | `curl` HTML contains `<h1`, `ENGINEER`, `width="1200" height="1600"`, and the live pill label |
| 8 | Add motion layers: `hero-spotlight.tsx`, `magnetic-button.tsx`, CTA swap, `motion.header` navbar | F9, F10, M1 | `curl` HTML contains the CTA hrefs but **no** spotlight markup (client-only mount, §5.3 rule 2) |
| 9 | Remove the temporary probe; finalise `index.tsx` | M1 | No `JSON.stringify`, no `console.*`, no probe import remains |
| 10 | `npm run typecheck` | — | exit 0 |
| 11 | `npm run build` | — | exit 0; §11.2 checks pass; `src/routeTree.gen.ts` unchanged |
| 12 | SSR verification: `npm run dev` + §11.3 checks | — | All greps pass |
| 13 | Manual browser checks (§11.4, §11.5) | — | No hydration mismatch; no clipped capsule; no horizontal scrollbar |
| 14 | Cleanup: `rm -rf .output`; confirm no scratch/probe/temp asset remains; re-read the final file list against §4.3 | — | Only F1–F12 + M1–M3 differ from Phase 1's tree |

---

## 11. Verification Gates

### 11.1 Gate 1 — TypeScript

`npm run typecheck` exits 0 on the final state. Expected traps: `import type` for `LandingConfig`/`Database` types; no unused motion constants in F4; no `any` in the View Transition typing.

### 11.2 Gate 2 — Production build & bundle hygiene

`npm run build`, then on `.output/`:

| Check | Assertion |
| --- | --- |
| Exit code | 0 |
| Server-only leak scan of `.output/public` | 0 matches for `SUPABASE_SERVICE_ROLE_KEY`, `createSupabaseServerClient`, `getSiteConfig`, `setResponseHeader`, `persistSession` |
| Client chunk delta | gzip size of the landing chunk vs the Phase 1 baseline recorded in this step; if > 20 KB, apply §12 R4 |
| CSS assertions (`app-*.css`) | `--surface-glass` present; `.dark` present; `where(.dark` present; `::view-transition-new(root)` present; `.hero-portrait-mask` present |
| `src/routeTree.gen.ts` | unchanged — no route files were added |

### 11.3 Gate 3 — SSR / runtime (`npm run dev`, port 3000)

| # | Command | Expected |
| --- | --- | --- |
| 1 | `curl -s localhost:3000/ \| grep -ao "<h1"` | ≥1 hit |
| 2 | `curl -s localhost:3000/ \| grep -ao "Available for Projects"` | ≥1 hit — **the live `site_configs` label, server-rendered** |
| 3 | `curl -s localhost:3000/ \| grep -ao "backdrop-blur-md"` | ≥1 hit (capsule) |
| 4 | `curl -s localhost:3000/ \| grep -ao 'aria-disabled="true"'` | ≥1 hit (CV disabled while `resume.url` is null) |
| 5 | `curl -s localhost:3000/ \| grep -ao "ENGINEER"` | ≥1 hit (Layer 2 is SSR text) |
| 6 | `curl -s localhost:3000/ \| grep -ao "radial-gradient"` | **0 hits** — Layer 1 is client-only |
| 7 | HTTP status | 200; no server error in the dev log |
| 8 | Degradation drill | Blank `VITE_SUPABASE_URL`, hit `/`: still 200, pill absent, `requireEnv` error logged server-side. Restore `.env` exactly afterwards and re-run check 2 |

### 11.4 Gate 4 — Hydration & no-mismatch

Manual browser pass (no test runner exists in this repo; stated limitation, not an omission):

1. Load `/` with the console at "Verbose" — expect **no** React hydration warnings.
2. Repeat with `localStorage.theme` pre-set to `"light"` and with the OS scheme switched, exercising both hydration paths.
3. Performance panel: CLS = 0 on load; "Paint flashing" shows no full-page repaint on load.
4. Verify `document.documentElement.classList` and `localStorage.theme` after each toggle — the Phase 1 theme contract still holds.

### 11.5 Gate 5 — Motion, keyboard & responsive (manual)

| Check | Pass condition |
| --- | --- |
| Reduced motion | With OS "reduce motion" on: no spotlight, no magnetic offset, no pill pulse, instant theme switch, no navbar scale animation |
| Keyboard | Tab order per §8.1; `Enter` works on theme toggle and resume trigger; focus ring visible in both themes |
| Anchor links | Clicking `#works` etc. scrolls smoothly when the target exists and does nothing (no jump to top) when it does not — the expected Phase 2.1 behaviour before §2.3–§2.6 |
| Viewports | 320 / 768 / 1024 / 1440 px: capsule fully visible and centered; no horizontal scrollbar; hero copy never collides with the portrait |
| Contrast | Pill label, nav links, CTA text ≥ 4.5:1 in both themes (devtools contrast readout) |
| Pointer | Touch/coarse pointer: spotlight and magnetic offsets never activate |

### 11.6 Rollback

Additive except `src/routes/index.tsx` and `src/styles/app.css`, both small and self-contained. If motion or the server-function seam proves unworkable mid-run, the documented stop points are §12 R1 (dynamic import) and §12 R4 (motion fallback ladder); neither requires reverting already-gated work.

---

## 12. Risks & Mitigations

| # | Risk | Prob. | Impact | Mitigation | Early-abort criterion |
| --- | --- | --- | --- | --- | --- |
| R1 | Import-protection rejects the top-level `supabase.server` import in the server-function module (§2.3 reading wrong for this plugin version) | Low | High | Step 3 gates on `npm run build` **before** any UI work. Fallback: `const { getSiteConfig } = await import('../lib/supabase.server')` **inside** the handler (Phase 1's probe pattern) | If both patterns fail the build, stop and re-plan using the plugin's own diagnostic text as evidence |
| R2 | `motion` causes a hydration mismatch on decorative layers | Low | Medium | Spotlight is client-only; magnetic springs start at 0; pill pulse suppressed by `MotionConfig`, not an SSR-visible branch | Persisting mismatch → move the pill's pulsing ring behind F10's mount gate |
| R3 | Reading theme during render (the tempting implementation) reintroduces FOUC-class mismatches | Medium | High | §6.4's state model: icons switched by CSS, `isDark` starts `null`, DOM reads only in effects/handlers | Any hydration warning in Gate 4 → audit for `localStorage`/`matchMedia` in a render path |
| R4 | `motion` inflates the client bundle past the LCP budget | Medium | Medium | §3.2 measures the gzip delta in Gate 2 | > 20 KB gzip → `LazyMotion` + `domAnimation` + `m`; still > 20 KB → hand-roll the spotlight and keep motion only for the magnetic button |
| R5 | Always-running spotlight rAF loop is wasteful | Low | Low | Two `set()`/frame, no React work, motion suspends hidden tabs; accepted trade (simplicity over an idle-stop heuristic) | Measurable idle CPU in the Performance profile → add an idle-stop that cancels rAF after N frames without pointer movement |
| R6 | `lucide-react@1.53.0` may not export `Sun`/`Moon`/`Download` under those names | Low | Low | Verify named exports at Step 5 | Missing export → inline three SVGs; do not change the library version mid-task |
| R7 | `document.startViewTransition` absent from TS 6 `lib.dom` | Medium | Low | Locally declared interface + `in` narrowing; **no** `@ts-ignore` permitted | `tsc` error → the local interface already covers it |
| R8 | `jsonb` payload drift (`availability` field changes) renders broken copy | Low | Medium | Runtime guards `isAvailability`/`isResume` in F1 return `null` → pill disappears | Guard rejects the live row in Step 3 → re-read `site_configs` and align guard/type |
| R9 | Deploy-only failure because `.env` differs on Vercel | Low | Medium | §5.4 degradation keeps `/` renderable; Vercel env parity is ROADMAP §6.1 | Gate 3 check 8 is the rehearsal |

---

## 13. Follow-ups Handed to Later Sub-Tasks (not implemented here)

1. **Section targets + scroll-spy active link** — `#works`, `#services`, `#articles`, `#contact` and `NAV_LINKS`' active state arrive with ROADMAP §2.3–§2.6; `section[id]` `scroll-margin-top` is already in place (M2).
2. **Navbar → root layout** — when `/articles` exists (Phase 3), move `<Navbar>` out of `index.tsx` into a root route layout and convert anchors to router-aware links (`to="/" hash="…"`).
3. **Real portrait** — replace `src/assets/portrait-placeholder.svg` at the documented swap point (§3.3), ideally WebP/AVIF, same 3:4 ratio (ROADMAP §5.1).
4. **Forced CV download** — decide between `target="_blank"` (current) and Supabase's `?download` flag (ROADMAP §2.6, §4.4).
5. **Admin-managed availability** — the pill already reads live data; `/admin/settings` (ROADMAP §4.4) closes the loop.
6. **`src/env.d.ts`** — still recommended (Phase 1 summary §4.3 item 4) so `VITE_*`/server vars are not `any`.
7. **`motion` reuse in Phase 2.4** — reuse `SPRING_SURFACE` (F4) for the drawer/bottom sheet so `stiffness 320, damping 32, mass 1` stays defined in exactly one file.
