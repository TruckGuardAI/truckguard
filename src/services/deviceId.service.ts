import AsyncStorage from '@react-native-async-storage/async-storage';

import * as Crypto from 'expo-crypto';

const DEVICE_ID_KEY = 'truckguard-device-id';

class DeviceIdService {
  private cachedId: string | null = null;

  async getDeviceId(): Promise<string> {
    if (this.cachedId) {
      return this.cachedId;
    }

    try {
      const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);

      if (stored) {
        this.cachedId = stored;
        return stored;
      }

      const newId = Crypto.randomUUID();

      await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
      this.cachedId = newId;

      return newId;
    } catch (error) {
      console.log('Erro deviceId:', error);

      const fallbackId = Crypto.randomUUID();
      this.cachedId = fallbackId;

      return fallbackId;
    }
  }
}

export const deviceIdService = new DeviceIdService();
