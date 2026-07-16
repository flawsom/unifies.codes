# Competitive Analysis & Product Requirements

> Goal: make **Unifies** the best product in the "study / curriculum / interview-prep
> tracker + habit/study tracker" space, by (a) knowing exactly what competitors
> do, and (b) building the features real users ask for but nobody ships.
>
> Research basis: GitHub repo search + open-issue mining (real data, July 2026),
> competitor landing-page scrapes (Notion, loggd.life, NeetCode, Tech Interview
> Handbook, roadmap.sh, interviewing.io, super-productivity), and well-documented
> community pain points. Reddit blocked scripted access, so community needs are
> drawn from GitHub issues + known discourse and flagged as such.

---

## 1. Competitor landscape

### A. General habit / life trackers (the "loggd.life / Notion" cluster)
| Product | What it is | Top features | Uniqueness / why people pick it |
|---|---|---|---|
| **loggd.life** | Gamified life tracker | Habits, tasks, goals, focus time in one dashboard; streaks; **XP/levels**; "see your year" timeline | *Playful*, year-in-pixels view; free on web+iOS; very low friction |
| **Notion** (used as habit tracker) | Flexible workspace | Databases, relations, formulas, templates, AI | Infinite customizability; one workspace for everything; but **you build the tracker yourself** |
| **super-productivity** | OSS desktop todo + time tracker | Timeboxing, time tracking, Jira/GitHub/GitLab integrations, **E2EE sync** | Privacy-first, offline, power-user integrations |
| **ActivityWatch** | Automatic time tracker | Passive tracking, cross-platform, extensible | Zero effort (no manual logging) |
| **prog-o-meter** | #100DaysOfCode tracker | Public streak, GitHub-backed log | Social proof via public profile |
| **Habitica** | Game-ified habits | RPG quests, parties, rewards | Community/accountability |

### B. Coding / interview-prep trackers (the "NeetCode / Structy" cluster)
| Product | What it is | Top features | Uniqueness / why people pick it |
|---|---|---|---|
| **NeetCode** | Structured DSA prep | 800+ problems, courses, **AI mock interviews**, Versus (head-to-head) mode | Brand trust, interview-realistic practice |
| **Structy** | Guided DSA path | Video solutions, curated order | Pedagogy |
| **Tech Interview Handbook** | Free written guide | System design, behavioral, resume | Free, curated, no login |
| **roadmap.sh** | Developer roadmaps | Community roadmaps, progress checkmarks | Visual "what to learn" maps |
| **interviewing.io** | Anonymous mock interviews | Live feedback, company fast-track | Real human interviews |
| **LeetSync** (OSS) | Sync LeetCode → GitHub | Auto-commit solutions, streak | Git-as-backup |
| **PrepPilot** (OSS) | All-in-one prep platform | Track questions by company, sheets import | Company-frequency focus |
| **FaangPrepTracker** (OSS) | Web prep tracker | Progress tracking | Minimal, fast |

### C. Where Unifies sits
Your app is the **only** one that fuses (1) *any curriculum the user brings* —
paste text, upload a file, or load a sample — (2) an *AI gap analysis that adds
foundational basics and advanced/staff-level depth*, (3) *beginner→advanced
tagging in one view*, (4) *GitHub-style heatmap + real (grace-day) streaks*,
(5) a *command palette + revision/skip mode*, and (6) *shareable public profiles
+ leaderboard* — **with tests + CI + auto-deploy**. That combination is
genuinely unmatched by any single competitor above.

---

## 2. What users actually ask for (evidence from real issues)

Mined from open GitHub issues on the most relevant repos:

- **Sync reliability is the #1 complaint.**
  - `LeetSync` #468–#479: "streak not updating", "not syncing", "data not showing on repo", "code not saved". → Users abandon trackers when their progress silently disappears.
  - `super-productivity` #9031–#9050: sync conflict resolution, E2EE, recovery snapshots. → Power users demand *safe, recoverable, encrypted* sync.
  - **Requirement:** visible save status, conflict handling, and a "last saved" indicator (you already have `saveError` — surface it better + add "saved ✓ at HH:MM").

- **Streaks must be robust and meaningful.**
  - `LeetSync` #471/#479: "streak not showing continuously". → Streaks that break on a single missed day or a timezone bug kill motivation.
  - **Requirement:** forgiving streak logic (grace day), explicit "longest streak", and the heatmap you already built.

- **Gamification / momentum drives retention.**
  - `loggd.life` XP/levels, `Habitica` quests, `prog-o-meter` public streaks. → Users stay for the *game*, not the checklist.
  - **Requirement:** XP/levels or a "momentum" score; weekly goal + celebration on milestones.

- **Accessibility & keyboard-first UX.**
  - `PrepPilot` #465: "Improve Modal with proper ARIA + keyboard focus". → Recruiters and users notice a11y.
  - **Requirement:** you already have ⌘K; add focus traps in modals, ARIA roles, and a visible focus ring. (Strong MAANG signal.)

- **Contribution friction is low when onboarding is clear.**
  - `prog-o-meter` #111/#118: "confirm successful save", "notify if username not registered". → Micro-confirmations reduce anxiety.
  - **Requirement:** explicit save confirmations + gentle empty-states.

- **Community / social proof.**
  - `prog-o-meter` public profiles; `interviewing.io` leaderboards; `NeetCode` Versus. → People want to *compare* and *show off*.
  - **Requirement:** your `?u=` share + leaderboard is exactly right — extend with compare view & "this week vs last week".

---

## 3. Requirements to be the best

Prioritized. **P0 = differentiates + addresses a real complaint. P1 = strong retention/recruiter signal. P2 = polish.**

### P0 — Trust & retention (fix the #1 killer: lost/silent progress)
1. **Reliable sync with clear status**
   - Show "Saved ✓ · HH:MM" next to the existing error state.
   - Conflict handling: last-write-wins with a timestamp; never silently drop.
   - Add an offline queue: if Supabase is unreachable, keep changes in
     localStorage and flush on reconnect (toast: "Synced N changes").
2. **Robust, forgiving streaks**
   - Already implemented (`currentStreak`/`longestStreak`); add a **grace day**
     (a streak survives a single missed day) and show "best: N days".
   - Timezone-safe (use local `todayStr` — already done).

### P1 — What makes people stay (gamification + social)
3. **Gamification layer**
   - XP per checked item + weekly bonus; simple level system.
   - "Momentum" score (this week vs last week %) shown in header.
   - Milestone celebration (confetti/toast at 25/50/75/100% per phase).
4. **Enhanced sharing & leaderboard**
   - `?u=` profile: add **compare mode** ("you vs them" per track).
   - Leaderboard: rank by streak AND by weekly momentum; filter by track.
   - "This week" heatmap highlight.
5. **Goals & reminders**
   - Set a weekly DSA/study goal (e.g. "5 problems/week"); progress ring.
   - Optional browser notification reminder (opt-in, no spam).

### P1 — Recruiter-grade engineering signals
6. **Accessibility pass**
   - Focus trap + Esc in all modals (SharePanel, CommandPalette, AdminPanel).
   - ARIA roles/labels; visible focus ring; `prefers-reduced-motion` respect.
   - `CommandPalette` already keyboard-complete — document it.
7. **More tests + coverage badge**
   - Component tests (Testing Library) for `ActivityHeatmap`, `CommandPalette`,
     `SharePanel`. Target ~90% on components too.
   - E2E: add a share-flow test (`?u=` opens read-only profile).
8. **Performance budget**
   - Lazy-load `AdminPanel`/`SharePanel` (already conditional render; add
     `React.lazy` + Suspense). Lighthouse target ≥ 95.

### P2 — Delight & reach
9. **Import / export**
   - Export progress as JSON + CSV; import to migrate from other trackers
     (addresses the "I tracked in Notion/Excel" crowd).
10. **Theming**
    - Light mode + system preference; persist choice. (Tailwind already set up.)
11. **Mobile polish**
    - Bottom nav / responsive command palette; `⌘K` → long-press or FAB on touch.
12. **Onboarding empty-state**
    - First-run: "Set your mission start date" CTA; sample streak animation.

---

## 4. Recommended build order (so the app stays green)

1. P0 #1 save-status + offline queue (small, high trust).
2. P0 #2 grace-day streak (tiny logic change in `progressStats`).
3. P1 #6 a11y pass (modals + focus ring) — cheap, huge signal.
4. P1 #3 gamification (XP/momentum) — the retention engine.
5. P1 #4 compare + leaderboard filters.
6. P1 #7 component tests + E2E share flow.
7. P2 #9 import/export, #10 theming, #11 mobile, #12 onboarding.

---

## 5. Honest gaps vs competitors (keep improving)
- **No real practice problems** (NeetCode/Structy have 800+). → Out of scope for
  a *tracker*, but link out to them (already done via `resource.url`).
- **No AI mock interviews** (NeetCode/interviewing.io). → Could embed later.
- **No community content** (roadmap.sh). → `?u=` + leaderboard is our social layer.

The wedge: competitors track *either* habits *or* prep, but **none** let you
bring *your own* curriculum and have an AI structure it, fill the beginner→staff
gaps, and track it with GitHub-style streaks, a command palette, revision/skip
mode, and shareable public profiles — **that is the moat.** Build P0–P1 and it's
best-in-class.

---

## 6. Implementation status (as of 2026-07-16)

All work is **live-data only** (Supabase + localStorage), no demo/seed/mock rows.
MIT-licensed, free, no analytics.

| Req | Status | Where |
|---|---|---|
| P0 #1 Save status + offline queue | Done | `App.jsx` save-state machine, `online` flush, PWA offline queue |
| P0 #2 Grace-day streak | Done | `progressStats.currentStreak(...,1)` |
| P1 #3 Gamification (XP/level/momentum) | Done | `progressStats.totalXp/levelFromXp/momentumPercent`, header, `Toast` celebrations |
| P1 #4 Compare + leaderboard filters | Done | `SharePanel` (track filter, compare in shared view) |
| P1 #5 Goals & reminders | Done | Weekly goal control + `useNotifications` opt-in reminder |
| P1 #6 a11y pass | Done | `useFocusTrap`, ARIA on modals, focus ring, reduced-motion, skip-to-content |
| P1 #7 Component tests + E2E share | Done | `*.test.jsx` (5 components) + `e2e/share.spec.ts` + `e2e/ux.spec.ts` |
| P1 #8 Perf / code-split | Done | `React.lazy` for AdminPanel/SharePanel |
| P2 #9 Import / export | Done | `utils/io.js` (JSON + CSV) + UI buttons |
| P2 #10 Theming | Done | `useTheme` + light overrides in `index.css` |
| P2 #11 Mobile polish | Partial | Responsive layout; Cmd+K touch FAB not yet added (PWA install covers mobile) |
| P2 #12 Onboarding empty-state | Done | Mission-start nudge when no date set |
| Focus (Today) view | Done | `FocusView.jsx` — plan-day anchor, next item, weekly goal |
| Insights dashboard | Done | `Insights.jsx` — track bars, pace, sparkline, level/XP/momentum |
| Milestone / level-up celebrations | Done | `Toast.celebrate` fired from `App.jsx` on phase-complete |
| Keyboard shortcuts help (⌘?) | Done | `ShortcutsHelp.jsx` — cheatsheet modal, Esc + focus trap |
| Installable PWA + offline | Done | `vite-plugin-pwa`, workbox, SW, offline app shell |
| **Bring-your-own curriculum** | Done | `CurriculumImport.jsx` — paste / upload / sample; import gate |
| **AI gap analysis (basics→advanced)** | Done | `utils/analyze.js` (`analyzeCurriculum` + `planToCurriculum`), `api/analyze.js` (OpenRouter free model) + offline heuristic fallback |
| **Highlights: you vs Unifies-added** | Done | `Highlights.jsx` + `curriculum._meta` (included/added/path) |
| **Revision & skip (with caution)** | Done | `RevisionView.jsx` — skip with disclaimer + restore; `skipped` state |
| **RawBlock brutalist design** | Done | `index.css` + `tailwind.config.js` — black-on-white, thick borders, Archivo Black/Work Sans/Space Mono |
| **Rebrand to Unifies** | Done | app title, logo, README, repo `flawsom/unifies.codes`, domain `unifies.codes` |

**Next (optional polish):** Cmd+K touch FAB for mobile (P2 #11); weekly-goal
visual ring (logic done, currently numeric control); AI mock-interview embed
(out of scope for a tracker, link out instead).
