import type { Config } from 'tailwindcss';

// TR Cloth Store லோகோவின் நிறங்கள்: ஆழ்ந்த மெஜந்தா-ஊதா (maroon), தங்கம் (gold), கிரீம் (cream), கருப்பு (ink).
// வகுப்புப் பெயர்கள் (maroon, gold, cream) பழையபடியே; நிறங்கள் மட்டும் இங்கே மாறும்.
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        maroon: { DEFAULT: '#8a0f5d', dark: '#5a0a3d', light: '#b32283' },
        gold: { DEFAULT: '#c9962b', light: '#e8c877', pale: '#f9f1de' },
        cream: '#fdf9f1',
        ink: '#1a1216',
      },
      fontFamily: {
        sans: ['"Jost"', '"Noto Sans Tamil"', '"Latha"', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', '"Noto Serif Tamil"', '"Noto Sans Tamil"', 'Georgia', 'serif'],
      },
      keyframes: { marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } } },
      animation: { marquee: 'marquee 30s linear infinite' },
    },
  },
  plugins: [],
} satisfies Config;
