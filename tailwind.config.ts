import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        // FloodWise road-status palette (semantic — unchanged)
        status: {
          passable: "#22c55e",
          caution: "#eab308",
          avoid: "#ef4444",
          unknown: "#9ca3af",
          closed: "#7f1d1d",
        },
        // UI accent — runtime-switchable via CSS variables (see globals.css).
        brand: {
          DEFAULT: "rgb(var(--brand) / <alpha-value>)",
          dark: "rgb(var(--brand-dark) / <alpha-value>)",
          deep: "rgb(var(--brand-deep) / <alpha-value>)",
        },
        // Semantic surface tokens (theme-aware).
        surface: {
          bg: "rgb(var(--surface-bg) / <alpha-value>)",
          panel: "rgb(var(--surface-panel) / <alpha-value>)",
          line: "rgb(var(--surface-line) / <alpha-value>)",
        },
        // Surfaces
        ink: {
          950: "#09090b",
          900: "#0d0d10",
          850: "#121216",
          800: "#17171c",
        },
      },
      borderRadius: {
        DEFAULT: "0.375rem",
      },
    },
  },
  plugins: [],
};

export default config;
