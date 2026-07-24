/**
 * Arrotech Hub — brand theme tokens (single source of truth)
 *
 * 60 / 30 / 10
 * ─────────────────────────────────────────────────────────────
 *  60%  Night Violet  #1E1033  → surfaces, chrome, text, canvas
 *  30%  Dragon Fruit  #FF4696  → CTAs, links, brand fills
 *  10%  Solar Amber   #FFC857  → accent pops, highlights
 *
 * Edit THIS FILE to change the brand. Then restart Vite and run:
 *   npm run lint:ui
 *
 * Consumers:
 *   - app code            → import { chart, colors, brand } from '../theme'
 *   - tailwind.config.js  → require('./theme-tokens.cjs') (loads this file)
 *   - index.css           → CSS vars must mirror values below
 */

export type ColorScale = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
};

export const nightViolet: ColorScale = {
  50: '#FAF8FC',
  100: '#F3EEF8',
  200: '#E4DCEC',
  300: '#C9BBD8',
  400: '#9A86B0',
  500: '#6F5A88',
  600: '#4A3863',
  700: '#35264A',
  800: '#281A3D',
  900: '#1E1033',
  950: '#12091F',
};

export const dragonFruit: ColorScale = {
  50: '#FFF0F6',
  100: '#FFE0ED',
  200: '#FFC1DB',
  300: '#FF94C0',
  400: '#FF6BA8',
  500: '#FF4696',
  600: '#E62E7D',
  700: '#C41A63',
  800: '#9A144D',
  900: '#6B0E36',
  950: '#3D081F',
};

export const solarAmber: ColorScale = {
  50: '#FFF9EB',
  100: '#FFF0C7',
  200: '#FFE08A',
  300: '#FFD15C',
  400: '#FFC857',
  500: '#FFC857',
  600: '#E6A820',
  700: '#C48912',
  800: '#9A6A0E',
  900: '#6B4809',
  950: '#3D2804',
};

/** Hybrid: brand midtones + night violet deep ends (legacy blue/indigo/sky). */
const brandMidDeep: ColorScale = {
  50: dragonFruit[50],
  100: dragonFruit[100],
  200: dragonFruit[200],
  300: dragonFruit[300],
  400: dragonFruit[400],
  500: dragonFruit[500],
  600: dragonFruit[600],
  700: dragonFruit[700],
  800: nightViolet[800],
  900: nightViolet[900],
  950: nightViolet[950],
};

/** Teal remap: soft brand + amber mid + violet deep. */
const tealRemap: ColorScale = {
  50: dragonFruit[50],
  100: dragonFruit[100],
  200: dragonFruit[200],
  300: solarAmber[300],
  400: solarAmber[400],
  500: solarAmber[500],
  600: dragonFruit[600],
  700: nightViolet[700],
  800: nightViolet[800],
  900: nightViolet[900],
  950: nightViolet[950],
};

export const brand = {
  nightViolet,
  dragonFruit,
  solarAmber,
  themeColor: nightViolet[900],
  backgroundColor: nightViolet[50],
  names: {
    secondary: 'Night Violet',
    primary: 'Dragon Fruit',
    accent: 'Solar Amber',
  },
};

export const colors = {
  primary: dragonFruit,
  secondary: nightViolet,
  accent: solarAmber,
};

export const remaps = {
  slate: nightViolet,
  gray: nightViolet,
  zinc: nightViolet,
  neutral: nightViolet,
  fuchsia: dragonFruit,
  pink: dragonFruit,
  purple: dragonFruit,
  violet: nightViolet,
  indigo: brandMidDeep,
  blue: brandMidDeep,
  cyan: solarAmber,
  sky: brandMidDeep,
  teal: tealRemap,
  amber: solarAmber,
  yellow: solarAmber,
};

export const gradients = {
  brand: `linear-gradient(135deg, ${dragonFruit[500]} 0%, ${nightViolet[900]} 100%)`,
  brandSoft: `linear-gradient(135deg, rgba(255,70,150,0.18) 0%, rgba(30,16,51,0.08) 100%)`,
  accent: `linear-gradient(135deg, ${solarAmber[500]} 0%, ${dragonFruit[500]} 100%)`,
  surface: `linear-gradient(160deg, ${nightViolet[50]} 0%, ${nightViolet[100]} 45%, ${dragonFruit[100]} 100%)`,
  surfaceDark: `linear-gradient(160deg, ${nightViolet[950]} 0%, ${nightViolet[900]} 55%, ${nightViolet[800]} 100%)`,
};

export const shadows = {
  brand: '0 10px 40px -10px rgba(255, 70, 150, 0.45)',
  brandLg: '0 20px 50px -12px rgba(255, 70, 150, 0.4)',
  accent: '0 8px 28px -8px rgba(255, 200, 87, 0.55)',
  surface: '0 1px 3px rgba(30, 16, 51, 0.06), 0 8px 24px rgba(30, 16, 51, 0.06)',
  edgeGlow: 'drop-shadow(0 0 3px rgba(255, 70, 150, 0.4))',
};

export const chart = {
  primary: dragonFruit[500],
  primary400: dragonFruit[400],
  primary300: dragonFruit[300],
  primary600: dragonFruit[600],
  accent: solarAmber[500],
  accent600: solarAmber[600],
  accent700: solarAmber[700],
  secondary: nightViolet[900],
  secondary400: nightViolet[400],
  secondary500: nightViolet[500],
  secondary600: nightViolet[600],
  surfaceDark: nightViolet[900],
  surfaceDarker: nightViolet[950],
  ink: nightViolet[900],
  muted: nightViolet[400],
};

export const cssVars = {
  light: {
    surface: nightViolet[50],
    surface2: nightViolet[100],
    ink: nightViolet[900],
    brand: dragonFruit[500],
    accent: solarAmber[500],
  },
  dark: {
    surface: nightViolet[950],
    surface2: nightViolet[900],
    ink: nightViolet[50],
  },
};

export const bannedHex = [
  '#6366F1',
  '#4F46E5',
  '#3B82F6',
  '#2563EB',
  '#8B5CF6',
  '#7C3AED',
  '#A855F7',
  '#0F0F23',
  '#1A1A3E',
  '#020617',
  '#0B1120',
  '#060B14',
  '#0B1221',
];

export function getTailwindExtend() {
  return {
    colors: {
      secondary: colors.secondary,
      primary: colors.primary,
      accent: colors.accent,
      ...remaps,
    },
    backgroundImage: {
      'brand-gradient': gradients.brand,
      'brand-gradient-soft': gradients.brandSoft,
      'accent-gradient': gradients.accent,
      'surface-gradient': gradients.surface,
      'surface-gradient-dark': gradients.surfaceDark,
    },
    boxShadow: {
      brand: shadows.brand,
      'brand-lg': shadows.brandLg,
      accent: shadows.accent,
      surface: shadows.surface,
    },
  };
}

export const themeColor = brand.themeColor;
export const backgroundColor = brand.backgroundColor;

const tokens = {
  nightViolet,
  dragonFruit,
  solarAmber,
  brand,
  colors,
  remaps,
  gradients,
  shadows,
  chart,
  cssVars,
  bannedHex,
  getTailwindExtend,
  themeColor,
  backgroundColor,
};

export default tokens;
