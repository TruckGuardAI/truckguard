import type { Alert, AlertType } from './alert.types';

import type { RiskLevel } from './risk.types';

import type { RouteCoordinate } from './route.types';

export type RouteRiskAlert = Alert & {
  distanceToRouteKm: number;
  distanceAlongRouteKm: number;
  riskContribution: number;
};

export type RouteCriticalSegment = {
  id: string;
  startKm: number;
  endKm: number;
  riskScore: number;
  riskLevel: RiskLevel;
  alertCount: number;
  dominantAlertType: AlertType | null;
};

export type RouteRiskAnalysis = {
  hasSufficientData: boolean;
  riskScore: number | null;
  riskLevel: RiskLevel | null;
  criticalSegments: RouteCriticalSegment[];
  alertsOnRoute: RouteRiskAlert[];
};

export type RouteRiskEngineInput = {
  routeCoordinates: RouteCoordinate[];
  alerts: Alert[];
  now?: Date;
  influenceKm?: number;
  lookbackDays?: number;
};

export type RouteRiskAnalyzeOptions = {
  origem?: string;
  destino?: string;
};
