import React from 'react';

import { useTranslation } from 'react-i18next';

import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../context/ThemeContext';

import { TruxafeLogo } from './TruxafeLogo';

type HomeBrandBlockProps = {
  greeting: string;
};

export default function HomeBrandBlock({
  greeting,
}: HomeBrandBlockProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top + 12,
        },
      ]}
    >
      <TruxafeLogo
        size="home"
        centered
      />

      <Text
        style={[
          styles.greeting,
          {
            color: theme.colors.textPrimary,
          },
        ]}
        numberOfLines={2}
      >
        {greeting}
      </Text>

      <Text
        style={[
          styles.welcome,
          {
            color: theme.colors.textSecondary,
          },
        ]}
        numberOfLines={2}
      >
        {t('home.welcome')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },

  greeting: {
    marginTop: 10,
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
    textAlign: 'center',
  },

  welcome: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
