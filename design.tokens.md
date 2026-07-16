# Unifies — Design Tokens (machine reference)

> Compact, copy-paste token reference for Unifies' RawBlock v2 system.
> Canonical narrative spec: [`design.md`](./design.md).
> Publish / sync these to designmd.ai via the `designmd` MCP server.

## CSS custom properties

Implemented in `src/index.css` (`@layer base`). Channels are space-separated RGB
so Tailwind opacity modifiers (`/60`) and `rgb(var(--token) / <alpha>)` work.

```css
:root {                 /* LIGHT (default) */
  --bg: 246 247 249;
  --surface: 255 255 255;
  --elevated: 255 255 255;
  --fg: 10 10 12;
  --muted: 84 86 92;
  --faint: 138 141 148;
  --line: 216 219 224;
  --accent: 17 17 17;          /* monochrome ink */
  --accent-fg: 255 255 255;
  --success: 17 163 107;
  --danger: 224 36 36;
  --warn: 194 130 10;
  --shadow-hard-x: 4px;
  --shadow-hard-y: 4px;
  --shadow-hard-color: rgb(10 10 12 / 0.9);
  --shadow-hard: 4px 4px 0 0 rgb(10 10 12 / 0.9);
}
html.dark {             /* DARK (full inversion) */
  --bg: 10 10 12;
  --surface: 22 23 27;
  --elevated: 30 31 37;
  --fg: 244 244 245;
  --muted: 162 165 173;
  --faint: 108 111 119;
  --line: 43 45 51;
  --accent: 244 244 245;       /* monochrome paper */
  --accent-fg: 10 10 12;
  --success: 47 191 126;
  --danger: 255 90 90;
  --warn: 224 169 58;
  --shadow-hard-color: rgb(244 244 245 / 0.5);
  --shadow-hard: 4px 4px 0 0 rgb(244 244 245 / 0.5);
}
```

## Tailwind token utilities (mapped in `tailwind.config.js`)

| Utility            | Token        | Notes                              |
| ------------------ | ------------ | ---------------------------------- |
| `bg-bg` `text-bg` | `--bg`       | page canvas                       |
| `bg-surface`       | `--surface`  | cards / panels / inputs           |
| `bg-elevated`      | `--elevated` | popovers / sticky bars            |
| `text-fg` `bg-fg` | `--fg`       | primary text / primary fills      |
| `text-muted`       | `--muted`    | secondary text                    |
| `text-faint`       | `--faint`    | tertiary / meta text              |
| `border-line`      | `--line`     | all borders & dividers            |
| `bg-accent` `text-accent` `border-accent` | `--accent` | monochrome brand |
| `text-accent-fg` `bg-accent-fg` | `--accent-fg` | on-accent text/fill |
| `text-success` `bg-success` | `--success` | done / XP               |
| `text-danger` `bg-danger` | `--danger` | error / destructive        |
| `text-warn` `bg-warn` | `--warn` | caution / skip / celebrate    |
| `shadow-hard`      | `--shadow-hard` | hard offset shadow              |
| `font-display`     | Space Grotesk | headings / impact numbers         |
| `font-mono`        | JetBrains Mono | codes / dates / XP               |
| `font-sans`        | Inter        | body (default)                   |

## Component classes (in `src/index.css`)

`raw-card` · `raw-btn` · `raw-btn-accent` · `raw-input` · `raw-label` · `raw-stat` ·
`raw-tag` · `raw-chip` · `raw-chip-on` · `raw-check` · `raw-theme-toggle` ·
`list-row` · `tooltip` · `toast` · `toast-error` · `fab` · `safe-t` · `safe-b` ·
`scrollbar-stable`

Legacy aliases (auto-remap old Tailwind palette → tokens, both themes):
`card` · `btn` · `input` · `label` · `chip` · `chip-on` · `helper` · `link` ·
`modal` · `overlay`

## Keyframes

`fade-in` · `pop` · `pop-in` · `slide-up` · `flash` — all disabled under
`prefers-reduced-motion`.

## Hard rules

1. Accent is **monochrome** (ink ↔ paper). No brand hue.
2. **Radius 0** everywhere (FAB circle is the only exception).
3. **No soft shadows** — only the hard offset `--shadow-hard`.
4. Dark mode is a **full token inversion**; no third theme.
5. New code uses `raw-*` + token utilities; never hand-roll colors.
