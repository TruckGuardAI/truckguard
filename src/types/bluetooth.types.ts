/**
 * TruckGuard Bluetooth Types
 * Comunicação ESP32 <-> App
 */

// ============================================================================
// ESP32 Event Types (Raw protocol)
// ============================================================================

/**
 * Eventos que o ESP32 pode enviar
 * Formato do protocolo: string ASCII
 */
export type ESP32EventCode =
  | 'TANK_RIGHT'
  | 'TANK_LEFT'
  | 'PALLET_RIGHT'
  | 'PALLET_LEFT'
  | 'FULL_ATTACK';

/**
 * Payload recebido do ESP32 via Bluetooth
 */
export interface ESP32BluetoothPayload {
  /** Código do evento (raw) */
  code: ESP32EventCode;
  
  /** Timestamp do ESP32 (Unix milliseconds) */
  timestamp: number;
  
  /** Voltagem da bateria do ESP32 (opcional) */
  batteryVoltage?: number;
  
  /** ID único do dispositivo ESP32 */
  deviceId: string;
}

// ============================================================================
// Bluetooth Connection Types
// ============================================================================

/**
 * Status da conexão Bluetooth
 */
export type BluetoothConnectionStatus =
  | 'disconnected'
  | 'scanning'
  | 'connecting'
  | 'connected'
  | 'error';

/**
 * Estado da conexão Bluetooth
 */
export interface BluetoothConnectionState {
  status: BluetoothConnectionStatus;
  deviceId: string | null;
  deviceName: string | null;
  rssi: number | null; // Signal strength
  lastConnectedAt: number | null;
  error: string | null;
}

/**
 * Informações do dispositivo ESP32 descoberto
 */
export interface ESP32DeviceInfo {
  id: string;
  name: string;
  rssi: number; // Signal strength
  isConnectable: boolean;
}

// ============================================================================
// Service Configuration
// ============================================================================

/**
 * Configuração do serviço Bluetooth
 * UUIDs devem corresponder aos configurados no ESP32
 */
export interface BluetoothServiceConfig {
  /** UUID do serviço principal do ESP32 */
  serviceUUID: string;
  
  /** UUID da característica de notificação (ESP32 -> App) */
  notifyCharacteristicUUID: string;
  
  /** UUID da característica de escrita (App -> ESP32) */
  writeCharacteristicUUID: string;
  
  /** Prefixo do nome do dispositivo ESP32 para filtrar scan */
  deviceNamePrefix: string;
  
  /** Timeout de conexão (ms) */
  connectionTimeout: number;
  
  /** Intervalo de retry de conexão (ms) */
  retryInterval: number;
  
  /** Auto-reconectar se desconectar */
  autoReconnect: boolean;
}

// ============================================================================
// Event Processing Types
// ============================================================================

/**
 * Evento processado internamente após parsing
 */
export interface ProcessedBluetoothEvent {
  /** Código do evento */
  code: ESP32EventCode;
  
  /** Timestamp de recebimento no app */
  receivedAt: number;
  
  /** Timestamp do ESP32 */
  esp32Timestamp: number;
  
  /** ID do dispositivo */
  deviceId: string;
  
  /** Dados adicionais */
  metadata: {
    batteryVoltage?: number;
    rssi?: number;
  };
}

// ============================================================================
// Listeners & Callbacks
// ============================================================================

/**
 * Callback quando evento é recebido do ESP32
 */
export type BluetoothEventListener = (
  event: ProcessedBluetoothEvent
) => void | Promise<void>;

/**
 * Callback quando status da conexão muda
 */
export type BluetoothConnectionListener = (
  state: BluetoothConnectionState
) => void;

// ============================================================================
// Error Types
// ============================================================================

export type BluetoothErrorType =
  | 'PERMISSION_DENIED'
  | 'BLUETOOTH_DISABLED'
  | 'DEVICE_NOT_FOUND'
  | 'CONNECTION_FAILED'
  | 'CONNECTION_LOST'
  | 'INVALID_PAYLOAD'
  | 'SERVICE_NOT_FOUND'
  | 'CHARACTERISTIC_NOT_FOUND'
  | 'TIMEOUT'
  | 'UNKNOWN';

export class BluetoothError extends Error {
  constructor(
    public type: BluetoothErrorType,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'BluetoothError';
  }
}
