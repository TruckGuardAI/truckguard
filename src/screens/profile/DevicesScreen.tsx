import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

import ProfileBackHeader from '../../components/profile/ProfileBackHeader';

import { useTheme } from '../../context/ThemeContext';
import { useThemedStyles } from '../../hooks/useThemedStyles';

import { useBluetoothConnection } from '../../hooks/useBluetoothConnection';

import type { AppThemeTokens } from '../../theme/palettes';

import type { ESP32DeviceInfo } from '../../services/bluetooth';

function createStyles(theme: AppThemeTokens) {
  const { colors, components } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    header: {
      padding: 20,
      paddingTop: 60,
    },

    subtitle: {
      fontSize: 14,
      color: colors.textMuted,
    },

    card: {
      backgroundColor: colors.card,
      marginHorizontal: 20,
      marginBottom: 16,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },

    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 12,
    },

    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },

    statusText: {
      flex: 1,
    },

    statusLabel: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 2,
    },

    statusValue: {
      fontSize: 18,
      fontWeight: '600',
    },

    deviceInfo: {
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },

    infoLabel: {
      fontSize: 14,
      color: colors.textMuted,
      marginRight: 8,
    },

    infoValue: {
      fontSize: 14,
      color: colors.textPrimary,
      fontWeight: '500',
    },

    errorBox: {
      marginTop: 12,
      padding: 12,
      backgroundColor: 'rgba(211, 47, 54, 0.1)',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(211, 47, 54, 0.3)',
    },

    errorText: {
      fontSize: 13,
      color: colors.danger,
    },

    eventBox: {
      padding: 12,
      backgroundColor: 'rgba(184, 107, 58, 0.1)',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(184, 107, 58, 0.3)',
    },

    eventCode: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 4,
    },

    eventTime: {
      fontSize: 13,
      color: colors.textMuted,
    },

    eventMeta: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
    },

    actions: {
      paddingHorizontal: 20,
      marginBottom: 16,
    },

    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },

    dangerButton: {
      backgroundColor: colors.danger,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },

    buttonDisabled: {
      opacity: 0.5,
    },

    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      color: components.buttonPrimaryText,
    },

    deviceCard: {
      padding: 12,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },

    deviceCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },

    deviceCardText: {
      flex: 1,
    },

    deviceName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 2,
    },

    deviceMeta: {
      fontSize: 12,
      color: colors.textMuted,
    },

    infoCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginHorizontal: 20,
      padding: 12,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },

    infoCardText: {
      flex: 1,
      fontSize: 12,
      color: colors.textMuted,
      lineHeight: 16,
    },
  });
}

export default function DevicesScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  const {
    connectionState,
    lastEvent,
    isConnected,
    isScanning,
    isConnecting,
    scan,
    connect,
    disconnect,
  } = useBluetoothConnection();

  const [devices, setDevices] = useState<ESP32DeviceInfo[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);

  const getStatusColor = (): string => {
    switch (connectionState.status) {
      case 'connected':
        return theme.colors.success;
      case 'connecting':
      case 'scanning':
        return theme.colors.warning;
      case 'error':
        return theme.colors.danger;
      default:
        return theme.colors.textMuted;
    }
  };

  const handleScan = async () => {
    try {
      setScanError(null);
      console.log('🔍 Iniciando scan...');

      const foundDevices = await scan(10000);

      setDevices(foundDevices);

      if (foundDevices.length === 0) {
        Alert.alert(
          t('devices.noDevice'),
          t('devices.noDeviceFound'),
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('common.unknown');

      setScanError(errorMessage);

      Alert.alert(t('devices.scanError'), errorMessage);
    }
  };

  const handleConnect = async (device: ESP32DeviceInfo) => {
    try {
      console.log(`🔗 Conectando a ${device.name}...`);

      await connect(device.id);

      Alert.alert(
        t('devices.connectedTitle'),
        t('devices.connectedMessage', { device: device.name }),
      );

      setDevices([]);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('common.unknown');

      Alert.alert(t('devices.connectionError'), errorMessage);
    }
  };

  const handleDisconnect = async () => {
    try {
      console.log('🔌 Desconectando...');

      await disconnect();

      Alert.alert(
        t('devices.disconnectedTitle'),
        t('devices.disconnectedMessage'),
      );
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    }
  };

  const getStatusText = (): string => {
    switch (connectionState.status) {
      case 'connected':
        return t('devices.connected');
      case 'connecting':
        return t('devices.connecting');
      case 'scanning':
        return t('devices.scanning');
      case 'disconnected':
        return t('devices.disconnected');
      case 'error':
        return t('devices.error');
      default:
        return t('devices.unknown');
    }
  };

  const getStatusIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (connectionState.status) {
      case 'connected':
        return 'bluetooth';
      case 'connecting':
      case 'scanning':
        return 'bluetooth-outline';
      default:
        return 'bluetooth-outline';
    }
  };

  const statusColor = getStatusColor();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <ProfileBackHeader title={t('devices.title')} />

        <Text style={styles.subtitle}>
          {t('devices.subtitle')}
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.statusRow}>
          <Ionicons
            name={getStatusIcon()}
            size={32}
            color={statusColor}
          />
          <View style={styles.statusText}>
            <Text style={styles.statusLabel}>{t('devices.status')}</Text>
            <Text
              style={[styles.statusValue, { color: statusColor }]}
            >
              {getStatusText()}
            </Text>
          </View>
        </View>

        {connectionState.deviceName && (
          <View style={styles.deviceInfo}>
            <Text style={styles.infoLabel}>{t('devices.device')}</Text>
            <Text style={styles.infoValue}>
              {connectionState.deviceName}
            </Text>
          </View>
        )}

        {connectionState.rssi && (
          <View style={styles.deviceInfo}>
            <Text style={styles.infoLabel}>{t('devices.signal')}</Text>
            <Text style={styles.infoValue}>
              {connectionState.rssi} dBm
            </Text>
          </View>
        )}

        {connectionState.error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              {connectionState.error}
            </Text>
          </View>
        )}
      </View>

      {lastEvent && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('devices.lastEvent')}</Text>
          <View style={styles.eventBox}>
            <Text style={styles.eventCode}>🚨 {lastEvent.code}</Text>
            <Text style={styles.eventTime}>
              {new Date(lastEvent.receivedAt).toLocaleTimeString()}
            </Text>
            {lastEvent.metadata.batteryVoltage && (
              <Text style={styles.eventMeta}>
                {t('devices.battery')} {lastEvent.metadata.batteryVoltage.toFixed(2)}V
              </Text>
            )}
          </View>
        </View>
      )}

      <View style={styles.actions}>
        {!isConnected ? (
          <TouchableOpacity
            style={[
              styles.primaryButton,
              (isScanning || isConnecting) && styles.buttonDisabled,
            ]}
            onPress={handleScan}
            disabled={isScanning || isConnecting}
          >
            {isScanning ? (
              <>
                <ActivityIndicator color={theme.components.buttonPrimaryText} style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>{t('devices.scanning')}</Text>
              </>
            ) : (
              <>
                <Ionicons name="search" size={20} color={theme.components.buttonPrimaryText} />
                <Text style={styles.buttonText}>{t('devices.scanDevices')}</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleDisconnect}
          >
            <Ionicons name="close-circle" size={20} color={theme.components.buttonPrimaryText} />
            <Text style={styles.buttonText}>{t('devices.disconnect')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {devices.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {t('devices.foundDevices', { count: devices.length })}
          </Text>

          {devices.map((device) => (
            <TouchableOpacity
              key={device.id}
              style={styles.deviceCard}
              onPress={() => handleConnect(device)}
              disabled={isConnecting}
            >
              <View style={styles.deviceCardContent}>
                <Ionicons name="hardware-chip" size={24} color={theme.colors.primary} />
                <View style={styles.deviceCardText}>
                  <Text style={styles.deviceName}>{device.name}</Text>
                  <Text style={styles.deviceMeta}>
                    RSSI: {device.rssi} dBm • {device.id.slice(0, 8)}...
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.colors.textMuted}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {scanError && (
        <View style={styles.card}>
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{scanError}</Text>
          </View>
        </View>
      )}

      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color={theme.colors.textMuted} />
        <Text style={styles.infoCardText}>
          {t('devices.esp32Hint')}
        </Text>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}
