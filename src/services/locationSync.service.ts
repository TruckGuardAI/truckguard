import {
  locationService,
  type UserCoordinates,
} from './location.service';

import { profileService } from './profile.service';

/** Limite do RPC `get_nearby_users` — após 24h o utilizador é excluído. */
export const LOCATION_MAX_STALENESS_MS =
  24 * 60 * 60 * 1000;

/** Aviso quando a sync ao Supabase está atrasada (app ativo). */
export const LOCATION_STALE_WARNING_MS =
  5 * 60 * 1000;

/** Intervalo mínimo entre syncs passivas (GPS watch). */
export const LOCATION_SYNC_MIN_INTERVAL_MS =
  60 * 1000;

/** Deslocação mínima (metros) para sync antes do intervalo. */
export const LOCATION_SYNC_MIN_DISTANCE_M = 50;

export type LocationUpdateSource =
  | 'watch'
  | 'fetch'
  | 'login'
  | 'app_open'
  | 'alert_create'
  | 'push_register'
  | 'alert_received';

export type LocationSyncSource =
  | 'watch'
  | 'login'
  | 'app_open'
  | 'alert_create'
  | 'push_register'
  | 'alert_received';

type SyncStatus = {
  lastSyncedAt: string | null;
  lastSyncedLatitude: number | null;
  lastSyncedLongitude: number | null;
  ageMs: number | null;
  maxStalenessMs: number;
  excludedFromNearby: boolean;
};

class LocationSyncService {
  private lastSyncedAt: number | null = null;

  private lastSyncedCoords:
    UserCoordinates | null = null;

  private lastStaleLogAt = 0;

  private syncInFlight:
    Promise<void> | null = null;

  getSyncStatus(): SyncStatus {
    const ageMs =
      this.lastSyncedAt === null
        ? null
        : Date.now() - this.lastSyncedAt;

    return {
      lastSyncedAt:
        this.lastSyncedAt === null
          ? null
          : new Date(
              this.lastSyncedAt,
            ).toISOString(),
      lastSyncedLatitude:
        this.lastSyncedCoords?.latitude ??
        null,
      lastSyncedLongitude:
        this.lastSyncedCoords?.longitude ??
        null,
      ageMs,
      maxStalenessMs:
        LOCATION_MAX_STALENESS_MS,
      excludedFromNearby:
        ageMs !== null &&
        ageMs >= LOCATION_MAX_STALENESS_MS,
    };
  }

  onLocalLocationUpdate(
    coords: UserCoordinates,
    source: LocationUpdateSource,
  ): void {
    console.log('LOG_LOCATION_UPDATE', {
      latitude: coords.latitude,
      longitude: coords.longitude,
      source,
      timestamp: new Date().toISOString(),
    });

    this.logStaleIfNeeded();

    const syncSource: LocationSyncSource =
      source === 'fetch'
        ? 'watch'
        : source;

    void this.trySync(
      coords,
      syncSource,
      false,
    );
  }

  async syncFromCurrentLocation(
    options: {
      source: LocationSyncSource;
      force?: boolean;
    },
  ): Promise<void> {
    const coords =
      locationService.getLastKnownLocation() ??
      (await locationService
        .getCurrentLocation()
        .catch(() => null));

    if (!coords) {
      return;
    }

    console.log('LOG_LOCATION_UPDATE', {
      latitude: coords.latitude,
      longitude: coords.longitude,
      source: options.source,
      timestamp: new Date().toISOString(),
    });

    await this.trySync(
      coords,
      options.source,
      options.force ?? true,
    );
  }

  async syncCoordinates(
    coords: UserCoordinates,
    source: LocationSyncSource,
    force = false,
  ): Promise<void> {
    console.log('LOG_LOCATION_UPDATE', {
      latitude: coords.latitude,
      longitude: coords.longitude,
      source,
      timestamp: new Date().toISOString(),
    });

    await this.trySync(
      coords,
      source,
      force,
    );
  }

  private logStaleIfNeeded(): void {
    if (this.lastSyncedAt === null) {
      return;
    }

    const ageMs =
      Date.now() - this.lastSyncedAt;

    if (
      ageMs < LOCATION_STALE_WARNING_MS
    ) {
      return;
    }

    if (
      Date.now() - this.lastStaleLogAt <
      LOCATION_STALE_WARNING_MS
    ) {
      return;
    }

    this.lastStaleLogAt = Date.now();

    console.log('LOG_LOCATION_STALE', {
      ageMs,
      ageMinutes: Math.round(
        ageMs / 60_000,
      ),
      maxStalenessMs:
        LOCATION_MAX_STALENESS_MS,
      maxStalenessHours: 24,
      excludedFromNearby:
        ageMs >=
        LOCATION_MAX_STALENESS_MS,
      lastSyncedAt: new Date(
        this.lastSyncedAt,
      ).toISOString(),
      status: this.getSyncStatus(),
    });
  }

  private shouldSync(
    coords: UserCoordinates,
    force: boolean,
  ): boolean {
    if (force) {
      return true;
    }

    if (
      this.lastSyncedAt === null ||
      this.lastSyncedCoords === null
    ) {
      return true;
    }

    const elapsedMs =
      Date.now() - this.lastSyncedAt;

    if (
      elapsedMs >=
      LOCATION_SYNC_MIN_INTERVAL_MS
    ) {
      return true;
    }

    const movedKm =
      locationService.calculateDistanceKm(
        this.lastSyncedCoords.latitude,
        this.lastSyncedCoords.longitude,
        coords.latitude,
        coords.longitude,
      );

    return (
      movedKm * 1000 >=
      LOCATION_SYNC_MIN_DISTANCE_M
    );
  }

  private async trySync(
    coords: UserCoordinates,
    source: LocationSyncSource,
    force: boolean,
  ): Promise<void> {
    if (
      !this.shouldSync(coords, force)
    ) {
      return;
    }

    if (this.syncInFlight) {
      await this.syncInFlight;
    }

    this.syncInFlight =
      this.performSync(
        coords,
        source,
      );

    try {
      await this.syncInFlight;
    } finally {
      this.syncInFlight = null;
    }
  }

  private async performSync(
    coords: UserCoordinates,
    source: LocationSyncSource,
  ): Promise<void> {
    try {
      await profileService.updateUserLocation(
        coords.latitude,
        coords.longitude,
      );

      this.lastSyncedAt = Date.now();
      this.lastSyncedCoords = coords;

      console.log('LOG_LOCATION_SYNC', {
        latitude: coords.latitude,
        longitude: coords.longitude,
        source,
        timestamp: new Date().toISOString(),
        last_location_at: new Date(
          this.lastSyncedAt,
        ).toISOString(),
      });
    } catch (error) {
      console.log('LOG_LOCATION_SYNC', {
        latitude: coords.latitude,
        longitude: coords.longitude,
        source,
        success: false,
        error,
      });
    }
  }
}

export const locationSyncService =
  new LocationSyncService();
