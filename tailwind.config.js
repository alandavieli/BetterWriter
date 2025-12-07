/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable manual toggling
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fbf8f1',
          100: '#f5edd6',
          200: '#ebd9aa',
          300: '#dfc078',
          400: '#d4a74b',
          500: '#c68d2b',
          600: '#aa6f20',
          700: '#88531b',
          800: '#71421b',
          900: '#5e3619',
        },
        cream: {
          50: '#fdfbf7',
          100: '#fbf8f1',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Georgia', 'serif'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      }
    },
  },
  plugins: [],
}
