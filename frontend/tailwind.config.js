/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        butterfly: {
          50: '#fef7ee',
          100: '#fdedd6',
          200: '#fbd7ad',
          300: '#f8ba79',
          400: '#f59343',
          500: '#f2741f',
          600: '#e35715',
          700: '#bc3f13',
          800: '#953317',
          900: '#792c16',
        }
      }
    },
  },
  plugins: [],
}
