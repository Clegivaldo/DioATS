/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F6F5F0",
        surface: "#FFFFFF",
        line: "#E4E1D8",
        ink: {
          DEFAULT: "#111917",
          soft: "#2C3A35",
          muted: "#5F6B65",
        },
        brand: {
          50: "#EAF6F0",
          100: "#CDEBDE",
          200: "#9FD8C2",
          300: "#6BBFA0",
          400: "#3AA17F",
          500: "#0F7355",
          600: "#0B5C44",
          700: "#094936",
          800: "#073829",
          900: "#052A1F",
        },
        signal: {
          lime: "#D8F46B",
          amber: "#B4761A",
          danger: "#B23A2E",
        },
      },
      fontFamily: {
        sans: ['"Inter Tight"', "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ['"Instrument Serif"', "Georgia", "ui-serif", "serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(17,25,23,0.04), 0 12px 32px -18px rgba(17,25,23,0.28)",
        page: "0 2px 4px rgba(17,25,23,0.06), 0 24px 60px -28px rgba(17,25,23,0.45)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        rise: "rise 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};
