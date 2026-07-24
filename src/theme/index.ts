/**
 * App-facing brand theme API.
 * Source of truth: ./tokens.ts — edit scales there to rebrand the app.
 */
export type { ColorScale } from './tokens';
export {
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
} from './tokens';

export { default } from './tokens';
