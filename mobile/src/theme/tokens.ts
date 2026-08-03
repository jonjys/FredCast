/**
 * Design tokens ported from docs/wireframes.html — single source of truth
 * for color, type, spacing and radius across the app. Keep this file and
 * the wireframe's :root tokens in sync.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 40,
} as const;

export const radius = {
  sm: 10,
  md: 18,
  lg: 28,
  pill: 999,
} as const;

export const fontFamily = {
  // System-native stacks — RN resolves these per platform. A premium feel
  // comes from rhythm/spacing, not a purchased display face (see PRODUCT_PLAN.md §4).
  display: undefined, // falls back to platform default bold below
  body: undefined,
  mono: 'monospace',
} as const;

export const typeScale = {
  h1: { fontSize: 30, fontWeight: '700' as const, letterSpacing: -0.4 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  title: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.2 },
  body: { fontSize: 16, fontWeight: '400' as const },
  label: { fontSize: 13, fontWeight: '600' as const },
  caption: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 1.2 },
  mono: { fontSize: 12, fontFamily: 'monospace' as const },
};

export type ThemeColors = typeof darkColors;

export const darkColors = {
  bg: '#0B0B10',
  surface: '#17161D',
  surface2: '#1F1E27',
  text: '#F3F1EE',
  textDim: '#9B98A6',
  textFaint: '#6E6B78',
  accent: '#7C6FEE',
  accentInk: '#FFFFFF',
  ready: '#35D28A',
  connecting: '#E8B84B',
  danger: '#E8615A',
  border: 'rgba(255,255,255,0.09)',
};

export const lightColors: ThemeColors = {
  bg: '#FAF9F7',
  surface: '#FFFFFF',
  surface2: '#F1EFEA',
  text: '#17151F',
  textDim: '#66636F',
  textFaint: '#9A97A1',
  accent: '#6552E0',
  accentInk: '#FFFFFF',
  ready: '#128F63',
  connecting: '#9C6D0E',
  danger: '#C6423B',
  border: 'rgba(20,16,30,0.09)',
};
