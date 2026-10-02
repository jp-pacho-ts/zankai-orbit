import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-montserrat)", "Montserrat", "sans-serif"],
      },
      colors: {
        orbit: {
          bg: "var(--bg)",
          top: "var(--top)",
          panel: "var(--panel)",
          card: "var(--card)",
          line: "var(--line)",
          text: "var(--text)",
          muted: "var(--muted)",
          soft: "var(--soft)",
          blue: "var(--blue)",
          blue2: "var(--blue2)",
        },
        border: "var(--line)",
        input: "var(--line)",
        ring: "var(--blue)",
        background: "var(--bg)",
        foreground: "var(--text)",
        primary: {
          DEFAULT: "var(--blue)",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "var(--soft)",
          foreground: "var(--text)",
        },
        muted: {
          DEFAULT: "var(--soft)",
          foreground: "var(--muted)",
        },
        accent: {
          DEFAULT: "var(--soft)",
          foreground: "var(--blue)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--text)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "orbit-pulse": {
          "50%": {
            boxShadow: "0 0 0 8px #438ff408, 0 0 19px #438ff4a0",
          },
        },
      },
      animation: {
        "orbit-pulse": "orbit-pulse 2s infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
