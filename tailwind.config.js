/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0066FF',
        secondary: '#1E1E1E',
        accent: '#00C853',
        figma: '#F24E1E',
        replit: '#F26207',
        github: '#181717'
      }
    },
  },
  plugins: [],
}
