/**
 * TruckGuard Bluetooth Protocol Parser
 * Responsável por decodificar payloads recebidos do ESP32
 * 
 * SOLID: Single Responsibility Principle
 * Esta classe tem apenas uma responsabilidade: parsear protocolos Bluetooth
 */

import { Buffer } from 'buffer';

import {
  BluetoothError,
  type ESP32BluetoothPayload,
  type ESP32EventCode,
} from '../../types/bluetooth.types';

/**
 * Parser de protocolo Bluetooth ESP32
 * 
 * Formato esperado do payload (JSON):
 * {
 *   "code": "TANK_RIGHT",
 *   "timestamp": 1234567890,
 *   "battery": 3.7,
 *   "deviceId": "TG001"
 * }
 * 
 * OU formato alternativo (string simples):
 * "TANK_RIGHT"
 */
export class BluetoothProtocolParser {
  /**
   * Decodifica buffer base64 recebido via BLE
   */
  decodeBase64(base64Data: string): string {
    try {
      // React Native tem Buffer global (via polyfill)
      return Buffer.from(base64Data, 'base64').toString('utf-8');
    } catch (error) {
      throw new BluetoothError(
        'INVALID_PAYLOAD',
        'Failed to decode base64 data',
        error as Error
      );
    }
  }

  /**
   * Valida se o código do evento é válido
   */
  private isValidEventCode(code: string): code is ESP32EventCode {
    const validCodes: ESP32EventCode[] = [
      'TANK_RIGHT',
      'TANK_LEFT',
      'PALLET_RIGHT',
      'PALLET_LEFT',
      'FULL_ATTACK',
    ];

    return validCodes.includes(code as ESP32EventCode);
  }

  /**
   * Parse payload JSON do ESP32
   */
  parseJSON(jsonString: string): ESP32BluetoothPayload {
    try {
      const data = JSON.parse(jsonString);

      if (!data.code || !this.isValidEventCode(data.code)) {
        throw new Error(`Invalid event code: ${data.code}`);
      }

      return {
        code: data.code,
        timestamp: data.timestamp || Date.now(),
        batteryVoltage: data.battery,
        deviceId: data.deviceId || 'unknown',
      };
    } catch (error) {
      throw new BluetoothError(
        'INVALID_PAYLOAD',
        `Failed to parse JSON: ${(error as Error).message}`,
        error as Error
      );
    }
  }

  /**
   * Parse payload simples (apenas código do evento)
   */
  parseSimple(eventCode: string): ESP32BluetoothPayload {
    const trimmedCode = eventCode.trim().toUpperCase();

    if (!this.isValidEventCode(trimmedCode)) {
      throw new BluetoothError(
        'INVALID_PAYLOAD',
        `Invalid event code: ${trimmedCode}`
      );
    }

    return {
      code: trimmedCode,
      timestamp: Date.now(),
      deviceId: 'unknown',
    };
  }

  /**
   * Parse payload (tenta JSON primeiro, fallback para simples)
   */
  parse(rawData: string): ESP32BluetoothPayload {
    const cleaned = rawData.trim();

    // Tentar JSON primeiro
    if (cleaned.startsWith('{')) {
      try {
        return this.parseJSON(cleaned);
      } catch {
        // Se falhar, tentar parse simples
      }
    }

    // Fallback: parse simples
    return this.parseSimple(cleaned);
  }

  /**
   * Parse completo: base64 -> string -> payload
   */
  parseBase64Payload(base64Data: string): ESP32BluetoothPayload {
    const decodedString = this.decodeBase64(base64Data);
    return this.parse(decodedString);
  }
}
