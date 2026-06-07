/**
 * TruckGuard - Bluetooth Mock Test
 * Script de teste para simular eventos ESP32 sem hardware
 * 
 * USO:
 * 1. Comentar import de 'react-native-ble-plx' no BluetoothService.ts
 * 2. Executar este mock para testar o fluxo completo
 * 3. Descomentar quando tiver hardware real
 * 
 * Este arquivo é apenas para desenvolvimento/testes
 * NÃO usar em produção
 */

import { Buffer } from 'buffer';

import { BluetoothProtocolParser } from '../services/bluetooth/BluetoothProtocolParser';
import { BluetoothEventProcessor } from '../services/bluetooth/BluetoothEventProcessor';
import type { ESP32BluetoothPayload, ESP32EventCode } from '../types/bluetooth.types';

/**
 * Mock de payloads ESP32 para teste
 */
const MOCK_PAYLOADS = {
  tankRightJSON: {
    code: 'TANK_RIGHT' as ESP32EventCode,
    timestamp: Date.now(),
    battery: 3.7,
    deviceId: 'TG_TEST_001',
  },

  tankLeftJSON: {
    code: 'TANK_LEFT' as ESP32EventCode,
    timestamp: Date.now(),
    battery: 3.6,
    deviceId: 'TG_TEST_001',
  },

  palletRightJSON: {
    code: 'PALLET_RIGHT' as ESP32EventCode,
    timestamp: Date.now(),
    battery: 3.8,
    deviceId: 'TG_TEST_001',
  },

  palletLeftJSON: {
    code: 'PALLET_LEFT' as ESP32EventCode,
    timestamp: Date.now(),
    battery: 3.5,
    deviceId: 'TG_TEST_001',
  },

  fullAttackJSON: {
    code: 'FULL_ATTACK' as ESP32EventCode,
    timestamp: Date.now(),
    battery: 3.9,
    deviceId: 'TG_TEST_001',
  },

  // Payloads simples (apenas código)
  tankRightSimple: 'TANK_RIGHT',
  tankLeftSimple: 'TANK_LEFT',
  palletRightSimple: 'PALLET_RIGHT',
  palletLeftSimple: 'PALLET_LEFT',
  fullAttackSimple: 'FULL_ATTACK',
};

/**
 * Converte objeto para base64 (simula ESP32)
 */
function toBase64(data: object | string): string {
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
  return Buffer.from(jsonString, 'utf-8').toString('base64');
}

/**
 * Testa o parser de protocolo
 */
export async function testProtocolParser() {
  console.log('\n========================================');
  console.log('🧪 Testando BluetoothProtocolParser');
  console.log('========================================\n');

  const parser = new BluetoothProtocolParser();

  // Teste 1: Parse JSON
  try {
    console.log('✅ Teste 1: Parse JSON completo');
    const base64JSON = toBase64(MOCK_PAYLOADS.tankRightJSON);
    const parsed = parser.parseBase64Payload(base64JSON);
    console.log('   Resultado:', JSON.stringify(parsed, null, 2));
  } catch (error) {
    console.error('❌ Teste 1 falhou:', error);
  }

  // Teste 2: Parse simples
  try {
    console.log('\n✅ Teste 2: Parse string simples');
    const base64Simple = toBase64(MOCK_PAYLOADS.tankLeftSimple);
    const parsed = parser.parseBase64Payload(base64Simple);
    console.log('   Resultado:', JSON.stringify(parsed, null, 2));
  } catch (error) {
    console.error('❌ Teste 2 falhou:', error);
  }

  // Teste 3: Parse inválido (deve lançar erro)
  try {
    console.log('\n⚠️  Teste 3: Parse código inválido (deve falhar)');
    const base64Invalid = toBase64('INVALID_CODE');
    parser.parseBase64Payload(base64Invalid);
    console.error('❌ Teste 3 deveria ter falhado!');
  } catch (error) {
    console.log('✅ Teste 3: Erro esperado capturado:', (error as Error).message);
  }
}

/**
 * Testa o processador de eventos
 */
export async function testEventProcessor() {
  console.log('\n========================================');
  console.log('🧪 Testando BluetoothEventProcessor');
  console.log('========================================\n');

  const processor = new BluetoothEventProcessor();

  // Teste 1: Processar evento TANK_RIGHT
  try {
    console.log('✅ Teste 1: Processar TANK_RIGHT');

    const payload: ESP32BluetoothPayload = {
      code: 'TANK_RIGHT',
      timestamp: Date.now(),
      deviceId: 'TG_TEST_001',
      batteryVoltage: 3.7,
    };

    const processedEvent = await processor.processEvent(payload, -65);

    console.log('   Evento processado:', JSON.stringify(processedEvent, null, 2));
    console.log('   ✅ Verifique se:');
    console.log('      - Histórico foi atualizado');
    console.log('      - Notificação foi enviada');
    console.log('      - Alerta foi criado na comunidade');
  } catch (error) {
    console.error('❌ Teste 1 falhou:', error);
  }

  // Teste 2: Processar evento FULL_ATTACK
  try {
    console.log('\n✅ Teste 2: Processar FULL_ATTACK');

    const payload: ESP32BluetoothPayload = {
      code: 'FULL_ATTACK',
      timestamp: Date.now(),
      deviceId: 'TG_TEST_001',
      batteryVoltage: 3.9,
    };

    await processor.processEvent(payload, -70);

    console.log('   ✅ Evento processado com sucesso');
  } catch (error) {
    console.error('❌ Teste 2 falhou:', error);
  }

  // Teste 3: Deduplicação (mesmo evento em < 2s)
  try {
    console.log('\n✅ Teste 3: Deduplicação de eventos');

    const payload: ESP32BluetoothPayload = {
      code: 'TANK_LEFT',
      timestamp: Date.now(),
      deviceId: 'TG_TEST_001',
      batteryVoltage: 3.6,
    };

    // Primeiro evento
    await processor.processEvent(payload);
    console.log('   Evento 1 processado');

    // Segundo evento (duplicado)
    await processor.processEvent(payload);
    console.log('   Evento 2 (duplicado) deve ter sido ignorado');

    // Aguardar 2.5s
    console.log('   Aguardando 2.5s...');
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // Terceiro evento (não é mais duplicado)
    await processor.processEvent(payload);
    console.log('   Evento 3 processado (não é mais duplicado)');
  } catch (error) {
    console.error('❌ Teste 3 falhou:', error);
  }
}

/**
 * Simula recebimento de eventos em sequência
 */
export async function simulateEventSequence() {
  console.log('\n========================================');
  console.log('🚨 Simulando Sequência de Eventos ESP32');
  console.log('========================================\n');

  const parser = new BluetoothProtocolParser();
  const processor = new BluetoothEventProcessor();

  const events: ESP32BluetoothPayload[] = [
    MOCK_PAYLOADS.tankRightJSON,
    MOCK_PAYLOADS.palletLeftJSON,
    MOCK_PAYLOADS.tankLeftJSON,
    MOCK_PAYLOADS.fullAttackJSON,
  ];

  for (let i = 0; i < events.length; i++) {
    const event = events[i];

    console.log(`\n📡 Evento ${i + 1}/${events.length}: ${event.code}`);

    try {
      // Simular payload base64 do ESP32
      const base64 = toBase64(event);

      // Parse
      const parsed = parser.parseBase64Payload(base64);

      // Processar
      await processor.processEvent(parsed, -60);

      console.log('✅ Processado com sucesso');

      // Aguardar 3s entre eventos
      if (i < events.length - 1) {
        console.log('⏳ Aguardando 3s...');
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.error('❌ Erro ao processar:', error);
    }
  }

  console.log('\n✅ Sequência completa processada!');
}

/**
 * Executa todos os testes
 */
export async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  TruckGuard - Bluetooth Mock Tests        ║');
  console.log('╚════════════════════════════════════════════╝');

  await testProtocolParser();
  await testEventProcessor();
  await simulateEventSequence();

  console.log('\n');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  ✅ Todos os testes concluídos!            ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('\n');
}

/**
 * Para usar em componente React:
 * 
 * import { runAllTests } from '@/src/tests/bluetooth.mock.test';
 * 
 * <Button onPress={runAllTests} title="Testar Bluetooth" />
 */
