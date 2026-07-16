// Theme toggle with SVG sun/moon icons and smooth animation.
// Respects the RawBlock brutalist design system — no rounded corners,
// hard shadows, high contrast.

const SunIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="square"
    strokeLinejoin="miter"
    className="w-4 h-4"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="square"
    strokeLinejoin="miter"
    className="w-4 h-4"
    aria-hidden="true"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const SystemIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="square"
    strokeLinejoin="miter"
    className="w-4 h-4"
    aria-hidden="true"
  >
    <rect x="2" y="3" width="20" height="14" rx="0" ry="0" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const THEMES = [
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
  { value: "system", label: "System", Icon: SystemIcon },
];

export default function ThemeToggle({ theme, onChange, className }) {
  const current = THEMES.find((t) => t.value === theme) || THEMES[0];
  const nextTheme = (() => {
    const idx = THEMES.findIndex((t) => t.value === theme);
    return THEMES[(idx + 1) % THEMES.length];
  })();

  return (
    <button
      onClick={() => onChange(nextTheme.value)}
      className={
        "theme-toggle flex items-center gap-2 px-2.5 py-1.5 border-2 border-fg text-fg hover:bg-fg hover:text-bg transition-colors duration-150 " +
        (className || "")
      }
      title={`Theme: ${current.label}. Click for ${nextTheme.label}.`}
      aria-label={`Color theme: ${current.label}. Click to switch to ${nextTheme.label}.`}
    >
      <current.Icon />
      <span className="font-mono text-[11px] uppercase tracking-wider leading-none">
        {theme === "system" ? "Auto" : current.label}
      </span>
    </button>
  );
}
