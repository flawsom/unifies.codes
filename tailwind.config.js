/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      // Semantic color tokens are driven by CSS variables (see src/index.css).
      // This lets a single class (e.g. `bg-surface`) flip cleanly between light
      // and dark without any component-level conditional styling.
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        elevated: "rgb(var(--elevated) / <alpha-value>)",
        fg: "rgb(var(--fg) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        faint: "rgb(var(--faint) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-fg": "rgb(var(--accent-fg) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        warn: "rgb(var(--warn) / <alpha-value>)",
      },
      fontFamily: {
        display: ['"Space Grotesk"', "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ['"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        // Brutalist display scale — tight, intentional, scannable.
        "display": ["clamp(2rem, 6vw, 3.25rem)", { lineHeight: "1.02", letterSpacing: "-0.02em", fontWeight: "700" }],
        "h1": ["clamp(1.5rem, 4vw, 2.25rem)", { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "700" }],
        "h2": ["clamp(1.25rem, 3vw, 1.5rem)", { lineHeight: "1.1", letterSpacing: "-0.01em", fontWeight: "700" }],
        "h3": ["1.0625rem", { lineHeight: "1.2", fontWeight: "700" }],
        "lede": ["1.0625rem", { lineHeight: "1.5" }],
      },
      borderRadius: {
        // Brutalist: hard edges everywhere. Single radius token, no soft pills.
        none: "0",
        sm: "var(--radius)",
        DEFAULT: "var(--radius)",
        md: "var(--radius)",
        lg: "var(--radius)",
        xl: "var(--radius)",
        "2xl": "var(--radius)",
        "3xl": "var(--radius)",
        full: "var(--radius)",
      },
      borderWidth: {
        DEFAULT: "2px",
        1: "1px",
        2: "2px",
        3: "3px",
        4: "4px",
      },
      boxShadow: {
        // Hard, offset shadow (brutalist) — uses a token so it inverts per theme.
        hard: "var(--shadow-hard)",
        "hard-sm": "var(--shadow-hard-sm)",
        "hard-lg": "var(--shadow-hard-lg)",
        focus: "var(--shadow-focus)",
      },
      keyframes: {
        "pop": {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "60%": { transform: "scale(1.04)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 var(--shadow-focus)" },
          "70%": { boxShadow: "0 0 0 6px transparent" },
          "100%": { boxShadow: "0 0 0 0 transparent" },
        },
      },
      animation: {
        "pop": "pop 180ms ease-out",
        "slide-up": "slide-up 220ms ease-out",
        "fade-in": "fade-in 160ms ease-out",
        "pulse-ring": "pulse-ring 1.4s ease-out infinite",
      },
    },
  },
  plugins: [],
};
