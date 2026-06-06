/**
 * Compatibilidade: tipos e facade para código legado.
 * Dados vivem no Supabase via alertsApiService.
 */
export type {
  Alert,
  AlertType,
  CreateAlertInput,
} from '../types/alert.types';

export { alertsApiService } from './alertsApi.service';

import type { Alert, AlertType, CreateAlertInput } from '../types/alert.types';
import { alertsApiService } from './alertsApi.service';

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

/** @deprecated Use alertsApiService.confirmAlert() */
async function confirm(id: string): Promise<Alert | null> {
  return alertsApiService.confirmAlert(id);
}

/** @deprecated Use alertsApiService.resolveAlert() */
async function resolve(id: string): Promise<Alert | null> {
  return alertsApiService.resolveAlert(id);
}

/** @deprecated Use alertsApiService.getAlertById() */
async function getById(id: string): Promise<Alert | undefined> {
  return alertsApiService.getAlertById(id);
}

export const alertsService = {
  getAll,
  add,
  confirm,
  resolve,
  getById,
};
