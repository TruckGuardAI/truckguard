/**
 * TruckGuard Bluetooth Service - Index
 * Export principal para o serviço Bluetooth
 */

export { bluetoothService } from './BluetoothService';
export { BluetoothProtocolParser } from './BluetoothProtocolParser';
export { BluetoothEventProcessor } from './BluetoothEventProcessor';

// Re-export types
export type {
  ESP32EventCode,
  ESP32BluetoothPayload,
  BluetoothConnectionStatus,
  BluetoothConnectionState,
  ESP32DeviceInfo,
  ProcessedBluetoothEvent,
  BluetoothEventListener,
  BluetoothConnectionListener,
  BluetoothServiceConfig,
} from '../../types/bluetooth.types';

export { BluetoothError } from '../../types/bluetooth.types';

// Re-export config
export {
  BLUETOOTH_CONFIG,
  ESP32_EVENT_TO_ALERT_TYPE,
  ESP32_EVENT_TO_SENSOR_NAME,
} from '../../config/bluetooth.config';
