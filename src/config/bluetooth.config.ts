/**
 * TruckGuard Bluetooth Configuration
 * Configurações para comunicação ESP32 <-> App
 * 
 * IMPORTANTE: Os UUIDs abaixo devem corresponder EXATAMENTE
 * aos configurados no firmware do ESP32
 */

import type { BluetoothServiceConfig } from '../types/bluetooth.types';

/**
 * Configuração padrão do serviço Bluetooth
 * 
 * Para gerar novos UUIDs (se necessário):
 * https://www.uuidgenerator.net/
 * 
 * Ou usando Python:
 * import uuid
 * print(str(uuid.uuid4()))
 */
export const BLUETOOTH_CONFIG: BluetoothServiceConfig = {
  /**
   * UUID do serviço principal do ESP32
   * Deve corresponder ao SERVICE_UUID no firmware ESP32
   */
  serviceUUID: '4fafc201-1fb5-459e-8fcc-c5c9c331914b',

  /**
   * UUID da característica de notificação (ESP32 -> App)
   * ESP32 envia eventos através desta característica
   */
  notifyCharacteristicUUID: 'beb5483e-36e1-4688-b7f5-ea07361b26a8',

  /**
   * UUID da característica de escrita (App -> ESP32)
   * App pode enviar comandos ao ESP32 (ex: reset, status)
   */
  writeCharacteristicUUID: '1c95d5e3-d8f7-413a-bf3d-7a2e6d3b3c0a',

  /**
   * Prefixo do nome do dispositivo ESP32
   * Usado para filtrar dispositivos durante scan
   * Exemplo: "TruckGuard_001", "TruckGuard_ABC"
   */
  deviceNamePrefix: 'TruckGuard',

  /**
   * Timeout de conexão (15 segundos)
   */
  connectionTimeout: 15000,

  /**
   * Intervalo de retry se conexão falhar (5 segundos)
   */
  retryInterval: 5000,

  /**
   * Auto-reconectar se dispositivo desconectar
   */
  autoReconnect: true,
};

/**
 * Mapeamento de códigos ESP32 para tipos de alerta
 */
export const ESP32_EVENT_TO_ALERT_TYPE = {
  TANK_RIGHT: 'fuel',
  TANK_LEFT: 'fuel',
  PALLET_RIGHT: 'pallet',
  PALLET_LEFT: 'pallet',
  FULL_ATTACK: 'full_attack',
} as const;

/**
 * Mapeamento de códigos ESP32 para nomes de sensores
 */
export const ESP32_EVENT_TO_SENSOR_NAME = {
  TANK_RIGHT: 'tankRight',
  TANK_LEFT: 'tankLeft',
  PALLET_RIGHT: 'palletRight',
  PALLET_LEFT: 'palletLeft',
  FULL_ATTACK: 'all',
} as const;

/**
 * Timeout para considerar evento duplicado (ms)
 * Se o mesmo evento chegar em menos de 2s, é ignorado
 */
export const DUPLICATE_EVENT_TIMEOUT = 2000;

/**
 * Nível mínimo de RSSI (signal strength) para conectar
 * Valor típico: -80 dBm (mais próximo = melhor sinal)
 */
export const MIN_RSSI_THRESHOLD = -80;
