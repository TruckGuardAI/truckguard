import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';

import { AboutModal } from '../../src/components/about/AboutModal';

import { LanguageModal } from '../../src/components/i18n/LanguageModal';

import { useNotificationPreferences } from '../../src/context/NotificationPreferencesContext';

import { useTheme } from '../../src/context/ThemeContext';

import { useThemedStyles } from '../../src/hooks/useThemedStyles';

import type { AppThemeTokens } from '../../src/theme/palettes';

type ConfigScreenProps = {
  embedded?: boolean;
};

function createStyles(theme: AppThemeTokens) {
  const { colors } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 20,
    },

    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginTop: 50,
    },

    subtitle: {
      color: colors.textSecondary,
      marginBottom: 25,
    },

    card: {
      backgroundColor: colors.card,
      padding: 20,
      borderRadius: 25,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },

    section: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: 20,
    },

    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 25,
    },

    item: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 25,
    },

    label: {
      fontSize: 16,
      color: colors.textPrimary,
    },

    value: {
      color: colors.textSecondary,
    },
  });
}

export default function ConfigScreen({
  embedded = false,
}: ConfigScreenProps) {
  const { t, i18n } = useTranslation();

  const {
    notificationEnabled,
    communityAlertsEnabled,
    toggleNotifications,
    toggleCommunityAlerts,
  } = useNotificationPreferences();

  const [
    languageModalVisible,
    setLanguageModalVisible,
  ] = useState(false);

  const [
    aboutModalVisible,
    setAboutModalVisible,
  ] = useState(false);

  const {
    isDark,
    toggleTheme,
    theme,
  } = useTheme();

  const styles = useThemedStyles(createStyles);

  const currentLanguageLabel = t(
    `languages.${i18n.language}`,
    { defaultValue: t('languages.pt') },
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
      >
        {!embedded ? (
          <>
            <Text style={styles.title}>
              {t('config.title')}
            </Text>

            <Text style={styles.subtitle}>
              {t('config.subtitle')}
            </Text>
          </>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.section}>
            {t('config.preferences')}
          </Text>

          <View style={styles.row}>
            <Text style={styles.label}>
              🔔 {t('config.notifications')}
            </Text>

            <Switch
              value={notificationEnabled}
              onValueChange={() => {
                void toggleNotifications();
              }}
              trackColor={{
                false:
                  theme.components
                    .inputBackground,
                true: theme.colors.primary,
              }}
            />
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>
              {isDark ? '🌙' : '☀️'}{' '}
              {isDark
                ? t('config.darkMode')
                : t('config.lightMode')}
            </Text>

            <Switch
              value={isDark}
              onValueChange={() => {
                void toggleTheme();
              }}
              trackColor={{
                false:
                  theme.components
                    .inputBackground,
                true: theme.colors.primary,
              }}
            />
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>
              👥 {t('config.communityAlerts')}
            </Text>

            <Switch
              value={communityAlertsEnabled}
              onValueChange={() => {
                void toggleCommunityAlerts();
              }}
              trackColor={{
                false:
                  theme.components
                    .inputBackground,
                true: theme.colors.primary,
              }}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>
            {t('config.app')}
          </Text>

          <TouchableOpacity
            style={styles.item}
            onPress={() => {
              setLanguageModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.label}>
              🌍 {t('config.language')}
            </Text>

            <Text style={styles.value}>
              {currentLanguageLabel}
            </Text>
          </TouchableOpacity>

          <View style={styles.item}>
            <Text style={styles.label}>
              📱 {t('config.version')}
            </Text>

            <Text style={styles.value}>
              {t('common.version')}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.item}
            onPress={() => {
              setAboutModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.label}>
              ℹ {t('config.about')}
            </Text>

            <Text style={styles.value}>
              {t('common.brand')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LanguageModal
        visible={languageModalVisible}
        onClose={() => {
          setLanguageModalVisible(false);
        }}
      />

      <AboutModal
        visible={aboutModalVisible}
        onClose={() => {
          setAboutModalVisible(false);
        }}
      />
    </View>
  );
}
