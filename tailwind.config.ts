import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        maroon: { DEFAULT: '#7a1230', dark: '#5a0d23', light: '#a3304f' },
        gold: { DEFAULT: '#b8860b', light: '#e8c766', pale: '#f6ecd0' },
        cream: '#fbf6ee',
        ink: '#2b1d1d',
      },
      fontFamily: {
        sans: ['"Inter"', '"Noto Sans Tamil"', '"Latha"', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', '"Noto Serif Tamil"', '"Noto Sans Tamil"', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
