import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Appearance,
  useColorScheme as useSystemColorScheme,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  buildAppTheme,
  type AppThemeTokens,
  type ThemeMode,
} from '../theme/palettes';

const THEME_STORAGE_KEY =
  'truckguard_theme_preference';

export type ThemePreference =
  | ThemeMode
  | 'system';

type ThemeContextValue = {
  theme: AppThemeTokens;
  preference: ThemePreference;
  isDark: boolean;
  isReady: boolean;
  setTheme: (
    mode: ThemePreference,
  ) => Promise<void>;
  toggleTheme: () => Promise<void>;
};

const ThemeContext =
  createContext<ThemeContextValue | null>(
    null,
  );

function isThemePreference(
  value: string | null,
): value is ThemePreference {
  return (
    value === 'light' ||
    value === 'dark' ||
    value === 'system'
  );
}

function resolveThemeMode(
  preference: ThemePreference,
  systemScheme: ThemeMode | null,
): ThemeMode {
  if (
    preference === 'light' ||
    preference === 'dark'
  ) {
    return preference;
  }

  return systemScheme === 'dark'
    ? 'dark'
    : 'light';
}

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const systemScheme =
    useSystemColorScheme();

  const [
    preference,
    setPreference,
  ] = useState<ThemePreference>(
    'system',
  );

  const [
    isReady,
    setIsReady,
  ] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadPreference() {
      try {
        const stored =
          await AsyncStorage.getItem(
            THEME_STORAGE_KEY,
          );

        if (
          mounted &&
          isThemePreference(stored)
        ) {
          setPreference(stored);
        }
      } finally {
        if (mounted) {
          setIsReady(true);
        }
      }
    }

    void loadPreference();

    return () => {
      mounted = false;
    };
  }, []);

  const resolvedMode = useMemo(
    () =>
      resolveThemeMode(
        preference,
        systemScheme === 'dark'
          ? 'dark'
          : systemScheme === 'light'
            ? 'light'
            : null,
      ),
    [preference, systemScheme],
  );

  const theme = useMemo(
    () =>
      buildAppTheme(resolvedMode),
    [resolvedMode],
  );

  const persistPreference = useCallback(
    async (
      nextPreference: ThemePreference,
    ) => {
      setPreference(nextPreference);

      await AsyncStorage.setItem(
        THEME_STORAGE_KEY,
        nextPreference,
      );
    },
    [],
  );

  const setTheme = useCallback(
    async (
      mode: ThemePreference,
    ) => {
      await persistPreference(mode);
    },
    [persistPreference],
  );

  const toggleTheme = useCallback(
    async () => {
      const nextMode: ThemeMode =
        resolvedMode === 'dark'
          ? 'light'
          : 'dark';

      await persistPreference(nextMode);
    },
    [
      persistPreference,
      resolvedMode,
    ],
  );

  useEffect(() => {
    const subscription =
      Appearance.addChangeListener(
        () => {
          if (preference === 'system') {
            setPreference('system');
          }
        },
      );

    return () => {
      subscription.remove();
    };
  }, [preference]);

  const value = useMemo(
    () => ({
      theme,
      preference,
      isDark: theme.isDark,
      isReady,
      setTheme,
      toggleTheme,
    }),
    [
      theme,
      preference,
      isReady,
      setTheme,
      toggleTheme,
    ],
  );

  return (
    <ThemeContext.Provider
      value={value}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useTheme deve ser usado dentro de ThemeProvider',
    );
  }

  return context;
}

export function useThemeColors() {
  return useTheme().theme.colors;
}
