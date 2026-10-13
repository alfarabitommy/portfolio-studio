# Phase 2 — Sub-Task C Technical Implementation Plan

## Core Competencies & Services · Interactive Contact Form (dual-side Zod) · Editorial Footer

| | |
| --- | --- |
| **Status** | Approved — execution not started (this file has not been executed against yet) |
| **Scope** | ROADMAP §2.5 (Core Competencies & Services), §2.6 (Interactive Contact Section & Dynamic Touchpoints), landing-page composition tail |
| **Depends on** | Sub-Tasks A + B complete — `src/routes/index.tsx` (`<LazyMotion features={domMin} strict>`, loader, `inert` wrapper, recede wrapper), `src/server-fns/{site-config,projects}.ts` seam pattern, `src/lib/{site,works,cn,motion}.ts`, `docs/**` contracts, `supabase/migrations/*` RLS already deployed |
| **Target stack** | TanStack Start 1.168.60 · React 19.2 · Vite 8 · Nitro 3 · Tailwind 4.1.18 · TypeScript 6 strict · `@supabase/ssr` 0.12.7 · `motion` 14 (must stay `domMin`) · **zod 4.6.5 (new direct dep)** |
| **Deliverable of this document** | An executable, step-ordered plan with per-step gates. **No production code is written until the plan's steps are executed.** |

Two claims in the approved brief were checked against `node_modules` and found to be inaccurate as written; they are corrected in §3.2 **A2** (the `.validator((data: unknown) => …)` snippet) and **A3** (`contactSchema`'s file placement) rather than being silently followed or silently substituted.

---

## 1. Objective, Scope & Definition of Done

### 1.1 Objective

Complete the public single-page surface of `/` below Featured Works: a three-pillar Services grid, an interactive contact form whose payload is validated **twice** (browser `safeParse`, then a server-only `createServerFn` validator) before landing in `public.inbox_messages`, and an editorial footer carrying the direct channels, the dynamic CV download and a hydration-safe Jakarta live clock.

### 1.2 In Scope

1. `src/lib/contact.ts` — isomorphic Zod schema, intent vocabulary, field-error mapper, shared copy (new).
2. `src/server-fns/contact.ts` — `submitContactMessage` server function (new).
3. `src/lib/supabase.server.ts` — one new typed insert helper (modified).
4. `src/lib/services.ts` — pillar copy/constants (new).
5. `src/components/services.tsx` — `<section id="services">` (new).
6. `src/components/contact-section.tsx` — `<section id="contact">` + the client form state machine (new).
7. `src/components/footer.tsx` — footer + `LiveClock` + CV download + social row (new).
8. `src/lib/site.ts` — social links, site name, timezone constants (modified).
9. `src/routes/index.tsx` — loader + composition inside the existing `inert`/recede wrapper (modified).
10. `package.json` / `package-lock.json` — `zod` as a direct dependency (modified).

### 1.3 Out of Scope (explicit, to stop creep)

| Not in this sub-task | Owner |
| --- | --- |
| `#articles` section (the anchor stays dead in `NAV_LINKS`) | ROADMAP §3.1 |
| Anti-spam (honeypot, rate limit, Turnstile) — the RLS policy is `with check (true)` | Phase 5 hardening (§15) |
| CV **file size** indicator (UX §3F) — needs a cross-origin `HEAD`/`Content-Length` fetch | follow-up (§15) |
| Admin inbox UI, mark-read, `is_read` toggling | ROADMAP §4.3 |
| Email notification on submit (Resend/SMTP) | not specified for Phase 2 |
| `site_configs.social` key / migration | see §3.2 A6 |
| JSON-LD `Person.sameAs`, OG/Twitter cards, `sitemap.xml` | ROADMAP §3.4 |
| Vitest / ESLint / Prettier (repo has none — AGENTS.md) | not scheduled |
| New routes — `src/routeTree.gen.ts` must stay byte-identical | — |

### 1.4 Definition of Done

- [ ] `npm run typecheck` exits 0 (strict + `noUnusedLocals`/`noUnusedParameters`/`verbatimModuleSyntax`).
- [ ] `npm run build` exits 0; `.output/server/_ssr/contact-*.mjs` exists; **zero** import-protection violations.
- [ ] Client leak scan: no `createSupabaseServerClient`, `SUPABASE_SERVICE_ROLE_KEY`, `insertInboxMessage`, `getSiteConfig` in `.output/public/assets/*.js`.
- [ ] `sha1 src/routeTree.gen.ts` = `d21a5e495a38c29be169e78d98b0eb49defc6d3e`.
- [ ] Routes-chunk gzip delta measured and reported (target `< 20 KB`; zod's share reported separately).
- [ ] **No new motion features**: `grep -rE "domAnimation|domMax|whileHover|whileTap|whileInView|motion\." src/components/{services,contact-section,footer}.tsx` → 0 hits; no `motion/react` import in any of the three.
- [ ] SSR HTML (`curl -s localhost:3000/`) contains, in document order: `id="services"`, the three pillar titles, `id="contact"`, the headline, `name="intent_type"` ×3, `aria-live="polite"`, `Jakarta, ID • GMT+7`, and the four `[ GitHub ] / [ LinkedIn ] / [ X ] / [ WhatsApp ]` mono labels.
- [ ] SSR HTML contains **no** live clock value (`\b\d{2}:\d{2} WIB\b` → 0 hits) — proving the server rendered the static string.
- [ ] `curl … | grep -c 'aria-invalid="true"'` = 0 on the pristine page (idle state).
- [ ] Degradation drill (blank Supabase env): `/` still 200s, all three sections still render, form is interactive.
- [ ] Real submission inserts a row: server-seam probe returns `ok:true`; malformed payload is rejected server-side (non-200).
- [ ] `.output/`, probe code and scratch artifacts removed; final tree = §4.4 inventory; `src/styles/app.css` unchanged.
- [ ] Manual browser/keyboard pass handed to the user (no browser in this environment).

---

## 2. Verified Baseline (facts read from this checkout)

### 2.1 Repository / tooling facts

- `src/` holds `components/` (navbar, hero, hero-spotlight, availability-pill, magnetic-button, resume-trigger, theme-toggle, featured-works, project-drawer), `lib/` (cn, motion, site, works, supabase, supabase.server, use-project-drawer), `server-fns/{site-config,projects}.ts`, `routes/{__root,index}.tsx`, `styles/app.css` (211 lines), `types/database.ts`.
- `src/routes/index.tsx` (85 lines) renders `<LazyMotion features={domMin} strict>` → `<div inert>` → `<Navbar>` + recede `<div>` → `<main><Hero/><FeaturedWorks/></main>` + `<ProjectDrawer>` as a `LazyMotion` sibling.
- Scripts: `dev`, `typecheck`, `build`, `preview`, `generate-routes`. **No linter, formatter or test runner** (AGENTS.md) — so no `npm test`, no "tests passed" claims.
- Import style in `src/`: relative paths (`../lib/cn`), `import type` for type-only imports (enforced by `verbatimModuleSyntax`).
- Tailwind v4 scans `src/lib/*.ts` for class strings (proven by Sub-Task B's `SHEET_HEIGHT_CLASS` in `src/lib/works.ts`).
- `src/styles/app.css` already defines `@media (prefers-reduced-motion: reduce)` handling, `section[id] { scroll-margin-top: 6rem }`, `html { scroll-behavior: smooth }`, and bridges every token into Tailwind (`bg-*`, `text-*`, `border-*`, `font-mono`).

### 2.2 Framework facts verified in `node_modules` (these drive decisions below)

| # | Fact | Evidence |
| --- | --- | --- |
| F-1 | **Validators run on the server only.** The compiler *strips* `.validator()` from the client copy of a server-fn module | `@tanstack/start-plugin-core/dist/esm/start-compiler/handleCreateServerFn.js:140` (`if (context.env === "client") stripMethodCall(...)`) and `@tanstack/start-client-core/dist/esm/createServerFn.js:101` (`if (validator && env === "server") ctx.data = await execValidator(...)`) |
| F-2 | **A Zod v4 schema is accepted directly** as a validator: Zod implements Standard Schema (`~standard`), and `execValidator` dispatches on `"~standard" in validator` → `validate(input)` → throws `new Error(JSON.stringify(issues))` on failure | `createServerFn.js:169-179`; `zod/v4/core/standard-schema.d.ts:11-30` |
| F-3 | **`ResolveValidatorInput` for a schema object = `~standard.types.input`** (a serializable object literal) → the client call gets a *required, typed* `data`; for a `(data: unknown) => …` function it resolves to `unknown`, which `ValidateSerializable` maps to a `SerializationError` brand and makes the fetcher's `data` optional/untyped | `router-core/dist/esm/validators.d.ts:49`; `start-client-core/dist/esm/createServerFn.d.ts:86`; `router-core/dist/esm/ssr/serializer/transformer.d.ts:47,82` |
| F-4 | **The handler body is extracted into a `?tss-serverfn-split` provider module**; the caller module keeps sibling exports, and `supabase.server`-style imports survive in the client graph only because Rollup drops the now-unused specifier (the pattern Sub-Task B shipped and verified: build exit 0, 0 leaks) | `handleCreateServerFn.js:106-174`; plan 03 §1.2 Step 2 / §3.2 |
| F-5 | `Serializable` = `string \| number \| boolean \| null \| undefined \| bigint \| Date \| Uint8Array \| RawStream \| void \| {[TSR_SERIALIZABLE]: true}` → `{ ok: boolean; error?: string }` and a 4-string-object payload are both legal for `strict: true` | `transformer.d.ts:11-26` |
| F-6 | `zod@4.6.5` is already hoisted in `node_modules` (transitive via `@tanstack/start-plugin-core` and `@tanstack/router-cli`) → declaring it adds **no new package** to the lockfile tree | `npm ls zod` output |
| F-7 | Zod v4 API confirmed: `z.string().min(2, { message })`, `.max()`, `.trim()`, `z.email({ message })`, `z.enum([...])`, `safeParse`, `error.issues[].path`/`.message`; `zod/mini` exists as a smaller subpath export | `zod/v4/classic/schemas.d.ts:98-198`; `zod/package.json` exports |
| F-8 | The server-fn URL is `${TSS_SERVER_FN_BASE}${functionId}` with `x-tsr-serverFn: true` and seroval-encoded bodies → **not curl-friendly**; SSR/loader probes are the practical verification route | `client-rpc/createClientRpc.js:6`; `client-rpc/serverFnFetcher.js:70-97` |
| F-9 | A non-OK, non-serialized server-fn response surfaces to the client as `throw new Error(await response.text())` → the raw text may contain technical detail, so it must never be rendered into the DOM | `client-rpc/serverFnFetcher.js:174` |

### 2.3 Data facts

- `public.inbox_messages` (PRD §5C): `id uuid pk default gen_random_uuid()`, `name text not null`, `email text not null`, `intent_type text not null default 'general'`, `message text not null`, `is_read boolean default false`, `created_at timestamptz default now()`; index `inbox_messages_created_at_idx`.
- RLS already deployed (`supabase/migrations/20261008120100_rls_policies.sql`): `grant insert on public.inbox_messages to anon`; policy *"Anyone may submit a contact message"* `for insert to anon with check (true)`; **`anon` has no SELECT** (SELECT/UPDATE/DELETE are `authenticated` only).
- Consequence 1: an anon insert must not request a representation → **never chain `.select()`** (PostgREST would emit `INSERT … RETURNING *`, which needs SELECT).
- Consequence 2: a written row cannot be read back from this environment (only `VITE_SUPABASE_*` exists in `.env`; no `SUPABASE_SERVICE_ROLE_KEY`) → verification is `ok:true` (2xx from PostgREST) + dashboard confirmation.
- `site_configs.resume` = `{ url: string | null, updated_at: string | null }` is already read by the loader via `getLandingConfig()` and typed in `src/types/database.ts` (`SiteConfigValueMap`).
- No social URLs, personal name, or timezone string exist anywhere in `src/` — see §16.

---

## 3. Decisions & Assumptions

### 3.1 Decided by the brief (not re-litigated)

| # | Decision | Consequence |
| --- | --- | --- |
| D1 | Motion footprint stays `domMin`; micro-interactions are pure CSS (`group-hover`, `peer-checked`, `focus`, `aria-invalid`). | The three new components import **no** motion API, so the motion runtime delta is exactly 0 and `strict` can never throw on them. |
| D2 | Dual-side validation: browser + server, both from **one** Zod schema object. | F-1 makes the server half mandatory, not redundant: the client copy has no validator at all. |
| D3 | `createSupabaseServerClient()` is instantiated **inside** the handler (never at module scope) and inserts through the **anon** client. | Keeps the PRD §5E RLS contract meaningful (the insert is genuinely anon-privileged) and matches plan 01 §3.4's per-request client rule. |
| D4 | The handler never throws to the client: it returns a serializable `{ ok, error? }`. | A Supabase outage degrades to an inline form error; the page never 500s. |

### 3.2 Decisions taken here (defaults; each is vetoable at approval)

| # | Decision | Rationale / trade-off |
| --- | --- | --- |
| **A1** | `zod` is declared as `"zod": "^4.6.5"` (the version already hoisted transitively). | F-6: zero new packages, one deduped copy; pinning `^3` would install a second, older copy and fight the transitive 4.6.5. |
| **A2** | **The validator is the schema object: `.validator(contactSchema)`, not `.validator((data: unknown) => contactSchema.parse(data))`.** The brief's literal snippet is documented as the fallback. | F-3: passing the Zod schema keeps the Standard-Schema path, where the client payload is *typed and required* and `strict: true`'s serializability check stays meaningful. The function form also compiles (its parameter contravariance is satisfied by `ValidateValidator<SerializationError>` staying in the constraint union), but it degrades the client call to `data?: unknown` — i.e. a malformed payload would only be caught at runtime. **If the literal snippet is preferred, the plan's Step 3 gate decides between them with `tsc`** — the runtime behaviour is identical because `execValidator` runs `~standard.validate` vs `.parse` on the same input. |
| **A3** | The schema lives in **`src/lib/contact.ts`** (isomorphic, zero server imports); `src/server-fns/contact.ts` imports it; the client imports it from `src/lib/contact.ts`. | Deviation from the brief's "Schema … (`src/server-fns/contact.ts`)". Rationale: F-4 shows sibling exports of a server-fn module *do* survive into the client bundle today, but that makes the form's correctness depend on the compiler's extraction rewrite plus Rollup dropping the module's server-only import. A pure module removes that dependency, guarantees both sides validate with the *same* object instance, and keeps the DB/RLS reasoning where it belongs. **Zero API cost**: `ContactInput` and the schema remain importable from the server-fn module (it re-exports the type). |
| **A4** | Error styling uses the **existing palette** (user-selected): `aria-[invalid=true]:border-text-primary` on the underline + mono `text-text-primary` error text. No `--color-danger` token. | Keeps UX §2A authoritative; contrast ≥ 4.5:1 in both themes via `--text-primary`. Verified in generated CSS at gate G9. |
| **A5** | `intent_type` defaults to `'freelance'` (first pill, preselected, always a valid enum member). All three pills are native `<input type="radio">` inside a `<fieldset>`. | No "unselected" invalid state to design around; native radios give arrow-key group navigation and `role`/state semantics for free, with zero JS. The DB's `'general'` default is never used (the brief's enum is exactly 3 values). |
| **A6** | Social links are **constants in `src/lib/site.ts`** with `href: string \| null` (user-selected); `null` renders the disabled control, following the `ResumeTrigger` precedent. No `site_configs` key, no migration. | One auditable home for shell vocabulary; nothing broken ships; filling in a handle is a one-line diff. Trade-off: not admin-editable until a Phase 4 key exists (§15). |
| **A7** | Footer controls are text-first mono labels (`[ GitHub ]`), **no brand icons**, with a disabled state while `href === null`. | `lucide-react@1.53` dropped brand icons (Sub-Task B D-D), and mono labels match the editorial language. `ArrowUpRight` is used only as the active-link affordance. |
| **A8** | `LiveClock` renders the **spec string** `Jakarta, ID • GMT+7` on the server *and* on the client's first render (`useState<string \| null>(null)`), then appends `• 17:14 WIB (GMT+7)` after mount. **No `suppressHydrationWarning`.** | Matches the brief verbatim; `suppressHydrationWarning` would mask genuine mismatches elsewhere in the subtree. The 1 s interval writes the same `HH:MM` string for 59 of 60 ticks → React bails out of re-render (`Object.is`) → one render per minute. `hourCycle: 'h23'` avoids the `24:00` ICU quirk; `tabular-nums` + `min-w` stop the neighbour from shifting (CLS). |
| **A9** | `copyrightYear` is passed **from the loader** (`new Date().getFullYear()`), not computed during render. | A render-time year differs between server and client only in the 1-second window at a year boundary — vanishingly rare, but the loader value is dehydrated, so both renders are byte-identical by construction. Cost: one serializable `number` in the payload and one prop. Alternative: inline `new Date().getFullYear()` with the tiny boundary risk. |
| **A10** | The form uses `<form noValidate>` + native `type="email"`/`required` attributes; **Zod owns all messaging**. | Prevents the browser's native bubbles from pre-empting the Zod field errors and the `aria-live` banner, while keeping the input semantics/`aria-required` mapping for AT. |
| **A11** | Field errors: validate-all on submit, clear-the-field on change. No per-keystroke or per-blur re-validation in this sub-task. | Predictable, low-noise UX and a smaller state surface; per-blur validation is listed as a §15 refinement. |
| **A12** | The live region is **one always-mounted `aria-live="polite"` wrapper** whose subtree swaps between `form` and `thank-you`; focus moves to the first invalid control (or the banner) via a single `useEffect` keyed on `status`. | A live region must pre-exist to be reliably announced, so the wrapper never unmounts; the focus move is the primary, deterministic announcement path. |
| **A13** | No portals, no `position: fixed`, no focusable overlay in any of the three components. | Everything stays inside `routes/index.tsx`'s `inert` + recede wrapper, so the Project Drawer's focus trap and `inert` isolation remain authoritative (§4.2). |
| **A14** | Copy literals live in `src/lib/services.ts` / `src/lib/contact.ts` / `src/lib/site.ts` (mirroring `works.ts`). | Keeps UX §3D/§3F vocabulary in one reviewable place, and lets Tailwind v4's source scanner emit the class strings stored there. |
| **A15** | The footer's CV control is a **local `CvDownload`** in `footer.tsx`, not a modification of `ResumeTrigger`. | `ResumeTrigger` is Sub-Task A's file and its behaviour is covered by that summary; a ~10-line local variant avoids touching a verified-unchanged component. |

### 3.3 New constants (single homes)

| Export | Home | Value / source |
| --- | --- | --- |
| `CONTACT_INTENT_TYPES` | `src/lib/contact.ts` | `['freelance','fulltime','consulting'] as const` (brief) |
| `CONTACT_INTENT_LABELS` | `src/lib/contact.ts` | `Freelance / Fulltime / Consulting` (UX §3F pill copy) |
| `contactSchema`, `ContactInput`, `ContactField`, `ContactFieldErrors` | `src/lib/contact.ts` | brief field rules |
| `EMPTY_CONTACT_FORM` | `src/lib/contact.ts` | `{ name:'', email:'', intent_type:'freelance', message:'' }` |
| `toFieldErrors(error)` | `src/lib/contact.ts` | first issue per field, string paths only |
| `CONTACT_SECTION_EYEBROW/TITLE/SUMMARY`, `CONTACT_STORED_MESSAGE`, `CONTACT_FAILURE_MESSAGE`, `CONTACT_UNREACHABLE_MESSAGE` | `src/lib/contact.ts` | UX §3F headline verbatim: *"Have a project in mind, or looking for your next tech lead?"* |
| `SERVICE_PILLARS` (3 × `{ id, title, summary, tags }`), `SERVICES_SECTION_EYEBROW/TITLE` | `src/lib/services.ts` | UX §3D pillars 1–3 verbatim |
| `SITE_NAME` | `src/lib/site.ts` | placeholder — **§16 open item** |
| `SOCIAL_LINKS` | `src/lib/site.ts` | 4 entries, all `href: null` — **§16 open item** |
| `SITE_TIMEZONE = 'Asia/Jakarta'`, `SITE_TZ_LABEL = 'Jakarta, ID'`, `SITE_TZ_SUFFIX = 'GMT+7'`, `SITE_TZ_ABBREVIATION = 'WIB'` | `src/lib/site.ts` | UX §3F `"Jakarta, ID • 17:14 WIB (GMT+7)"` |
| `formatJakartaTime(date)` | `src/lib/site.ts` | `Intl.DateTimeFormat('en-GB', { timeZone, hour:'2-digit', minute:'2-digit', hour12:false, hourCycle:'h23' })` |

---

## 4. Architecture

### 4.1 Data flow & render tree

```
                       (server request for "/")
                                 │
        src/routes/index.tsx     ▼
        loader ──► Promise.all([ getLandingConfig(), getFeaturedProjects() ])
                        │                    │
        + copyrightYear: new Date().getFullYear()   (A9)
                        │
        loader data ── serialised into the SSR dehydration payload
                        │
   ┌────────────────────┴────────────────────────────────────────────────┐
   ▼                                                                    ▼
<div inert={drawer.isOpen}>                       (unchanged from Sub-Task B)
  <Navbar resumeUrl>                               z-50, outside the recede wrapper
  <div recede>  md:scale-[0.97] md:blur-[2px]
    <main>
      <Hero availability>                          SSR
      <FeaturedWorks projects onOpenProject>       SSR
      <Services />                                 SSR  ← new
      <ContactSection />                           SSR shell + client form ← new
      <Footer resumeUrl copyrightYear />           SSR + client clock ← new
    </main>
  </div>
</div>
<ProjectDrawer …>  z-60 backdrop / z-70 panel   (LazyMotion sibling, client-only)
```

Component-level seams:

```
ContactSection (client component, SSR-rendered shell)
  ├── copy column                      ← CONTACT_* constants (no props)
  └── ContactForm                      ← internal component
        ├── values  : useState<ContactInput>(EMPTY_CONTACT_FORM)
        ├── errors  : useState<ContactFieldErrors>({})
        ├── status  : useState<'idle'|'submitting'|'success'|'error'>('idle')
        ├── banner  : useState<string|null>(null)      ← server-side failure copy
        ├── bannerRef / formRef (focus management)
        └── submit  → contactSchema.safeParse(values)         (browser)
                    → submitContactMessage({ data: parsed.data })  (RPC)
                        └── createServerFn POST
                              ├── validator: contactSchema        (server, F-1/F-2)
                              └── handler: createSupabaseServerClient()
                                            └── insertInboxMessage({ name, email, intent_type, message })
                                                  └── INSERT (anon, no RETURNING) → RLS "Anyone may submit…"
```

### 4.2 Layering, `inert` & drawer isolation

| Concern | Guarantee |
| --- | --- |
| Z-index | Unchanged: navbar `z-50`, drawer backdrop `z-60`, panel `z-70`. The new sections use no `z-*` and no positioning contexts. |
| `inert` | `<Services>/<ContactSection>/<Footer>` are inside the same `<div inert={drawer.isOpen \|\| undefined}>` as `Navbar` + `main` → the contact inputs, pills, submit button and footer links leave both the tab order **and** the a11y tree while the drawer is open. |
| Recede wrapper | New sections live inside the recede `<div>`, so the whole page (not just Hero + Works) recedes. No new `transform`/`filter` ancestor: the navbar stays viewport-fixed. |
| Trap authority | `project-drawer.tsx`'s `FOCUSABLE_SELECTOR` query is scoped to the panel, so the new controls can never be reached while it is open. |
| No escape hatches | A13: no `createPortal`, no fixed overlays → nothing can render outside the `inert` subtree. |
| Reduced motion | Nothing new animates transforms on the page level; all new transitions are `motion-safe:`-gated. |

### 4.3 Client state model

| Concern | Owner | Shape / rule |
| --- | --- | --- |
| Form values | `ContactForm` | `useState<ContactInput>(EMPTY_CONTACT_FORM)` — SSR renders the same empty values, so the first client render matches exactly |
| Field errors | `ContactForm` | `useState<ContactFieldErrors>({})`; set from `safeParse(...).error.issues` via `toFieldErrors`, cleared per field on change |
| Status machine | `ContactForm` | `idle → submitting → success \| error`; `if (status === 'submitting') return` guards double submit |
| Server banner | `ContactForm` | `string \| null`; only ever a **fixed constant** (never `error.message`, see F-9) |
| Focus | `ContactForm` | one `useEffect` on `[status]`: `error` → first `[aria-invalid="true"]` else banner; `success` → banner (the thank-you panel) |
| Clock | `LiveClock` (footer) | `useState<string \| null>(null)` → static on server/first render; `useEffect` + `setInterval(1000)` after mount |
| Drawer open state | unchanged | `useProjectDrawer` in `routes/index.tsx` |

### 4.4 File inventory

**New (F)**

| # | Path | Purpose |
| --- | --- | --- |
| F1 | `src/lib/contact.ts` | `contactSchema`, `ContactInput`, intent vocabulary + labels, `EMPTY_CONTACT_FORM`, `toFieldErrors`, shared copy |
| F2 | `src/server-fns/contact.ts` | `submitContactMessage` + `ContactSubmitResult` |
| F3 | `src/lib/services.ts` | `SERVICE_PILLARS`, section eyebrow/title |
| F4 | `src/components/services.tsx` | `<section id="services">` |
| F5 | `src/components/contact-section.tsx` | `<section id="contact">` + internal `ContactForm` |
| F6 | `src/components/footer.tsx` | `<footer>` + `LiveClock` + `CvDownload` + social row |

**Modified (M)**

| # | Path | Change |
| --- | --- | --- |
| M1 | `src/lib/supabase.server.ts` | `+ insertInboxMessage(message: InboxMessageInsert)` (typed, no `.select()`) |
| M2 | `src/lib/site.ts` | `+ SITE_NAME`, `SOCIAL_LINKS`, timezone constants, `formatJakartaTime` |
| M3 | `src/routes/index.tsx` | loader `copyrightYear`; render `<Services/>`, `<ContactSection/>`, `<Footer/>` inside `<main>` |
| M4 | `package.json` / `package-lock.json` | `+ "zod": "^4.6.5"` |

**Verified unchanged (re-check at the end)**

`src/routes/__root.tsx`, **`src/routeTree.gen.ts`**, `src/router.tsx`, `src/styles/app.css` (expected: no change), `src/lib/{cn,motion,works,use-project-drawer}.ts`, `src/components/{navbar,hero,hero-spotlight,availability-pill,magnetic-button,resume-trigger,theme-toggle,featured-works,project-drawer}.tsx`, `src/server-fns/{site-config,projects}.ts`, `src/types/database.ts`, `tsconfig.json`, `vite.config.ts`, `tsr.config.json`, `vercel.json`, `supabase/**`, `docs/**`, `AGENTS.md`.

---

## 5. Step-by-Step Implementation Plan (each step ends at a gate)

### Step 0 — Pre-flight baseline

1. `npm run typecheck` → exit 0; `npm run build` → exit 0.
2. Record: routes-chunk gz (`gzip -c .output/public/assets/*.js` for the chunk containing `src/routes/index.tsx`), total client gz, `sha1sum src/routeTree.gen.ts`, `wc -l src/styles/app.css` (expect 211).
3. **Gate**: both commands exit 0 and the four baselines are written down (needed by §11 / G3).

### Step 1 — M4 add `zod`

1. `npm install zod@^4.6.5` (F-6: resolves to the already-present 4.6.5; expect `package.json` +1 line and no new tarball).
2. **Gate**: `npm ls zod` shows a single deduped `zod@4.6.5`; `npm run typecheck` and `npm run build` exit 0; the `package.json` diff is exactly one dependency line.

### Step 2 — F1 `src/lib/contact.ts`

1. Header comment citing PRD §6.3 (dual-side Zod validation), ROADMAP §2.6, UX §3F.
2. `CONTACT_INTENT_TYPES`, `ContactIntentType`, `CONTACT_INTENT_LABELS`, then:
   ```ts
   export const contactSchema = z.object({
     name: z.string().trim()
       .min(2,   { message: 'Please enter at least 2 characters.' })
       .max(100, { message: 'Please keep your name under 100 characters.' }),
     email: z.email({ message: 'Please enter a valid email address.' })
       .max(254, { message: 'Please enter a valid email address.' }),   // defensive cap beyond the brief
     intent_type: z.enum(CONTACT_INTENT_TYPES, { message: 'Please choose a type of collaboration.' }),
     message: z.string().trim()
       .min(10,   { message: 'Please write at least 10 characters.' })
       .max(2000, { message: 'Please keep your message under 2,000 characters.' }),
   })
   export type ContactInput = z.infer<typeof contactSchema>
   ```
   (`.trim()` runs before the length checks so whitespace-only input cannot pass; the email `.max(254)` is flagged in the code comment as hardening beyond the brief — drop it if the schema should match the brief character-for-character.)
3. `CONTACT_FIELDS`, `isContactField`, `ContactFieldErrors`, `EMPTY_CONTACT_FORM`, `toFieldErrors(error)` (first issue per `path[0]`, string paths only), and the copy constants.
4. **Gate**: `npm run typecheck` exit 0 — this simultaneously proves the Zod v4 param shapes (F-7) and that the module has **no** server imports (`grep -n "supabase.server\|@tanstack/react-start" src/lib/contact.ts` → 0).

### Step 3 — F2 `src/server-fns/contact.ts` + M1 `insertInboxMessage`

1. M1 — append to `src/lib/supabase.server.ts`, above the read helpers:
   ```ts
   /**
    * Insert a public contact-form submission.
    *
    * `.insert()` is called WITHOUT `.select()` on purpose: chaining it makes
    * PostgREST emit `INSERT ... RETURNING *`, which requires the SELECT
    * privilege `anon` deliberately does not have (docs/PRD.md §5E). The
    * default `Prefer: return=minimal` keeps the request on the granted verb.
    */
   export async function insertInboxMessage(message: InboxMessageInsert): Promise<void> {
     const supabase = createSupabaseServerClient()
     const { error } = await supabase.from('inbox_messages').insert(message)
     if (error) throw error
   }
   ```
   (add `InboxMessageInsert` to the existing `import type { … }` list.)
2. F2 — the seam (mirrors `projects.ts` / `site-config.ts` structure):
   ```ts
   import { createServerFn } from '@tanstack/react-start'
   import { insertInboxMessage } from '../lib/supabase.server'
   import { contactSchema, CONTACT_FAILURE_MESSAGE } from '../lib/contact'
   import type { InboxMessageInsert } from '../types/database'

   export interface ContactSubmitResult { ok: boolean; error?: string }

   export const submitContactMessage = createServerFn({ method: 'POST' })
     .validator(contactSchema)                                   // A2 (F-2/F-3)
     .handler(async ({ data }): Promise<ContactSubmitResult> => {
       try {
         const message: InboxMessageInsert = {
           name: data.name, email: data.email,
           intent_type: data.intent_type, message: data.message,
         }
         await insertInboxMessage(message)                        // creates the client inside (D3)
         return { ok: true }
       } catch (error) {
         console.error('[contact] failed to store message:', error)
         return { ok: false, error: CONTACT_FAILURE_MESSAGE }     // D4 — never throw, never leak
       }
     })
   ```
   The module must **not** re-implement the schema; it imports F1 (A3) and re-exports the type for convenience.
3. Temporary probe (removed in Step 11): in `src/routes/index.tsx`'s loader, `await submitContactMessage({ data: { name: 'PROBE — delete me', email: 'probe@example.com', intent_type: 'consulting', message: 'Phase 2 Sub-Task C server-seam probe.' } })` and render `<pre>{JSON.stringify(result)}</pre>` above `<Hero/>`.
4. **Gate**:
   - `npm run typecheck` exit 0, `npm run build` exit 0, `.output/server/_ssr/contact-*.mjs` exists, leak scan (G4) 0 hits → F-4's pattern holds for the new seam.
   - `npm run dev` → `curl -s localhost:3000/ | grep -o '"ok":true'` → **one hit** → PostgREST accepted the anon insert and RLS let it through.
   - Negative: change the probe payload to `{} as never` → the SSR request fails (non-200) → the server validator rejects malformed input even though the browser never sends any (proves F-1's server-only validation). Revert immediately.
   - Note in the summary that the row itself cannot be SELECTed with the anon key (§2.3) — confirm visually in the Supabase dashboard; the probe row is labelled `PROBE — delete me`.

### Step 4 — F3 `src/lib/services.ts` + F4 `src/components/services.tsx`

1. F3: `SERVICES_SECTION_EYEBROW = '[ SERVICES ]'`, `SERVICES_SECTION_TITLE = 'Core Competencies'`, `SERVICE_PILLARS` with the UX §3D wording (System & Web Architecture / Product Engineering & UI/UX / Technical Consulting) and 3–4 Geist-Mono tags each.
2. F4 markup contract:
   - `<section id="services" className="relative border-t border-border-subtle px-6 py-24 sm:px-10 lg:px-16">` — the same rhythm as `#works`; `scroll-margin-top` already global.
   - Header: mono eyebrow + `<h2 className="text-3xl font-bold tracking-tight sm:text-4xl">`.
   - `<ul className="mt-14 grid grid-cols-1 lg:grid-cols-3">` with **explicit** hairline borders per item (not `divide-*`, so the grid geometry is unambiguous at both breakpoints):
     `className="group relative flex flex-col gap-5 border-t border-border-subtle py-8 lg:border-t-0 lg:border-l lg:py-2 lg:pl-8 first:border-t-0 lg:first:border-l-0 lg:first:pl-0"`
   - Each pillar: `formatEditorialIndex(index, 3)` (reuses `src/lib/works.ts`) → `<h3 className="text-xl font-bold tracking-tight sm:text-2xl">` → summary `<p className="text-text-secondary">` → tags as `[ tag ]` mono pills (`mt-auto`, identical class string to the Featured Works chips).
   - Micro-interaction (pure CSS, no motion import): the `<h3>` gains `transition-colors group-hover:text-accent-emerald` and a hairline rule element
     `<span aria-hidden="true" className="absolute top-0 left-0 h-px w-full origin-left scale-x-0 bg-accent-emerald motion-safe:transition-transform motion-safe:duration-300 group-hover:scale-x-100" />`
     — transform-based (compositor only, no layout), and reduced-motion users get the rule appearing instantly (same posture as the Works grayscale reveal).
3. M3a: import `<Services />` into `src/routes/index.tsx` and render it right after `<FeaturedWorks/>` inside `<main>`.
4. **Gate**: `npm run typecheck` exit 0; `curl -s localhost:3000/ | grep -c 'id="services"'` = 1; all three pillar titles present; pillar ids counted = 3; the generated CSS contains the `scale-x-0` rule and the `group:hover` emerald hairline rule (G9); the navbar `#services` anchor now resolves.

### Step 5 — M2 `src/lib/site.ts` + F6 `src/components/footer.tsx`

1. M2 additions: `SITE_NAME` (placeholder), `SOCIAL_LINKS: readonly { label; href: string | null }[]` with all four `href: null` (A6), the timezone constants (A8), and `formatJakartaTime(date)`.
2. F6 markup contract:
   - `<footer id="footer" className="border-t border-border-subtle px-6 py-12 sm:px-10 lg:px-16">`; inner `mx-auto flex w-full max-w-7xl flex-col gap-10 lg:flex-row lg:items-end lg:justify-between`.
   - Left: `<p className="font-mono text-xs tracking-widest text-text-secondary uppercase">© {copyrightYear} {SITE_NAME}. All rights reserved.</p>` + `<LiveClock/>`.
   - Right: social `<ul>` (A7 — `[ GitHub ] [ LinkedIn ] [ X ] [ WhatsApp ]`, each in an `<li>`; `href === null` → `<button type="button" disabled aria-disabled="true" title="GitHub — add the URL in src/lib/site.ts">`; non-null → `<a href target="_blank" rel="noopener noreferrer" className="… hover:text-text-primary">` with `sr-only` "(opens in a new tab)") and the CV control.
   - CV (`CvDownload`, A15): `resumeUrl === null` → disabled `Download CV (PDF) — not uploaded yet` (opacity-40, `cursor-not-allowed`, `title`); otherwise an `<a>` with the `Download` icon (`lucide-react`), mono label, `target="_blank" rel="noopener noreferrer"` — **no `download` attribute** (cross-origin; same reasoning as `resume-trigger.tsx`).
   - `LiveClock` (A8):
     ```tsx
     const [time, setTime] = useState<string | null>(null)
     useEffect(() => {
       const update = () => setTime(formatJakartaTime(new Date()))
       update()
       const id = window.setInterval(update, 1000)
       return () => window.clearInterval(id)
     }, [])
     return (
       <p className="font-mono text-[11px] tracking-widest text-text-muted uppercase tabular-nums">
         {SITE_TZ_LABEL}
         {time === null
           ? <span> • {SITE_TZ_SUFFIX}</span>
           : <span className="inline-block min-w-[13ch]"> • {time} {SITE_TZ_ABBREVIATION} ({SITE_TZ_SUFFIX})</span>}
       </p>
     )
     ```
   - Semantic note (documented in the file header): the `<footer>` sits inside `<main>` per the brief, so it is the page's last *content* block; **no `role="contentinfo"`** is added (that landmark is invalid inside `main`).
3. M3b: render `<Footer resumeUrl={resume?.url ?? null} copyrightYear={copyrightYear} />` as the last child of `<main>`; extend the loader with `copyrightYear: new Date().getFullYear()` (A9).
4. **Gate**: `npm run typecheck` exit 0; `curl` shows `Jakarta, ID • GMT+7` **and** `grep -Ec '\d{2}:\d{2} WIB'` = 0 (the server rendered the static string); the four `[ … ]` labels present with the disabled attributes; `© {currentYear}` present; CV control state recorded (live `resume.url` today is read from `site_configs`).

### Step 6 — F5 `src/components/contact-section.tsx`

1. Layout: `<section id="contact" className="relative border-t border-border-subtle px-6 py-24 sm:px-10 lg:px-16">` → `mx-auto grid w-full max-w-7xl grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24`.
   - Left half: mono eyebrow `[ CONTACT ]`, `<h2>` = `CONTACT_SECTION_TITLE` (`Have a project in mind, or looking for your next tech lead?`), `CONTACT_SECTION_SUMMARY`, and a mono line pointing to the footer's direct channels (no `mailto` — the address is a §16 open item).
   - Right half: `<ContactForm/>` (internal component in the same file, mirroring `project-drawer.tsx`'s internal-panel pattern).
2. Form markup (A10/A12):
   ```tsx
   <div aria-live="polite" /* always mounted: pre-exists for AT */>
     {status === 'success'
       ? <div ref={bannerRef} tabIndex={-1} className="rounded-2xl border border-border-subtle bg-surface-card p-6 focus:outline-none">…thank-you + CONTACT_STORED_MESSAGE…</div>
       : <form ref={formRef} noValidate onSubmit={handleSubmit} className="flex flex-col gap-8">
           {/* name / email / message: label + input + conditional <p id={errorId}> */}
           <fieldset className="flex flex-col gap-3">
             <legend className="font-mono text-[11px] tracking-widest text-text-muted uppercase">Type of collaboration</legend>
             <div className="flex flex-wrap gap-3">
               {CONTACT_INTENT_TYPES.map((value) => (
                 <Fragment key={value}>
                   <input type="radio" id={`${radioGroupId}-${value}`} name="intent_type" value={value}
                          className="peer sr-only"
                          checked={values.intent_type === value}
                          onChange={() => setField('intent_type', value)} />
                   <label htmlFor={`${radioGroupId}-${value}`} className={PILL_CLASS}>{CONTACT_INTENT_LABELS[value]}</label>
                 </Fragment>
               ))}
             </div>
           </fieldset>
           {/* server-error banner (text node inside the live region) */}
           <p className="min-h-5 font-mono text-[11px] tracking-widest text-text-primary uppercase">{banner ?? ''}</p>
           <button type="submit" disabled={status === 'submitting'} aria-busy={status === 'submitting'} className={SUBMIT_CLASS}>
             {status === 'submitting' ? 'Sending…' : 'Send Message'}
           </button>
         </form>}
   </div>
   ```
   - Inputs share one class constant (bottom border only + emerald focus glow; A4):
     `w-full rounded-none border-0 border-b border-border-subtle bg-transparent px-0 py-3 text-text-primary placeholder:text-text-muted focus:border-accent-emerald focus:shadow-[0_6px_16px_-8px_var(--accent-glow)] focus:outline-none aria-[invalid=true]:border-text-primary motion-safe:transition-[border-color,box-shadow] motion-safe:duration-300`
   - Pills:
     `cursor-pointer rounded-full border border-border-subtle bg-surface-glass px-4 py-2 font-mono text-[11px] tracking-widest text-text-secondary uppercase backdrop-blur-md transition-colors hover:text-text-primary peer-checked:border-accent-emerald peer-checked:text-text-primary peer-checked:shadow-[0_0_0_1px_var(--accent-glow)] peer-focus-visible:ring-1 peer-focus-visible:ring-text-primary/40`
   - Per-field wiring: `id`, `name`, `aria-invalid={errors.x ? true : undefined}`, `aria-describedby={errors.x ? errorId : undefined}`, `autoComplete="name" | "email"`, `type="email"`, `required`, `<textarea rows={5}>`; `useId()` derives `errorId`/`radioGroupId` (SSR-stable).
3. Handlers/effects exactly as §4.3: `handleSubmit` (guard → `safeParse` → field errors + focus, or RPC), `setField(field, value)` (writes values **and** clears that field's error), the single focus effect on `[status]`, and the fixed-copy failure paths (`CONTACT_FAILURE_MESSAGE` for `{ok:false}`, `CONTACT_UNREACHABLE_MESSAGE` for a thrown/network error, logged via `console.error` — never `error.message` in the DOM, F-9).
4. M3c: render `<ContactSection />` between `<Services/>` and `<Footer/>`.
5. **Gate**: `npm run typecheck` exit 0; `curl` shows `id="contact"`, the headline verbatim, `name="intent_type"` ×3, a preselected `checked` radio, `aria-live="polite"`, all four fields present, and **0** occurrences of `aria-invalid="true"`; the Hero's `#contact` CTA and the navbar anchor now scroll to the section.

### Step 7 — M3 final composition audit

1. Verify in `src/routes/index.tsx`: section order `Hero → FeaturedWorks → Services → ContactSection → Footer` inside `<main>`, inside the recede wrapper, inside the `inert` div, with `<Navbar>` still outside the recede wrapper and `<ProjectDrawer>` still a `<LazyMotion>` sibling.
2. Confirm A13: `grep -rnE "createPortal|position: fixed" src/components/{services,contact-section,footer}.tsx` → 0 hits.
3. **Gate**: `curl -s localhost:3000/ | grep -o 'id="hero"\|id="works"\|id="services"\|id="contact"'` returns the four ids **in that order**; `grep -c "<main"` = 1; the drawer markers (`role="dialog"`, `The Challenge`, `radial-gradient`) are still absent/present exactly as Sub-Task B recorded.

### Step 8 — Full typecheck, build, budget, leak scan

1. `npm run typecheck` → exit 0; `npm run build` → exit 0, no import-protection output.
2. Re-measure chunk gz vs Step 0; quantify zod's share (build once with the form's `contactSchema` import temporarily replaced by a literal payload; difference = zod's client cost — only if the aggregate is close to the budget).
3. Leak scan (G4) and `sha1sum src/routeTree.gen.ts` (G5).
4. **Gate**: all four numbers recorded; leaks 0; sha1 unchanged; if zod's share alone exceeds 8 KB gz, apply the §11.4 `zod/mini` fallback **before** proceeding.

### Step 9 — SSR runtime matrix + degradation drill

1. Run the full `curl` matrix of §13 G6 (≈ 16 assertions).
2. Degradation drill: start a second dev server on port 3100 with `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` blanked in the shell env → the page must still be 200 with all four sections, the form rendered, the social row and CV control in their disabled states, and no availability pill.
3. **Gate**: every assertion passes, with Sub-Task A/B markers re-checked for regressions (hero `radial-gradient` count, `[ 01 / 02 ]`, `aria-haspopup="dialog"`, static clock string).

### Step 10 — A11y / structural audit (markup level)

1. Walk §12's table against the markup and the built CSS: label association (`for`/`id`), `fieldset`/`legend`, radio group `name`, `aria-invalid`/`aria-describedby` pairing, live-region presence in the SSR HTML, focus-ring utilities present, contrast pairs audited token-by-token, `sr-only` for icon-only/duplicate affordances.
2. **Gate**: each row has a concrete artefact (generated CSS line, SSR HTML grep, or code reference). The interactive keyboard walkthrough (Tab → radio arrow keys → submit → invalid focus → success focus) is **handed to the user** — no browser in this environment.

### Step 11 — Remove probes

1. Revert the temporary loader probe in `src/routes/index.tsx` (Step 3.3); `grep -rn "PROBE\|JSON.stringify(result)" src/` → 0.
2. **Gate**: `npm run typecheck` + `npm run build` exit 0 again; the SSR matrix of Step 9 still passes.

### Step 12 — Cleanup & final inventory

1. Remove `.output/`, any `.scratch/`, `/tmp` captures, and note the probe rows for deletion in the Supabase dashboard.
2. Diff the tree against §4.4; confirm `src/styles/app.css` line count unchanged and no stray file exists.
3. **Gate**: final tree = §4.4 inventory; `sha1sum src/routeTree.gen.ts` unchanged; `npm run typecheck` exit 0 on the frozen tree.

---

## 6. Server Seam — Contract (F1 + F2 + M1)

| Aspect | Specification |
| --- | --- |
| Schema home | `src/lib/contact.ts` (isomorphic, zero server imports) — A3 |
| Field rules | `name` 2–100 (trimmed), `email` valid + ≤254, `intent_type` enum of the 3 literals, `message` 10–2000 (trimmed); every rule carries a specific message |
| Validator | `.validator(contactSchema)` — Standard Schema path (F-2/F-3); the client module has **no** validator (F-1) |
| Method | `POST` (mutating; `strict: true` default kept) |
| Client call shape | `submitContactMessage({ data: parsed.data })` — `data` is **required and typed** as `ContactInput` |
| Handler input | `data: ContactInput` (validated output, not `unknown`) |
| Client instantiation | `createSupabaseServerClient()` inside `insertInboxMessage()` — per-request, never module scope (plan 01 §3.4, D3) |
| Insert | `supabase.from('inbox_messages').insert(message)` — **no `.select()`** (§2.3) |
| Row type | `InboxMessageInsert` from `src/types/database.ts` (no hand-written shape) |
| Return | `{ ok: true } \| { ok: false, error: string }` — plain JSON, serializable under `strict` (F-5) |
| Error policy | `try/catch` → `console.error('[contact] failed to store message:', error)` + fixed copy; never `throw`, never echo frame-level error text (F-9) |
| Degradation | missing env / outage / RLS change → inline banner in the form; page stays 200 |
| Not done here | rate limiting, captcha, honeypot, email notification, read-back verification (§1.3 / §15) |

---

## 7. Services Section — Contract (F3 + F4)

| Aspect | Specification |
| --- | --- |
| Props | none (copy is static, from `src/lib/services.ts`) |
| Root | `<section id="services">`, `border-t border-border-subtle`, `px-6 py-24 sm:px-10 lg:px-16` |
| Grid | 1 column, `lg:grid-cols-3`; **explicit** per-item hairlines (`border-t` mobile, `lg:border-l`, `first:` resets) |
| Pillars | UX §3D verbatim: System & Web Architecture · Product Engineering & UI/UX · Technical Consulting |
| Index | `formatEditorialIndex(index, 3)` reused from `src/lib/works.ts` |
| Typography | mono eyebrow + mono index/tags; `<h2> text-3xl sm:text-4xl`, `<h3> text-xl sm:text-2xl`, summary `text-text-secondary` |
| Micro-interaction | pure CSS: `group-hover:text-accent-emerald` + `scale-x-0 → group-hover:scale-x-100` emerald hairline, `motion-safe:transition-transform` |
| Motion budget | no `motion/react` import; `domMin` untouched |
| Reduced motion | transform suppressed via `motion-safe:`; colour change retained (not motion) |

---

## 8. Contact Section & Form — Contract (F5)

| Aspect | Specification |
| --- | --- |
| Root | `<section id="contact">`; 2 halves at `lg` (`lg:grid-cols-2`, `gap-16 lg:gap-24`), stacked copy-then-form on mobile |
| Left half | eyebrow, `<h2>` = UX §3F headline verbatim, summary, mono pointer to the footer channels |
| Form state | `values: ContactInput`, `errors: ContactFieldErrors`, `status: 'idle'\|'submitting'\|'success'\|'error'`, `banner: string \| null` |
| Client validation | `contactSchema.safeParse(values)` → `toFieldErrors(error)` (first issue per field) |
| Server validation | `validator(contactSchema)` on the server fn (§6) |
| Intent pills | native `<input type="radio" name="intent_type" className="peer sr-only">` + glass `<label>` styled with `peer-checked:`/`peer-focus-visible:`; `<fieldset>`+`<legend>`; default `freelance` (A5) |
| Inputs | bottom-border only (`border-0 border-b border-border-subtle bg-transparent`), focus → `border-accent-emerald` + `shadow-[0_6px_16px_-8px_var(--accent-glow)]`, invalid → `aria-[invalid=true]:border-text-primary` (A4) |
| Submit control | pill button, `disabled` + `aria-busy` while `submitting`, label swaps to `Sending…`, double-submit guarded |
| Success | thank-you panel replaces the form inside the same live region; values reset to `EMPTY_CONTACT_FORM`; focus moves to the panel |
| Failure | fixed copy only (`CONTACT_FAILURE_MESSAGE` / `CONTACT_UNREACHABLE_MESSAGE`); the real error goes to `console.error` |
| Field errors | `<p id={errorId}>` + `aria-describedby` + `aria-invalid={true}`; cleared when the user edits that field (A11) |
| Live region | one always-mounted `aria-live="polite"` wrapper (A12) |
| Native validation | `<form noValidate>` (A10) |
| Restored fields | none — the form resets after success (documented) |

---

## 9. Footer & Live Clock — Contract (F6)

| Aspect | Specification |
| --- | --- |
| Props | `{ resumeUrl: string \| null; copyrightYear: number }` |
| Root | `<footer>` inside `<main>`, `border-t border-border-subtle px-6 py-12 sm:px-10 lg:px-16`; **no `role="contentinfo"`** (invalid inside `main`) |
| Copyright | `© {copyrightYear} {SITE_NAME}. All rights reserved.` — year from the loader (A9) |
| Direct links | `SOCIAL_LINKS` from `src/lib/site.ts`; GitHub · LinkedIn · X · WhatsApp as mono labels; `href === null` → disabled button + `title` (A6/A7) |
| CV download | `resumeUrl` (live `site_configs.resume.url`); disabled state while `null`; `target="_blank" rel="noopener noreferrer"`, no `download` attribute |
| Clock — server | renders the static `Jakarta, ID • GMT+7` |
| Clock — client | `useEffect` starts a 1 s interval; state starts `null` so the first client render is byte-identical to the SSR HTML; then `Jakarta, ID • 17:14 WIB (GMT+7)` |
| Clock — determinism | `Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false, hourCycle: 'h23' })`; locale-independent; `tabular-nums` + `min-w-[13ch]` prevent neighbour shift |
| Clock — cleanup | `clearInterval` on unmount; no `window` access during render |
| Hydration | no `suppressHydrationWarning`; the mismatch is designed out, not silenced |

---

## 10. Composition — `src/routes/index.tsx` (M3)

```tsx
loader: async () => {
  const [config, featured] = await Promise.all([getLandingConfig(), getFeaturedProjects()])
  return { ...config, projects: featured.projects, copyrightYear: new Date().getFullYear() }
},
…
<div inert={drawer.isOpen || undefined}>
  <Navbar resumeUrl={resume?.url ?? null} />
  <div className={cn(/* recede, unchanged */)}>
    <main>
      <Hero availability={availability} />
      <FeaturedWorks projects={projects} onOpenProject={drawer.open} />
      <Services />
      <ContactSection />
      <Footer resumeUrl={resume?.url ?? null} copyrightYear={copyrightYear} />
    </main>
  </div>
</div>
<ProjectDrawer … />   {/* unchanged, still a <LazyMotion> sibling */}
```

Notes: no new loader call (no extra round trip — `Footer`/`Services`/`ContactSection` are prop-free or receive already-loaded data); `#articles` remains a dead anchor until Phase 3; anchor offset is already handled by `section[id] { scroll-margin-top: 6rem }` (no `app.css` change).

---

## 11. Motion & Bundle Budget

1. **Zero new motion features.** None of the three components imports `motion/react`; no `m`/`motion.*`, no `whileHover`/`whileTap`/`whileInView`, no `AnimatePresence`, no imperative `animate()`, no `domAnimation`/`domMax`. The only animated things are CSS transitions and layout-free transforms gated by `motion-safe:`.
2. **Forbidden-footprint list** (enforced at G7): `domAnimation`, `domMax`, `whileHover`, `whileTap`, `whileFocus`, `whileInView`, `drag=`, `motion.`, `createPortal`, `position: fixed`.
3. **Acceptance rule**: routes-chunk gz delta `< 20 KB` for the whole sub-task, with zod's share reported separately.
4. **zod fallback**: if zod classic's client share alone exceeds 8 KB gz, switch both import sites to `zod/mini` (`import { z } from 'zod/mini'`, constraints via `z.string().check(z.minLength(2), z.maxLength(100))`, `z.email()` confirmed present at `zod/v4/mini/schemas.d.ts:37`). Same schema semantics, smaller payload; one extra verification pass on the API shape.
5. **No CSS additions expected**: the sections use existing tokens only → `src/styles/app.css` should stay at 211 lines; a change there is a signal that a utility is unavailable and must be justified in the execution summary.
6. **Interaction cost**: the form re-renders only on keystrokes/status changes; the clock re-renders at most once per minute (identical-string bail-out). No per-frame work anywhere.

---

## 12. Accessibility Specification

| Requirement | Implementation | Evidence available without a browser |
| --- | --- | --- |
| Labels | every control has a real `<label for>` (or `fieldset`/`legend` for the radio group) | SSR HTML grep |
| Radio group | native radios sharing `name="intent_type"`; arrow-key navigation is free | SSR HTML (3 `name="intent_type"`) |
| Field errors | `aria-invalid={true}` + `aria-describedby` → the message `id`, both only when invalid | SSR HTML (0 `aria-invalid` on the pristine page) + markup review |
| Status announcements | always-mounted `aria-live="polite"` wrapper (A12) | SSR HTML grep |
| Focus management | one effect on `[status]`: first `[aria-invalid="true"]` else the banner on error; the thank-you panel on success (`tabIndex={-1}`) | code review |
| Submit state | `disabled` + `aria-busy` while `submitting` | SSR HTML + code review |
| Keyboard reachability | all controls are native `<button>`/`<a>`/`input`/`textarea`; no positive `tabindex` | SSR HTML |
| Visible focus | `focus-visible:ring-1 focus-visible:ring-text-primary/40` on buttons/links; inputs use the emerald underline + glow; `peer-focus-visible:` on the pill labels | generated CSS audit |
| Screen-reader-only text | `sr-only` for icon-only affordances and "(opens in a new tab)" | SSR HTML |
| Landmarks | `<footer>` inside `<main>` deliberately without `role="contentinfo"` (§9) | markup review |
| Dialogue isolation | new content is inside `inert` while the drawer is open; no portals (A13) | `routes/index.tsx` review |
| Contrast | error text `text-text-primary` on `bg-base`/`bg-card`; pills `text-text-secondary` → `text-text-primary` when checked; all from UX §2A tokens | token audit |
| Reduced motion | `motion-safe:` on every transition; no transform-only affordance carries meaning | class audit |
| Stable numbers | `tabular-nums` + fixed `min-w` on the clock (CLS 0 target, UX §8.4) | class audit |

---

## 13. Verification Gates (command → expectation)

| # | Command | Expectation |
| --- | --- | --- |
| G1 | `npm run typecheck` | exit 0 at every step gate, and on the frozen tree |
| G2 | `npm run build` | exit 0; 0 import-protection violations; `.output/server/_ssr/contact-*.mjs` exists |
| G3 | gz size of the routes chunk vs Step 0 | `< +20 KB`; zod's share reported separately |
| G4 | leak scan on `.output/public/assets/*.js` | 0 hits for `createSupabaseServerClient`, `SUPABASE_SERVICE_ROLE_KEY`, `insertInboxMessage`, `getSiteConfig`, `getPublishedProjects` |
| G5 | `sha1sum src/routeTree.gen.ts` | `d21a5e495a38c29be169e78d98b0eb49defc6d3e` |
| G6 | `curl -s localhost:3000/` greps | 16 assertions: 4 section ids in order · 3 pillar titles · headline verbatim · `name="intent_type"` ×3 · `aria-live="polite"` · `aria-invalid="true"` = 0 · `Jakarta, ID • GMT+7` present · `\d{2}:\d{2} WIB` = 0 · 4 social labels · `© {year}` · `role="dialog"` = 0 (drawer still client-only) · `radial-gradient` count unchanged · `[ 01 / 02 ]` present · `aria-haspopup="dialog"` present |
| G7 | forbidden-footprint grep over the three new components | `domAnimation\|domMax\|whileHover\|whileTap\|whileInView\|motion\.\|createPortal\|position: fixed` → 0 |
| G8 | server-seam probe (temporary) | valid payload → SSR shows `"ok":true` (anon insert accepted); malformed payload → non-200 (server validator rejects); probe removed in Step 11 |
| G9 | generated-CSS assertions | `aria-invalid` rule emitted · `--accent-glow` shadow utility emitted · `peer-checked` pill rule emitted · `scale-x-0` hairline rule emitted · `tabular-nums` emitted |
| G10 | degradation drill (blank Supabase env, port 3100) | 200; all four sections render; no availability pill; disabled social/CV states |
| G11 | cleanup | `.output/` + scratch removed; tree = §4.4; `app.css` still 211 lines |
| G12 | manual browser / keyboard / responsive pass (375 / 768 / 1024 / 1440 px) | **user-executed** — no browser in this environment |

---

## 14. Risks & Fallbacks

| # | Risk | Fallback |
| --- | --- | --- |
| R1 | Zod bloats the client chunk | §11.4 → `zod/mini` (same semantics, smaller); gate G3 catches it before the sub-task closes |
| R2 | `validator(contactSchema)` hits a type-level surprise under `strict: true` | Ladder: (a) `validator(contactSchema)` → (b) the brief's literal `(data: unknown) => contactSchema.parse(data)` → (c) `validator((data: ContactInput) => contactSchema.parse(data))` (typed parameter keeps `ResolveValidatorInput` serializable) → (d) `createServerFn({ method:'POST', strict:false })` as the last resort. Step 2/3's `tsc` gate decides, and the choice is recorded |
| R3 | Tailwind does not emit `aria-[invalid=true]:` for the underline | G9 checks the built CSS; fallback is a `data-invalid` attribute variant (`data-[invalid=true]:`) or the error text as the only signal |
| R4 | `peer-checked:` pills do not style (input/label order) | Verifiable in devtools; fallback is a `<label>` + `aria-pressed` button group with the same visuals |
| R5 | anon INSERT rejected (RLS/grant drift, e.g. a re-applied migration) | The handler returns `{ok:false, error}` and logs the PostgREST body; diagnosis: re-check `supabase/migrations/20261008120100_rls_policies.sql` state. Last resort (documented, needs justification): `createSupabaseAdminClient()` — it would break the "anon may submit" contract, so it is a decision, not a default |
| R6 | `.select()` accidentally chained on the insert → permission error | Guarded by the M1 comment + G8's real insertion; the failure is `42501` in the log |
| R7 | `Asia/Jakarta` / `hourCycle` unsupported in some runtime's ICU | `formatJakartaTime` builds its formatter lazily in a `try/catch`; on failure the clock keeps the static `Jakarta, ID • GMT+7` label (never throws, never mismatches) |
| R8 | Year differs across the SSR seam (New Year boundary) | Designed out by A9 (loader-provided year) |
| R9 | A submitted message is silently lost (no read-back possible with anon) | `ok:true` means PostgREST accepted the insert (2xx); the row is confirmable in the Supabase dashboard. A read-back check would require the service-role key, deliberately absent (ROADMAP §6.1) |
| R10 | Form spam (no rate limit; `with check (true)`) | Explicitly Phase 5 (§1.3): honeypot + rate limit + optional Turnstile. Today the only bounds are the 2,000-char message cap and zod validation |
| R11 | Focus/live-region double announcement on error | Accepted: the focus move is primary, the live region covers AT flows that do not move focus; documented in the component header |
| R12 | Long copy strings pushed into `src/lib/*.ts` are not scanned by Tailwind | Only *class* strings live there (`works.ts` precedent, verified by Sub-Task B D-C) — G9 confirms each emitted rule |

---

## 15. Follow-ups & Deliberate Omissions

1. Anti-spam: honeypot field, IP rate limiting, optional Turnstile (Phase 5 hardening).
2. CV **file size** indicator (UX §3F) — needs a cross-origin `Content-Length` fetch or a stored value in `site_configs.resume`.
3. CV **updated_at** line (UX §3F): the data is already in `resume.updated_at`; adding it is a two-prop change + one deterministic `Intl` date format (deliberately out of the brief's `resumeUrl`-only scope).
4. `mailto:` direct channel — blocked on the address (§16).
5. `#articles` section + `Selected Writings` (§3.1).
6. Per-blur field validation and a restore-values-on-error policy (A11).
7. `site_configs.social` (or a Phase 4 admin-managed footer config) if the links should be editable without a deploy.
8. Email notification on submit (Resend/SMTP) and the admin inbox UI.
9. Vitest (repo has no test runner) — the contact schema, `toFieldErrors` and `formatJakartaTime` are the natural first unit targets.

---

## 16. Open Items Requiring the User

| # | Item | Current plan | Cost to change |
| --- | --- | --- | --- |
| 1 | `SITE_NAME` for the copyright line | placeholder constant in `src/lib/site.ts` | one line |
| 2 | 4 social URLs (`SOCIAL_LINKS[].href`) | all `null` → disabled controls (user-selected) | one line each |
| 3 | Optional `mailto:` address for the contact left column | omitted | small |
| 4 | A2 — keep `validator(contactSchema)` or the brief's literal `(data: unknown) => …` snippet | schema object (typed client payload) | one line |
| 5 | A9 — loader-provided `copyrightYear` or inline `new Date().getFullYear()` | loader-provided (zero mismatch risk) | one prop |
