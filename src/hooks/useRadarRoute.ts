import {
  useCallback,
  useMemo,
  useState,
} from 'react';

import { useTranslation } from 'react-i18next';

import { isOpenRoutePlannerError } from '../services/openRoute.config';

import { routeService } from '../services/route.service';

import {
  isGeocodeNotFoundError,
  resolvePlaceCoordinates,
} from '../services/routeGeocoding.service';

import {
  analyzeRouteRisk,
  type RouteRiskResult,
} from '../services/routeRisk.service';

import type { Alert, AlertAlongRoute } from '../types/alert.types';

import type { CalculatedRoute } from '../types/route.types';

import { DEFAULT_TRIP } from '../types/route.types';

import type { UserCoordinates } from '../services/location.service';

import { useDebouncedValue } from './useDebouncedValue';

const ROUTE_DEBOUNCE_MS = 400;
const ROUTE_CORRIDOR_KM = 2;

export type RoutePlannerStatus =
  | 'idle'
  | 'calculating'
  | 'calculated'
  | 'error';

type UseRadarRouteResult = {
  origin: string;
  destination: string;
  setOrigin: (value: string) => void;
  setDestination: (value: string) => void;
  calculateRoute: () => Promise<void>;
  plannerStatus: RoutePlannerStatus;
  route: CalculatedRoute | null;
  routeAlerts: AlertAlongRoute[];
  routeLoading: boolean;
  routeError: string | null;
  routeWarning: string | null;
  routeRisk: RouteRiskResult | null;
  routeRiskLoading: boolean;
};

function resolveRouteErrorMessage(
  error: unknown,
  t: (key: string, options?: Record<string, string>) => string,
): string {
  if (
    error instanceof Error &&
    error.message === 'PLACE_NAME_EMPTY'
  ) {
    return t('radar.placeRequired');
  }

  if (isGeocodeNotFoundError(error)) {
    return t('radar.geocodeError', {
      place: error.city,
    });
  }

  if (isOpenRoutePlannerError(error)) {
    if (
      error.code ===
      'OPENROUTE_API_NOT_CONFIGURED'
    ) {
      return t('radar.openRouteNotConfigured');
    }

    if (error.code === 'TLS_CERTIFICATE_ERROR') {
      return t('radar.tlsCertificateError');
    }

    return t('radar.openRouteError');
  }

  if (error instanceof Error) {
    return error.message;
  }

  return t('radar.openRouteError');
}

function resolveRouteWarningMessage(
  warningKey: string | undefined,
  t: (key: string) => string,
): string | null {
  if (!warningKey) {
    return null;
  }

  const translated = t(`radar.${warningKey}`);

  if (translated === `radar.${warningKey}`) {
    return null;
  }

  return translated;
}

export function useRadarRoute(
  sortedAlerts: Alert[],
  userLocation: UserCoordinates,
  enabled: boolean,
): UseRadarRouteResult {
  const { t } = useTranslation();

  const [origin, setOrigin] = useState(
    DEFAULT_TRIP.origin.name,
  );

  const [destination, setDestination] =
    useState(DEFAULT_TRIP.destination.name);

  const [route, setRoute] = useState<CalculatedRoute | null>(
    null,
  );

  const [
    plannerStatus,
    setPlannerStatus,
  ] = useState<RoutePlannerStatus>('idle');

  const [routeLoading, setRouteLoading] = useState(false);

  const [routeError, setRouteError] = useState<string | null>(
    null,
  );

  const [
    routeWarning,
    setRouteWarning,
  ] = useState<string | null>(null);

  const [
    routeRisk,
    setRouteRisk,
  ] = useState<RouteRiskResult | null>(
    null,
  );

  const [
    routeRiskLoading,
    setRouteRiskLoading,
  ] = useState(false);

  const debouncedUser = useDebouncedValue(
    userLocation,
    ROUTE_DEBOUNCE_MS,
  );

  const debouncedAlerts = useDebouncedValue(
    sortedAlerts,
    ROUTE_DEBOUNCE_MS,
  );

  const calculateRoute =
    useCallback(async (): Promise<void> => {
      if (!enabled) {
        return;
      }

      const originName = origin.trim();
      const destinationName =
        destination.trim();

      if (!originName || !destinationName) {
        setRouteError(
          t('radar.placeRequired'),
        );
        setRouteWarning(null);
        setPlannerStatus('error');
        return;
      }

      setRouteLoading(true);
      setRouteRiskLoading(true);
      setRouteError(null);
      setRouteWarning(null);
      setPlannerStatus('calculating');
      setRoute(null);
      setRouteRisk(null);
      routeService.clearCache();

      try {
        const originPoint =
          await resolvePlaceCoordinates(
            originName,
          );

        const destinationPoint =
          await resolvePlaceCoordinates(
            destinationName,
          );

        const plannerResult =
          await routeService.calculatePlannerRoute(
            originPoint.latitude,
            originPoint.longitude,
            destinationPoint.latitude,
            destinationPoint.longitude,
            originName,
            destinationName,
          );

        setRoute(plannerResult.route);

        setRouteWarning(
          resolveRouteWarningMessage(
            plannerResult.warningKey,
            t,
          ),
        );

        const analysis =
          await analyzeRouteRisk(
            plannerResult.route.coordinates,
            {
              origem: originName,
              destino: destinationName,
            },
          );

        setRouteRisk(analysis);
        setPlannerStatus('calculated');

        console.log('ROUTE_PLANNER_COMPLETE', {
          origin: originName,
          destination: destinationName,
          source: plannerResult.source,
          distanceKm:
            plannerResult.route.distanceKm,
          riskScore: analysis.riskScore,
          alertsOnRoute:
            analysis.alertsOnRoute.length,
          criticalSegments:
            analysis.criticalSegments.length,
        });
      } catch (error) {
        const message =
          resolveRouteErrorMessage(
            error,
            t,
          );

        console.log('LOG_ROUTE_ERROR', {
          origem: originName,
          destino: destinationName,
          error: message,
          fatal: true,
        });

        setRouteError(message);
        setRouteWarning(null);
        setRoute(null);
        setRouteRisk(null);
        setPlannerStatus('error');
      } finally {
        setRouteLoading(false);
        setRouteRiskLoading(false);
      }
    }, [
      enabled,
      origin,
      destination,
      t,
    ]);

  const routeAlerts = useMemo(() => {
    if (!enabled || !route) {
      return [];
    }

    const riskAlertsOnRoute =
      routeRisk?.alertsOnRoute ?? [];

    if (riskAlertsOnRoute.length > 0) {
      return riskAlertsOnRoute.map(
        (alert) => ({
          ...alert,
          distanceAheadKm: Math.max(
            0,
            alert.distanceAlongRouteKm,
          ),
        }),
      );
    }

    return routeService.findAlertsAlongRoute(
      route.coordinates,
      debouncedAlerts,
      ROUTE_CORRIDOR_KM,
      debouncedUser,
    );
  }, [
    enabled,
    route,
    routeRisk?.alertsOnRoute,
    debouncedAlerts,
    debouncedUser,
  ]);

  const displayedRouteRisk =
    enabled &&
    route &&
    plannerStatus === 'calculated'
      ? routeRisk
      : null;

  const displayedRouteRiskLoading =
    enabled && routeLoading
      ? routeRiskLoading
      : false;

  return {
    origin,
    destination,
    setOrigin,
    setDestination,
    calculateRoute,
    plannerStatus,
    route:
      plannerStatus === 'calculated'
        ? route
        : null,
    routeAlerts,
    routeLoading,
    routeError,
    routeWarning,
    routeRisk: displayedRouteRisk,
    routeRiskLoading:
      displayedRouteRiskLoading,
  };
}
