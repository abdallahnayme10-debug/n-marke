import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#FAF7F0",
          50: "#FDFBF6",
          100: "#FAF7F0",
          200: "#F3EDDF",
        },
        sand: {
          50: "#FBF8F1",
          100: "#F5EFE0",
          200: "#E9DCB8",
          300: "#DCC48A",
          400: "#D3AC5C",
          500: "#C8963E",
          600: "#B07F31",
          700: "#8F652A",
          800: "#755227",
          900: "#604522",
        },
        ocean: {
          50: "#EFF6FB",
          100: "#DCEAF5",
          200: "#B8D4EA",
          300: "#8AB7D9",
          400: "#5795C4",
          500: "#3579AC",
          600: "#2A6190",
          700: "#244E75",
          800: "#224261",
          900: "#203A52",
        },
        leaf: {
          50: "#F2F7EF",
          100: "#E0EDD9",
          200: "#C2DBB6",
          300: "#9DC28B",
          400: "#77A562",
          500: "#5B8A46",
          600: "#476F36",
          700: "#39582D",
          800: "#2F4726",
          900: "#283D21",
        },
        night: {
          50: "#F5F6F8",
          100: "#E6E8EC",
          700: "#2A2E3A",
          800: "#1E222C",
          900: "#14171F",
          950: "#0D0F15",
        },
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "Nunito", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-poppins)", "Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
        "4xl": "2.25rem",
      },
      boxShadow: {
        soft: "0 6px 24px -8px rgba(32, 58, 82, 0.14)",
        "soft-lg": "0 12px 40px -12px rgba(32, 58, 82, 0.22)",
        warm: "0 10px 30px -10px rgba(200, 150, 62, 0.25)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
        "slide-up": "slide-up 0.45s ease-out both",
        float: "float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
