import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

import i18n, {
  isAppLanguage,
  type AppLanguage,
} from '../i18n';

const LANGUAGE_STORAGE_KEY =
  'truckguard_language';

type LanguageContextValue = {
  language: AppLanguage;
  isReady: boolean;
  setLanguage: (
    language: AppLanguage,
  ) => Promise<void>;
};

const LanguageContext =
  createContext<LanguageContextValue | null>(
    null,
  );

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [
    language,
    setLanguageState,
  ] = useState<AppLanguage>(
    i18n.language as AppLanguage,
  );

  const [
    isReady,
    setIsReady,
  ] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadLanguage() {
      try {
        const stored =
          await AsyncStorage.getItem(
            LANGUAGE_STORAGE_KEY,
          );

        if (
          mounted &&
          isAppLanguage(stored)
        ) {
          await i18n.changeLanguage(
            stored,
          );

          setLanguageState(stored);
        }
      } finally {
        if (mounted) {
          setIsReady(true);
        }
      }
    }

    void loadLanguage();

    return () => {
      mounted = false;
    };
  }, []);

  const setLanguage = useCallback(
    async (
      nextLanguage: AppLanguage,
    ) => {
      await i18n.changeLanguage(
        nextLanguage,
      );

      setLanguageState(nextLanguage);

      await AsyncStorage.setItem(
        LANGUAGE_STORAGE_KEY,
        nextLanguage,
      );
    },
    [],
  );

  const value = useMemo(
    () => ({
      language,
      isReady,
      setLanguage,
    }),
    [
      language,
      isReady,
      setLanguage,
    ],
  );

  return (
    <LanguageContext.Provider
      value={value}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(
    LanguageContext,
  );

  if (!context) {
    throw new Error(
      'useLanguage deve ser usado dentro de LanguageProvider',
    );
  }

  return context;
}
