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
          // Darker than the original #857768 so small labels meet WCAG AA
          // (>= 4.5:1) on ivory and ivory-light backgrounds.
          dark: "#6F6154",
        },
        olive: {
          DEFAULT: "#737963",
          light: "#8B9179",
          dark: "#5B6050",
        },
        gold: {
          DEFAULT: "#B8985F",
          light: "#D8C49B",
          dark: "#846331",
        },
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        widest2: "0.22em",
        widest3: "0.3em",
      },
      boxShadow: {
        soft: "0 28px 70px -38px rgba(42, 37, 33, 0.45)",
        lift: "0 22px 45px -28px rgba(42, 37, 33, 0.42)",
      },
    },
  },
  plugins: [],
};

export default config;
