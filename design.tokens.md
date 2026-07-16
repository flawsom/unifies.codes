# Unifies — Design Tokens (Reference)

> A compact, token-first companion to the full [`design.md`](./design.md) narrative spec.
> Publish / sync these to designmd.ai via the `designmd` MCP server.

This reference documents the **RawBlock v2** token layer for Unifies as plain prose and
tables, so it can be consumed both by humans and by tooling. All values are space-
separated RGB channels, which lets Tailwind opacity modifiers (such as `/60`) and
`rgb(var(--token) / <alpha>)` both work without extra configuration.

## Color tokens

Color is expressed through CSS custom properties. **Light is the default** (the `:root`
block); **Dark is a full inversion** applied under the `html.dark` class. There is no
third theme.

| Token             | Light                | Dark                 | Role                                |
| ----------------- | -------------------- | -------------------- | ----------------------------------- |
| `--bg`            | `#f6f7f9`           | `#0a0a0c`           | Page canvas                         |
| `--surface`       | `#ffffff`           | `#16171b`           | Cards, panels, inputs              |
| `--elevated`      | `#ffffff`           | `#1e1f25`           | Popovers, sticky bars              |
| `--fg`            | `#0a0a0c`          | `#f4f5f7`           | Primary text and primary fills     |
| `--muted`         | `#54565c`           | `#a2a5ad`           | Secondary and helper text           |
| `--faint`         | `#8a8d94`           | `#6c6f77`           | Tertiary and meta text             |
| `--line`          | `#d8dbe0`           | `#2b2d33`           | All borders and dividers           |
| `--accent`        | `#111111` (ink)     | `#f4f5f7` (paper)   | **Monochrome brand accent**        |
| `--accent-fg`     | `#ffffff`           | `#0a0a0c`           | Text and icons placed on `--accent`|
| `--success`        | `#11a36b`           | `#2fbf7e`           | Completed, XP, "done"             |
| `--danger`        | `#e02424`           | `#ff5a5a`           | Errors, destructive, delete        |
| `--warn`          | `#c2820a`           | `#e0a93a`           | Cautions, skips, celebrate        |

The accent is intentionally **monochrome** — ink in light, paper in dark — and carries
no brand hue. Blue, cyan, fuchsia and similar colors are never used as brand color; the
only non-neutral colors are the three semantic status tokens above. The legacy Tailwind
palette (`slate`, `cyan`, `fuchsia`, `emerald`, `red`, `amber`, `black`, `white`) is
remapped onto these tokens in CSS so historical components conform automatically in both
themes.

## Shadow tokens

RawBlock uses **hard offset shadows only** — never soft elevation. The shadow is a
structural device that reads as physical depth.

| Token                | Light                       | Dark                        |
| -------------------- | --------------------------- | --------------------------- |
| `--shadow-hard-x`    | `4px`                      | `4px`                      |
| `--shadow-hard-y`    | `4px`                      | `4px`                      |
| `--shadow-hard-color`| `rgb(10 10 12 / 0.9)`     | `rgb(244 244 245 / 0.5)`  |

On hover, an element lifts by `-1px, -1px` and the shadow grows; on active it collapses
to `0 0` to mimic a physical press.

## Typography tokens

Three families cover every role. Space Grotesk is the display and heading face; Inter is
the body face (and the framework default); JetBrains Mono is reserved for machine-readable
values such as dates, identifiers, keys and XP.

| Role    | Family         | Tailwind utility | Weights            |
| ------- | -------------- | ---------------- | ------------------ |
| Display | Space Grotesk | `font-display`  | 600 / 700          |
| Heading | Space Grotesk | `font-display`  | 600 / 700          |
| Body    | Inter         | `font-sans`      | 400 / 500 / 600    |
| Mono    | JetBrains Mono | `font-mono`      | 400 / 500 / 700    |

Type scales fluidly from mobile to desktop: the page title runs 36px → 56px, section
titles 26px → 34px, and body text 15px → 16px. Headlines are set uppercase with tight
tracking for impact.

## Component class tokens

Implemented in `src/index.css`. The `raw-*` set is the canonical, token-driven library:
`raw-card`, `raw-btn`, `raw-btn-accent`, `raw-input`, `raw-label`, `raw-stat`, `raw-tag`,
`raw-chip`, `raw-chip-on`, `raw-check`, `raw-theme-toggle`, `list-row`, `tooltip`,
`toast`, `toast-error`, `fab`, `safe-t`, `safe-b`, `scrollbar-stable`.

Legacy aliases — `card`, `btn`, `input`, `label`, `chip`, `chip-on`, `helper`, `link`,
`modal`, `overlay` — are kept so older components stay styled without rewriting. Every
legacy class derives its values from the token set, so both themes stay in sync.

## Motion tokens

Five keyframes drive all motion: `fade-in` (panel and section entrances), `pop`
(toasts, modals, created rows), `pop-in` (tooltips and small surfaces), `slide-up`
(staggered list rows and highlights), and `flash` (recently touched heatmap cells).
Everything honors `prefers-reduced-motion`, which fully disables non-essential animation
rather than merely slowing it.

## Hard rules

1. The accent is monochrome (ink ↔ paper). No brand hue.
2. Every corner is square — `border-radius: 0` is enforced globally; the mobile FAB
   circle is the only deliberate exception.
3. No soft shadows; only the hard offset `--shadow-hard`.
4. Dark mode is a complete token inversion; no third theme exists.
5. New code uses the `raw-*` classes and token utilities — colors are never hand-rolled.

The token layer lives in `@layer base` (custom properties), `@layer components`
(`raw-*` and legacy aliases), and `@layer utilities` (helpers and the theme-alias map).
Theme is a runtime class toggle, so switching is instant and total.
