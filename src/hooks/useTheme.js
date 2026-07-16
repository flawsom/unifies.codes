import { useEffect, useState } from "react";

// Theme: 'light' | 'dark' | 'system'. Persisted to localStorage and applied to
// <html data-theme>. Respects prefers-reduced-motion and OS color scheme.
const KEY = "fde-tracker-theme";

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(KEY) || "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    const apply = (value) => {
      const dark =
        value === "dark" ||
        (value === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      root.classList.toggle("dark", dark);
      root.classList.toggle("light", value === "light");
      root.style.colorScheme = dark ? "dark" : "light";
    };
    apply(theme);
    localStorage.setItem(KEY, theme);

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => apply("system");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  return [theme, setTheme];
}
