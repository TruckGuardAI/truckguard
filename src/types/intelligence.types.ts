import type { AlertType } from './alert.types';

export type CountryStat = {
  country: string;
  alertCount: number;
  riskScore: number;
};

export type CityStat = {
  city: string;
  country: string;
  alertCount: number;
  riskScore: number;
};

export type IncidentStat = {
  type: AlertType;
  label: string;
  count: number;
  percentage: number;
};

export type TimeRiskStat = {
  hour: number;
  label: string;
  alertCount: number;
  riskScore: number;
};
