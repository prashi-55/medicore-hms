/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12211E",
        surface: "#F6F5F1",
        panel: "#FFFFFF",
        primary: {
          DEFAULT: "#0E4F49",
          50: "#EAF2F1",
          100: "#CFE2DF",
          400: "#1E7A70",
          600: "#0E4F49",
          700: "#0A3B37",
          900: "#062421",
        },
        accent: {
          DEFAULT: "#C97A2B",
          100: "#F6E3CB",
          500: "#C97A2B",
          600: "#A9611D",
        },
        line: "#E1DDD3",
        danger: "#B3382C",
        success: "#1E7A4C",
        warn: "#B8862B",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(18,33,30,0.06), 0 1px 12px rgba(18,33,30,0.04)",
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};
