/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        accent: {
          gold: "var(--accent-gold)",
          goldHover: "var(--accent-gold-hover)",
          contrast: "var(--accent-contrast)",
        },
        bgLight: "var(--bg-light)",
        textPrimary: "var(--text-primary)",
        textSecondary: "var(--text-secondary)",
        borderLight: "var(--border-light)",
        success: "#2E7D32",
        danger: "#D32F2F",
        warning: "#ED6C02",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Outfit", "sans-serif"],
      },
    },
  },
  plugins: [],
};
