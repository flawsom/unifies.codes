/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    // RawBlock: every corner is square, there are no shadows.
    borderRadius: {
      none: "0",
      sm: "0",
      DEFAULT: "0",
      md: "0",
      lg: "0",
      xl: "0",
      "2xl": "0",
      "3xl": "0",
      full: "0",
    },
    boxShadow: {
      none: "none",
      DEFAULT: "none",
      sm: "none",
      md: "none",
      lg: "none",
      xl: "none",
      "2xl": "none",
    },
    extend: {
      colors: {
        // RawBlock palette
        black: "#000000",
        white: "#FFFFFF",
        link: "#0000FF", // hyperlinks only
        success: "#008000",
        warning: "#FFA000",
        error: "#FF0000",
        // Remap the existing `slate` tokens so the whole app flips to a
        // black-on-white brutalist look WITHOUT touching every JSX class.
        // (The app was dark-first; we invert the scale: 950=white bg, 100=black text.)
        slate: {
          50: "#000000",
          100: "#000000",
          200: "#111111",
          300: "#222222",
          400: "#444444",
          500: "#666666",
          600: "#888888",
          700: "#000000",
          800: "#000000",
          900: "#FFFFFF",
          950: "#FFFFFF",
        },
      },
      fontFamily: {
        display: ['"Archivo Black"', "system-ui", "sans-serif"],
        sans: ['"Work Sans"', "system-ui", "sans-serif"],
        mono: ['"Space Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        h1: ["64px", { lineHeight: "1.0" }],
        h2: ["48px", { lineHeight: "1.05" }],
        h3: ["32px", { lineHeight: "1.1" }],
      },
    },
  },
  plugins: [],
};
