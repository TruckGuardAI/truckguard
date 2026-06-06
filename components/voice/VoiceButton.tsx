import React, { useCallback } from 'react';

import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';

import { useVoiceAssistant } from '../../src/hooks/useVoiceAssistant';

import { useToast } from '../../src/context/ToastContext';

import type { ProcessCommandResult } from '../../src/types/voice.types';

function statusColor(state: string): string {
  switch (state) {
    case 'listening':
      return '#38bdf8';
    case 'success_sos':
      return '#ef4444';
    case 'success_alert':
      return '#22c55e';
    case 'unrecognized':
      return '#f97316';
    case 'cooldown':
      return '#94a3b8';
    case 'offline':
      return '#f97316';
    case 'error':
      return '#f87171';
    default:
      return '#64748b';
  }
}

export default function VoiceButton(): React.ReactElement {
  const { showToast, showMessage } = useToast();

  const handleCommandResult = useCallback(
    (result: ProcessCommandResult) => {
      if (result.kind === 'success') {
        if (result.commandId === 'sos') {
          showMessage('✓ SOS enviado por voz');
        } else {
          showToast('created');
        }

        if (result.offline) {
          showMessage('○ Guardado offline — sincroniza ao voltar online');
        }

        return;
      }

      if (result.kind === 'unrecognized') {
        showMessage('⚠️ Comando não reconhecido');
      }

      if (result.kind === 'error') {
        showMessage(result.message);
      }
    },
    [showToast, showMessage],
  );

  const { status, isListening, toggleListening } =
    useVoiceAssistant({
      onCommandResult: handleCommandResult,
    });

  const borderColor = statusColor(status.state);
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
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.micIcon}>🎤</Text>
        )}
      </Pressable>

      <View style={styles.textBlock}>
        <Text style={styles.label}>Assistente de voz</Text>
        <Text style={[styles.message, { color: borderColor }]}>
          {status.message}
        </Text>
        <Text style={styles.hint}>
          Ex.: "TruckGuard SOS" · "TruckGuard combustível"
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
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
    backgroundColor: '#1e293b',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonActive: {
    backgroundColor: '#172554',
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
    color: '#f8fafc',
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
    color: '#64748b',
    fontSize: 11,
    lineHeight: 15,
  },
});
