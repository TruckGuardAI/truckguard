/**
 * TruckGuard Bluetooth Service
 * Serviço principal de gerenciamento Bluetooth ESP32
 * 
 * SOLID Principles:
 * - Single Responsibility: Gerenciar conexões Bluetooth
 * - Open/Closed: Extensível via listeners
 * - Dependency Inversion: Depende de abstrações (parser, processor)
 * 
 * NOTA IMPORTANTE:
 * Este serviço requer react-native-ble-plx e Expo Development Build
 * Não funciona no Expo Go
 * 
 * Para instalar:
 * npm install react-native-ble-plx
 * npx expo prebuild
 * npx expo run:android
 */

import { Platform, PermissionsAndroid } from 'react-native';

// Types para BLE (será instalado via npm)
type BleManager = any;
type Device = any;
type Characteristic = any;

import type {
  BluetoothConnectionState,
  BluetoothConnectionListener,
  BluetoothEventListener,
  ESP32DeviceInfo,
  ESP32BluetoothPayload,
} from '../../types/bluetooth.types';

import { BluetoothError } from '../../types/bluetooth.types';
import { BLUETOOTH_CONFIG } from '../../config/bluetooth.config';
import { BluetoothProtocolParser } from './BluetoothProtocolParser';
import { BluetoothEventProcessor } from './BluetoothEventProcessor';

/**
 * Serviço Bluetooth para comunicação com ESP32
 */
class BluetoothService {
  private bleManager: BleManager | null = null;
  private connectedDevice: Device | null = null;
  private parser: BluetoothProtocolParser;
  private processor: BluetoothEventProcessor;

  private connectionState: BluetoothConnectionState = {
    status: 'disconnected',
    deviceId: null,
    deviceName: null,
    rssi: null,
    lastConnectedAt: null,
    error: null,
  };

  private eventListeners: Set<BluetoothEventListener> = new Set();
  private connectionListeners: Set<BluetoothConnectionListener> = new Set();

  constructor() {
    this.parser = new BluetoothProtocolParser();
    this.processor = new BluetoothEventProcessor();
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  /**
   * Inicializa o serviço Bluetooth
   * Deve ser chamado no App.tsx ou _layout.tsx
   */
  async initialize(): Promise<void> {
    try {
      console.log('📡 Bluetooth: Inicializando...');

      // Criar BLE Manager
      const { BleManager: BleManagerClass } = require('react-native-ble-plx');
      this.bleManager = new BleManagerClass();

      // Verificar permissões
      await this.requestPermissions();

      // Verificar se Bluetooth está habilitado
      const state = await this.bleManager.state();

      if (state !== 'PoweredOn') {
        console.warn(
          '⚠️ Bluetooth: Bluetooth desabilitado. Aguardando ativação...'
        );

        // Aguardar ativação
        await new Promise<void>((resolve) => {
          const subscription = this.bleManager!.onStateChange((newState: string) => {
            if (newState === 'PoweredOn') {
              subscription.remove();
              resolve();
            }
          }, true);
        });
      }

      this.updateConnectionState({
        status: 'disconnected',
        error: null,
      });

      console.log('✅ Bluetooth: Inicializado com sucesso');
    } catch (error) {
      const bleError = new BluetoothError(
        'UNKNOWN',
        'Failed to initialize Bluetooth',
        error as Error
      );

      this.updateConnectionState({
        status: 'error',
        error: bleError.message,
      });

      throw bleError;
    }
  }

  /**
   * Requisita permissões Bluetooth
   */
  private async requestPermissions(): Promise<void> {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) {
        // Android 12+
        const permissions = [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ];

        const granted = await PermissionsAndroid.requestMultiple(permissions);

        const allGranted = Object.values(granted).every(
          (status) => status === 'granted'
        );

        if (!allGranted) {
          throw new BluetoothError(
            'PERMISSION_DENIED',
            'Bluetooth permissions denied'
          );
        }
      } else {
        // Android 11 e inferior
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );

        if (granted !== 'granted') {
          throw new BluetoothError(
            'PERMISSION_DENIED',
            'Location permission denied (required for Bluetooth on Android < 12)'
          );
        }
      }
    }

    // iOS: Permissões gerenciadas automaticamente pelo Info.plist
  }

  // ==========================================================================
  // Scanning
  // ==========================================================================

  /**
   * Escaneia dispositivos ESP32 próximos
   * Retorna lista de dispositivos encontrados
   */
  async scanForDevices(durationMs: number = 10000): Promise<ESP32DeviceInfo[]> {
    if (!this.bleManager) {
      throw new BluetoothError('UNKNOWN', 'Bluetooth not initialized');
    }

    console.log(`🔍 Bluetooth: Escaneando por ${durationMs}ms...`);

    this.updateConnectionState({ status: 'scanning' });

    const devices = new Map<string, ESP32DeviceInfo>();

    try {
      // Iniciar scan
      this.bleManager.startDeviceScan(
        null, // Todos os serviços
        { allowDuplicates: false },
        (error: Error | null, device: any) => {
          if (error) {
            console.error('❌ Bluetooth: Erro no scan:', error);
            return;
          }

          if (!device || !device.name) {
            return;
          }

          // Filtrar por prefixo do nome
          if (device.name.startsWith(BLUETOOTH_CONFIG.deviceNamePrefix)) {
            devices.set(device.id, {
              id: device.id,
              name: device.name,
              rssi: device.rssi || -100,
              isConnectable: device.isConnectable || false,
            });

            console.log(`📡 Bluetooth: Dispositivo encontrado: ${device.name}`);
          }
        }
      );

      // Aguardar duração do scan
      await new Promise((resolve) => setTimeout(resolve, durationMs));

      // Parar scan
      this.bleManager.stopDeviceScan();

      const foundDevices = Array.from(devices.values());

      console.log(
        `✅ Bluetooth: Scan completo. ${foundDevices.length} dispositivos encontrados`
      );

      this.updateConnectionState({ status: 'disconnected' });

      return foundDevices;
    } catch (error) {
      this.bleManager.stopDeviceScan();

      throw new BluetoothError(
        'UNKNOWN',
        'Scan failed',
        error as Error
      );
    }
  }

  // ==========================================================================
  // Connection
  // ==========================================================================

  /**
   * Conecta ao dispositivo ESP32
   */
  async connect(deviceId: string): Promise<void> {
    if (!this.bleManager) {
      throw new BluetoothError('UNKNOWN', 'Bluetooth not initialized');
    }

    console.log(`🔗 Bluetooth: Conectando ao dispositivo ${deviceId}...`);

    this.updateConnectionState({ status: 'connecting' });

    try {
      // Conectar ao dispositivo
      const device = await this.bleManager.connectToDevice(deviceId, {
        timeout: BLUETOOTH_CONFIG.connectionTimeout,
      });

      this.connectedDevice = device;

      console.log(`✅ Bluetooth: Conectado ao ${device.name}`);

      // Descobrir serviços e características
      await device.discoverAllServicesAndCharacteristics();

      // Ler RSSI
      const rssi = await device.readRSSI();

      this.updateConnectionState({
        status: 'connected',
        deviceId: device.id,
        deviceName: device.name || 'Unknown',
        rssi: rssi,
        lastConnectedAt: Date.now(),
        error: null,
      });

      // Monitorar desconexão
      device.onDisconnected((error: Error | null) => {
        console.warn('⚠️ Bluetooth: Dispositivo desconectado', error);

        this.handleDisconnection(error);
      });

      // Iniciar monitoramento de notificações
      await this.startNotifications();

      console.log('✅ Bluetooth: Conexão estabelecida e notificações ativas');
    } catch (error) {
      const bleError = new BluetoothError(
        'CONNECTION_FAILED',
        `Failed to connect to ${deviceId}`,
        error as Error
      );

      this.updateConnectionState({
        status: 'error',
        error: bleError.message,
      });

      throw bleError;
    }
  }

  /**
   * Desconecta do dispositivo ESP32
   */
  async disconnect(): Promise<void> {
    if (!this.connectedDevice) {
      return;
    }

    console.log('🔌 Bluetooth: Desconectando...');

    try {
      await this.bleManager?.cancelDeviceConnection(this.connectedDevice.id);

      this.connectedDevice = null;

      this.updateConnectionState({
        status: 'disconnected',
        deviceId: null,
        deviceName: null,
        rssi: null,
      });

      console.log('✅ Bluetooth: Desconectado');
    } catch (error) {
      console.error('❌ Bluetooth: Erro ao desconectar', error);
    }
  }

  /**
   * Gerencia desconexão inesperada
   */
  private handleDisconnection(error?: Error | null): void {
    this.connectedDevice = null;

    this.updateConnectionState({
      status: 'disconnected',
      deviceId: null,
      deviceName: null,
      rssi: null,
      error: error ? 'Connection lost' : null,
    });

    // Auto-reconectar se configurado
    if (BLUETOOTH_CONFIG.autoReconnect && this.connectionState.deviceId) {
      console.log('🔄 Bluetooth: Tentando reconectar...');

      setTimeout(() => {
        const lastDeviceId = this.connectionState.deviceId;

        if (lastDeviceId) {
          this.connect(lastDeviceId).catch((err) => {
            console.error('❌ Bluetooth: Falha ao reconectar', err);
          });
        }
      }, BLUETOOTH_CONFIG.retryInterval);
    }
  }

  // ==========================================================================
  // Notifications
  // ==========================================================================

  /**
   * Inicia monitoramento de notificações do ESP32
   */
  private async startNotifications(): Promise<void> {
    if (!this.connectedDevice) {
      throw new BluetoothError('CONNECTION_FAILED', 'No device connected');
    }

    console.log('👂 Bluetooth: Iniciando monitoramento de notificações...');

    try {
      const subscription = this.connectedDevice.monitorCharacteristicForService(
        BLUETOOTH_CONFIG.serviceUUID,
        BLUETOOTH_CONFIG.notifyCharacteristicUUID,
        async (error: Error | null, characteristic: any) => {
          if (error) {
            console.error('❌ Bluetooth: Erro na notificação:', error);
            return;
          }

          if (!characteristic || !characteristic.value) {
            return;
          }

          try {
            // Parse payload
            const payload = this.parser.parseBase64Payload(characteristic.value);

            // Processar evento
            const processedEvent = await this.processor.processEvent(
              payload,
              this.connectionState.rssi || undefined
            );

            // Notificar listeners
            this.notifyEventListeners(payload);

            console.log(
              `📨 Bluetooth: Evento processado: ${processedEvent.code}`
            );
          } catch (parseError) {
            console.error('❌ Bluetooth: Erro ao processar payload:', parseError);
          }
        }
      );

      console.log('✅ Bluetooth: Monitoramento de notificações ativo');

      // Armazenar subscription para cleanup futuro
      // (subscription será automaticamente cancelado ao desconectar)
    } catch (error) {
      throw new BluetoothError(
        'CHARACTERISTIC_NOT_FOUND',
        'Failed to start notifications',
        error as Error
      );
    }
  }

  // ==========================================================================
  // Listeners
  // ==========================================================================

  /**
   * Adiciona listener de eventos
   */
  addEventListener(listener: BluetoothEventListener): () => void {
    this.eventListeners.add(listener);

    // Retorna função de cleanup
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  /**
   * Adiciona listener de conexão
   */
  addConnectionListener(listener: BluetoothConnectionListener): () => void {
    this.connectionListeners.add(listener);

    // Enviar estado atual imediatamente
    listener(this.connectionState);

    // Retorna função de cleanup
    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  /**
   * Notifica listeners de eventos
   */
  private notifyEventListeners(payload: ESP32BluetoothPayload): void {
    this.eventListeners.forEach((listener) => {
      try {
        listener({
          code: payload.code,
          receivedAt: Date.now(),
          esp32Timestamp: payload.timestamp,
          deviceId: payload.deviceId,
          metadata: {
            batteryVoltage: payload.batteryVoltage,
            rssi: this.connectionState.rssi || undefined,
          },
        });
      } catch (error) {
        console.error('❌ Bluetooth: Erro no listener de evento:', error);
      }
    });
  }

  /**
   * Notifica listeners de conexão
   */
  private notifyConnectionListeners(): void {
    this.connectionListeners.forEach((listener) => {
      try {
        listener(this.connectionState);
      } catch (error) {
        console.error('❌ Bluetooth: Erro no listener de conexão:', error);
      }
    });
  }

  /**
   * Atualiza estado da conexão
   */
  private updateConnectionState(
    partial: Partial<BluetoothConnectionState>
  ): void {
    this.connectionState = {
      ...this.connectionState,
      ...partial,
    };

    this.notifyConnectionListeners();
  }

  // ==========================================================================
  // Getters
  // ==========================================================================

  /**
   * Retorna estado atual da conexão
   */
  getConnectionState(): BluetoothConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.connectionState.status === 'connected';
  }

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  /**
   * Destroi o serviço e libera recursos
   */
  async destroy(): Promise<void> {
    console.log('🧹 Bluetooth: Limpando recursos...');

    await this.disconnect();

    this.bleManager?.destroy();
    this.bleManager = null;

    this.eventListeners.clear();
    this.connectionListeners.clear();

    console.log('✅ Bluetooth: Recursos liberados');
  }
}

// Singleton
export const bluetoothService = new BluetoothService();
