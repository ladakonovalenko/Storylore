/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#14161F',
          800: '#191C28',
          700: '#1F2230',
          500: '#3A3F54',
          300: '#565C77',
        },
        parchment: {
          DEFAULT: '#E8E2D3',
          dim: '#8B8FA3',
        },
        amber: {
          ink: '#C98A3E',
          soft: '#E0AD6E',
        },
        crimson: {
          dim: '#9A4A45',
          soft: '#C16B65',
        },
        moss: {
          dim: '#5E7A66',
          soft: '#7F9C87',
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
