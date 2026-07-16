import React from "react";
import { useAuth } from "../context/AuthContext";

export default function AccountBar({ onOpenAdmin }) {
  const { isSupabaseConfigured, authLoading, user, profile, isAdmin, signInWithGoogle, signOut } =
    useAuth();

  if (!isSupabaseConfigured) {
    return (
      <span className="text-[11px] font-mono text-slate-600" title="Set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY to enable accounts">
        guest mode (local only)
      </span>
    );
  }

  if (authLoading) {
    return <span className="text-[11px] font-mono text-slate-600">checking session…</span>;
  }

  if (!user) {
    return (
      <button
        onClick={signInWithGoogle}
        className="flex items-center gap-2 text-xs font-mono bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 px-3 py-1.5 rounded transition-colors"
      >
        <svg viewBox="0 0 48 48" className="w-3.5 h-3.5">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6c-2 1.5-4.6 2.5-7.7 2.5-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.7l6.6 5.6C41.5 36.2 44 30.7 44 24c0-1.3-.1-2.3-.4-3.5z" />
        </svg>
        Sign in with Google
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 text-xs font-mono">
      <span className="text-slate-400 hidden sm:inline">{profile?.display_name || user.email}</span>
      {isAdmin && (
        <button
          onClick={onOpenAdmin}
          className="text-cyan-400 hover:text-cyan-300 border border-cyan-900/60 px-2 py-1 rounded"
        >
          Admin
        </button>
      )}
      <button onClick={signOut} className="text-slate-500 hover:text-slate-300">
        Sign out
      </button>
    </div>
  );
}
