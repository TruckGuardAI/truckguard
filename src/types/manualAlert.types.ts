import type { AlertType } from './alert.types';

export type ManualIncidentTypeId =
  | 'sos'
  | 'robbery_in_progress'
  | 'cargo_theft'
  | 'fuel_theft'
  | 'obstacle'
  | 'suspicious_area';

export type ManualIncidentTypeOption = {
  id: ManualIncidentTypeId;
  alertType: AlertType;
  labelKey: string;
};

export const MANUAL_INCIDENT_TYPES: ManualIncidentTypeOption[] =
  [
    {
      id: 'sos',
      alertType: 'sos',
      labelKey: 'manualAlert.types.sos',
    },
    {
      id: 'robbery_in_progress',
      alertType: 'full_attack',
      labelKey: 'manualAlert.types.robberyInProgress',
    },
    {
      id: 'cargo_theft',
      alertType: 'cargo_theft',
      labelKey: 'manualAlert.types.cargoTheft',
    },
    {
      id: 'fuel_theft',
      alertType: 'fuel',
      labelKey: 'manualAlert.types.fuelTheft',
    },
    {
      id: 'obstacle',
      alertType: 'obstacle',
      labelKey: 'manualAlert.types.obstacle',
    },
    {
      id: 'suspicious_area',
      alertType: 'cabin_attack',
      labelKey: 'manualAlert.types.suspiciousArea',
    },
  ];
