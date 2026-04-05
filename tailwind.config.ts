/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eaf8f5',
          100: '#c5eee6',
          200: '#9fe3d7',
          300: '#7ad8c8',
          400: '#58bdae',
          500: '#58bdae',
          600: '#4aa99b',
          700: '#3d9485',
          800: '#2f7f70',
          900: '#226a5c',
          950: '#155548',
        },
        secondary: {
          green: '#58bdae',
          yellow: '#58bdae',
        },
        brand: {
          teal: '#58bdae',
          green: '#58bdae',
          yellow: '#58bdae',
          black: '#1A1A18',
          white: '#FFFFFF',
        },
        /* Updated palette — spec colours */
        btg: {
          cream: '#F5F0E8',
          sand: '#EDE8DF',
          terracotta: '#58bdae',
          rust: '#4aa99b',
          sage: '#7A9E7E',
          teal: '#58bdae',
          blush: '#58bdae',
          gold: '#E8943A',
          dark: '#1A1A18',
          mid: '#6B6560',
          'light-text': '#6B6560',
          cta: '#FF7F50',
          'cta-hover': '#e5673e',
          amber: '#58bdae',
          'deep-teal': '#1A4D4A',
          nav: '#1A1A18',
        },
      },
      fontFamily: {
        heading: ['TT Norms Pro', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'DM Sans', 'system-ui', 'sans-serif'],
        brand: ['var(--font-brand)', 'cursive'],
        mono: ['Geist Mono', 'SF Mono', 'Fira Code', 'monospace'],
        serif: ['TT Norms Pro', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'brand': '8px',
      },
      animation: {
        marquee: 'marquee 20s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};
