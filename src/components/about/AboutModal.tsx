import React from 'react';

import { useTranslation } from 'react-i18next';

import * as WebBrowser from 'expo-web-browser';

import {
  Modal,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

import { APP_LINKS } from '../../constants/appLinks';

import { useThemedStyles } from '../../hooks/useThemedStyles';

import type { AppThemeTokens } from '../../theme/palettes';

type AboutModalProps = {
  visible: boolean;
  onClose: () => void;
};

type LinkItem = {
  labelKey: string;
  url: string;
};

const LINK_ITEMS: LinkItem[] = [
  {
    labelKey: 'about.website',
    url: APP_LINKS.website,
  },
  {
    labelKey: 'about.privacyPolicy',
    url: APP_LINKS.privacyPolicy,
  },
  {
    labelKey: 'about.termsOfUse',
    url: APP_LINKS.termsOfUse,
  },
];

const FEATURE_KEYS = [
  'about.features.roadAlerts',
  'about.features.security',
  'about.features.community',
  'about.features.aiAssistant',
] as const;

function createStyles(theme: AppThemeTokens) {
  const { colors, components } = theme;

  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: components.modalOverlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },

    card: {
      width: '100%',
      maxWidth: 400,
      maxHeight: '85%',
      backgroundColor: components.modalBackground,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 24,
    },

    scroll: {
      flexGrow: 0,
    },

    brand: {
      color: colors.textPrimary,
      fontSize: 28,
      fontWeight: '900',
      textAlign: 'center',
      marginBottom: 6,
    },

    version: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 16,
    },

    description: {
      color: colors.textSecondary,
      fontSize: 16,
      lineHeight: 24,
      textAlign: 'center',
      marginBottom: 20,
    },

    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 10,
    },

    feature: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 6,
    },

    linksSection: {
      marginTop: 20,
      gap: 10,
    },

    linkButton: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSecondary,
    },

    linkText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },

    closeButton: {
      marginTop: 20,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
    },

    closeText: {
      color: colors.textSecondary,
      fontSize: 16,
      fontWeight: '600',
    },
  });
}

export function AboutModal({
  visible,
  onClose,
}: AboutModalProps) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  async function openLink(url: string) {
    await WebBrowser.openBrowserAsync(url);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.overlay}
        onPress={onClose}
      >
        <Pressable
          style={styles.card}
          onPress={(event) => {
            event.stopPropagation();
          }}
        >
          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.brand}>
              {t('common.brand')}
            </Text>

            <Text style={styles.version}>
              {t('about.versionLabel', {
                version: t('common.version'),
              })}
            </Text>

            <Text style={styles.description}>
              {t('about.description')}
            </Text>

            <Text style={styles.sectionTitle}>
              {t('about.developedFor')}
            </Text>

            {FEATURE_KEYS.map((key) => (
              <Text
                key={key}
                style={styles.feature}
              >
                • {t(key)}
              </Text>
            ))}

            <View style={styles.linksSection}>
              {LINK_ITEMS.map((item) => (
                <TouchableOpacity
                  key={item.labelKey}
                  style={styles.linkButton}
                  onPress={() => {
                    void openLink(item.url);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.linkText}>
                    {t(item.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.closeText}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
