/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ВИПРАВЛЕНО: усі кольори тепер посилаються на CSS-змінні,
        // які перемикаються залежно від теми (.light на <html>).
        // Назви токенів лишені тими ж (ink/parchment/amber/crimson/moss),
        // щоб не редагувати жоден із компонентів — змінюються лише значення.
        ink: {
          900: 'var(--ink-900)',
          800: 'var(--ink-800)',
          700: 'var(--ink-700)',
          500: 'var(--ink-500)',
          300: 'var(--ink-300)',
        },
        parchment: {
          DEFAULT: 'var(--parchment)',
          dim: 'var(--parchment-dim)',
        },
        amber: {
          ink: 'var(--amber-ink)',
          soft: 'var(--amber-soft)',
        },
        crimson: {
          dim: 'var(--crimson-dim)',
          soft: 'var(--crimson-soft)',
        },
        moss: {
          dim: 'var(--moss-dim)',
          soft: 'var(--moss-soft)',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
