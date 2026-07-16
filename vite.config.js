import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icon.svg"],
      manifest: {
        name: "Unifies — curriculum tracker",
        short_name: "Unifies",
        description:
          "Paste any curriculum and let Unifies turn it into a smart, trackable study plan from beginner to staff-level.",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallback: "index.html",
      },
    }),
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["text", "json-summary", "lcov"],
      include: ["src/utils/**", "src/data/**", "src/hooks/**", "src/components/**", "src/*.js", "src/*.jsx"],
      exclude: ["src/utils/registerSW.js", "src/main.jsx", "src/test/**"],
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
