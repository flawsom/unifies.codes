# Unifies — Design System (RawBlock)

> **RawBlock** is Unifies' unapologetic, anti-design design language: structural
> bones, thick borders, system-level type, and the raw power of black-on-white.
> No rounded corners. No shadows. No polish. Every element looks assembled from
> HTML primitives — because that *is* the point. Brutalism as a design language.

This document is the single source of truth for how Unifies looks and behaves.
It is implemented in `src/index.css` (design tokens + component classes) and
enforced app-wide via CSS remaps of the legacy Tailwind `slate/cyan/fuchsia`
utilities. When in doubt, follow this file.

---

## 1. Philosophy

- **Structure over decoration.** Hierarchy comes from border weight, scale, and
  inversion — never from shadows, gradients, or imagery.
- **Honest materials.** Borders are 3–5px. Backgrounds are flat. Text is high
  contrast. Nothing pretends to be 3D.
- **Intentional tension.** Spacing is deliberately irregular (see scale). Asymmetry
  is encouraged. If it looks "too designed," strip it back.

---

## 2. Color

Strict, semantic palette only. No off-palette hues.

| Token            | Light (default)     | Dark (inverted)      | Usage                                   |
| ---------------- | ------------------- | -------------------- | --------------------------------------- |
| `--rb-fg`        | `#000000` Black     | `#FFFFFF` White      | Text, borders, primary fills           |
| `--rb-bg`        | `#FFFFFF` White     | `#000000` Black      | Background, inverse text                |
| `--rb-border`    | `#000000`           | `#FFFFFF`            | All borders                             |
| `--rb-muted`     | `#333333`           | `#BDBDBD`            | Helper / secondary text                |
| `--rb-sunken`    | `#F0F0F0`           | `#141414`            | Inputs, card surfaces, sunken areas    |
| `--rb-sunken-hover` | `#E8E8E8`       | `#1F1F1F`            | Hover state of sunken surfaces          |
| `--rb-link`      | `#0000FF` Blue      | `#4D4DFF`            | **Links only**                          |
| `--rb-success`   | `#008000` Green     | `#00B300`            | Success / "done" / completed            |
| `--rb-warning`   | `#FFA500` Orange    | `#FFB733`            | Warning / caution (e.g. skip confirm)  |
| `--rb-error`     | `#FF0000` Red       | `#FF4D4D`            | Error / destructive                     |
| `--rb-disabled-border` | `#CCCCCC`     | `#555555`            | Disabled borders (no opacity)           |
| `--rb-disabled-fill`   | `#F5F5F5`     | `#0F0F0F`            | Disabled fills                          |

**Rules**
1. Blue (`#0000FF`) is **reserved for hyperlinks only**. Never use it for buttons,
   borders, or decoration.
2. Success/Warning/Error are used semantically — not as decoration.
3. Dark mode is a **full inversion** of the tokens above (white-on-black). There is
   no third theme.

---

## 3. Typography

| Role    | Font        | Size / weight        | Line height | Notes                          |
| ------- | ----------- | -------------------- | ----------- | ------------------------------ |
| h1      | Archivo Black | 64px regular      | 1.0         | Hero / page title              |
| h2      | Archivo Black | 48px regular      | 1.05        | Section title                  |
| h3      | Archivo Black | 32px regular      | 1.1         | Sub-section                    |
| h4      | Work Sans   | 22px semibold       | 1.2         | Card / group title             |
| body    | Work Sans   | 16px regular        | 1.6         | Default text                   |
| small   | Work Sans   | 14px regular        | 1.5         | Captions                       |
| tiny    | Work Sans   | 12px regular        | 1.4         | Meta                           |
| mono    | Space Mono  | 15px regular        | 1.5         | Data, codes, toggle labels     |

- **Headlines** use Archivo Black, uppercase where impact matters.
- **Body** uses Work Sans at 16px / 1.6 for comfortable reading.
- **Mono** (Space Mono) for any machine-readable value (dates, ids, keys).

---

## 4. Spacing

Base unit 8px. Intentionally irregular — use as a starting point, then break it
when the design demands tension.

| Token | px  |
| ----- | --- |
| sp-1  | 4   |
| sp-2  | 8   |
| sp-3  | 16  |
| sp-4  | 24  |
| sp-5  | 40  |
| sp-6  | 64  |
| sp-7  | 80  |
| sp-8  | 120 |

Content container: `max-w-5xl mx-auto` with `px-4 sm:px-5`. Header: `py-4 sm:py-5`.

---

## 5. Border Radius & Elevation

- **Radius: 0 everywhere.** Every element. No exceptions. (`* { border-radius: 0 !important }`.)
- **No shadows.** (`* { box-shadow: none !important }`.) Hierarchy is built with
  border weight + scale, never elevation.
- Border weights: **thin** 1px, **thick** 3px (default), **heavy** 5px (active/hover
  emphasis).

---

## 6. Components

### 6.1 Buttons
| Variant     | Look                                                                    | Hover                  | Active            |
| ----------- | ----------------------------------------------------------------------- | ---------------------- | ----------------- |
| Primary     | `bg-fg` (black), `text-bg` (white), 3px border, square, uppercase 2px tracking | invert → `bg-bg`/`text-fg` | `border-width: 5px` |
| Secondary   | `bg-bg` (white), `text-fg` (black), 3px border                          | invert → `bg-fg`/`text-bg` | —                 |
| Ghost       | transparent, `text-fg`, no border, underline                            | `text-link` (blue)     | —                 |
| Destructive | `bg-error` (red), white text, 3px border                                | `bg-fg`/`text-error`   | —                 |

Sizes: Small (`6px 16px`, 12px, 32px h), Medium (`10px 24px`, 14px, 44px h),
Large (`16px 40px`, 18px, 56px h). Disabled: sunken fill, muted text, `#CCCCCC`
border (no opacity).

Class: `.btn` (primary), `.btn-secondary`, `.btn-ghost`, `.btn-danger`.

### 6.2 Cards
- **Default:** `bg-bg`, 3px `border`, square, `padding: 24px` (sp-4).
- **Elevated:** `bg-bg`, 5px border, square (heavier border = more importance).
- Class: `.card`. Sunken surfaces (phase blocks) use `--rb-sunken`.

### 6.3 Inputs
- Surface sunken `#F0F0F0`, `text-fg`, 3px border, Space Mono 15px, `10px/12px` padding.
- Default 3px border · Hover `#E8E8E8` · **Focus 5px border, no outline** ·
  Error 3px `error` border · Disabled 3px `#CCCCCC`, `#F5F5F5` fill.
- Label: `text-fg`, Archivo Black 14px uppercase, 4px margin-bottom.
- Helper: `text-muted` (or `error` on error), Work Sans 12px, 4px margin-top.
- Class: `.input`.

### 6.4 Chips
- **Filter chip:** `bg-bg`, `text-fg`, 2px border, square, uppercase 10px, 1px tracking,
  `4px/12px` padding. Active → invert (`bg-fg`/`text-bg`).
- **Status chip:** square, 2px colored border; Active `#008000`, Warning `#FFA500`,
  Error `#FF0000`, Default `#000000` — all white fill + colored text + colored border.
- Class: `.chip`, `.chip-active`.

### 6.5 Lists
Transparent, Work Sans 16px, 3px divider, `12px 0` item padding. Hover → underline.
Active → `bg-fg`/`text-bg` full-width. No trailing icons. Class: `.list-row`.

### 6.6 Checkboxes
20×20px, 3px border, square. Unchecked white bg; checked `bg-fg` (black) + white 3px
checkmark. Focus 5px border. Disabled `#CCCCCC` border, `#F5F5F5` fill. Class: `.cbx`.

### 6.7 Theme Toggle
Top-right of every screen (`header` + import screen). Square, 3px border, Space Mono
13px uppercase, `6px 14px` padding. Label shows the **target** mode (`Light`/`Dark`).
Class: `.theme-toggle`. Inverts on hover.

### 6.8 Tooltips / Toasts
Black fill, white text, Space Mono 13px, square, `8px/12px` padding, max-width 260px.
(Inverted block — no border, no shadow.)

---

## 7. Responsiveness (all platforms)

- **Mobile-first.** Base layout is single-column; grids expand at `sm:` (≥640px).
- **Header** stacks/wraps: brand left, `[theme-toggle] [account]` right; on narrow
  screens the title scales to `text-lg` and the row wraps with `gap-3`.
- **Phase grid:** `grid sm:grid-cols-2` — one column on phones, two on larger.
- **Touch targets:** buttons ≥ 44px tall; checkbox/radio hit areas ≥ 20px.
- **No horizontal scroll:** `overflow-x` guarded; long curriculum text wraps.
- **Safe areas:** respects `env(safe-area-inset-*)` on notched devices via viewport meta.
- **Reduced motion:** honors `prefers-reduced-motion` — celebratory animations are
  disabled, not just slowed.

---

## 8. Theming

- Two modes only: **Light** (default, black-on-white) and **Dark** (full inversion).
- Mode is stored in `localStorage` and applied via `html.dark` / default classes.
- All tokens are CSS variables (`--rb-*`), so a mode switch is instantaneous and
  total — no per-component exceptions.
- The app never relies on OS preference alone; the user controls it via the
  `.theme-toggle` in the header.

---

## 9. Do's and Don'ts

1. **Do** use thick borders (3–5px) as the primary visual organizer.
2. **Don't** round any corner — ever. Sharp edges are non-negotiable.
3. **Do** use full inversions (black↔white) for hover/active.
4. **Don't** use opacity for disabled states — use lighter borders + grey fills.
5. **Do** use Archivo Black at large sizes (48–64px) for impact.
6. **Don't** use blue (`#0000FF`) for anything but hyperlinks.
7. **Do** embrace intentional spacing irregularity / asymmetric layouts.
8. **Do** use uppercase + tracking for buttons and labels.
9. **Don't** add decorative images, icons, or illustrations.
10. **Don't** polish or refine — if it looks too "designed," strip it back.

---

## 10. Implementation notes

- Tokens + component classes live in `src/index.css`.
- Legacy utility classes (`bg-slate-*`, `text-cyan-*`, etc.) are **remapped** to the
  RawBlock tokens via CSS so historical JSX conforms without rewrites:
  - `slate-*` → `--rb-fg` / `--rb-bg` / `--rb-border` (per theme)
  - `emerald-*` → `--rb-success`, `amber-*` → `--rb-warning`, `red-*` → `--rb-error`
  - `cyan/fuchsia` → removed/decorative → `--rb-link` / `--rb-border`
- Add new components using the `.btn` / `.card` / `.input` / `.chip` classes — do not
  hand-roll colors.
