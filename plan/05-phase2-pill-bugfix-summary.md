# Phase 2 — Sub-Task C.1 Execution Summary

## Contact Intent Pills — Selected-State Leak (containment fix)

| | |
| --- | --- |
| **Status** | Complete — automated gates pass; the browser/keyboard pass (G5) is handed to the user (no browser in this environment) |
| **Executed** | 2026-10-13 |
| **Plan** | `plan/05-phase2-pill-bugfix-plan.md` (approved), Steps 0–3 |
| **Files changed** | `src/components/contact-section.tsx` only, plus this summary. `src/styles/app.css` untouched (211 lines), `src/routeTree.gen.ts` sha1 `d21a5e49…` unchanged |
| **Stack verified against** | Tailwind CSS **4.3.3**, React 19, Vite 8.3.3, TypeScript (strict, `noUnusedLocals`) |
| **User override applied** | **O-1** — the empty default state is preserved; G4 asserts **ZERO** checked radios, superseding the plan's `(A5: freelance preselected)` line |
| **Deviations** | **D-1** (emitted selector is `:has(:checked)`, not the predicted `:has(*:checked)`) — cosmetic. Finding **F-1** below |

---

## 1. What changed (plan §2, as executed)

1. **`PILL_CLASS`** — the state variants swapped, every other token byte-identical:
   `peer-checked:` ×3 → `has-checked:` ×3 · `peer-focus-visible:` ×2 → `has-focus-visible:` ×2.
   The `--accent-glow` shadow, the radius, the glass surface and the mono/uppercase treatment are
   unchanged, so the agreed aesthetics are identical by construction, not by re-approximation.
2. **Markup** — the `<Fragment>`-wrapped sibling pair became **one `<label className={PILL_CLASS}>`
   containing its own `<input className="sr-only">`**. `radioId`, `id=` and `htmlFor=` were deleted:
   containment *is* the label association, and it is also what scopes `:has(:checked)` to that one pill.
3. **Imports** — `Fragment` removed → `import { useEffect, useId, useRef, useState } from 'react'`.
4. **Comments** — the `PILL_CLASS` header now documents the containment contract and the leak it
   replaces (with the emitted `~` selector as evidence); the `<fieldset>` comment records that **no
   pill is preselected by design**; the file header cites `plan/05`.
5. **Invariants kept** — `name="intent_type"`, `required`, `aria-invalid` on the radios themselves
   (the focus effect's `[aria-invalid="true"]` lookup still resolves), the `<fieldset>` /
   `<legend>` / `aria-describedby` wiring, and `sr-only` (real radios → arrow-key navigation and AT
   state for free). No `motion/react` import: the motion contract is untouched.

---

## 2. Gate results

| # | Gate | Result | Evidence |
| --- | --- | --- | --- |
| G1 | `npm run typecheck` | **Pass** | exit 0 — proves the `Fragment` removal is clean under `noUnusedLocals` |
| G2 | `npm run build` | **Pass** | exit 0, `✓ built in 3.49s`; only pre-existing `framer-motion` `"use client"` module-directive warnings |
| G3 | generated CSS emits the `:has()` utilities | **Pass** | `.output/public/assets/app-fS5Rz75M.css` (61,947 B) — see §2.1 |
| G4 | SSR HTML: 3 × `name="intent_type"`, **0** checked, 0 `aria-invalid`, 0 `peer` | **Pass** | fresh `npm run dev` on **:3001**, HTTP 200, 48,591 B — see §2.2 |
| G5 | Browser/keyboard interaction pass | **Not executed here** | no browser binary and no DOM library in this environment (§2.3) |

### 2.1 G3 — the emitted rules (verbatim)

```
.has-checked\:border-accent-emerald:has(:checked){border-color:var(--accent-emerald)}
.has-checked\:text-text-primary:has(:checked){color:var(--text-primary)}
.has-checked\:shadow-\[0_0_0_1px_var\(--accent-glow\)\]:has(:checked){…--accent-glow…}
.has-focus-visible\:ring-1:has(:focus-visible){…ring…}
.has-focus-visible\:ring-text-primary\/40:has(:focus-visible){--tw-ring-color:var(--text-primary)}          ← byte 49985
.has-focus-visible\:ring-text-primary\/40:has(:focus-visible){--tw-ring-color:color-mix(… var(--text-primary) 40%, transparent)} ← byte 50129, wins
```

The fallback-then-`color-mix` pair is Tailwind's standard emission for a `/40` modifier on a `var()`
colour, and the modern declaration comes **last**, so the focus ring is exactly as strong as the
previously approved `peer-focus-visible:ring-text-primary/40` (the identical pair is emitted for the
pre-existing `focus-visible:…/40` utilities elsewhere on the page). No visual drift.

### 2.2 G4 — SSR evidence

The three radios, verbatim from the server response:

```html
<input type="radio" required="" class="sr-only" name="intent_type" value="freelance"/>
<input type="radio" required="" class="sr-only" name="intent_type" value="fulltime"/>
<input type="radio" required="" class="sr-only" name="intent_type" value="consulting"/>
```

| Assertion | Value |
| --- | --- |
| `name="intent_type"` | 3 |
| **`checked` attribute on a radio** | **0** |
| `aria-invalid="true"` | 0 |
| `peer` | 0 |
| `has-checked:border-accent-emerald` (label class strings) | 3 |
| `id="…-intent-…"` | 0 |

The 9 `checked` substrings elsewhere in the HTML are all inside the labels' `has-checked:` class
names, not attributes on an input.

### 2.3 G5 — why it is handed over, and what already backs it

This environment has **no browser binary** (`~/.cache/ms-playwright` contains only `ffmpeg-1011` and
an empty `mcp-chrome`) and **no DOM library** (`jsdom`, `nwsapi`, `happy-dom`, `puppeteer`,
`playwright` are all absent), so no automated interaction test is possible. Two things cover the
claim short of a click test:

- **Structural guarantee** — the pill's only state selector is `:has(:checked)` on the label itself;
  `:has()` is evaluated against that label's own subtree, and a pill's radio is a child of that same
  label and of nothing else. No sibling combinator remains in the class string, so the leak cannot
  recur regardless of sibling order or count.
- **Empty default is coherent** (executed) — running the real module in Node
  (`node --experimental-strip-types`) over `EMPTY_CONTACT_FORM` yields
  `intent_type: "Please choose a type of collaboration."`, i.e. the unselected group is a genuine
  invalid state owned by Zod, not a visual-only default.

**2-minute manual pass** (both themes): click Freelance → *only* Freelance shows the emerald border +
glow; repeat for Fulltime and Consulting; then Tab into the group and press ←/→ → the selection and
the focus ring both follow the focused pill only.

---

## 3. O-1 — the empty default state is preserved (not reverted)

- `EMPTY_CONTACT_FORM.intent_type === ''` (`src/lib/contact.ts:192-197`), whose own comment already
  records that it supersedes plan/04 §3.2 A5. It was neither changed nor "restored".
- Gate **G4's** wording in plan/05 §3 still says "exactly one `checked` (A5: freelance preselected)".
  That line is now wrong and is **superseded by this document**; per repo convention the approved
  plan file is left as approved, and the correction lives in the summary (as plan/04 did with D-A…D-F).
- Evidence: **0** checked radios in the SSR HTML (§2.2) and the Zod rejection message above (§2.3).

---

## 4. Deviations & findings

| # | Item | Detail |
| --- | --- | --- |
| **D-1** | Emitted selector is `:has(:checked)`, not `:has(*:checked)` (plan §2 prediction) | Tailwind's `has` compound collapses the universal selector. Cosmetic only — the source-level mechanism was verified in `tailwindcss@4.3.3`'s `lib.mjs` (`compound("has",2,…)` → `&:has(…)`), and G3 confirms the emitted form. |
| **F-1** | The rebuilt bundle **still contains the 5 old `.peer-checked\:…` / `.peer-focus-visible\:…` rules** — dead CSS, referenced by nothing (G4: 0 `peer` in the HTML) | Root cause **proven with a disposable probe**: Tailwind v4 auto-detects sources project-wide and scans **markdown**, so the literal class strings quoted in `plan/04-…-plan.md:424`, `plan/04-…-summary.md` and `plan/05-…-plan.md §2` regenerate them. `src/` itself is clean (`grep peer-checked src/` → 0). Probe: a `shadow-[0_0_0_77px_red]` token placed in a markdown file was emitted into the CSS (1 hit); probe deleted + rebuilt → 0 hits. Cost today is a few hundred bytes of unreferenced CSS. **Optional follow-up (out of scope here, `app.css` was a non-goal):** pin Tailwind's sources with an explicit `@source`/ignore in `src/styles/app.css` if documenting class strings in `plan/` should stop affecting the bundle. |

---

## 5. Cleanup

- Probe file `plan/zz-tailwind-source-probe.md` deleted; the final `npm run build` ran **after** the
  deletion, so `.output/` matched the shipped source (probe hits = 0).
- `.output/` and the `/tmp` captures were removed after the evidence above was recorded (they did not
  exist in the checkout before this sub-task; `.output/` is regenerated by `npm run build`).
- The dev server this run started (**:3001**) was stopped. Port **3000** was already serving your own
  dev server — it was left running and untouched.
- No test runner exists in this repo (AGENTS.md), so verification is typecheck + build + generated-CSS
  and SSR greps, with the browser pass handed over as G5.
