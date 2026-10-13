# AGENTS.md

## What this is

Personal portfolio & studio showcase. TanStack Start (React 19, Vite 8, SSR) deployed to
Vercel, with Supabase (Postgres, Auth, Storage) as the content backend. Node 22, npm.

**Current state: scaffold.** `src/` holds only the root route and a placeholder home route.
The product described in `docs/` — public single-page landing, article engine, `/admin`
command center — is specified but **not yet implemented**. Supabase is an installed
dependency with zero usage in `src/`.

## Product contracts

Read these before changing product behavior. They are authoritative and written in
Indonesian; keep their vocabulary (*drawer*, *bottom sheet*, *case study*, *availability
pill*, *Reading Progress Bar*) when implementing.

- `docs/PRD.md` — route map (§4), database schema for `projects`, `articles`,
  `inbox_messages`, `site_configs` (§5), the RLS policy matrix (§5E), non-functional
  requirements (§6), Definition of Done (§7).
- `docs/ROADMAP.md` — 6-phase execution plan. Phase 1 and 2 are the near-term work.
- `docs/UX_UX_Spec.md` — design tokens (§2), typography scale, layout wireframes, motion
  parameters, accessibility and Core Web Vitals budgets (§8).

Treat these as target state, not current state. Verify what exists in code before assuming
a route, table, or bucket is present.

## Commands

Verified against this checkout.

| Command | Purpose |
| --- | --- |
| `npm install` | Install dependencies. |
| `npm run dev` | Vite dev server on port 3000. Renders via SSR. |
| `npm run typecheck` | `tsc --noEmit`. TypeScript strict, `noUnusedLocals`/`noUnusedParameters`. |
| `npm run build` | Production build through Nitro → `.output/` (`server/` + `public/`). |
| `npm run preview` | Serve the built output locally. |
| `npm run generate-routes` | Regenerate `src/routeTree.gen.ts`. |

Package manager is **npm** (`package-lock.json`; `.cta.json` records
`"packageManager": "npm"`). The `pnpm.onlyBuiltDependencies` block in `package.json` is an
unused template leftover.

There is **no linter, formatter, or test runner** configured. Do not invoke `npm test` or
`npm run lint` and do not claim tests passed. If a change needs tests, propose adding
Vitest rather than silently introducing a framework.

This is **not a git repository** — there is no branch, commit, or diff workflow to follow.

## Non-obvious contracts

- **`src/routeTree.gen.ts` is generated.** Never hand-edit it; it is marked read-only in
  `.vscode/settings.json` and excluded from search. Routes come from files in `src/routes/`
  (file-based routing, `tsr.config.json` → target `react`). Regeneration normally happens
  automatically through the Vite plugin; `npm run generate-routes` forces it.
- **Path aliases:** both `#/*` and `@/*` resolve to `./src/*` — declared in `package.json`
  `imports` and `tsconfig.json` `paths`, resolved by Vite via `resolve.tsconfigPaths`.
- **Env split:** `.env` is gitignored and currently defines `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY`. `VITE_`-prefixed values are inlined into the browser bundle, so
  treat them as public. Server-only secrets (e.g. `SUPABASE_SERVICE_ROLE_KEY` from
  ROADMAP §6.1) must be **unprefixed** and read only inside loaders or server functions —
  never imported into a component module. `README.md` points at an `.env.example` that does
  not exist in this checkout.
- **SSR is load-bearing.** The document shell lives in `src/routes/__root.tsx`
  (`HeadContent` / `Scripts`); SEO ranking is an explicit goal (PRD §4B, ROADMAP Phase 3).
  Keep page content renderable on the server.
- **Styling:** Tailwind v4 via `@tailwindcss/vite`, single entry `src/styles.css`
  (`@import "tailwindcss";`) linked with `?url` from the root route. The dual-theme tokens
  in `docs/UX_UX_Spec.md` §2 are **not yet** in the stylesheet.

## Verifying your work

1. `npm run typecheck` and `npm run build` both pass.
2. The affected route renders on the server, not just in the browser:
   `npm run dev` then `curl -s localhost:3000/ | grep -ao "<h1"`.
3. Any `src/routeTree.gen.ts` change came from a regeneration run, not a manual edit.
4. State what you verified by hand, since no test suite exists to lean on.
