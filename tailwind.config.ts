import type { Config } from 'tailwindcss';

/**
 * Design tokens per PIVOT_PLAN.md: dark, data-dense CFO dashboard —
 * not a re-skin of the old cast app's tokens.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#09090B',
        card: '#18181B',
        data: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      screens: {
        xs: '390px',
      },
    },
  },
  plugins: [],
};

export default config;
