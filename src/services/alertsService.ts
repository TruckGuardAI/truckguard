/**
 * Compatibilidade: tipos e facade para código legado.
 * Dados vivem no Supabase via alertsApiService.
 */
import type { Alert, AlertType } from '../types/alert.types';

import { alertsApiService } from './alertsApi.service';

export type {
  Alert,
  AlertType,
  CreateAlertInput,
} from '../types/alert.types';

export { alertsApiService };

/** @deprecated Use alertsApiService.getAlerts() */
async function getAll(): Promise<Alert[]> {
  return alertsApiService.getAlerts();
}

/** @deprecated Use alertsApiService.createAlert() */
async function add(
  title: string,
  latitude: number,
  longitude: number,
  type?: AlertType,
): Promise<Alert | null> {
  return alertsApiService.createAlert({
    title,
    latitude,
    longitude,
    type,
  });
}

/** @deprecated Use alertsApiService.getAlertById() */
async function getById(id: string): Promise<Alert | undefined> {
  return alertsApiService.getAlertById(id);
}

export const alertsService = {
  getAll,
  add,
  getById,
};
