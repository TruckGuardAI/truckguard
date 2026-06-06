/**
 * TruckGuard - Bluetooth Setup Screen (Example)
 * Tela de exemplo para configuração e teste de Bluetooth ESP32
 * 
 * Para usar:
 * 1. Criar app/(tabs)/bluetooth.tsx
 * 2. Copiar este código
 * 3. Adicionar ícone no tab navigator
 */

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

import { useBluetoothConnection } from '@/src/hooks/useBluetoothConnection';
import type { ESP32DeviceInfo } from '@/src/services/bluetooth';

export default function BluetoothSetupScreen() {
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

  // ==========================================================================
  // Handlers
  // ==========================================================================

  const handleScan = async () => {
    try {
      setScanError(null);
      console.log('🔍 Iniciando scan...');

      const foundDevices = await scan(10000); // 10 segundos

      setDevices(foundDevices);

      if (foundDevices.length === 0) {
        Alert.alert(
          'Nenhum Dispositivo',
          'Nenhum dispositivo TruckGuard encontrado. Verifique se o ESP32 está ligado.'
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      setScanError(errorMessage);

      Alert.alert('Erro no Scan', errorMessage);
    }
  };

  const handleConnect = async (device: ESP32DeviceInfo) => {
    try {
      console.log(`🔗 Conectando a ${device.name}...`);

      await connect(device.id);

      Alert.alert(
        'Conectado!',
        `Conectado com sucesso ao ${device.name}. Agora o app receberá alertas automaticamente.`
      );

      // Limpar lista de dispositivos após conectar
      setDevices([]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      Alert.alert('Erro de Conexão', errorMessage);
    }
  };

  const handleDisconnect = async () => {
    try {
      console.log('🔌 Desconectando...');

      await disconnect();

      Alert.alert('Desconectado', 'Desconectado do ESP32.');
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    }
  };

  // ==========================================================================
  // Render Helpers
  // ==========================================================================

  const getStatusColor = (): string => {
    switch (connectionState.status) {
      case 'connected':
        return '#10B981'; // verde
      case 'connecting':
      case 'scanning':
        return '#F59E0B'; // amarelo
      case 'error':
        return '#EF4444'; // vermelho
      default:
        return '#6B7280'; // cinza
    }
  };

  const getStatusText = (): string => {
    switch (connectionState.status) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando...';
      case 'scanning':
        return 'Escaneando...';
      case 'disconnected':
        return 'Desconectado';
      case 'error':
        return 'Erro';
      default:
        return 'Desconhecido';
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

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Bluetooth ESP32</Text>
        <Text style={styles.subtitle}>
          Configure a conexão com o dispositivo de segurança
        </Text>
      </View>

      {/* Status Card */}
      <View style={styles.card}>
        <View style={styles.statusRow}>
          <Ionicons
            name={getStatusIcon()}
            size={32}
            color={getStatusColor()}
          />
          <View style={styles.statusText}>
            <Text style={styles.statusLabel}>Status</Text>
            <Text
              style={[styles.statusValue, { color: getStatusColor() }]}
            >
              {getStatusText()}
            </Text>
          </View>
        </View>

        {connectionState.deviceName && (
          <View style={styles.deviceInfo}>
            <Text style={styles.infoLabel}>Dispositivo:</Text>
            <Text style={styles.infoValue}>
              {connectionState.deviceName}
            </Text>
          </View>
        )}

        {connectionState.rssi && (
          <View style={styles.deviceInfo}>
            <Text style={styles.infoLabel}>Sinal (RSSI):</Text>
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

      {/* Last Event Card */}
      {lastEvent && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Último Evento</Text>
          <View style={styles.eventBox}>
            <Text style={styles.eventCode}>🚨 {lastEvent.code}</Text>
            <Text style={styles.eventTime}>
              {new Date(lastEvent.receivedAt).toLocaleTimeString()}
            </Text>
            {lastEvent.metadata.batteryVoltage && (
              <Text style={styles.eventMeta}>
                Bateria: {lastEvent.metadata.batteryVoltage.toFixed(2)}V
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Actions */}
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
                <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Escaneando...</Text>
              </>
            ) : (
              <>
                <Ionicons name="search" size={20} color="#fff" />
                <Text style={styles.buttonText}>Escanear Dispositivos</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleDisconnect}
          >
            <Ionicons name="close-circle" size={20} color="#fff" />
            <Text style={styles.buttonText}>Desconectar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Devices List */}
      {devices.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Dispositivos Encontrados ({devices.length})
          </Text>

          {devices.map((device) => (
            <TouchableOpacity
              key={device.id}
              style={styles.deviceCard}
              onPress={() => handleConnect(device)}
              disabled={isConnecting}
            >
              <View style={styles.deviceCardContent}>
                <Ionicons name="hardware-chip" size={24} color="#D97706" />
                <View style={styles.deviceCardText}>
                  <Text style={styles.deviceName}>{device.name}</Text>
                  <Text style={styles.deviceMeta}>
                    RSSI: {device.rssi} dBm • {device.id.slice(0, 8)}...
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#9CA3AF"
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Scan Error */}
      {scanError && (
        <View style={styles.card}>
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{scanError}</Text>
          </View>
        </View>
      )}

      {/* Info */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color="#6B7280" />
        <Text style={styles.infoCardText}>
          O ESP32 deve estar ligado e próximo. O nome do dispositivo deve
          começar com "TruckGuard".
        </Text>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06090D',
  },

  header: {
    padding: 20,
    paddingTop: 40,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F3F4F6',
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },

  card: {
    backgroundColor: '#10161C',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F3F4F6',
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
    color: '#9CA3AF',
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
    color: '#9CA3AF',
    marginRight: 8,
  },

  infoValue: {
    fontSize: 14,
    color: '#F3F4F6',
    fontWeight: '500',
  },

  errorBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },

  errorText: {
    fontSize: 13,
    color: '#EF4444',
  },

  eventBox: {
    padding: 12,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
  },

  eventCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D97706',
    marginBottom: 4,
  },

  eventTime: {
    fontSize: 13,
    color: '#9CA3AF',
  },

  eventMeta: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },

  actions: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  primaryButton: {
    backgroundColor: '#D97706',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  dangerButton: {
    backgroundColor: '#DC2626',
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
    color: '#FFFFFF',
  },

  deviceCard: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
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
    color: '#F3F4F6',
    marginBottom: 2,
  },

  deviceMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 20,
    padding: 12,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.2)',
  },

  infoCardText: {
    flex: 1,
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 16,
  },
});
