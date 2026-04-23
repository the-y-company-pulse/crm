import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // The Y Company brand
        neon: "#deff00",
        navy: "#2b394f",
        steel: "#94adba",
        beige: "#e9d7c4",
        offwhite: "#f5f4f4",
        // Dark theme — Y Analytics inspired
        ink: {
          950: "#080f1a",
          900: "#0c1622",
          850: "#10192a",
          800: "#172234",
          700: "#1f2c3f",
        },
      },
      fontFamily: {
        harabara: ['Harabara', 'Arial Black', 'sans-serif'],
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        sans: ['"DM Sans"', "system-ui", "-apple-system", "sans-serif"],
      },
      backgroundImage: {
        "ink-glow":
          "radial-gradient(ellipse 90% 50% at 50% -10%, rgba(222,255,0,0.06), transparent 60%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(43,57,79,0.4), transparent 60%)",
      },
      boxShadow: {
        "neon-glow": "0 0 24px -4px rgba(222, 255, 0, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
