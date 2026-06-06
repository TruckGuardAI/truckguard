import { useEffect, useMemo, useState } from 'react';

import { routeService } from '../services/route.service';

import type { Alert, AlertAlongRoute } from '../types/alert.types';

import type { CalculatedRoute } from '../types/route.types';

import { DEFAULT_TRIP } from '../types/route.types';

import type { UserCoordinates } from '../services/location.service';

import { useDebouncedValue } from './useDebouncedValue';

const ROUTE_DEBOUNCE_MS = 400;
const ROUTE_CORRIDOR_KM = 2;

type UseRadarRouteResult = {
  route: CalculatedRoute | null;
  routeAlerts: AlertAlongRoute[];
  routeLoading: boolean;
  routeError: string | null;
};

export function useRadarRoute(
  sortedAlerts: Alert[],
  userLocation: UserCoordinates,
  enabled: boolean,
): UseRadarRouteResult {
  const [route, setRoute] = useState<CalculatedRoute | null>(
    null,
  );

  const [routeLoading, setRouteLoading] = useState(false);

  const [routeError, setRouteError] = useState<string | null>(
    null,
  );

  const debouncedUser = useDebouncedValue(
    userLocation,
    ROUTE_DEBOUNCE_MS,
  );

  const debouncedAlerts = useDebouncedValue(
    sortedAlerts,
    ROUTE_DEBOUNCE_MS,
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    const loadRoute = async (): Promise<void> => {
      try {
        setRouteLoading(true);
        setRouteError(null);

        const calculated =
          await routeService.calculateRoute(
            DEFAULT_TRIP.origin.latitude,
            DEFAULT_TRIP.origin.longitude,
            DEFAULT_TRIP.destination.latitude,
            DEFAULT_TRIP.destination.longitude,
            DEFAULT_TRIP.origin.name,
            DEFAULT_TRIP.destination.name,
          );

        if (!cancelled) {
          setRoute(calculated);
        }
      } catch (error) {
        if (!cancelled) {
          setRouteError(
            error instanceof Error
              ? error.message
              : 'Erro ao calcular rota',
          );
        }
      } finally {
        if (!cancelled) {
          setRouteLoading(false);
        }
      }
    };

    void loadRoute();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const routeAlerts = useMemo(() => {
    if (!enabled || !route) {
      return [];
    }

    return routeService.findAlertsAlongRoute(
      route.coordinates,
      debouncedAlerts,
      ROUTE_CORRIDOR_KM,
      debouncedUser,
    );
  }, [enabled, route, debouncedAlerts, debouncedUser]);

  return {
    route,
    routeAlerts,
    routeLoading,
    routeError,
  };
}
