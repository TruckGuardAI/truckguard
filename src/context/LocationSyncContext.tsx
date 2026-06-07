import React, {
  useEffect,
} from 'react';

import { useAuth } from './AuthContext';

import {
  locationService,
} from '../services/location.service';

import {
  locationSyncService,
} from '../services/locationSync.service';

export function LocationSyncProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const {
    session,
    loading: authLoading,
  } = useAuth();

  useEffect(() => {
    if (authLoading || !session?.user) {
      return;
    }

    let mounted = true;

    void locationSyncService.syncFromCurrentLocation(
      {
        source: 'app_open',
        force: true,
      },
    );

    const unsubscribe =
      locationService.watchUserLocation(
        (coords) => {
          if (!mounted) {
            return;
          }

          locationSyncService.onLocalLocationUpdate(
            coords,
            'watch',
          );
        },
      );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [
    authLoading,
    session?.user,
  ]);

  return <>{children}</>;
}
