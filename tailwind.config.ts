import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Theme-aware tokens: values live as RGB channels in globals.css
        // (dark default + [data-theme="light"] override) so /opacity works.
        white: "rgb(var(--c-white) / <alpha-value>)",
        // The Y Company brand
        neon: "rgb(var(--c-neon) / <alpha-value>)",
        navy: "rgb(var(--c-navy) / <alpha-value>)",
        steel: "#94adba",
        beige: "#e9d7c4",
        offwhite: "#f5f4f4",
        // Dark theme — Y Analytics inspired
        ink: {
          950: "rgb(var(--c-ink-950) / <alpha-value>)",
          900: "rgb(var(--c-ink-900) / <alpha-value>)",
          850: "rgb(var(--c-ink-850) / <alpha-value>)",
          800: "rgb(var(--c-ink-800) / <alpha-value>)",
          700: "rgb(var(--c-ink-700) / <alpha-value>)",
        },
      },
      fontFamily: {
        harabara: ['Harabara', 'Arial Black', 'sans-serif'],
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        sans: ['"DM Sans"', "system-ui", "-apple-system", "sans-serif"],
      },
      backgroundImage: {
        "ink-glow": "var(--ink-glow)",
      },
      boxShadow: {
        "neon-glow": "var(--neon-glow)",
      },
    },
  },
  plugins: [],
};

export default config;
