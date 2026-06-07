import React from 'react';

import { useTranslation } from 'react-i18next';

import {
  View,
  StyleSheet,
} from 'react-native';

import ProfileBackHeader from '../../../src/components/profile/ProfileBackHeader';

import { useTheme } from '../../../src/context/ThemeContext';

import ConfigScreen from '../config';

export default function ProfileSettingsRoute() {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor:
            theme.colors.background,
        },
      ]}
    >
      <View style={styles.header}>
        <ProfileBackHeader title={t('config.title')} />
      </View>

      <ConfigScreen embedded />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
  },
});
