import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
      },
      colors: {
        canvas: "var(--canvas)",
        card: "var(--card)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
        navy: "var(--navy)",
        copper: "var(--copper)",
        good: "var(--good)",
        bad: "var(--bad)",
        warn: "var(--warn)",
        info: "var(--info)",
      },
      boxShadow: {
        panel: "0 1px 0 rgba(16,32,51,0.04), 0 18px 40px -28px rgba(16,32,51,0.55)",
      },
      borderRadius: {
        input: "6px",
        card: "10px",
        modal: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
