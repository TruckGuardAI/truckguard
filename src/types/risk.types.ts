import type { AlertType } from './alert.types';

export type RiskLevel = 'low' | 'medium' | 'high';

export type RiskLevelDisplay = {
  level: RiskLevel;
  emoji: string;
  label: string;
  color: string;
};

export type RiskReason = {
  id: string;
  text: string;
};

export type RiskScoreBreakdown = {
  fuelTheft: number;
  fullAttack: number;
  highConfirmations: number;
  veryClose: number;
  criticalHour: number;
  multipleAlerts: number;
  areaRecurrence: number;
  otherTypes: number;
};

export type RiskScoreResult = {
  score: number;
  breakdown: RiskScoreBreakdown;
  reasons: RiskReason[];
};

export type AreaRiskResult = {
  score: number;
  level: RiskLevel;
  display: RiskLevelDisplay;
  reasons: RiskReason[];
  nearbyCount: number;
  history24hCount: number;
  areaKey: string;
  calculatedAt: string;
};

export type RiskEngineContext = {
  nearbyAlerts: Array<{
    type: AlertType;
    distance: number;
    confirmations: number;
    resolved: boolean;
    createdAt?: string;
    latitude: number;
    longitude: number;
  }>;
  history24h: Array<{
    type: AlertType;
    confirmations: number;
    createdAt?: string;
    latitude: number;
    longitude: number;
  }>;
  currentTime?: Date;
  userLatitude: number;
  userLongitude: number;
};

export const RISK_LEVEL_DISPLAY: Record<
  RiskLevel,
  RiskLevelDisplay
> = {
  low: {
    level: 'low',
    emoji: '🟢',
    label: 'Baixo',
    color: '#22c55e',
  },
  medium: {
    level: 'medium',
    emoji: '🟠',
    label: 'Médio',
    color: '#f97316',
  },
  high: {
    level: 'high',
    emoji: '🔴',
    label: 'Alto',
    color: '#ef4444',
  },
};
