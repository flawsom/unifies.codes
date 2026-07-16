import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Dedicated Vitest config. Vitest prefers this file over vite.config.js, which
// keeps the unit-test run fully separate from the Playwright E2E specs in e2e/
// (those run via `npm run e2e` / `npx playwright test`, not under Vitest).
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    include: [
      "src/utils/**/*.test.{js,ts}",
      "src/data/**/*.test.{js,ts}",
      "src/hooks/**/*.test.{js,ts}",
      "src/components/**/*.test.{js,jsx,ts,tsx}",
      "src/*.test.{js,jsx,ts,tsx}",
    ],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/e2e/**",
      "**/.{idea,git,cache,output,temp}/**",
      "src/utils/registerSW.js",
      "src/main.jsx",
      "src/test/**",
    ],
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["text", "json-summary", "lcov"],
      include: [
        "src/utils/**",
        "src/data/**",
        "src/hooks/**",
        "src/components/**",
        "src/*.js",
        "src/*.jsx",
      ],
      exclude: ["src/utils/registerSW.js", "src/main.jsx", "src/test/**"],
    },
  },
});
