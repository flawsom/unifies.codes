// components/AccountBar.jsx
import React from "react";
import { useAuth } from "../context/AuthContext";

/**
 * Account / auth control in the header.
 *
 * Three states (driven by useAuth):
 *  - Supabase NOT configured  -> guest mode note (explains why there's no login)
 *  - configured, logged out  -> "Continue with Google" + new/existing guidance
 *  - configured, logged in   -> identity + Sign out (Admin button if admin)
 */
export default function AccountBar({ onOpenAdmin }) {
  const { user, profile, authConfigured, signInWithGoogle, signOut, authError } = useAuth();

  // --- Guest mode: Supabase keys aren't set on the host, so no login is possible.
  if (!authConfigured) {
    return (
      <span
        className="text-[11px] text-slate-500 font-mono max-w-[220px] text-right leading-tight"
        title="Set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY on your host and redeploy to enable sign-in."
      >
        Guest mode — saved on this device. Add Supabase keys to enable sign-in & sync.
      </span>
    );
  }

  // --- Logged out: show sign-in + guidance for new vs existing users.
  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <button onClick={signInWithGoogle} className="btn" data-testid="signin-btn">
          Continue with Google
        </button>
        {authError && (
          <p className="text-danger text-xs mt-1" role="alert">
            {authError}
          </p>
        )}
        <span className="hidden md:inline text-[11px] text-slate-500 max-w-[190px] leading-tight">
          New here? Start now — your plan is saved on this device. Sign in to sync across devices and unlock sharing.
        </span>
      </div>
    );
  }

  // --- Logged in.
  const name = profile?.display_name || profile?.email || user.email || "Account";
  const initial = (name || "?").slice(0, 1).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <span
        className="w-8 h-8 border-[3px] border-black bg-black text-white font-display flex items-center justify-center text-sm"
        title={name}
        aria-label={name}
      >
        {initial}
      </span>
      <span className="hidden sm:inline text-sm text-slate-700 max-w-[160px] truncate">{name}</span>
      {profile?.is_admin && (
        <button onClick={onOpenAdmin} className="btn btn-ghost btn-sm underline">
          Admin
        </button>
      )}
      <button onClick={signOut} className="btn btn-ghost btn-sm underline">
        Sign out
      </button>
    </div>
  );
}
