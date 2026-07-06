import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  // Tema oscuro por clase (RF5): un wrapper con `dark` conmuta la paleta.
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [typography],
};
