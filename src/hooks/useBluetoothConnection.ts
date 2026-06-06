/**
 * TruckGuard - Hook React para Bluetooth
 * Custom hook para facilitar integração de Bluetooth em componentes React
 */

import { useEffect, useState, useCallback } from 'react';

import {
  bluetoothService,
  type BluetoothConnectionState,
  type ESP32DeviceInfo,
  type ProcessedBluetoothEvent,
} from '../services/bluetooth';

/**
 * Hook para gerenciar conexão Bluetooth ESP32
 */
export function useBluetoothConnection() {
  const [connectionState, setConnectionState] =
    useState<BluetoothConnectionState>(
      bluetoothService.getConnectionState()
    );

  const [lastEvent, setLastEvent] =
    useState<ProcessedBluetoothEvent | null>(null);

  useEffect(() => {
    // Listener de conexão
    const unsubscribeConnection =
      bluetoothService.addConnectionListener(setConnectionState);

    // Listener de eventos
    const unsubscribeEvents = bluetoothService.addEventListener(
      (event) => {
        setLastEvent(event);
      }
    );

    return () => {
      unsubscribeConnection();
      unsubscribeEvents();
    };
  }, []);

  const scan = useCallback(
    async (durationMs: number = 10000): Promise<ESP32DeviceInfo[]> => {
      return await bluetoothService.scanForDevices(durationMs);
    },
    []
  );

  const connect = useCallback(async (deviceId: string): Promise<void> => {
    return await bluetoothService.connect(deviceId);
  }, []);

  const disconnect = useCallback(async (): Promise<void> => {
    return await bluetoothService.disconnect();
  }, []);

  return {
    // Estado
    connectionState,
    lastEvent,
    isConnected: connectionState.status === 'connected',
    isScanning: connectionState.status === 'scanning',
    isConnecting: connectionState.status === 'connecting',

    // Ações
    scan,
    connect,
    disconnect,
  };
}
