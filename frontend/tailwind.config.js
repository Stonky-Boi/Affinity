/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'background': 'rgb(var(--color-background) / <alpha-value>)',
        'surface': 'rgb(var(--color-surface) / <alpha-value>)',
        'primary-text': 'rgb(var(--color-primary-text) / <alpha-value>)',
        'secondary-text': 'rgb(var(--color-secondary-text) / <alpha-value>)',
        'primary-border': 'rgb(var(--color-border) / <alpha-value>)',
        'accent': 'rgb(var(--color-accent) / <alpha-value>)',
      }
    },
  },
  plugins: [],
}