# Unifies — Design System (RawBlock v2)

> **RawBlock** is Unifies' unapologetic, anti-decoration design language: structural
> bones, thick borders, system-level type, hard offset shadows, and the raw power of
> high-contrast ink-on-paper. No soft gradients. No rounded corners. No "polish" for
> its own sake. Every element looks assembled from honest primitives — because that
> *is* the point. Neo-brutalism as a study of structure.

This document is the **single source of truth** for how Unifies looks and behaves. It is
implemented in `src/index.css` (design tokens + component classes + a theme-alias
layer) and enforced app-wide. When in doubt, follow this file.

---

## 1. Philosophy

- **Structure over decoration.** Hierarchy comes from border weight, scale, hard
  shadow offset, and inversion — never from soft shadows, gradients, or imagery.
- **Honest materials.** Borders are 2–3px. Backgrounds are flat. Text is high contrast.
  Hard offset shadows are *structural* (they read as physical depth, not glow).
- **Intentional tension.** Spacing is deliberately irregular. Asymmetry is encouraged.
  If it looks "too designed," strip it back — but keep the hard shadow.
- **Two themes, one system.** Light (ink-on-paper) and Dark (paper-on-ink) are total
  inversions driven by the same token set. No third theme, no per-component exceptions.

---

## 2. Color — token system

All color is expressed as **space-separated RGB channels** so Tailwind opacity modifiers
(`/60`, `/40`) and `rgb(var(--token) / <alpha>)` both work. Light is the default
(`:root`); Dark overrides under `html.dark`.

| Token             | Light (default)        | Dark (inverted)         | Role                                   |
| ----------------- | ---------------------- | ----------------------- | -------------------------------------- |
| `--bg`            | `246 247 249` `#f6f7f9` | `10 10 12` `#0a0a0c`   | Page canvas                            |
| `--surface`       | `255 255 255` `#ffffff` | `22 23 27` `#16171b`    | Cards, panels, inputs                 |
| `--elevated`      | `255 255 255`          | `30 31 37` `#1e1f25`   | Popovers, sticky bars                 |
| `--fg`            | `10 10 12` `#0a0a0c`  | `244 244 245` `#f4f5f7`| Primary text, primary fills, borders   |
| `--muted`         | `84 86 92` `#54565c`   | `162 165 173` `#a2a5ad` | Secondary / helper text                |
| `--faint`         | `138 141 148` `#8a8d94`| `108 111 119` `#6c6f77` | Tertiary / meta text                   |
| `--line`          | `216 219 224` `#d8dbe0`| `43 45 51` `#2b2d33`    | All borders & dividers                |
| `--accent`        | `17 17 17` `#111111`   | `244 244 245` `#f4f5f7`| **Monochrome brand ink** (no hue)      |
| `--accent-fg`     | `255 255 255`           | `10 10 12` `#0a0a0c`   | Text/icon on `--accent`               |
| `--success`       | `17 163 107` `#11a36b` | `47 191 126` `#2fbf7e`  | Completed / XP / "done"                |
| `--danger`        | `224 36 36` `#e02424`   | `255 90 90` `#ff5a5a`   | Errors / destructive / delete          |
| `--warn`          | `194 130 10` `#c2820a`  | `224 169 58` `#e0a93a`   | Cautions / skips / celebrate           |

**Shadow tokens (hard offset — not soft):**
```
--shadow-hard-x: 4px;  --shadow-hard-y: 4px;
--shadow-hard-color: rgb(var(--fg) / 0.9);
--shadow-hard: var(--shadow-hard-x) var(--shadow-hard-y) 0 0 var(--shadow-hard-color);
```
In dark mode the offset color flips to `rgb(var(--fg) / 0.5)` so the shadow stays
visible on a near-black canvas. `:hover` nudges the element `-1px,-1px` and grows the
shadow; `:active` collapses it to `0 0` (physical press).

**Rules**
1. The accent is **monochrome** (ink ↔ paper). There is no brand hue. Do not introduce
   blue/cyan/fuchsia as "brand" color.
2. `--success` / `--danger` / `--warn` are **semantic only** — never decorative.
3. Dark mode is a **full inversion** of the token set. There is no third theme.
4. The legacy Tailwind palette (`slate`, `cyan`, `fuchsia`, `emerald`, `red`, `amber`,
   `black`, `white`) is **remapped** to these tokens in CSS (see §11) so historical JSX
   conforms automatically. Prefer the token utilities (`bg-surface`, `text-fg`,
   `border-line`, `bg-accent`, `text-success`…) in new code.

---

## 3. Typography

| Role     | Font (family)        | Tailwind                  | Weight / Notes                              |
| -------- | -------------------- | ------------------------- | ------------------------------------------- |
| Display  | Space Grotesk        | `font-display`            | 600/700 — hero numbers, big stats          |
| Heading  | Space Grotesk        | `font-display` `text-h1/2/3`| section/page titles, uppercase for impact |
| Body     | Inter                | `font-sans` (default)     | 400/500/600 — all UI text                  |
| Mono     | JetBrains Mono       | `font-mono`               | 400/500/700 — codes, dates, ids, XP        |

Type scale (responsive, fluid where noted):
| Token     | Mobile | ≥640px | Line height | Use                      |
| --------- | ------ | ------- | ----------- | ------------------------ |
| `text-h1`| 36px   | 56px    | 1.0         | Hero / page title        |
| `text-h2`| 26px   | 34px    | 1.05        | Section title            |
| `text-h3`| 20px   | 24px    | 1.1         | Sub-section / card title |
| body      | 15px   | 16px    | 1.55        | Default text             |
| small     | 13px   | 14px    | 1.5         | Captions                 |
| tiny      | 11px   | 12px    | 1.4         | Meta                     |

- Headlines use `font-display`, **uppercase** where impact matters, with `tracking-tight`.
- Body uses Inter at 16px / 1.55 for comfortable reading.
- Mono (`font-mono`) for any machine-readable value (dates, ids, keys, XP, percentages).
- Loaded via Google Fonts in `index.html` with `display=swap`; the early paint script
  guarantees no flash of wrong theme.

---

## 4. Spacing & layout

Base unit 4px. Intentionally irregular — use as a starting point, then break it when the
design demands tension.

| Token | px  |
| ----- | --- |
| sp-1  | 4   |
| sp-2  | 8   |
| sp-3  | 12  |
| sp-4  | 16  |
| sp-5  | 24  |
| sp-6  | 32  |
| sp-7  | 48  |
| sp-8  | 64  |

- Content container: `max-w-5xl mx-auto px-4 sm:px-5`.
- Header: `py-4 sm:py-5`, flex-wrap with `gap-3`.
- Section rhythm: `space-y-10 sm:space-y-14`.
- Irregular spacing is encouraged between sibling blocks to create RawBlock tension.

---

## 5. Border radius & elevation

- **Radius: 0 everywhere.** (`* { border-radius: 0 !important }`.) Every element. No
  exceptions — except the mobile **FAB**, which is intentionally circular for recognizability.
- **No soft shadows.** (`box-shadow` is used only for the hard offset `--shadow-hard`.)
  Hierarchy is built with border weight + scale + hard shadow, never soft elevation.
- Border weights: **thin** 1px (dividers), **default** 2px (inputs, chips), **thick** 3px
  (cards, buttons — the RawBlock signature), **heavy** 5px (active/hover emphasis).

---

## 6. Motion

Motion is structural and snappy. All animations respect `prefers-reduced-motion`
(fully disabled, not merely slowed).

| Token           | Keyframes            | Use                                         |
| --------------- | -------------------- | ------------------------------------------- |
| `animate-fade-in` | `fade-in` (0→1 opacity) | Panel/section entrance                    |
| `animate-pop`     | `pop` (scale 0.96→1.02→1) | Toasts, modals, created rows             |
| `animate-pop-in`  | `pop-in` (scale 0.9→1)    | Tooltips, small surfaces                |
| `animate-slide-up`| `slide-up` (y12→0)        | Staggered list rows, highlights         |
| `flash` (heatmap) | `flash` (brightness 1→1.6→1) | Recently-touched heatmap cells      |

- Buttons: `transition-[transform,box-shadow]`; hover lifts `-1px,-1px` + grows shadow;
  active collapses shadow to `0 0` (physical press).
- Respect `prefers-reduced-motion`: a global media query zeroes all durations.

---

## 7. Components

### 7.1 Buttons — `.raw-btn` (new) / `.btn` (legacy alias)
| Variant        | Look                                                            | Hover                     | Active              |
| -------------- | -------------------------------------------------------------- | ------------------------- | ------------------- |
| Primary        | `bg-accent` (ink), `text-accent-fg` (paper), 3px border, square, hard shadow, uppercase 2px tracking | lift `-1px,-1px` + bigger shadow | collapse shadow (press) |
| Accent         | `bg-accent text-accent-fg` (same as primary, explicit)         | same                     | same                |
| Secondary      | `bg-surface text-fg`, 2px `border-line`                        | `border-fg`              | —                   |
| Ghost          | transparent, `text-fg`, underline                              | `text-muted`             | —                   |
| Destructive    | `bg-danger` + paper text, 2px border                           | `bg-fg text-danger`      | —                   |

Sizes: SM `h-8 px-3 text-xs`, MD `h-10 px-4 text-sm`, LG `h-12 px-6 text-base`.
**Touch target ≥ 44px** on all interactive controls. Class: `.raw-btn` / `.btn`
(legacy alias maps `.btn` → ink primary with hard shadow).

### 7.2 Cards — `.raw-card` / `.card`
- **Default:** `bg-surface`, 2px `border-line`, hard shadow, square, `p-4 sm:p-6`.
- **Elevated:** `bg-elevated`, 3px border, heavier shadow (popovers, sticky bars).
- Legacy `.card` alias → `bg-surface text-fg border-line` + hard shadow.
- Sunken surfaces (phase blocks, inputs) use `--surface` on a `--bg` page.

### 7.3 Inputs — `.raw-input` / `.input`
- `bg-surface`, `text-fg`, 2px `border-line`, `font-mono` 14px, `px-3 py-2`.
- Default 2px border · Focus → `border-fg` + visible focus ring (2px `outline` on
  `--accent`, `outline-offset:2px`) · Error → `border-danger` + `text-danger` helper
  · Disabled → `border-line` + `text-faint`, no opacity tricks.
- Label: `text-xs font-semibold uppercase tracking-wide text-muted`.
- Helper: `text-xs text-faint` (or `text-danger` on error).

### 7.4 Chips — `.raw-chip` / `.chip`
- **Filter chip:** `bg-surface text-muted`, 2px `border-line`, square, uppercase 10px,
  1px tracking. Active → `.raw-chip-on` / `.chip-on` (`bg-accent text-accent-fg`).
- **Status chip:** square, 2px colored border; success/danger/warn tints via token.
- Class: `.raw-chip` / `.chip`, `.raw-chip-on` / `.chip-on`.

### 7.5 Lists & rows — `.list-row`
Transparent, body text, 2px divider, `py-3`. Hover → `text-muted`/underline. Active →
`bg-accent text-accent-fg` full-width. No trailing decorative icons.

### 7.6 Checkboxes — `.cbx` / raw-check
20×20px, 2px border, square. Unchecked `bg-surface`; checked → `bg-accent` +
`fill-accent-fg` 3px checkmark (theme-aware — visible in both modes). Focus 2px outline.

### 7.7 Theme toggle — `.raw-theme-toggle` / `.theme-toggle`
Top-right of every screen (header + import). Square, 2px border, `font-mono` 13px
uppercase, `px-3 py-1.5`. Label shows the **target** mode. Inverts on hover.
State lives in `localStorage` key `fde-tracker-theme` (`light` | `dark` | `system`),
applied via `html.dark` by `src/hooks/useTheme.js`.

### 7.8 Tooltips & toasts — `.tooltip` / `.toast` / `.toast-error`
Inverted block (hard shadow, no border): `--fg` fill, `--bg` text, `font-mono` 13px,
`p-2`, max-width 280px. Toasts `animate-pop` from bottom-right; `toast-error` uses
`--danger` tint.

### 7.9 Mobile FAB — `.fab`
Fixed bottom-right, circular (`border-radius:9999px !important`), `bg-accent
text-accent-fg`, hard shadow. **Hidden ≥640px** (`display:none` then `inline-flex` on
`max-width:640px`). Provides the quick-jump / command-palette entry on small screens
(req: P2 #11). Respects `env(safe-area-inset-*)`.

---

## 8. Data visualization (RawBlock data-viz)

- **Activity heatmap:** 7×N grid of square cells; intensity maps to commit-count
  buckets via `--surface` → `--line` → `--accent` ramp. Recently touched cells
  `animate-flash`. Monochrome (no rainbow). Tooltip shows exact count + date.
- **XP / level gauntlet:** horizontal progress bars built from `--line` track +
  `--accent` fill + `font-mono` percentage. Milestone ticks at level boundaries.
- **Stats:** `font-display` huge numbers (`text-h1`) with `font-mono` unit labels.
- All charts are CSS/SVG only — no chart library, keeping the brutalist honesty.

---

## 9. Responsiveness (all platforms & screen sizes)

- **Mobile-first.** Base layout single-column; grids expand at `sm:` (≥640px).
- **Header** wraps: brand left, `[theme-toggle] [account]` right; title scales to
  `text-lg` and row wraps with `gap-3` on narrow screens.
- **Phase grid:** `grid sm:grid-cols-2` — one column on phones, two on larger.
- **Mobile FAB** (§7.9) guarantees a primary action is always thumb-reachable.
- **Touch targets:** buttons ≥ 44px tall; checkbox/radio hit areas ≥ 20px.
- **No horizontal scroll:** `overflow-x` guarded; long curriculum text wraps. The
  deployment "gauntlet" view scrolls horizontally only when a phase genuinely
  overflows, with `scrollbar-stable` to avoid layout shift.
- **Safe areas:** `index.html` ships `viewport-fit=cover`; `.safe-t` / `.safe-b` and the
  FAB offset use `env(safe-area-inset-*)`.
- **Reduced motion:** honors `prefers-reduced-motion` — celebratory animations are
  disabled, not merely slowed.
- **PWA:** installable, offline-cached (Workbox precache), themed `theme-color` that
  follows light/dark.

---

## 10. Accessibility

- **Contrast:** all token pairings meet WCAG AA; `--muted`/`--faint` used only for
  secondary text, never primary.
- **Focus:** every interactive element has a visible 2px outline (on `--accent`) at
  `outline-offset:2px`; never removed.
- **Skip link:** "Skip to content" is the first focusable element, visually hidden until
  focused, jumps to `#main`.
- **Labels:** form fields have associated `<label>`; icon-only buttons carry `aria-label`.
- **Motion:** `prefers-reduced-motion` fully disables non-essential animation.
- **Semantics:** landmarks (`header`/`main`/`footer`/`nav`), `role`/`aria-*` on
  dialogs and live regions for XP/toast announcements.

---

## 11. Implementation notes

- **Tokens + component classes** live in `src/index.css` (`@layer base` tokens,
  `@layer components` for `.raw-*`/legacy aliases, `@layer utilities` for helpers).
- **Theme-alias layer:** components still using Tailwind's default palette are remapped
  onto the tokens via CSS `!important` aliases so they render flawlessly in BOTH themes
  without per-file rewrites:
  - `bg-white`/`text-black`/`bg-black`/`text-white`/`border-black` → ink↔paper
    inversion (`--bg`/`--fg`/`--accent-fg`).
  - `slate-*` → `--surface` / `--line` / `--fg` / `--muted` / `--faint` (per role).
  - `cyan`/`fuchsia`/`sky`/`indigo` → `--accent` (monochrome brand).
  - `emerald`/`green` → `--success`, `red` → `--danger`, `amber`/`yellow` → `--warn`.
  - `fill-white` → `fill-accent-fg` (theme-aware SVG checkmarks).
- **Keyframes** (`fade-in`, `pop`, `pop-in`, `slide-up`, `flash`) are defined globally;
  `prefers-reduced-motion` zeroes them.
- **New code:** use the `raw-*` classes and token utilities (`bg-surface`, `text-fg`,
  `border-line`, `bg-accent`, `text-success`…). Do not hand-roll colors.
- **Fonts:** Inter / Space Grotesk / JetBrains Mono via Google Fonts in `index.html`.
- **No build-time theming** — theme is a runtime class toggle, instant and total.

---

## 12. Do's and Don'ts

1. **Do** use thick borders (2–3px) + hard offset shadows as the primary visual organizer.
2. **Don't** round any corner — ever (the FAB's circle is the only exception). Sharp edges
   are non-negotiable.
3. **Do** use full inversions (ink↔paper) for hover/active states.
4. **Don't** use opacity for disabled states — use lighter borders + muted fills.
5. **Do** use `font-display` at large sizes (34–56px) for impact; `font-mono` for data.
6. **Don't** introduce a brand hue — the accent is monochrome by design.
7. **Do** embrace intentional spacing irregularity / asymmetric layouts.
8. **Do** use uppercase + tracking for buttons and labels.
9. **Don't** add decorative images, icons, or illustrations beyond functional SVG.
10. **Don't** polish or refine into softness — if it looks too "designed," strip it back,
    but keep the hard shadow.
