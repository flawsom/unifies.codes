import { useState, useEffect, useRef } from "react";

// Opt-in browser notifications for a weekly goal reminder. No spam: only fires
// if the user explicitly enabled it AND notifications are granted. Live-data
// only — never sends anything off-device.
const KEY = "fde-tracker-notify";

export function useNotifications(goalReached) {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(KEY) === "1";
    } catch {
      return false;
    }
  });
  const [supported] = useState(() => typeof window !== "undefined" && "Notification" in window);
  const lastFired = useRef(0);

  useEffect(() => {
    localStorage.setItem(KEY, enabled ? "1" : "0");
  }, [enabled]);

  const enable = async () => {
    if (!supported) return false;
    if (Notification.permission === "granted") {
      setEnabled(true);
      return true;
    }
    if (Notification.permission === "default") {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        setEnabled(true);
        return true;
      }
    }
    return false;
  };

  // Fire a gentle nudge if enabled but the weekly goal isn't met (once/day).
  useEffect(() => {
    if (!enabled || !supported || Notification.permission !== "granted") return;
    if (goalReached) return;
    const now = Date.now();
    const dayMs = 86400000;
    if (now - lastFired.current < dayMs) return;
    lastFired.current = now;
    try {
      new Notification("FDE Tracker", {
        body: "Your weekly goal isn't met yet — a little progress today keeps the streak alive.",
      });
    } catch {
      /* notifications may be blocked in some contexts; ignore */
    }
  }, [enabled, supported, goalReached]);

  return { enabled, supported, enable };
}
