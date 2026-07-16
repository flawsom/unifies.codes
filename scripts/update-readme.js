// Keeps the README's status block in sync with the actual test + coverage run.
// CI runs this after `npm run test:coverage`; locally you can run
// `node scripts/update-readme.js` to refresh the numbers. Only the content
// between the <!-- STATUS --> ... <!-- /STATUS --> markers is touched, so the
// hand-written prose never drifts from the code.
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());
const readmePath = path.join(root, "README.md");

// 1) Run Vitest in JSON mode to get real pass/fail counts + coverage.
// Write the JSON to a file (--outputFile) so we don't have to parse stdout
// that Vitest mixes with the coverage table.
const outFile = path.join(root, "coverage", "vitest.json");
let summary;
try {
  execSync(
    `npx vitest run --coverage --reporter=json --outputFile=${outFile} --coverage.reporter=json-summary`,
    { cwd: root, encoding: "utf8", stdio: "ignore" }
  );
} catch {
  // a failing test still writes the JSON output file; fall through and read it
}
if (fs.existsSync(outFile)) {
  try {
    summary = JSON.parse(fs.readFileSync(outFile, "utf8"));
  } catch {
    summary = null;
  }
}

const files = summary?.testResults?.length ?? 0;
const passed = summary?.numPassedTests ?? 0;
const failed = summary?.numFailedTests ?? 0;
const totalTests = summary?.numTotalTests ?? 0;

// Coverage: v8 reporter also writes coverage-summary.json; prefer that.
let coveragePct = "n/a";
const covPath = path.join(root, "coverage", "coverage-summary.json");
if (fs.existsSync(covPath)) {
  try {
    const cov = JSON.parse(fs.readFileSync(covPath, "utf8"));
    const totals = cov.total;
    if (totals?.lines?.pct != null) {
      coveragePct = `${totals.lines.pct.toFixed(2)}%`;
    }
  } catch {
    /* ignore */
  }
}

const status = [
  "<!-- STATUS -->",
  "",
  "![tests](https://img.shields.io/badge/tests-" +
    `${passed}/${totalTests}%20passing` +
    "-brightgreen)",
  "![coverage](https://img.shields.io/badge/coverage-" +
    `${encodeURIComponent(coveragePct)}` +
    "-blue)",
  "![ci](https://img.shields.io/badge/CI-GitHub%20Actions-9cf)",
  "",
  `> _Status auto-generated from the Vitest run: **${passed}/${totalTests} tests passing** across **${files} file(s)**, **${coveragePct}** line coverage. This block is updated by CI — do not edit by hand._`,
  "",
  "<!-- /STATUS -->",
].join("\n");

if (!fs.existsSync(readmePath)) {
  console.error("README.md not found at", readmePath);
  process.exit(1);
}

const readme = fs.readFileSync(readmePath, "utf8");
const updated = readme.replace(
  /<!-- STATUS -->[\s\S]*?<!-- \/STATUS -->/,
  status
);

fs.writeFileSync(readmePath, updated);
console.log(
  `README status updated: ${passed}/${totalTests} tests passing, ${coveragePct} coverage.`
);
