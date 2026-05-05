/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      'colors': {
        'primary': '#C7623D',
        'secondary': '#904029',
        'accent': '#874221',
        'background': '#C27341',
        'text-primary': '#333333',
        'text-secondary': '#666666',
      }
    },
  },
  plugins: [],
};
