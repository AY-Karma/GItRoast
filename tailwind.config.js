/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0B0F",
        card: "#17171C",
        muted: "#A1A1AA",
        ring: "#2D2D36",
        pink: "#FF5C8A",
        violet: "#7C5CFF",
        cyan: "#00D4FF"
      },
      borderRadius: {
        "3xl": "24px",
        "4xl": "32px"
      },
      boxShadow: {
        glow: "0 24px 120px rgba(124, 92, 255, 0.22)",
        card: "0 22px 70px rgba(0, 0, 0, 0.35)"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["SFMono-Regular", "monospace"]
      },
      backgroundImage: {
        "radial-stage":
          "radial-gradient(circle at top left, rgba(255,92,138,.28), transparent 34%), radial-gradient(circle at top right, rgba(0,212,255,.2), transparent 34%), radial-gradient(circle at 50% 10%, rgba(124,92,255,.22), transparent 42%)"
      }
    }
  },
  plugins: []
};
