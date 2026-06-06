# ✅ TruckGuard Bluetooth - Checklist de Implementação

Use este checklist para ativar o Bluetooth ESP32 no projeto.

---

## 📋 Fase 1: Instalação e Configuração (30-45 min)

### ✅ 1.1 Instalar Dependência
```bash
cd frontend
npm install react-native-ble-plx
```

**Resultado esperado**: `react-native-ble-plx` em `package.json`

---

### ✅ 1.2 Configurar `app.json`

1. Abrir `frontend/app.json`
2. Copiar configuração de `app.json.bluetooth-example`
3. Adicionar na seção `plugins`:
   ```json
   [
     "react-native-ble-plx",
     {
       "isBackgroundEnabled": false,
       "modes": ["peripheral"],
       "bluetoothAlwaysUsageDescription": "...",
       "bluetoothPeripheralUsageDescription": "..."
     }
   ]
   ```
4. Adicionar permissões Android:
   ```json
   "android": {
     "permissions": [
       "android.permission.BLUETOOTH",
       "android.permission.BLUETOOTH_ADMIN",
       "android.permission.BLUETOOTH_CONNECT",
       "android.permission.BLUETOOTH_SCAN",
       "android.permission.ACCESS_FINE_LOCATION"
     ]
   }
   ```
5. Adicionar permissões iOS:
   ```json
   "ios": {
     "infoPlist": {
       "NSBluetoothAlwaysUsageDescription": "...",
       "NSBluetoothPeripheralUsageDescription": "..."
     }
   }
   ```

**Resultado esperado**: `app.json` configurado com Bluetooth

---

### ✅ 1.3 Rebuild com Development Build

```bash
# Limpar e rebuild
npx expo prebuild --clean

# Android
npx expo run:android

# OU iOS
npx expo run:ios
```

**Resultado esperado**: Build bem-sucedido sem erros

**⚠️ IMPORTANTE**: Não funciona no Expo Go!

---

## 📋 Fase 2: Integração no App (10-15 min)

### ✅ 2.1 Inicializar Bluetooth no Root Layout

Editar `frontend/app/_layout.tsx`:

```typescript
import { useEffect } from 'react';
import { bluetoothService } from '@/src/services/bluetooth';

export default function RootLayout() {
  useEffect(() => {
    // Inicializar Bluetooth
    bluetoothService.initialize().catch((error) => {
      console.error('❌ Erro ao inicializar Bluetooth:', error);
    });

    // Cleanup
    return () => {
      bluetoothService.destroy();
    };
  }, []);

  return (
    // ... resto do layout
  );
}
```

**Resultado esperado**: Console mostra `✅ Bluetooth: Inicializado com sucesso`

---

### ✅ 2.2 Criar Tela de Configuração Bluetooth (Opcional)

**Opção A**: Copiar tela de exemplo
```bash
cp app/(tabs)/bluetooth-example.tsx app/(tabs)/bluetooth.tsx
```

**Opção B**: Criar tela customizada usando `useBluetoothConnection` hook

```typescript
import { useBluetoothConnection } from '@/src/hooks/useBluetoothConnection';

function MyBluetoothScreen() {
  const { scan, connect, disconnect, connectionState } = 
    useBluetoothConnection();
  
  // ... sua UI
}
```

**Resultado esperado**: Tela de Bluetooth funcional no app

---

## 📋 Fase 3: Configuração ESP32 (45-60 min)

### ✅ 3.1 Preparar Firmware ESP32

1. Abrir Arduino IDE ou PlatformIO
2. Criar novo projeto para ESP32
3. Instalar biblioteca `BLE` (built-in no ESP32)
4. Definir UUIDs (DEVEM corresponder ao app):

```cpp
#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define NOTIFY_CHAR_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define WRITE_CHAR_UUID "1c95d5e3-d8f7-413a-bf3d-7a2e6d3b3c0a"
#define DEVICE_NAME "TruckGuard_001"
```

**Resultado esperado**: Firmware compilando sem erros

---

### ✅ 3.2 Implementar Lógica de Envio

```cpp
void sendEvent(const char* eventCode) {
  String payload = "{\"code\":\"" + String(eventCode) + 
                   "\",\"timestamp\":" + String(millis()) + 
                   ",\"deviceId\":\"TG001\"}";
  
  pCharacteristic->setValue(payload.c_str());
  pCharacteristic->notify();
}
```

**Resultado esperado**: Função `sendEvent` implementada

---

### ✅ 3.3 Conectar Sensores

Mapear sensores físicos para códigos de evento:

```cpp
// Exemplo:
#define TANK_RIGHT_SENSOR 25
#define TANK_LEFT_SENSOR 26
// ... etc

void loop() {
  if (digitalRead(TANK_RIGHT_SENSOR) == HIGH) {
    sendEvent("TANK_RIGHT");
    delay(2000); // Debounce
  }
  // ... outros sensores
}
```

**Resultado esperado**: Sensores lidos corretamente

---

### ✅ 3.4 Upload Firmware para ESP32

```bash
# Arduino IDE: Sketch > Upload
# PlatformIO: pio run --target upload
```

**Resultado esperado**: Firmware carregado com sucesso

---

## 📋 Fase 4: Testes (15-30 min)

### ✅ 4.1 Teste de Scan

1. Ligar ESP32
2. Abrir app TruckGuard
3. Ir para tela de Bluetooth
4. Clicar em "Escanear Dispositivos"

**Resultado esperado**: 
- Console mostra `🔍 Bluetooth: Escaneando...`
- ESP32 aparece na lista com nome `TruckGuard_001`

---

### ✅ 4.2 Teste de Conexão

1. Clicar no dispositivo ESP32 na lista
2. Aguardar conexão

**Resultado esperado**:
- Console mostra `✅ Bluetooth: Conectado ao TruckGuard_001`
- Status muda para "Conectado"
- RSSI é exibido

---

### ✅ 4.3 Teste de Eventos

1. Acionar sensor no ESP32 (ex: `TANK_RIGHT`)
2. Observar comportamento do app

**Resultado esperado**:
- Console mostra `📡 Bluetooth: Evento recebido do ESP32: TANK_RIGHT`
- Histórico é atualizado
- Notificação local aparece
- Alerta é criado na comunidade
- GPS location é capturado

---

### ✅ 4.4 Teste de Deduplicação

1. Acionar mesmo sensor 2 vezes em < 2 segundos
2. Observar console

**Resultado esperado**:
- Primeiro evento: processado
- Segundo evento: `⚠️ Bluetooth: Evento duplicado ignorado: TANK_RIGHT`

---

### ✅ 4.5 Teste de Auto-reconnect

1. Conectar ao ESP32
2. Desligar ESP32
3. Aguardar 5 segundos
4. Religar ESP32

**Resultado esperado**:
- Console mostra `⚠️ Bluetooth: Dispositivo desconectado`
- Console mostra `🔄 Bluetooth: Tentando reconectar...`
- Console mostra `✅ Bluetooth: Conectado ao TruckGuard_001`

---

## 📋 Fase 5: Verificação Final (5-10 min)

### ✅ 5.1 Verificar Integração Completa

Para cada evento ESP32, verificar:

| Item | Status |
|------|--------|
| ✅ Evento recebido no console | [ ] |
| ✅ Histórico atualizado | [ ] |
| ✅ Notificação local enviada | [ ] |
| ✅ Alerta criado na comunidade | [ ] |
| ✅ GPS location capturado | [ ] |
| ✅ UI atualizada (lastEvent) | [ ] |

---

### ✅ 5.2 Verificar Todos os Eventos

Testar cada código de evento:

| Evento | Testado | Funciona |
|--------|---------|----------|
| `TANK_RIGHT` | [ ] | [ ] |
| `TANK_LEFT` | [ ] | [ ] |
| `PALLET_RIGHT` | [ ] | [ ] |
| `PALLET_LEFT` | [ ] | [ ] |
| `FULL_ATTACK` | [ ] | [ ] |

---

## 📋 Troubleshooting

### ❌ Problema: "Bluetooth not initialized"

**Solução**: Verificar se `bluetoothService.initialize()` foi chamado em `app/_layout.tsx`

---

### ❌ Problema: "Permission denied"

**Solução Android 12+**:
1. Verificar `app.json` tem `BLUETOOTH_SCAN` e `BLUETOOTH_CONNECT`
2. Rebuild: `npx expo prebuild --clean`

**Solução Android < 12**:
1. Verificar `app.json` tem `ACCESS_FINE_LOCATION`
2. Rebuild

---

### ❌ Problema: "Device not found"

**Soluções**:
- ✅ Verificar se ESP32 está ligado
- ✅ Verificar se nome do ESP32 começa com `TruckGuard`
- ✅ Aumentar duração do scan: `scan(15000)` (15 segundos)
- ✅ Verificar se Bluetooth do celular está habilitado

---

### ❌ Problema: "Service not found"

**Solução**: Verificar se UUIDs no app correspondem aos do ESP32

```typescript
// App (bluetooth.config.ts)
serviceUUID: '4fafc201-1fb5-459e-8fcc-c5c9c331914b'

// ESP32 (firmware)
#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
```

**DEVEM SER IDÊNTICOS!**

---

### ❌ Problema: Eventos não chegam

**Soluções**:
1. Verificar se notificações estão habilitadas no ESP32
2. Verificar formato do payload (JSON ou string simples)
3. Verificar logs: `adb logcat | grep Bluetooth`
4. Testar com mock: `runAllTests()`

---

## 🎉 Conclusão

Se todos os checkboxes acima estão marcados:

✅ **Bluetooth ESP32 está 100% funcional!**

Agora você pode:
- Receber eventos reais do hardware ESP32
- Processar alertas automaticamente
- Salvar no histórico
- Enviar notificações
- Criar alertas na comunidade

---

## 📚 Documentação Adicional

| Documento | Para que serve |
|-----------|----------------|
| `README_BLUETOOTH.md` | Visão geral e quick start |
| `BLUETOOTH_SETUP_GUIDE.md` | Guia detalhado passo-a-passo |
| `docs/BLUETOOTH_ARCHITECTURE.md` | Documentação técnica |
| `BLUETOOTH_SUMMARY.md` | Resumo executivo |

---

**Boa sorte! 🚀**
