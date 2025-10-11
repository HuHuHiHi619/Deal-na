/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lavender: {
          50:  '#f4f3ff',
          100: '#eae7ff',
          200: '#d5cfff',
          400: '#a594f9',
          500: '#8b79e6',
          700: '#6c5dd3',
        },
        periwinkle: {
          100: '#e6e9ff',
          200: '#d1d6ff',
          700: '#7a86cb',
        },
      },
    },
  },
  plugins: [],
};
