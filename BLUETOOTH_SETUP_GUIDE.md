/**
 * TruckGuard Bluetooth Integration Guide
 * Guia de instalação e configuração do Bluetooth ESP32
 * 
 * IMPORTANTE: Este arquivo deve ser EXCLUÍDO antes de fazer commit
 * Serve apenas como documentação durante o desenvolvimento
 */

## 📦 PASSO 1: Instalar Dependências

```bash
# No diretório frontend/
npm install react-native-ble-plx
```

## 🔧 PASSO 2: Atualizar app.json

Adicione as permissões necessárias ao `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-ble-plx",
        {
          "isBackgroundEnabled": false,
          "modes": ["peripheral"],
          "bluetoothAlwaysUsageDescription": "TruckGuard precisa de Bluetooth para conectar ao ESP32 de segurança.",
          "bluetoothPeripheralUsageDescription": "TruckGuard precisa de Bluetooth para receber alertas do ESP32."
        }
      ]
    ],
    "android": {
      "permissions": [
        "android.permission.BLUETOOTH",
        "android.permission.BLUETOOTH_ADMIN",
        "android.permission.BLUETOOTH_CONNECT",
        "android.permission.BLUETOOTH_SCAN",
        "android.permission.ACCESS_FINE_LOCATION"
      ]
    },
    "ios": {
      "infoPlist": {
        "NSBluetoothAlwaysUsageDescription": "TruckGuard precisa de Bluetooth para conectar ao ESP32.",
        "NSBluetoothPeripheralUsageDescription": "TruckGuard precisa de Bluetooth para receber alertas do ESP32."
      }
    }
  }
}
```

## 🏗️ PASSO 3: Rebuild com Development Build

```bash
# Limpar e rebuild Android
npx expo prebuild --clean
npx expo run:android

# OU para iOS
npx expo run:ios
```

**IMPORTANTE**: Não funciona no Expo Go! Requer Development Build.

## 🔌 PASSO 4: Integrar no App

### 4.1 Inicializar Bluetooth no App Root

```typescript
// app/_layout.tsx ou App.tsx
import { useEffect } from 'react';
import { bluetoothService } from '@/src/services/bluetooth';

export default function RootLayout() {
  useEffect(() => {
    // Inicializar Bluetooth
    bluetoothService.initialize().catch((error) => {
      console.error('Erro ao inicializar Bluetooth:', error);
    });

    // Cleanup ao desmontar
    return () => {
      bluetoothService.destroy();
    };
  }, []);

  return (
    // ... resto do layout
  );
}
```

### 4.2 Criar Tela de Conexão Bluetooth

```typescript
// app/bluetooth-setup.tsx
import { useState, useEffect } from 'react';
import { View, Text, Button, FlatList } from 'react-native';
import { bluetoothService, type ESP32DeviceInfo } from '@/src/services/bluetooth';

export default function BluetoothSetupScreen() {
  const [devices, setDevices] = useState<ESP32DeviceInfo[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    // Listener de conexão
    const unsubscribe = bluetoothService.addConnectionListener((state) => {
      setConnectionStatus(state.status);
    });

    return unsubscribe;
  }, []);

  const handleScan = async () => {
    try {
      setScanning(true);
      const found = await bluetoothService.scanForDevices(10000);
      setDevices(found);
    } catch (error) {
      console.error('Erro no scan:', error);
    } finally {
      setScanning(false);
    }
  };

  const handleConnect = async (deviceId: string) => {
    try {
      await bluetoothService.connect(deviceId);
      alert('Conectado com sucesso!');
    } catch (error) {
      alert('Erro ao conectar: ' + error.message);
    }
  };

  const handleDisconnect = async () => {
    await bluetoothService.disconnect();
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>
        Bluetooth ESP32
      </Text>

      <Text>Status: {connectionStatus}</Text>

      <Button
        title={scanning ? 'Escaneando...' : 'Escanear Dispositivos'}
        onPress={handleScan}
        disabled={scanning || connectionStatus === 'connected'}
      />

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ padding: 10, borderBottomWidth: 1 }}>
            <Text>{item.name}</Text>
            <Text>RSSI: {item.rssi} dBm</Text>
            <Button
              title="Conectar"
              onPress={() => handleConnect(item.id)}
            />
          </View>
        )}
      />

      {connectionStatus === 'connected' && (
        <Button
          title="Desconectar"
          onPress={handleDisconnect}
          color="red"
        />
      )}
    </View>
  );
}
```

### 4.3 Monitorar Eventos (Opcional)

```typescript
// Qualquer componente pode ouvir eventos
useEffect(() => {
  const unsubscribe = bluetoothService.addEventListener((event) => {
    console.log('Evento recebido do ESP32:', event.code);
    
    // O evento já foi processado automaticamente pelo BluetoothEventProcessor
    // que chamou securityService.simulateEvent, salvou no histórico,
    // enviou para comunidade e ativou notificação
    
    // Aqui você pode adicionar lógica adicional se necessário
  });

  return unsubscribe;
}, []);
```

## 🔧 PASSO 5: Configurar ESP32 (Firmware)

### UUIDs que devem corresponder no ESP32:

```cpp
// Arduino/PlatformIO - ESP32 Firmware
#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_NOTIFY_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define CHARACTERISTIC_WRITE_UUID "1c95d5e3-d8f7-413a-bf3d-7a2e6d3b3c0a"
#define DEVICE_NAME "TruckGuard_001" // Pode ser TruckGuard_ABC, etc.
```

### Formato do payload (JSON recomendado):

```json
{
  "code": "TANK_RIGHT",
  "timestamp": 1234567890,
  "battery": 3.7,
  "deviceId": "TG001"
}
```

### Ou formato simples (string):

```
TANK_RIGHT
```

### Códigos de evento válidos:
- `TANK_RIGHT`
- `TANK_LEFT`
- `PALLET_RIGHT`
- `PALLET_LEFT`
- `FULL_ATTACK`

## 🧪 PASSO 6: Testar

### Teste 1: Scan
```typescript
const devices = await bluetoothService.scanForDevices();
console.log('Dispositivos encontrados:', devices);
```

### Teste 2: Conexão
```typescript
await bluetoothService.connect(deviceId);
console.log('Conectado!');
```

### Teste 3: Receber Evento
- Acionar sensor no ESP32
- Verificar console do app
- Verificar histórico no app
- Verificar notificação
- Verificar alerta na comunidade

## 🔍 Troubleshooting

### Erro: "Bluetooth not initialized"
**Solução**: Chamar `bluetoothService.initialize()` no app root

### Erro: "Permission denied"
**Solução**: Verificar permissões no AndroidManifest.xml e Info.plist

### Erro: "Device not found"
**Solução**: 
- Verificar se ESP32 está ligado
- Verificar se nome do dispositivo começa com "TruckGuard"
- Aumentar duração do scan

### Erro: "Service not found"
**Solução**: Verificar se UUIDs no app correspondem aos do ESP32

### Eventos não chegam
**Solução**:
- Verificar se notificações estão ativas no ESP32
- Verificar formato do payload (JSON ou string simples)
- Verificar logs: `adb logcat | grep Bluetooth`

## 📝 Notas Finais

1. **Sem mocks**: Esta implementação é 100% real, pronta para hardware
2. **SOLID**: Código segue princípios SOLID (separação de responsabilidades)
3. **TypeScript**: Totalmente tipado
4. **Production-ready**: Inclui error handling, retries, auto-reconnect
5. **Testável**: Cada módulo pode ser testado independentemente

## 🚀 Próximos Passos

1. Implementar tela de configuração Bluetooth no app
2. Adicionar indicador visual de conexão na UI
3. Implementar persistência da última conexão (AsyncStorage)
4. Adicionar modo de baixo consumo de energia
5. Implementar OTA (Over-The-Air) updates para ESP32

---

**LEMBRE-SE**: Excluir este arquivo antes de commit!
