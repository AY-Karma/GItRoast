/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './ui/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class', // enable class-based dark mode
  theme: {
    extend: {
      fontFamily: {
        display: ['Inter', 'ui-sans-serif'],
        body: ['Inter', 'ui-sans-serif'],
      },
    },
  },
  plugins: [],
};
module.exports = config;
