// components/GuestBanner.jsx
import React from "react";
import { useAuth } from "../context/AuthContext";

/**
 * Prominent "sign in to sync" call-to-action for guests (logged-out users).
 * RawBlock styling: thick border, full inversion on hover, clear copy.
 */
export default function GuestBanner() {
  const { user, authConfigured, signInWithGoogle } = useAuth();
  if (user) return null; // only for guests

  return (
    <div className="border-[3px] border-black bg-white px-4 py-3 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <p className="text-sm text-black leading-snug">
        <span className="font-display uppercase tracking-wide">Sign in to sync progress.</span>{" "}
        Your plan is saved on this device only. Sign in with Google to back it up, share
        curricula, and pick up on any device.
      </p>
      <button
        onClick={signInWithGoogle}
        className="btn whitespace-nowrap"
        data-testid="signin-btn"
        disabled={!authConfigured}
      >
        Sign in with Google
      </button>
    </div>
  );
}
