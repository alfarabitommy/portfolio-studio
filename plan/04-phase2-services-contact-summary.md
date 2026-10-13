# Phase 2 — Sub-Task C Execution Summary

## Core Competencies & Services · Interactive Contact Form (dual-side Zod) · Editorial Footer

| | |
| --- | --- |
| **Status** | Complete — all automated gates pass; the manual browser/keyboard pass (Step 10 / G12) is handed to the user (no browser in this environment) |
| **Executed** | 2026-10-13 |
| **Plan** | `plan/04-phase2-services-contact-plan.md` (approved), Steps 0–12 |
| **Stack verified against** | TanStack Start 1.168.60, React 19.2, Vite 8.3.3, Nitro 3, Tailwind CSS 4.1.18, TypeScript 6 (strict), `@supabase/ssr` 0.12.7, `motion` 14.0.0, **zod 4.6.7 (`zod/mini` entry point)** |
| **Inventory delivered** | F1–F6 new, M1–M4 modified; `src/routeTree.gen.ts` and `src/styles/app.css` byte-identical |
| **User decisions applied** | §16 items 1–5, all as directed (see §2.5) |
| **Deviation vs. plan** | Two documented, both measurement-driven: **D-A** (zod entry point) and **D-C** (success-marker colour). Recorded in §1.3 |

---

# 1. Execution Overview & Step-by-Step Gate Status

## 1.1 Outcome

The landing page now server-renders the full single-page surface below Featured Works:

- `<section id="services">` — three capability pillars in a 1-column/3-column hairline grid, with a pure-CSS hover affordance (accent hairline scaling in from the left + title colour shift);
- `<section id="contact">` — an editorial split section whose right half is an interactive form (name, email, intent pills, message) with **dual-side Zod validation**: `validateContactInput()` in the browser and `.validator(contactSchema)` on a `createServerFn` POST that inserts into `public.inbox_messages` through the anon RLS policy;
- `<footer>` — copyright from a loader-supplied year, four direct channels (disabled until URLs exist), a dynamic CV download driven by `site_configs.resume.url`, and a **hydration-safe live Jakarta clock** whose server markup is the static `Jakarta, ID • GMT+7`.

Both `#services` and `#contact` were already present in `NAV_LINKS` and the hero's "Start a Project" CTA pointed at `#contact`; both anchors now resolve. The three components import nothing from `motion/react`, so the page's `<LazyMotion features={domMin} strict>` budget is unchanged.

The one plan instruction that fired mid-execution was §11.4's bundle fallback: zod's **classic** entry point measured **22,418 gz** of client budget on its own — over the sub-task's `< +20 KB` gate all by itself. Switching the schema's entry point to `zod/mini` cut that to **5,162 gz**, bringing the whole sub-task in at **+8,469 gz** (§3.3).

## 1.2 Step-by-step status

| Step | Action | Status | Gate evidence |
| --- | --- | --- | --- |
| 0 | Pre-flight baseline | Done | `tsc --noEmit` exit 0; `vite build` exit 0; routes chunk **43,364 gz** (131,413 B), index chunk 110,017 gz (345,668 B), CSS 54,917 B; `routeTree.gen.ts` sha1 `d21a5e49…`; `app.css` **211 lines** |
| 1 | M4 add `zod` | Done | `npm ls zod` → one deduped **4.6.7** (no new package: the version was already hoisted transitively); typecheck + build exit 0; `package.json` diff = 1 dependency line |
| 2 | F1 `src/lib/contact.ts` | Done | `tsc --noEmit` exit 0 (proves the zod param shapes); `grep` for `supabase.server`/`@tanstack/react-start` in the module → only the header comment, no import |
| 3 | M1 `insertInboxMessage` + F2 `src/server-fns/contact.ts` + temporary probe | Done | typecheck 0; build 0 with **0 import-protection violations**; `.output/server/_ssr/contact-*.mjs` present (caller + `?tss-serverfn-split` provider); **positive probe → `{"ok":true}`** (anon insert accepted by PostgREST/RLS); **negative probe → HTTP 500** carrying `Please enter at least 2 characters.` / `…valid email address.` / `…at least 10 characters.`; probe reverted immediately |
| 4 | F3 `src/lib/services.ts` + F4 `src/components/services.tsx` + wire | Done | typecheck 0; SSR HTML: `id="services"` ×1, three pillar titles, three `data-pillar` hooks, `[ SERVICES ]`, `Core Competencies`, `[ 01 / 03 ]` |
| 5 | M2 `src/lib/site.ts` + F6 `src/components/footer.tsx` + wire + loader year | Done | typecheck 0; SSR HTML: `Jakarta, ID • GMT+7` present and **0** `HH:MM WIB` (static server string proven); `© 2026 Tommy Alfarabi`; four `[ … ]` social controls in the disabled state; CV control disabled (**live `site_configs.resume.url` is `null` today**) |
| 6 | F5 `src/components/contact-section.tsx` + wire | Done | typecheck 0; SSR HTML: `id="contact"`, headline verbatim, `name="intent_type"` ×3, exactly one `checked`, `aria-live="polite"` ×1, **0** `aria-invalid="true"`, **0** `aria-busy="true"`, `mailto:tommy.alfarabi@gmail.com`, `Send Message` |
| 7 | M3 composition audit | Done | section order in SSR HTML = `hero → works → services → contact → footer`; one `<main>`; `inert`/recede wrappers unchanged (navbar still outside the recede wrapper, drawer still a `LazyMotion` sibling); 0 hits for `createPortal` / `position: fixed` in the three components |
| 8 | Full typecheck / build / budget / leak scan | Done | see §3.1–§3.4 (this is where D-A was forced: +25,731 gz → +8,469 gz after the zod entry-point swap) |
| 9 | SSR matrix + degradation drill | Done | G6: **19/19 assertions** (§3.5); G10: blank-env server on port 3100 → HTTP 200 with hero/services/contact/footer, `#works` correctly absent, form intact, CV disabled, no availability pill (§3.8) |
| 10 | A11y / markup / CSS audit | Done | §3.9 — labels/`for`, `fieldset`/`legend`, radio group, live region, focus rings and every generated utility verified; **one systemic contrast finding reported, not silently changed** (F-1) |
| 11 | Remove probes | Done | `grep -rn "TEMP STUB\|TEMPORARY\|PROBE\|data-probe" src/` → 0 hits; typecheck + build re-run exit 0; the SSR matrix re-run clean |
| 12 | Cleanup & final inventory | Done | `.output/`, `.scratch/`, all `/tmp` captures, backups and logs removed; final `src/` tree = §2.1–§2.3 inventory; `app.css` still 211 lines; `routeTree.gen.ts` sha1 unchanged |

## 1.3 Deviations from the approved plan (each with its measured evidence)

| # | Plan said | Shipped | Why |
| --- | --- | --- | --- |
| **D-A** | §11.4: "if zod classic's client share alone exceeds 8 KB gz, switch both import sites to `zod/mini`" (a conditional fallback) | **`zod/mini`** is the shipped entry point. Schema constraints are `z.string().check(z.trim(), z.minLength(2, {message}), z.maxLength(100, {message}))` / `z.email({message}).check(z.maxLength(254, {message}))`; parsing is the top-level `z.safeParse(schema, value)` behind a new `validateContactInput()` seam; `toFieldErrors` is now typed structurally against `{ issues }` | **Measured** across three builds: zod classic = **22,418 gz** (71,095 → 46,677 with the schema stubbed out), zod/mini = **5,162 gz** (51,833 → 46,671). The condition in the plan's own rule fired (22,418 > 8,192), and without the swap the sub-task's `+20 KB` gate was unreachable — the aggregate was +25,731 gz. The swap saves **17,262 gz** and the behaviour is identical: verified by executing the real module in Node (trim, all four messages, field mapping) and by re-running the positive/negative server probes *after* the swap. `zod/mini` exports no `ZodError` type, hence the structural issue type. |
| **D-B** | §5 Step 1: "`npm install zod@^4.6.5` … expect 4.6.5" | Resolved to **4.6.7** | npm honoured the `^` range and re-deduped the whole tree to 4.6.7 (`@tanstack/start-plugin-core`, `@tanstack/router-cli` and the root dep all share one copy). Still exactly one zod in `node_modules` — the property the decision was protecting. |
| **D-C** | §5 Step 6 sketch: success panel marked with a mono `[ SENT ]` label | Shipped as `[ SENT ]` in `text-text-secondary` beside an **emerald dot** (the `AvailabilityPill` treatment), not emerald text | `--accent-emerald` on `--bg-base` measures **3.16:1** in light mode — fine for the large bold Services `<h3>` hover (AA-large needs 3:1) but **below the 4.5:1** that UX §8.3 requires for 12 px mono text. The dot carries the accent; the text carries the contrast. |
| **D-D** | §5 Step 5: "the four social labels … `href === null` → disabled control" | Shipped, and the **CV download is also currently disabled** | The live `site_configs.resume.url` is `null` — `getLandingConfig()` reports it, so both the navbar trigger and the new footer button render their disabled state. Nothing to fix; recorded so the state is not mistaken for a defect. |
| **D-E** | §5 Step 3.3: run the server-seam probe once | The probe was run **twice** — before and after the zod entry-point swap | The swap changed how the validator parses (`~standard.validate` over a mini schema), so the earlier evidence no longer covered the shipped code. Both runs are reported in §3.6. |
| **D-F** | §9 Footer props `{ resumeUrl, copyrightYear }` | Shipped as specified | A9's loader-provided year is in the dehydration payload, so `© 2026 …` is identical on both sides by construction. |

## 1.4 What is verified by execution vs. what is not

**Verified by execution** (§3): typecheck, production build, import-protection, server-fn extraction, routes-chunk gzip (+ zod's isolated cost from three controlled builds), client leak scan, `routeTree.gen.ts` identity, 19-assertion SSR matrix, positive **and** negative server-seam probes against the live Supabase project, the real `src/lib/contact.ts` executed in Node (7 schema cases), generated-CSS assertions for every new utility, the blank-env degradation drill, and a full markup/label/ARIA audit of the SSR output.

**Not executable here** (same limitation as Sub-Tasks A and B — no browser automation, no test runner): real hydration in a browser, click-to-submit, keyboard traversal, live regions being announced, reduced-motion rendering, and the responsive/theme visual pass. Those are enumerated for the user in §4.1. Two further limits are inherent: the anon role **cannot read** `inbox_messages` (RLS grants INSERT only), so the inserted rows are inferred from PostgREST's 2xx and must be confirmed in the dashboard; and any assertion about *post-hydration* (e.g. the clock actually ticking) rests on code review plus the ARIA/HTML structure, not on observation.

---

# 2. Created & Modified Files Breakdown

## 2.1 New (F1–F6)

| # | Path | Lines | Purpose |
| --- | --- | --- | --- |
| F1 | `src/lib/contact.ts` | 8,935 B | Isomorphic Zod schema (`zod/mini`), intent vocabulary + labels, `validateContactInput`, `toFieldErrors` (+ structural `ContactIssue`), `EMPTY_CONTACT_FORM`, all section/field/status copy, `CONTACT_MAILTO` |
| F2 | `src/server-fns/contact.ts` | 2,976 B | `submitContactMessage` (`POST`, `.validator(contactSchema)`, `ContactSubmitResult`) |
| F3 | `src/lib/services.ts` | 2,272 B | `SERVICE_PILLARS` (3), section eyebrow/title |
| F4 | `src/components/services.tsx` | 3,639 B | `<section id="services">` — hairline grid, editorial index, accent hover rule |
| F5 | `src/components/contact-section.tsx` | 15,910 B | `<section id="contact">` + internal `ContactForm` (state machine, pills, focus management, live region) + `Field` |
| F6 | `src/components/footer.tsx` | 6,989 B | `<footer>`, `LiveClock`, `CvDownload`, `SocialControl` |

## 2.2 Modified (M1–M4)

| # | Path | Change |
| --- | --- | --- |
| M1 | `src/lib/supabase.server.ts` | `+ insertInboxMessage(message: InboxMessageInsert)` — typed insert, **no `.select()`**, client created per call; `InboxMessageInsert` added to the type import |
| M2 | `src/lib/site.ts` | `+ SITE_NAME = 'Tommy Alfarabi'`, `+ SOCIAL_LINKS` (4 × `href: null`), `+ SITE_TIMEZONE/SITE_TZ_LABEL/SITE_TZ_SUFFIX/SITE_TZ_ABBREVIATION`, `+ formatJakartaTime` (lazy, `try/catch`, `hourCycle: 'h23'`) |
| M3 | `src/routes/index.tsx` | Loader `+ copyrightYear`; `<Services/>`, `<ContactSection/>`, `<Footer resumeUrl={resume?.url ?? null} copyrightYear={copyrightYear}/>` inside `<main>`; header comment updated |
| M4 | `package.json` + `package-lock.json` | `+ "zod": "^4.6.7"` (one line; no new package added to the tree) |

## 2.3 Verified unchanged

`src/routes/__root.tsx`, **`src/routeTree.gen.ts`** (sha1 `d21a5e495a38c29be169e78d98b0eb49defc6d3e`), `src/router.tsx`, **`src/styles/app.css`** (211 lines, source untouched), `src/lib/{cn,works,use-project-drawer}.ts`, `src/components/{hero,hero-spotlight,availability-pill,magnetic-button,resume-trigger,theme-toggle,featured-works,project-drawer}.tsx`, `src/server-fns/{site-config,projects}.ts`, `src/types/database.ts`, `tsconfig.json`, `vite.config.ts`, `tsr.config.json`, `vercel.json`, `supabase/**`, `docs/**`, `AGENTS.md`.

**Four files left this list *after* this sub-task closed** — three separate, user-directed refactors landed later (same working session) and touched them:

- `src/components/navbar.tsx`: the shrink moved from a CSS transition onto an `m.header` + `SPRING_SURFACE` spring, anchored with `origin-top`. `src/lib/motion.ts` then needed only its `SPRING_SURFACE` doc comment updated, to record that it now has two consumers.
- `src/components/services.tsx` (F4): reworked into the "Elevated Monolithic Grid" — uniform `py-10` / `lg:px-8 lg:py-12` on every pillar with the `first:` padding exceptions removed (the indicator now clears `[ 01 / 03 ]` by 40–48px), plus an ambient `--accent-glow` radial wash, etched micro-badges and kinetic hover details. Still zero `motion/react` imports.
- `src/components/contact-section.tsx` (F5) and `src/lib/contact.ts` (F1): the right column is now an architectural glass card; the `<legend>` spacing defect is fixed (`mb-4`, and the fieldset is no longer a flex column — a rendered legend is not a flex item, so `gap` never reached it); the submit button became a primary CTA in the hero `MagneticButton` language; and **`intent_type` no longer preselects `freelance`**, so the group defaults to unselected and Zod enforces a conscious choice. That last change required a new `ContactDraft` type (draft `intent_type: ContactIntentType | ''` vs validated `ContactInput`), which is why the file list grew.

None of the three is part of Sub-Task C's scope. `domMin`, the forbidden-feature list and every marker in §3.5 were re-verified afterwards; the routes chunk moved +45 gz (navbar), +222 gz (services) and +139 gz (contact), ending at **52,239 gz** against the 51,833 gz recorded in §3.2.

**Superseded by the contact rework:** plan §3.2 A5 (and the `EMPTY_CONTACT_FORM` note in §3.3) preselected `freelance` "so the radio group is never in an unselected state". The group now starts unselected by explicit user request; §3.9's observation "exactly one is checked (freelance, preselected per A5)" therefore reads **0 checked** in the pristine SSR HTML, and the intent field gained the error path it previously could not reach (0 `aria-invalid` → 3 radios carry it once the field is invalid, all three with `required`).

**Marker refinement required by the services rework.** §3.5 assertion 12 used `grep -c "radial-gradient"` = 0 as evidence that the Hero's Layer 1 spotlight is client-only. The pillars now legitimately carry a `radial-gradient(...)` **class string** (the hover wash), so that needle returns 3 and no longer proves anything about the Hero. Use the Hero's own signature instead — its spotlight is `radial-gradient(${size}px circle at …)` applied through an inline style — and assert `grep -c "circle at"` = 0, which held at the time of writing.

## 2.4 Dependency change

`zod` is now a direct dependency. It was already present transitively (`@tanstack/start-plugin-core` → `router-plugin`, `@tanstack/router-cli` → `router-generator`), so `npm install zod@^4.6.5` added **no new package** — it pinned the root dependency and re-deduped the tree to a single `zod@4.6.7`. `npm audit` reports 2 moderate advisories, both **pre-existing** and unrelated (`@tailwindcss/typography` → `postcss-selector-parser`, a build-time PostCSS dependency).

## 2.5 User decisions applied (plan §16)

| # | Decision | Applied |
| --- | --- | --- |
| 1 | `SITE_NAME = 'Tommy Alfarabi'` | `src/lib/site.ts` — rendered as `© 2026 Tommy Alfarabi. All rights reserved.` |
| 2 | Keep all `SOCIAL_LINKS[].href` as `null` | Four disabled controls with `title="GitHub — add the URL in src/lib/site.ts"` |
| 3 | `mailto:tommy.alfarabi@gmail.com` in the left column | Rendered in the summary copy and again in the success panel; 1 `mailto:` href in the SSR HTML |
| 4 | `.validator(contactSchema)` | Shipped verbatim; typecheck confirms the Standard-Schema path resolves both the client payload and the handler's `data` |
| 5 | Loader-provided `copyrightYear` | Shipped; the year is part of the dehydration payload |

---

# 3. Verification & Gate Results

## 3.1 Typecheck & build (G1, G2)

- `npm run typecheck` → **exit 0**, at every step gate and on the frozen tree (strict, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`).
- `npm run build` → **exit 0**; **0** import-protection violations; `.output/server/_ssr/contact-{CiZOaMFF,KbbZg8jN}.mjs` present (caller module + `?tss-serverfn-split` provider), confirming the handler body is extracted server-side.

## 3.2 Routes chunk gzip delta (G3)

| Asset | Step 0 baseline | Delivered | Delta |
| --- | --- | --- | --- |
| `routes-*.js` | **43,364 gz** (131,413 B) | **51,833 gz** (160,723 B) | **+8,469 gz** ✅ (gate `< +20 KB`) |
| `index-*.js` | 110,017 gz | 110,049 gz | +32 gz (unchanged in practice) |
| `app-*.css` | 54,917 B raw | 56,475 B raw (9,738 gz) | +1,558 B raw — new utilities only (below); `app.css` **source** is untouched at 211 lines |

Of the +8,469 gz, **5,162 gz is zod/mini** and **3,307 gz is the three components plus their constants and wiring** — a ~2.5× better ratio than the first build produced (+25,731 gz with zod classic).

## 3.3 Zod's specific cost (the plan's §11.4 measurement)

Three controlled builds; the stub builds removed only the schema construction (keeping every component, constant and copy string, so the difference isolates zod):

| Build | Content | routes gz | zod's share |
| --- | --- | --- | --- |
| A | zod **classic** (`import { z } from 'zod'`) | 69,095 | **22,418 gz** |
| B | same tree, schema stubbed out (`validateContactInput` returns success) | 46,677 | — |
| C | zod **mini** (`import { z } from 'zod/mini'`) | 51,833 | **5,162 gz** |
| D | same tree, schema stubbed out | 46,671 | — |

The stub baseline (B ≈ D ≈ 46,67x gz, within 6 gz) is what makes the two shares comparable, and it is also the non-zod cost of the sub-task: 46,671 − 43,364 = **3,307 gz**. **The swap saved 17,262 gz** on a 5 KB budget line. Zero cost was paid in motion features: no `motion/react` import exists in any of the three components and the engine is still `domMin`.

## 3.4 Leak scan (G4)

`.output/public/assets/*.js` searched for `createSupabaseServerClient`, `insertInboxMessage`, `SUPABASE_SERVICE_ROLE_KEY`, `getSiteConfig`, `getPublishedProjects` → **0 hits for all five**. The client graph reaches the database only through the stubbed RPC.

## 3.5 SSR runtime checks (G6) — 19/19

Against `curl -s http://127.0.0.1:3000/` (HTTP 200, 42,968 B). Assertions are separator-tolerant because React 19 inserts `<!-- -->` between adjacent text children:

| # | Assertion | Result |
| --- | --- | --- |
| 1 | `id="hero" → works → services → contact → footer` in document order | PASS |
| 2 | three pillar titles present | 3 |
| 3 | headline verbatim (`Have a project in mind, or looking for your next tech lead?`) | 1 |
| 4 | `name="intent_type"` | 3 |
| 5 | `aria-live="polite"` (single always-mounted region) | 1 |
| 6 | `aria-invalid="true"` on the pristine page | **0** ✅ |
| 7 | static clock `Jakarta, ID • GMT+7` | PASS |
| 8 | live clock value `\d\d:\d\d WIB` in server markup | **0** ✅ (server string proven static) |
| 9 | four social labels | 4 |
| 10 | `© 20xx Tommy Alfarabi` | 1 |
| 11 | `role="dialog"` (drawer still client-only) | **0** ✅ |
| 12 | `radial-gradient` (Hero Layer 1 still client-only) | **0** ✅ |
| 13 | `[ 01 / 02 ]` editorial index (Sub-Task B marker) | 1 |
| 14 | `aria-haspopup="dialog"` (Sub-Task B marker) | 2 |
| 15 | CV control in its disabled state | 2 |
| 16 | `<main>` | 1 |
| 17 | probe artefacts | **0** ✅ |
| 18 | `inert` attribute while the drawer is closed | **0** ✅ |
| 19 | availability pill (live `site_configs` read) | 2 |

No regression on any Sub-Task A/B marker.

## 3.6 Server-seam probe (G8) — run twice, before and after the zod swap

| Run | Payload | Result |
| --- | --- | --- |
| Pre-swap (classic zod) | valid, with leading/trailing whitespace | HTTP 200, SSR rendered `{"ok":true}` → validator passed, `.trim()` applied, anon INSERT accepted by RLS |
| Pre-swap | `{ name: 'x', email: 'not-an-email', message: 'short' }` | **HTTP 500** with `Please enter at least 2 characters.` / `Please enter a valid email address.` / `Please write at least 10 characters.` |
| Post-swap (zod/mini) | valid, whitespace-padded | HTTP 200, `{"ok":true}` |
| Post-swap | same invalid payload | **HTTP 500** with the same three messages |

This is the definitive proof of two plan claims: validators run **server-side only** (the browser never sends anything in these probes), and `execValidator`'s `~standard.validate` path works with the `zod/mini` schema. The probe was reverted immediately after each run; `grep` for `PROBE`/`data-probe` in `src/` returns 0.

**Side effect requiring your action:** these probes wrote **two real rows** to `public.inbox_messages`, both with `name = 'PROBE — delete me'` and `email = 'probe@example.com'`. They cannot be deleted from here — the anon role has no SELECT/UPDATE/DELETE on that table by design. Please remove them in the Supabase dashboard (or ignore them; they will show as unread with `intent_type = 'consulting'`).

## 3.7 Generated CSS assertions (G9)

Every new utility is emitted in the built `app-*.css`, so Tailwind v4's source scanner did pick up the class strings held in `src/lib/*.ts` and in `cn(...)` compositions:

| Rule | Emitted form |
| --- | --- |
| `aria-[invalid=true]:border-text-primary` | `.aria-\[invalid\=true\]\:border-text-primary[aria-invalid=true]{border-color:var(--text-primary)}` |
| `focus:shadow-[0_6px_16px_-8px_var(--accent-glow)]` | `…:focus{--tw-shadow:0 6px 16px -8px var(--tw-shadow-color,var(--accent-glow));box-shadow:…}` |
| `peer-checked:border-accent-emerald` / `:text-text-primary` / `:shadow-[…]` | `.peer-checked\:…:is(:where(.peer):checked~*){…}` |
| `peer-focus-visible:ring-1` | emitted |
| `group-hover:scale-x-100`, `group-hover:text-accent-emerald` | emitted (the Services hairline + title) |
| `focus:border-accent-emerald` | emitted |
| `tabular-nums`, `min-w-[17ch]` | emitted (stable clock digits, no neighbour shift) |
| `sr-only` | emitted |

## 3.8 Degradation drill (G10)

Second dev server on **port 3100** with `VITE_SUPABASE_URL=` and `VITE_SUPABASE_ANON_KEY=` blanked:

| Check | Result |
| --- | --- |
| `GET /` | **HTTP 200** |
| Sections rendered | `hero`, `services`, `contact`, `footer` |
| `#works` | **absent** (no projects → the section degrades exactly as designed) |
| Contact form | 3 radios, all fields, `Send Message` |
| Footer | present; static clock string present; CV control disabled |
| Availability pill | **absent** (live read failed → the pill is omitted, not rendered empty) |
| Hero headline | intact |

## 3.9 Accessibility & contrast audit (Step 10)

Beyond the plan's §12 table, the SSR markup was parsed programmatically:

- **Labels:** all 6 `<label for>` targets resolve to a real `id`; **no duplicate ids**.
- **Radio group:** `<fieldset>` + `<legend>Type of collaboration</legend>`; 3 labels resolve inside the fieldset; all three radios share `name="intent_type"`; exactly one is `checked` (freelance, preselected per A5).
- **Invalid state:** `aria-invalid` and `aria-describedby` are **absent** in the pristine HTML and are set together from the same `id`/`error` pair (the `errorLink`/`invalidFlag` helpers plus `Field`'s `${id}-error` paragraph guarantee they cannot drift).
- **Live region:** exactly one `aria-live="polite"` wrapper, mounted in the initial HTML, whose subtree swaps between the form and the thank-you panel.
- **Focus management:** one `useEffect` on `[status]` (idle/submitting excluded) → first `[aria-invalid="true"]`, else the banner, else the status panel.
- **Names:** `Send Message` is **enabled** at idle (`aria-busy="false"`, no `disabled` attribute — the string `disabled:` that appears in its class list is Tailwind's variant, not the attribute); every disabled control carries `disabled="" aria-disabled="true" title="…"`; `ThemeToggle` keeps its `aria-label="Toggle color theme"`; 5 `sr-only` labels present (4 social + 1 pre-existing).
- **Contrast** (computed, WCAG 2.1 relative luminance): `text-primary` on base 19.06:1 (both themes) ✅; `text-secondary` on base 7.41 light / 7.76 dark ✅; `text-secondary` on `surface-card` 7.73 / 6.91 ✅; `text-primary` on `surface-card` 19.90 / 16.97 ✅; `accent-emerald` on base (Services `<h3>` hover, 24 px bold) 3.16 / 8.73 ✅ (AA-large ≥ 3:1); **`text-muted` on base 2.46 light / 4.12 dark ❌** — see F-1.

## 3.10 Gate summary

| Gate | Expected | Result |
| --- | --- | --- |
| G1 typecheck | exit 0 | ✅ exit 0 (per step and frozen) |
| G2 build | exit 0, 0 import-protection, `contact-*.mjs` extracted | ✅ |
| G3 routes gz | `< +20 KB`; zod share reported | ✅ **+8,469 gz**; zod/mini 5,162 gz |
| G4 leak scan | 0 hits ×5 needles | ✅ 0/0/0/0/0 |
| G5 `routeTree.gen.ts` | sha1 unchanged | ✅ `d21a5e49…` |
| G6 SSR matrix | 19 assertions | ✅ 19/19 |
| G7 forbidden footprint | 0 hits | ✅ 0 (`domAnimation`, `domMax`, `whileHover`, `whileTap`, `whileFocus`, `whileInView`, `createPortal`, `position: fixed`, `motion.`) |
| G8 server-seam probe | positive `ok:true`, negative non-200 | ✅ twice (pre/post zod swap) |
| G9 generated CSS | 5+ utilities emitted | ✅ 8 verified |
| G10 degradation drill | 200 + sections intact | ✅ |
| G11 cleanup | no leftovers | ✅ `.output`, `.scratch`, `/tmp` artefacts removed; inventory matches |
| G12 manual pass | user-executed | ⏳ handed over (§4.1) |

---

# 4. Notes & Readiness for the Next Phase

## 4.1 Manual pass handed to you (G12)

No browser exists in this environment, so these must be eyeballed/executed by hand. Suggested order (dev server on port 3000):

1. **Submit for real:** fill name/email/pills/message → `Send Message` → the button shows `Sending…`, then the thank-you panel appears **and receives focus**; confirm the row in the Supabase dashboard (it will be a third row besides the two probes — see §3.6).
2. **Validation:** submit empty → focus lands on *name* with `Please enter at least 2 characters.`; type `a` → error clears on edit; enter `not-an-email` → the email error; pick **Consulting** → the pill shows the emerald border/glow.
3. **Keyboard:** Tab through the pills with arrow keys (native radio group), `Tab` to the submit button, `Enter` to submit; confirm the emerald focus underline + glow on inputs and the focus ring on pills/buttons.
4. **Clock:** the footer reads `Jakarta, ID • GMT+7` on first paint and becomes `Jakarta, ID • HH:MM WIB (GMT+7)` within a second — and the console shows **no** hydration warning.
5. **Theme:** toggle light/dark — the error underline swaps to `text-primary`, the pills/panels keep contrast, and nothing flashes.
6. **Responsive:** 375 / 768 / 1024 / 1440 px — Services is 1 column → 3 columns with vertical hairlines; Contact stacks copy-then-form; the footer stacks; no horizontal scroll.
7. **Drawer interaction:** open a project card → the page recedes, the inputs/links behind it are unreachable by Tab (`inert`), `Escape` closes and focus returns to the card title.
8. **Reduced motion:** with `prefers-reduced-motion: reduce`, the Services hairline appears without the scale transition and the drawer fades instead of sliding.

## 4.2 Findings reported, not silently changed

| # | Finding | Why it was not changed here | Recommended fix |
| --- | --- | --- | --- |
| **F-1** | `--text-muted` fails WCAG AA: **2.46:1** light, **4.12:1** dark for small text (eyebrow labels, pillar index `[ 01 / 03 ]`, tag chips, clock, disabled-control labels) | It is a **UX §2A token value**, not a component choice, and it is already used the same way by Sub-Task A (navbar) and Sub-Task B (`#works` eyebrow, index, chips). Editing my three components to `text-text-secondary` would make this sub-task visually inconsistent with the sections above it without fixing the cause | One-line change in `src/styles/app.css`: raise `--text-muted` (e.g. to `#71717a` light / `#8b8b93` dark) — a §2A amendment, so it belongs in a deliberate design change, not a silent edit |
| **F-2** | Two probe rows in `public.inbox_messages` | Anon has no DELETE (by design); the service-role key is deliberately absent from this environment | Delete `name = 'PROBE — delete me'` in the dashboard |
| **F-3** | The contact endpoint has no spam protection; RLS is `with check (true)` and the only bounds are zod's limits | Explicitly out of scope for this sub-task (§1.3), and a honeypot would have added a 5th field the brief did not specify | Phase 5 hardening: honeypot + per-IP rate limit, optionally Turnstile |
| **F-4** | `#articles` in `NAV_LINKS` still scrolls nowhere | Phase 3 owns that section | ROADMAP §3.1 |

## 4.3 Follow-ups carried from the plan

CV file-size and `updated_at` indicators (UX §3F), a per-blur validation mode for the form, `site_configs.social` if the links should be editable without a deploy, submit notifications (Resend/SMTP), the admin inbox UI (`is_read`), and Vitest — the schema, `toFieldErrors` and `formatJakartaTime` are the natural first unit targets (the Node type-stripping harness used in §3.3 is a ready-made starting point for the first two).

## 4.4 Readiness for the next phase

- The landing page's route map from PRD §4A.1 is now complete except **Selected Writings / Insights** (`#articles`, Phase 3) — every other public anchor resolves.
- The contact seam is the first **write** path in the app and establishes the pattern Phase 4's admin screens will reuse: a typed insert helper in `supabase.server.ts`, a `createServerFn` with a Standard-Schema validator, a serializable `{ ok, error? }` result, and fixed user-facing copy with the detail logged server-side.
- `src/lib/contact.ts` is the reference for "one schema, two runtimes" — the same object feeds the browser and the server validator, and the browser entry point is a named seam (`validateContactInput`) so the zod entry point can change without touching the form.
- Budget state: routes chunk 51,833 gz with **zero** motion-feature growth; the `domMin` contract, the `inert`/focus-trap isolation and the SSR-first posture are all intact and re-verified.
- Verification debt is unchanged from Sub-Tasks A/B: no browser automation and no test runner, so every interactive claim above is structural or code-level and awaits the §4.1 pass.
