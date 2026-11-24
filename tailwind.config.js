/** @type {import('tailwindcss').Config} */

// Colors are defined as CSS variables in src/index.css (:root).
// Change the theme there — no need to touch this file.
const shades = (name, keys) =>
  Object.fromEntries(
    keys.map((k) => [k, `rgb(var(--color-${name}-${k}) / <alpha-value>)`])
  );

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--color-primary-500) / <alpha-value>)',
          ...shades('primary', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary-950) / <alpha-value>)',
          ...shades('secondary', [800, 900, 950]),
        },
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
      },
      boxShadow: {
        soft: '0 8px 30px rgba(15, 23, 42, 0.06)',
        card: '0 2px 12px rgba(15, 23, 42, 0.05)',
      },
    },
  },
  plugins: [],
};
