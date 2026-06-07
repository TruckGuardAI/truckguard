import React, { useCallback } from 'react';

import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';

import { useTranslation } from 'react-i18next';

import { useVoiceAssistant } from '../../src/hooks/useVoiceAssistant';

import { useToast } from '../../src/context/ToastContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useThemedStyles } from '../../src/hooks/useThemedStyles';

import type { AppThemeTokens } from '../../src/theme/palettes';

import type { ProcessCommandResult } from '../../src/types/voice.types';

function statusColor(
  state: string,
  colors: AppThemeTokens['colors'],
): string {
  switch (state) {
    case 'listening':
      return colors.primary;
    case 'success_sos':
      return colors.danger;
    case 'success_alert':
      return colors.success;
    case 'unrecognized':
      return colors.warning;
    case 'cooldown':
      return colors.textMuted;
    case 'offline':
      return colors.warning;
    case 'error':
      return colors.danger;
    default:
      return colors.textMuted;
  }
}

function createStyles(theme: AppThemeTokens) {
  const { colors } = theme;

  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 12,
      gap: 14,
      ...Platform.select({
        web: {
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        },
        default: {
          elevation: 6,
        },
      }),
    },

    button: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },

    buttonActive: {
      backgroundColor: colors.surface,
    },

    buttonPressed: {
      opacity: 0.88,
      transform: [{ scale: 0.96 }],
    },

    micIcon: {
      fontSize: 26,
    },

    textBlock: {
      flex: 1,
    },

    label: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '800',
      marginBottom: 4,
    },

    message: {
      fontSize: 13,
      fontWeight: '700',
      marginBottom: 4,
    },

    hint: {
      color: colors.textMuted,
      fontSize: 11,
      lineHeight: 15,
    },
  });
}

export default function VoiceButton(): React.ReactElement {
  const { t } = useTranslation();
  const { showToast, showMessage } = useToast();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  const handleCommandResult = useCallback(
    (result: ProcessCommandResult) => {
      if (result.kind === 'success') {
        if (result.commandId === 'sos') {
          showMessage(t('voice.sosSent'));
        } else {
          showToast('created');
        }

        if (result.offline) {
          showMessage(t('voice.savedOffline'));
        }

        return;
      }

      if (result.kind === 'unrecognized') {
        showMessage(t('voice.unrecognized'));
      }

      if (result.kind === 'error') {
        showMessage(result.message);
      }
    },
    [showToast, showMessage, t],
  );

  const { status, isListening, toggleListening } =
    useVoiceAssistant({
      onCommandResult: handleCommandResult,
    });

  const borderColor = statusColor(status.state, theme.colors);
  const isBusy =
    status.state === 'processing' ||
    status.state === 'listening';

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => {
          void toggleListening();
        }}
        style={({ pressed }) => [
          styles.button,
          { borderColor },
          isListening && styles.buttonActive,
          pressed && styles.buttonPressed,
        ]}
      >
        {isBusy ? (
          <ActivityIndicator color={theme.components.buttonPrimaryText} size="small" />
        ) : (
          <Text style={styles.micIcon}>🎤</Text>
        )}
      </Pressable>

      <View style={styles.textBlock}>
        <Text style={styles.label}>{t('voice.assistant')}</Text>
        <Text style={[styles.message, { color: borderColor }]}>
          {status.message}
        </Text>
        <Text style={styles.hint}>
          {t('voice.hint')}
        </Text>
      </View>
    </View>
  );
}
