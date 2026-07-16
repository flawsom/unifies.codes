// utils/analyze.test.js
import { describe, it, expect } from "vitest";
import { heuristicStructure, planToCurriculum, inferDifficulty } from "../utils/analyze";

describe("heuristicStructure", () => {
  it("returns empty plan for blank input", () => {
    const p = heuristicStructure("");
    expect(p.items).toHaveLength(0);
    expect(p.phases).toHaveLength(0);
  });

  it("splits markdown headings into phases and bullets into items", () => {
    const text = `# Phase 1: Python
- Variables and types
- Functions

# Phase 2: Web
- HTTP and REST`;
    const p = heuristicStructure(text);
    // A "Foundations" phase is added by Unifies (no basic items detected), so +1 phase.
    expect(p.phases.length).toBeGreaterThanOrEqual(3);
    expect(p.items.filter((i) => i.source === "user")).toHaveLength(3);
    expect(p.items.every((i) => i.source === "user" || i.source === "app")).toBe(true);
  });

  it("infers advanced difficulty from keywords", () => {
    expect(inferDifficulty("System design at scale")).toBe("advanced");
    expect(inferDifficulty("Intro to variables")).toBe("basic");
    expect(inferDifficulty("Build a small API")).toBe("intermediate");
  });

  it("adds foundational basics when the curriculum starts mid-level", () => {
    const text = `# Intermediate stuff
- Design a service
- Write integration tests`;
    const p = heuristicStructure(text);
    const appItems = p.items.filter((i) => i.source === "app");
    expect(appItems.length).toBeGreaterThan(0);
    // At least the foundational basics were added as 'basic'.
    expect(appItems.some((i) => i.difficulty === "basic")).toBe(true);
    expect(p.added).toMatch(/foundational/i);
  });

  it("adds advanced/staff gaps when none are present", () => {
    const text = `# Basics
- Learn variables
- Write a loop`;
    const p = heuristicStructure(text);
    const appItems = p.items.filter((i) => i.source === "app");
    expect(appItems.some((i) => i.difficulty === "advanced")).toBe(true);
    expect(p.added).toMatch(/advanced/i);
  });
});

describe("planToCurriculum", () => {
  it("produces the app's {phases, bonus, parallelTrack} shape", () => {
    const plan = heuristicStructure(`# Phase 1
- Learn Git
# Beyond
- Staff level architecture`);
    const cur = planToCurriculum(plan);
    expect(cur).toHaveProperty("phases");
    expect(cur).toHaveProperty("bonus");
    expect(cur).toHaveProperty("parallelTrack");
    expect(Array.isArray(cur.phases)).toBe(true);
    // every item keeps id + title + text
    const flat = [
      ...cur.phases.flatMap((p) => p.weeks.flatMap((w) => w.items)),
      ...(cur.bonus.weeks || []).flatMap((w) => w.items),
      ...cur.parallelTrack.items,
    ];
    expect(flat.every((i) => i.id && i.text)).toBe(true);
  });

  it("routes track:bonus items in a bonus phase into the bonus section", () => {
    const plan = {
      title: "x",
      phases: [
        { id: "p1", title: "Main" },
        { id: "app-advanced", title: "Beyond mastery" },
      ],
      items: [
        { id: "a", title: "A", text: "A", phaseId: "p1", track: "core" },
        { id: "b", title: "B", text: "B", phaseId: "app-advanced", track: "bonus" },
      ],
      included: "",
      added: "",
      path: [],
    };
    const cur = planToCurriculum(plan);
    const bonusIds = (cur.bonus.weeks || []).flatMap((w) => w.items).map((i) => i.id);
    expect(bonusIds).toContain("b");
  });
});
