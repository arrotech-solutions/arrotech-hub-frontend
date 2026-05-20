/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* ── Luminous Azure — Primary Brand Color ──
           A vibrant, energetic blue that screams modern tech.
           Trustworthy yet highly dynamic. */
        primary: {
          50:  '#e6f1fe',
          100: '#cce3fd',
          200: '#99c7fb',
          300: '#66aaf9',
          400: '#338ef7',
          500: '#006fee',
          600: '#005bc4',
          700: '#004493',
          800: '#002e62',
          900: '#001731',
          950: '#000b1a',
        },
        /* ── Obsidian — Secondary / Neutral ──
           Deep, crisp, high-contrast grays scaling down to near OLED-black.
           Creates the ultimate premium dark mode canvas. */
        secondary: {
          50:  '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        /* ── Electric Amethyst — Accent / CTA ──
           A striking violet that blends flawlessly with Azure
           for breathtaking gradients and glows. */
        accent: {
          50:  '#f2eafe',
          100: '#e4d4fd',
          200: '#c9a9fa',
          300: '#ae7ef7',
          400: '#9353f4',
          500: '#7828c8',
          600: '#6020a0',
          700: '#481878',
          800: '#301050',
          900: '#180828',
          950: '#0c0414',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      keyframes: {
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'marquee': {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '70%': { transform: 'scale(1.1)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'draw-line': {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'marquee': 'marquee 40s linear infinite',
        'fade-in-up': 'fade-in-up 0.6s ease-out both',
        'float': 'float 6s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 3s ease infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'pop-in': 'pop-in 0.4s ease-out both',
        'draw-line': 'draw-line 0.5s ease-out both',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 