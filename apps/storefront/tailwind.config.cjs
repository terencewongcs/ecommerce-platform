/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          black: '#111111',
          gold: '#C8A96E',
          ivory: '#F8F6F1',
          surface: '#EDE9E3',
          slate: '#6C6C7A',
          rose: '#C47D8F',
        },
      },
    },
  },
  plugins: [],
};
