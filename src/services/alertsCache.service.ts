import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Alert, CreateAlertInput } from '../types/alert.types';

const CACHE_KEY = 'truckguard_alerts_cache';
const PENDING_KEY = 'truckguard_alerts_pending';

export type PendingMutation =
  | {
      id: string;
      kind: 'create';
      /** ID temporário `local-*` criado offline para substituição após sync. */
      localAlertId?: string;
      payload: CreateAlertInput;
      createdAt: string;
    }
  | {
      id: string;
      kind: 'delete';
      alertId: string;
      createdAt: string;
    };

class AlertsCacheService {
  async getAlerts(): Promise<Alert[]> {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);

      if (!raw) {
        return [];
      }

      const parsed: unknown = JSON.parse(raw);

      return Array.isArray(parsed) ? (parsed as Alert[]) : [];
    } catch (error) {
      console.log('Erro cache alertas:', error);
      return [];
    }
  }

  async saveAlerts(alerts: Alert[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(alerts));
    } catch (error) {
      console.log('Erro guardar cache:', error);
    }
  }

  async getPending(): Promise<PendingMutation[]> {
    try {
      const raw = await AsyncStorage.getItem(PENDING_KEY);

      if (!raw) {
        return [];
      }

      const parsed: unknown = JSON.parse(raw);

      return Array.isArray(parsed)
        ? (parsed as PendingMutation[])
        : [];
    } catch (error) {
      console.log('Erro pending alertas:', error);
      return [];
    }
  }

  async savePending(pending: PendingMutation[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        PENDING_KEY,
        JSON.stringify(pending),
      );
    } catch (error) {
      console.log('Erro guardar pending:', error);
    }
  }

  async enqueuePending(
    mutation: PendingMutation,
  ): Promise<void> {
    const pending = await this.getPending();
    pending.push(mutation);
    await this.savePending(pending);
  }

  async clearPending(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PENDING_KEY);
    } catch (error) {
      console.log('Erro limpar pending:', error);
    }
  }
}

export const alertsCacheService = new AlertsCacheService();
