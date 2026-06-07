import React from 'react';

import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { useTranslation } from 'react-i18next';

import { useThemedStyles } from '../../src/hooks/useThemedStyles';

import type { AppThemeTokens } from '../../src/theme/palettes';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: string) => void;
};

const MODAL_TYPE_KEYS = [
  'theft',
  'accident',
  'police',
  'fuel',
  'rest',
  'danger',
] as const;

function createStyles(theme: AppThemeTokens) {
  const { colors, components } = theme;

  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: components.modalOverlay,
      justifyContent: 'center',
      alignItems: 'center',
    },

    modal: {
      width: '85%',
      backgroundColor: components.modalBackground,
      padding: 20,
      borderRadius: 20,
    },

    title: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: 'bold',
      marginBottom: 20,
    },

    item: {
      backgroundColor: colors.surfaceSecondary,
      padding: 16,
      borderRadius: 12,
      marginBottom: 10,
    },

    text: {
      color: colors.textPrimary,
    },

    cancel: {
      marginTop: 15,
      backgroundColor: colors.danger,
      padding: 15,
      borderRadius: 12,
      alignItems: 'center',
    },

    cancelText: {
      color: components.buttonPrimaryText,
    },
  });
}

export default function CreateAlertModal({
  visible,
  onClose,
  onSelect,
}: Props) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>
            {t('radar.reportAlert')}
          </Text>

          {MODAL_TYPE_KEYS.map((key) => (
            <TouchableOpacity
              key={key}
              style={styles.item}
              onPress={() => onSelect(key)}
            >
              <Text style={styles.text}>
                {t(`radar.modalTypes.${key}`)}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            onPress={onClose}
            style={styles.cancel}
          >
            <Text style={styles.cancelText}>
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
