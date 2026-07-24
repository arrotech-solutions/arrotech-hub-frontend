/** @type {import('tailwindcss').Config} */

/**
 * Brand colors / gradients / shadows come from src/theme/tokens.ts
 * (loaded via ./theme-tokens.cjs for Node/Tailwind).
 * Edit tokens.ts to rebrand — do not duplicate hex scales here.
 */
const { getTailwindExtend } = require('./theme-tokens.cjs');
const themeTokens = getTailwindExtend();

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: themeTokens.colors,
      backgroundImage: themeTokens.backgroundImage,
      boxShadow: themeTokens.boxShadow,
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
