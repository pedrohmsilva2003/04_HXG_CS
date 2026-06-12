/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hex: {
          sky: '#01adff',
          'sky-dark': '#005198',
          land: '#83c410',
          'land-dark': '#28721e',
          sea: '#04d0e6',
          'sea-dark': '#106b73',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}