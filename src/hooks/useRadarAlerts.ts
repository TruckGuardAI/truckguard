import { useEffect, useMemo, useState } from 'react';

import {
  locationService,
  type UserCoordinates,
} from '../services/location.service';

import {
  enrichAlertsWithDistance,
  filterAlertsByRadius,
  type RadiusFilterKm,
} from '../utils/alertRadar.utils';

import type { Alert } from '../types/alert.types';

import { useDebouncedValue } from './useDebouncedValue';

const LOCATION_DEBOUNCE_MS = 400;

type UseRadarAlertsResult = {
  alerts: Alert[];
  sortedAlerts: Alert[];
  userLocation: UserCoordinates;
  radiusKm: RadiusFilterKm;
  setRadiusKm: (value: RadiusFilterKm) => void;
  locationReady: boolean;
};

export function useRadarAlerts(
  rawAlerts: Alert[],
): UseRadarAlertsResult {
  const [userLocation, setUserLocation] =
    useState<UserCoordinates>({
      latitude: 41.1579,
      longitude: -8.6291,
    });

  const [locationReady, setLocationReady] =
    useState(false);

  const [radiusKm, setRadiusKm] =
    useState<RadiusFilterKm>(null);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const initial =
        await locationService.getCurrentLocation();

      if (mounted) {
        setUserLocation(initial);
        setLocationReady(true);
      }
    })();

    const unsubscribe = locationService.watchUserLocation(
      (coords) => {
        if (mounted) {
          setUserLocation(coords);
          setLocationReady(true);
        }
      },
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const debouncedLocation = useDebouncedValue(
    userLocation,
    LOCATION_DEBOUNCE_MS,
  );

  const sortedAlerts = useMemo(() => {
    if (!locationReady) {
      return rawAlerts.map((alert) => ({
        ...alert,
        distance: 0,
      }));
    }

    return enrichAlertsWithDistance(
      rawAlerts,
      debouncedLocation.latitude,
      debouncedLocation.longitude,
    );
  }, [rawAlerts, debouncedLocation, locationReady]);

  const alerts = useMemo(
    () => filterAlertsByRadius(sortedAlerts, radiusKm),
    [sortedAlerts, radiusKm],
  );

  return {
    alerts,
    sortedAlerts,
    userLocation: debouncedLocation,
    radiusKm,
    setRadiusKm,
    locationReady,
  };
}
