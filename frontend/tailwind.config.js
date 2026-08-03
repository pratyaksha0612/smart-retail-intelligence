/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        primary: "var(--primary-text)",
        secondary: "var(--secondary-text)",
        border: "var(--border)",
        accent: "var(--accent)",
        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
