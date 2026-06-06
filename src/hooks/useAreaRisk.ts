import { useMemo } from 'react';

import { riskEngineService } from '../services/riskEngine.service';

import type { Alert } from '../types/alert.types';

import type { AreaRiskResult } from '../types/risk.types';

import type { UserCoordinates } from '../services/location.service';

import { useDebouncedValue } from './useDebouncedValue';

const RISK_DEBOUNCE_MS = 400;

type UseAreaRiskResult = {
  areaRisk: AreaRiskResult;
};

export function useAreaRisk(
  rawAlerts: Alert[],
  sortedAlerts: Alert[],
  userLocation: UserCoordinates,
  locationReady: boolean,
): UseAreaRiskResult {
  const debouncedLocation = useDebouncedValue(
    userLocation,
    RISK_DEBOUNCE_MS,
  );

  const debouncedSorted = useDebouncedValue(
    sortedAlerts,
    RISK_DEBOUNCE_MS,
  );

  const debouncedRaw = useDebouncedValue(
    rawAlerts,
    RISK_DEBOUNCE_MS,
  );

  const areaRisk = useMemo(() => {
    if (!locationReady) {
      return riskEngineService.calculateAreaRisk(
        debouncedLocation.latitude,
        debouncedLocation.longitude,
        debouncedRaw,
        [],
      );
    }

    const enrichedNearby =
      riskEngineService.enrichAlertsForRisk(
        debouncedSorted.filter((item) => !item.resolved),
        debouncedLocation.latitude,
        debouncedLocation.longitude,
      );

    const enrichedAll = riskEngineService.enrichAlertsForRisk(
      debouncedRaw,
      debouncedLocation.latitude,
      debouncedLocation.longitude,
    );

    return riskEngineService.calculateAreaRisk(
      debouncedLocation.latitude,
      debouncedLocation.longitude,
      enrichedAll,
      enrichedNearby,
    );
  }, [
    debouncedLocation,
    debouncedSorted,
    debouncedRaw,
    locationReady,
  ]);

  return { areaRisk };
}
