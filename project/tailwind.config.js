/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#101713',
        forest: { DEFAULT: '#193C30', 600: '#22503F', 700: '#142F26' },
        paper: { DEFAULT: '#F4F2E9', 200: '#E9E6D9', 300: '#DCD8C8' },
        chartreuse: { DEFAULT: '#C7F36B', 600: '#A9DB4E' },
        sage: { DEFAULT: '#8FA596', 400: '#B3C2B7', 600: '#5E7266' },
        graphite: { DEFAULT: '#2B332E', 500: '#5C665F' },
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};
