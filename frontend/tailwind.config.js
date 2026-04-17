/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: '#0f0f0f',
        darker: '#0a0a0a',
        gold: { DEFAULT: '#D4AF37', light: '#F3E5AB', dark: '#AA8C2C' }
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      }
    },
  },
  plugins: [],
}