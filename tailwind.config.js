/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FBF5EE',
        blush: { 50: '#FDF1F3', 100: '#F9E3E7', 200: '#F3CDD4' },
        rose: { DEFAULT: '#C98593', 600: '#A25A6B', 700: '#8A4858' },
        charcoal: '#2F2A2C',
        mist: '#6F6568',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      boxShadow: { soft: '0 6px 24px -8px rgba(138,72,88,.18)' },
    },
  },
  plugins: [],
};
