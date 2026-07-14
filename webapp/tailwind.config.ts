import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nyayantar Beta palette (solid)
        white: "#ffffff",
        "white-1": "#fefefe",
        gainsboro: "#e2e2e2",
        "royal-blue": "#3b82f6",
        "dim-gray": "#666666",
        "fire-brick": "#8d4b2c",
        black: "#000000",

        page: "#fefefe",
        surface: "#ffffff",
        "surface-soft": "#fefefe",
        "surface-tint": "#f6f4f2",
        text: "#000000",
        "text-muted": "#666666",
        border: "#e2e2e2",
        "border-strong": "rgba(0, 0, 0, 0.12)",
        "border-card": "rgba(0, 0, 0, 0.35)",
        accent1: "#8d4b2c",
        accent2: "#a8663f",
        accent3: "#3b82f6",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: ["12px", "16px"],
        sm: ["14px", "20px"],
        base: ["16px", "24px"],
        lg: ["18px", "28px"],
        xl: ["20px", "30px"],
        "2xl": ["24px", "32px"],
        "3xl": ["32px", "40px"],
        "4xl": ["40px", "48px"],
        "5xl": ["56px", "64px"],
        "6xl": ["72px", "78px"],
      },
      maxWidth: {
        "page-rail": "1436px",
        section: "1376px",
        content: "1296px",
        "hero-copy": "720px",
        title: "506px",
        "pricing-title": "490px",
        "card-copy": "352px",
        "wide-card-copy": "467px",
      },
      spacing: {
        "3.5": "14px",
        "3.52": "14.07px",
        "7.5": "30px",
        "9.25": "37px",
        "11.5": "46px",
        "13.5": "54px",
        "17.75": "71px",
        "18": "72px",
        "24.75": "99px",
        "25.5": "102px",
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "8px",
        xl: "10px",
        "2xl": "12px",
        "3xl": "14px",
        "4xl": "16px",
        tag: "22px",
        avatar: "30px",
        full: "9999px",
      },
      transitionTimingFunction: {
        framer: "cubic-bezier(0.44, 0, 0.56, 1)",
      },
      backgroundImage: {
        "gradient-primary":
          "linear-gradient(135deg, #8d4b2c 0%, #a8663f 100%)",
        "gradient-accent-border":
          "linear-gradient(135deg, #3b82f6 0%, #8d4b2c 100%)",
        "gradient-accent-soft":
          "linear-gradient(135deg, rgba(141, 75, 44, 0.10) 0%, rgba(58, 130, 246, 0.10) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
