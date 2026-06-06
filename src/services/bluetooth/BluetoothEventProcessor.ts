/**
 * TruckGuard Bluetooth Event Processor
 * Responsável por processar eventos recebidos e integrá-los ao sistema
 * 
 * SOLID: Single Responsibility Principle
 * Esta classe tem apenas uma responsabilidade: processar eventos Bluetooth
 * e integrá-los ao sistema existente
 */

import type {
  ESP32BluetoothPayload,
  ProcessedBluetoothEvent,
} from '../../types/bluetooth.types';

import {
  ESP32_EVENT_TO_SENSOR_NAME,
  DUPLICATE_EVENT_TIMEOUT,
} from '../../config/bluetooth.config';

import type { SensorType } from '../security.service';
import { securityService } from '../security.service';

/**
 * Processador de eventos Bluetooth
 */
export class BluetoothEventProcessor {
  private lastEventTimestamps: Map<string, number> = new Map();

  /**
   * Verifica se o evento é duplicado (recebido recentemente)
   */
  private isDuplicateEvent(eventCode: string): boolean {
    const lastTimestamp = this.lastEventTimestamps.get(eventCode);

    if (!lastTimestamp) {
      return false;
    }

    const elapsed = Date.now() - lastTimestamp;
    return elapsed < DUPLICATE_EVENT_TIMEOUT;
  }

  /**
   * Registra timestamp do evento
   */
  private recordEventTimestamp(eventCode: string): void {
    this.lastEventTimestamps.set(eventCode, Date.now());
  }

  /**
   * Converte payload ESP32 em evento processado
   */
  private createProcessedEvent(
    payload: ESP32BluetoothPayload,
    rssi?: number
  ): ProcessedBluetoothEvent {
    return {
      code: payload.code,
      receivedAt: Date.now(),
      esp32Timestamp: payload.timestamp,
      deviceId: payload.deviceId,
      metadata: {
        batteryVoltage: payload.batteryVoltage,
        rssi,
      },
    };
  }

  /**
   * Converte código ESP32 para SensorType do securityService
   */
  private mapToSensorType(eventCode: string): SensorType {
    return (
      ESP32_EVENT_TO_SENSOR_NAME[
        eventCode as keyof typeof ESP32_EVENT_TO_SENSOR_NAME
      ] || 'all'
    );
  }

  /**
   * Processa evento recebido do ESP32
   * 
   * Fluxo:
   * 1. Verifica duplicação
   * 2. Cria evento processado
   * 3. Chama securityService.simulateEvent
   * 4. Retorna evento processado
   */
  async processEvent(
    payload: ESP32BluetoothPayload,
    rssi?: number
  ): Promise<ProcessedBluetoothEvent> {
    const eventKey = `${payload.deviceId}_${payload.code}`;

    // 1. Verificar duplicação
    if (this.isDuplicateEvent(eventKey)) {
      console.log(
        `⚠️ Bluetooth: Evento duplicado ignorado: ${payload.code}`
      );

      // Retornar evento mas não processar
      return this.createProcessedEvent(payload, rssi);
    }

    // 2. Registrar timestamp
    this.recordEventTimestamp(eventKey);

    // 3. Criar evento processado
    const processedEvent = this.createProcessedEvent(payload, rssi);

    console.log(
      `📡 Bluetooth: Evento recebido do ESP32:`,
      JSON.stringify(processedEvent, null, 2)
    );

    // 4. Converter para SensorType
    const sensorType = this.mapToSensorType(payload.code);

    // 5. Executar fluxo de segurança (histórico, notificação, comunidade)
    try {
      await securityService.simulateEvent(sensorType);

      console.log(
        `✅ Bluetooth: Evento processado com sucesso: ${payload.code}`
      );
    } catch (error) {
      console.error(
        `❌ Bluetooth: Erro ao processar evento: ${payload.code}`,
        error
      );
    }

    return processedEvent;
  }

  /**
   * Limpa histórico de eventos (para testes ou reset)
   */
  clearEventHistory(): void {
    this.lastEventTimestamps.clear();
    console.log('🧹 Bluetooth: Histórico de eventos limpo');
  }
}
