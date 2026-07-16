import { useEffect, useRef } from "react";

// Traps focus inside a modal while it's open, and restores focus on close.
// `active` toggles the behavior. Returns a ref to attach to the container.
export function useFocusTrap(active) {
  const ref = useRef(null);
  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (!node) return;

    const prevFocused = document.activeElement;
    const selector =
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
    const focusables = () => Array.from(node.querySelectorAll(selector));
    // Focus the first focusable (or the container).
    const first = focusables()[0] || node;
    first.focus();

    const onKey = (e) => {
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    node.addEventListener("keydown", onKey);
    return () => {
      node.removeEventListener("keydown", onKey);
      if (prevFocused && prevFocused.focus) prevFocused.focus();
    };
  }, [active]);
  return ref;
}
