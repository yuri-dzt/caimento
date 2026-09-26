/** @type {import('tailwindcss').Config} */
const token = (name) => `hsl(var(--${name}) / <alpha-value>)`

module.exports = {
  darkMode: 'media',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: '1rem' },
    extend: {
      colors: {
        background: token('background'),
        foreground: token('foreground'),
        card: { DEFAULT: token('card'), foreground: token('card-foreground') },
        muted: { DEFAULT: token('muted'), foreground: token('muted-foreground') },
        accent: { DEFAULT: token('accent'), foreground: token('accent-foreground') },
        primary: { DEFAULT: token('primary'), foreground: token('primary-foreground') },
        stitch: token('stitch'),
        rack: token('rack'),
        wall: token('wall'),
        destructive: { DEFAULT: token('destructive'), foreground: token('destructive-foreground') },
        success: token('success'),
        warning: token('warning'),
        border: token('border'),
        input: token('input'),
        ring: token('ring'),
        thread: {
          sky: token('thread-sky'),
          flax: token('thread-flax'),
          violet: token('thread-violet'),
          rose: token('thread-rose'),
          plum: token('thread-plum'),
          teal: token('thread-teal'),
          lilac: token('thread-lilac'),
          indigo: token('thread-indigo'),
          blush: token('thread-blush'),
          orange: token('thread-orange'),
          moss: token('thread-moss'),
          brown: token('thread-brown'),
          slate: token('thread-slate'),
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
        control: '10px',
      },
      boxShadow: {
        lift: '0 1px 2px hsl(var(--shadow) / 0.06), 0 4px 12px -2px hsl(var(--shadow) / 0.10)',
        float: '0 2px 4px hsl(var(--shadow) / 0.08), 0 16px 40px -8px hsl(var(--shadow) / 0.22)',
      },
      keyframes: {
        'spool-turn': { to: { transform: 'rotate(360deg)' } },
        'stitch-run': { to: { strokeDashoffset: '0' } },
      },
      animation: {
        'spool-turn': 'spool-turn 1.6s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
