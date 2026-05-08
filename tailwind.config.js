/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#C7623D',
        secondary: '#904029',
        accent: '#874221',
        background: '#C27341',
        'text-primary': '#333333',
        'text-secondary': '#666666',
        cream: '#faf7f2',
        linen: '#f5ede0',
        gold: '#c9a96e',
        'gold-dark': '#a8865a',
        blush: '#f2e8e8',
        'blush-dark': '#e0cccc',
        charcoal: '#3d3535',
        muted: '#8a7a7a',
      }
    },
  },
  plugins: [],
};
