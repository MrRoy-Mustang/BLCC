/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F9F8F6',
        forest: {
          DEFAULT: '#1C3D27',
          light: '#2C5238',
          dark: '#122818',
        },
      },
      fontFamily: {
        display: ['Georgia', 'serif'],
        sans: ['system-ui', 'sans-serif'],
      },
      boxShadow: {
        ticket: '0 20px 60px -15px rgba(28, 61, 39, 0.35)',
      },
    },
  },
  plugins: [],
}
