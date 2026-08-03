import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, radius, spacing, typeScale, ThemeColors } from './tokens';

export type Theme = {
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  type: typeof typeScale;
  scheme: 'light' | 'dark';
};

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme() === 'light' ? 'light' : 'dark';

  const theme = useMemo<Theme>(
    () => ({
      colors: scheme === 'light' ? lightColors : darkColors,
      spacing,
      radius,
      type: typeScale,
      scheme,
    }),
    [scheme],
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
