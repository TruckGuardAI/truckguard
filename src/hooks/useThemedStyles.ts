import { useMemo } from 'react';

import type {
  StyleSheet,
} from 'react-native';

import { useTheme } from '../context/ThemeContext';

import type { AppThemeTokens } from '../theme/palettes';

export function useThemedStyles<
  T extends StyleSheet.NamedStyles<T>,
>(
  factory: (
    theme: AppThemeTokens,
  ) => T,
): T {
  const { theme } = useTheme();

  return useMemo(
    () => factory(theme),
    [factory, theme],
  );
}
