# 📡 TruckGuard - Arquitetura Bluetooth ESP32

Implementação completa e real de comunicação Bluetooth entre ESP32 e aplicação React Native Expo.

## 🎯 Objetivo

Permitir que o ESP32 envie eventos de segurança via Bluetooth para o aplicativo, que automaticamente:
- ✅ Processa o evento através do `securityService.simulateEvent`
- ✅ Salva no histórico
- ✅ Envia para a comunidade (cria alerta em tempo real)
- ✅ Ativa notificação push local

## 📦 Estrutura de Arquivos

```
frontend/
├── src/
│   ├── types/
│   │   └── bluetooth.types.ts          # Tipos TypeScript para Bluetooth
│   ├── config/
│   │   └── bluetooth.config.ts         # Configuração (UUIDs, timeouts, etc)
│   ├── services/
│   │   └── bluetooth/
│   │       ├── index.ts                # Export principal
│   │       ├── BluetoothService.ts     # Serviço principal (conexão, scan, etc)
│   │       ├── BluetoothProtocolParser.ts   # Parser de payloads ESP32
│   │       └── BluetoothEventProcessor.ts   # Processador de eventos
│   └── hooks/
│       └── useBluetoothConnection.ts   # React hook para integração fácil
└── BLUETOOTH_SETUP_GUIDE.md            # Guia completo de instalação
```

## 🏗️ Arquitetura (SOLID)

### Single Responsibility Principle
- **BluetoothService**: Gerencia conexões BLE (scan, connect, disconnect)
- **BluetoothProtocolParser**: Parse e validação de payloads
- **BluetoothEventProcessor**: Processamento e integração com sistema

### Open/Closed Principle
- Extensível via listeners (addEventListener, addConnectionListener)
- Novos tipos de eventos podem ser adicionados sem modificar código existente

### Dependency Inversion
- BluetoothService depende de abstrações (parser, processor)
- Componentes React dependem de hooks, não de implementações diretas

## 📡 Protocolo de Comunicação

### Eventos Suportados
```typescript
'TANK_RIGHT'    // Sensor tanque direito
'TANK_LEFT'     // Sensor tanque esquerdo
'PALLET_RIGHT'  // Sensor palete direito
'PALLET_LEFT'   // Sensor palete esquerdo
'FULL_ATTACK'   // Ataque completo (todos sensores)
```

### Formato do Payload

#### Opção 1: JSON (Recomendado)
```json
{
  "code": "TANK_RIGHT",
  "timestamp": 1234567890,
  "battery": 3.7,
  "deviceId": "TG001"
}
```

#### Opção 2: String Simples
```
TANK_RIGHT
```

### UUIDs (devem corresponder no ESP32)
```typescript
serviceUUID: '4fafc201-1fb5-459e-8fcc-c5c9c331914b'
notifyCharacteristicUUID: 'beb5483e-36e1-4688-b7f5-ea07361b26a8'
writeCharacteristicUUID: '1c95d5e3-d8f7-413a-bf3d-7a2e6d3b3c0a'
```

## 🔄 Fluxo de Dados

```
ESP32 Sensor Ativado
    │
    ↓
ESP32 envia via BLE notify characteristic
    │
    ↓
BluetoothService recebe notificação
    │
    ↓
BluetoothProtocolParser faz parse do payload
    │
    ↓
BluetoothEventProcessor processa evento
    │
    ├──→ securityService.simulateEvent(sensor)
    │    ├──→ historyService.add(...)
    │    ├──→ notificationsService.send(...)
    │    └──→ alertsApiService.createAlert(...)
    │
    └──→ Notifica listeners (UI)
```

## 🚀 Como Usar

### 1. Instalar Dependência
```bash
npm install react-native-ble-plx
```

### 2. Configurar app.json
Ver `BLUETOOTH_SETUP_GUIDE.md` seção "PASSO 2"

### 3. Rebuild (Development Build necessário)
```bash
npx expo prebuild --clean
npx expo run:android
```

### 4. Inicializar no App Root
```typescript
// app/_layout.tsx
import { bluetoothService } from '@/src/services/bluetooth';

useEffect(() => {
  bluetoothService.initialize();
  return () => bluetoothService.destroy();
}, []);
```

### 5. Usar em Componente (com hook)
```typescript
import { useBluetoothConnection } from '@/src/hooks/useBluetoothConnection';

function BluetoothSetup() {
  const { scan, connect, disconnect, connectionState, lastEvent } = 
    useBluetoothConnection();

  const handleScan = async () => {
    const devices = await scan(10000);
    console.log('Dispositivos:', devices);
  };

  return (
    <View>
      <Text>Status: {connectionState.status}</Text>
      {lastEvent && (
        <Text>Último evento: {lastEvent.code}</Text>
      )}
      <Button onPress={handleScan} title="Escanear" />
    </View>
  );
}
```

## 🔧 Configuração ESP32 (Firmware)

### Arduino/PlatformIO
```cpp
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// UUIDs (devem corresponder ao app)
#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define DEVICE_NAME "TruckGuard_001"

BLECharacteristic *pCharacteristic;

void setup() {
  // Inicializar BLE
  BLEDevice::init(DEVICE_NAME);
  BLEServer *pServer = BLEDevice::createServer();
  BLEService *pService = pServer->createService(SERVICE_UUID);
  
  pCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ |
    BLECharacteristic::PROPERTY_NOTIFY
  );
  
  pCharacteristic->addDescriptor(new BLE2902());
  pService->start();
  
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->start();
}

void sendEvent(const char* eventCode) {
  // Formato JSON
  String payload = "{\"code\":\"" + String(eventCode) + 
                   "\",\"timestamp\":" + String(millis()) + 
                   ",\"deviceId\":\"TG001\"}";
  
  pCharacteristic->setValue(payload.c_str());
  pCharacteristic->notify();
}

void loop() {
  // Exemplo: ler sensor e enviar evento
  if (digitalRead(TANK_RIGHT_SENSOR) == HIGH) {
    sendEvent("TANK_RIGHT");
    delay(2000); // Debounce
  }
}
```

## ✅ Features Implementadas

- ✅ Scan de dispositivos BLE
- ✅ Conexão/desconexão
- ✅ Monitoramento de notificações
- ✅ Parse de payload (JSON + string simples)
- ✅ Deduplicação de eventos (2s timeout)
- ✅ Integração automática com securityService
- ✅ Auto-reconnect em caso de desconexão
- ✅ Listeners para eventos e conexão
- ✅ Error handling robusto
- ✅ TypeScript completo
- ✅ React hook para integração fácil
- ✅ Permissões Android/iOS
- ✅ RSSI (signal strength) tracking
- ✅ Battery voltage monitoring (opcional)

## 🧪 Testes

### Teste Manual
1. Ligar ESP32 com firmware configurado
2. Abrir app e ir para tela de Bluetooth
3. Clicar em "Escanear"
4. Verificar se "TruckGuard_XXX" aparece na lista
5. Clicar em "Conectar"
6. Acionar sensor no ESP32
7. Verificar:
   - Console mostra evento recebido
   - Histórico mostra novo registro
   - Notificação local aparece
   - Alerta é criado na comunidade

## 📚 Referências

- [react-native-ble-plx](https://github.com/dotintent/react-native-ble-plx)
- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [ESP32 BLE Arduino](https://github.com/espressif/arduino-esp32/tree/master/libraries/BLE)

## 🔒 Segurança

- ✅ Validação de payloads
- ✅ Timeout de conexão
- ✅ Deduplicação de eventos
- ⚠️ **TODO**: Implementar pareamento BLE (bonding)
- ⚠️ **TODO**: Implementar criptografia AES nos payloads

## 📝 Notas

- **NÃO funciona no Expo Go**: Requer Development Build
- **Android 12+**: Requer permissões BLUETOOTH_SCAN e BLUETOOTH_CONNECT
- **Android < 12**: Requer permissão ACCESS_FINE_LOCATION
- **iOS**: Permissões configuradas automaticamente via Info.plist

---

**Implementação por**: Cursor AI Agent  
**Data**: 2026-06-02  
**Status**: ✅ Pronto para hardware real
