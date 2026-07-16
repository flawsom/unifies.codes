import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

const TABS = [
  { id: "accounts", label: "Accounts" },
  { id: "topics", label: "Topics" },
  { id: "progress", label: "Progress" },
];

export default function AdminPanel({ defaultCurriculum, onClose }) {
  const { refreshProfile } = useAuth();
  const [tab, setTab] = useState("accounts");
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [status, setStatus] = useState("");

  // --- topics tab state ---
  const [curriculumText, setCurriculumText] = useState("");
  const [curriculumLoading, setCurriculumLoading] = useState(true);
  const [curriculumError, setCurriculumError] = useState("");

  // --- progress tab state ---
  const [selectedUserId, setSelectedUserId] = useState("");
  const [progressRow, setProgressRow] = useState(null);
  const [progressLoading, setProgressLoading] = useState(false);

  const loadProfiles = useCallback(async () => {
    setLoadingProfiles(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, display_name, is_admin, created_at")
      .order("created_at", { ascending: true });
    if (!error) setProfiles(data || []);
    setLoadingProfiles(false);
  }, []);

  const loadCurriculum = useCallback(async () => {
    setCurriculumLoading(true);
    const { data, error } = await supabase.from("curriculum").select("id, data").eq("id", 1).single();
    if (error || !data) {
      setCurriculumText(JSON.stringify(defaultCurriculum, null, 2));
    } else {
      setCurriculumText(JSON.stringify(data.data, null, 2));
    }
    setCurriculumLoading(false);
  }, [defaultCurriculum]);

  useEffect(() => {
    loadProfiles();
    loadCurriculum();
  }, [loadProfiles, loadCurriculum]);

  const toggleAdmin = async (p) => {
    const { error } = await supabase.from("profiles").update({ is_admin: !p.is_admin }).eq("id", p.id);
    if (!error) {
      setStatus(`${p.email}: admin ${!p.is_admin ? "granted" : "revoked"}`);
      loadProfiles();
      refreshProfile();
    } else {
      setStatus(`Error: ${error.message}`);
    }
  };

  const removeAccountProgress = async (p) => {
    if (!window.confirm(`Reset all progress for ${p.email}? This cannot be undone.`)) return;
    const { error } = await supabase.from("progress").delete().eq("user_id", p.id);
    setStatus(error ? `Error: ${error.message}` : `Progress reset for ${p.email}`);
  };

  const saveCurriculum = async () => {
    let parsed;
    try {
      parsed = JSON.parse(curriculumText);
      setCurriculumError("");
    } catch (e) {
      setCurriculumError("Invalid JSON: " + e.message);
      return;
    }
    const { error } = await supabase
      .from("curriculum")
      .upsert({ id: 1, data: parsed, updated_at: new Date().toISOString() });
    setStatus(error ? `Error: ${error.message}` : "Curriculum saved. Users will get it on next load.");
  };

  const resetCurriculumToDefault = () => {
    setCurriculumText(JSON.stringify(defaultCurriculum, null, 2));
    setCurriculumError("");
  };

  const loadUserProgress = async (userId) => {
    setSelectedUserId(userId);
    if (!userId) {
      setProgressRow(null);
      return;
    }
    setProgressLoading(true);
    const { data, error } = await supabase
      .from("progress")
      .select("user_id, checked, start_date, updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    setProgressRow(!error && data ? data : { user_id: userId, checked: {}, start_date: "" });
    setProgressLoading(false);
  };

  const toggleProgressItem = (itemId) => {
    setProgressRow((row) => ({
      ...row,
      checked: { ...row.checked, [itemId]: !row.checked[itemId] },
    }));
  };

  const saveProgress = async () => {
    if (!progressRow) return;
    const { error } = await supabase.from("progress").upsert({
      user_id: progressRow.user_id,
      checked: progressRow.checked,
      start_date: progressRow.start_date,
      updated_at: new Date().toISOString(),
    });
    setStatus(error ? `Error: ${error.message}` : "Progress saved.");
  };

  return (
    <div className="fixed inset-0 z-[300] bg-slate-950/95 backdrop-blur-sm overflow-y-auto">
      <div className="max-w-4xl mx-auto px-5 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-cyan-400 uppercase">Control Room</p>
            <h1 className="text-2xl font-bold text-slate-50">Admin Panel</h1>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-mono border border-slate-700 hover:border-slate-500 text-slate-300 px-3 py-1.5 rounded"
          >
            Close
          </button>
        </div>

        <div className="flex gap-2 mb-5 font-mono text-xs">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded border ${
                tab === t.id
                  ? "border-cyan-500 text-cyan-400 bg-cyan-950/30"
                  : "border-slate-800 text-slate-500 hover:border-slate-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {status && (
          <div className="mb-4 text-xs font-mono text-amber-400 border border-amber-900/50 bg-amber-950/20 rounded px-3 py-2">
            {status}
          </div>
        )}

        {tab === "accounts" && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
            {loadingProfiles ? (
              <p className="p-4 text-sm text-slate-500">Loading accounts…</p>
            ) : profiles.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">No accounts yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-800 font-mono uppercase">
                    <th className="p-3">Email</th>
                    <th className="p-3">Joined</th>
                    <th className="p-3">Admin</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((p) => (
                    <tr key={p.id} className="border-b border-slate-800/60">
                      <td className="p-3 text-slate-200">{p.email}</td>
                      <td className="p-3 text-slate-500 font-mono text-xs">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => toggleAdmin(p)}
                          className={`text-xs font-mono px-2 py-1 rounded border ${
                            p.is_admin
                              ? "border-amber-500 text-amber-400"
                              : "border-slate-700 text-slate-500 hover:border-slate-500"
                          }`}
                        >
                          {p.is_admin ? "Admin" : "Make admin"}
                        </button>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => removeAccountProgress(p)}
                          className="text-xs font-mono text-red-400 hover:text-red-300"
                        >
                          Reset progress
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === "topics" && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-3">
              Edit the full curriculum (phases, bonus track, DSA track) as JSON. Every signed-in
              user reads this same object — invalid JSON won't be saved.
            </p>
            {curriculumLoading ? (
              <p className="text-sm text-slate-500">Loading curriculum…</p>
            ) : (
              <>
                <textarea
                  value={curriculumText}
                  onChange={(e) => setCurriculumText(e.target.value)}
                  spellCheck={false}
                  className="w-full h-96 bg-slate-950 border border-slate-800 rounded p-3 font-mono text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                />
                {curriculumError && (
                  <p className="mt-2 text-xs font-mono text-red-400">{curriculumError}</p>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={saveCurriculum}
                    className="text-xs font-mono bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold px-3 py-1.5 rounded"
                  >
                    Save curriculum
                  </button>
                  <button
                    onClick={resetCurriculumToDefault}
                    className="text-xs font-mono border border-slate-700 hover:border-slate-500 text-slate-300 px-3 py-1.5 rounded"
                  >
                    Reset to bundled default
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {tab === "progress" && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
            <label className="block text-xs font-mono text-slate-500 mb-2">Select account</label>
            <select
              value={selectedUserId}
              onChange={(e) => loadUserProgress(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 mb-4"
            >
              <option value="">— choose an account —</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.email}
                </option>
              ))}
            </select>

            {progressLoading && <p className="text-sm text-slate-500">Loading progress…</p>}

            {progressRow && !progressLoading && (
              <>
                <label className="block text-xs font-mono text-slate-500 mb-2">Mission start date</label>
                <input
                  type="date"
                  value={progressRow.start_date || ""}
                  onChange={(e) => setProgressRow((r) => ({ ...r, start_date: e.target.value }))}
                  className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 mb-4"
                />

                <p className="text-xs font-mono text-slate-500 mb-2">
                  Checked items ({Object.values(progressRow.checked || {}).filter(Boolean).length} checked)
                </p>
                <div className="max-h-64 overflow-y-auto border border-slate-800 rounded p-2 space-y-1 mb-4">
                  {Object.keys(progressRow.checked || {}).length === 0 ? (
                    <p className="text-xs text-slate-600 p-2">No items checked yet.</p>
                  ) : (
                    Object.entries(progressRow.checked).map(([itemId, done]) => (
                      <label key={itemId} className="flex items-center gap-2 text-xs font-mono text-slate-300 px-2 py-1">
                        <input type="checkbox" checked={Boolean(done)} onChange={() => toggleProgressItem(itemId)} />
                        {itemId}
                      </label>
                    ))
                  )}
                </div>

                <button
                  onClick={saveProgress}
                  className="text-xs font-mono bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold px-3 py-1.5 rounded"
                >
                  Save progress
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
