import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: "#F5F0E8",
          dark: "#ECE5D5",
          light: "#FAF7F0",
        },
        espresso: {
          DEFAULT: "#2A2521",
          light: "#3E3733",
          muted: "#5C534C",
        },
        taupe: {
          DEFAULT: "#A69A89",
          light: "#C6BBA8",
          dark: "#857768",
        },
        olive: {
          DEFAULT: "#737963",
          light: "#8B9179",
          dark: "#5B6050",
        },
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        widest2: "0.22em",
      },
    },
  },
  plugins: [],
};

export default config;
