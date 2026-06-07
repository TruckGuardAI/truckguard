import React from 'react';

import { useTranslation } from 'react-i18next';

import {
  Modal,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';

import {
  useLanguage,
} from '../../context/LanguageContext';

import { useThemedStyles } from '../../hooks/useThemedStyles';

import type { AppLanguage } from '../../i18n';

import type { AppThemeTokens } from '../../theme/palettes';

type LanguageModalProps = {
  visible: boolean;
  onClose: () => void;
};

const LANGUAGE_OPTIONS: AppLanguage[] = [
  'pt',
  'es',
  'en',
];

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
      maxWidth: 360,
      backgroundColor: components.modalBackground,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 24,
    },

    title: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '800',
      marginBottom: 20,
      textAlign: 'center',
    },

    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSecondary,
    },

    optionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.glass.fill,
    },

    optionText: {
      color: colors.textPrimary,
      fontSize: 17,
      fontWeight: '600',
    },

    check: {
      color: colors.primary,
      fontSize: 18,
      fontWeight: '800',
    },

    closeButton: {
      marginTop: 12,
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

export function LanguageModal({
  visible,
  onClose,
}: LanguageModalProps) {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const styles = useThemedStyles(createStyles);

  async function handleSelect(
    nextLanguage: AppLanguage,
  ) {
    await setLanguage(nextLanguage);
    onClose();
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
          <Text style={styles.title}>
            {t('languages.selectTitle')}
          </Text>

          {LANGUAGE_OPTIONS.map((option) => {
            const selected =
              language === option;

            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.option,
                  selected &&
                    styles.optionSelected,
                ]}
                onPress={() => {
                  void handleSelect(option);
                }}
                activeOpacity={0.85}
              >
                <Text
                  style={styles.optionText}
                >
                  {t(`languages.${option}`)}
                </Text>

                {selected ? (
                  <Text style={styles.check}>
                    ✓
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.closeText}>
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
