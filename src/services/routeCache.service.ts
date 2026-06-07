import {
  isSupabaseConfigured,
  supabase,
} from '../lib/supabase';

import type { RouteCoordinate } from '../types/route.types';

const TABLE = 'route_cache';

const TTL_DAYS = 60;

export type RouteCacheEntry = {
  cacheKey: string;
  originKey: string;
  destinationKey: string;
  coordinates: RouteCoordinate[];
  distanceKm: number;
  source: 'openroute';
  createdAt: string;
  expiresAt: string;
};

type RouteCacheRow = {
  id: string;
  origin_key: string;
  destination_key: string;
  distance_km: number;
  route_geometry: RouteCoordinate[];
  source: string;
  created_at: string;
};

type SupabaseErrorLike = {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
};

function roundCoord(value: number): string {
  return value.toFixed(4);
}

export function buildOriginKey(
  originLat: number,
  originLng: number,
): string {
  return `${roundCoord(originLat)},${roundCoord(originLng)}`;
}

export function buildDestinationKey(
  destinationLat: number,
  destinationLng: number,
): string {
  return `${roundCoord(destinationLat)},${roundCoord(destinationLng)}`;
}

export function buildRouteCacheKey(
  originLat: number,
  originLng: number,
  destinationLat: number,
  destinationLng: number,
): string {
  const originKey = buildOriginKey(
    originLat,
    originLng,
  );

  const destinationKey = buildDestinationKey(
    destinationLat,
    destinationLng,
  );

  return `${originKey}->${destinationKey}`;
}

function addDaysToIso(
  isoDate: string,
  days: number,
): string {
  const date = new Date(isoDate);
  date.setDate(date.getDate() + days);

  return date.toISOString();
}

function classifySupabaseError(
  error: SupabaseErrorLike,
) {
  const code = error.code ?? null;
  const message = error.message ?? 'unknown_error';

  const isRls =
    code === '42501' ||
    /row-level security/i.test(message);

  return {
    code,
    message,
    details: error.details ?? null,
    hint: error.hint ?? null,
    isRls,
    isConstraint:
      !isRls &&
      ((code?.startsWith('23') ?? false) ||
        /constraint|duplicate key/i.test(message)),
    isJsonb:
      /jsonb|invalid input syntax for type json/i.test(
        message,
      ),
  };
}

function logSupabaseError(
  action: string,
  context: Record<string, unknown>,
  error: SupabaseErrorLike,
): void {
  console.log('LOG_ROUTE_CACHE_SUPABASE_ERROR', {
    action,
    ...context,
    ...classifySupabaseError(error),
  });
}

async function countRouteCacheRows(): Promise<{
  count: number | null;
  error: SupabaseErrorLike | null;
}> {
  const { count, error } = await supabase
    .from(TABLE)
    .select('*', { count: 'exact', head: true });

  return {
    count: count ?? null,
    error: error ?? null,
  };
}

function isValidCoordinates(
  value: unknown,
): value is RouteCoordinate[] {
  if (!Array.isArray(value) || value.length < 2) {
    return false;
  }

  return value.every(
    (point) =>
      typeof point === 'object' &&
      point !== null &&
      typeof (point as RouteCoordinate).latitude ===
        'number' &&
      typeof (point as RouteCoordinate).longitude ===
        'number',
  );
}

function mapRowToEntry(
  row: RouteCacheRow,
): RouteCacheEntry | null {
  if (!isValidCoordinates(row.route_geometry)) {
    return null;
  }

  return {
    cacheKey: `${row.origin_key}->${row.destination_key}`,
    originKey: row.origin_key,
    destinationKey: row.destination_key,
    coordinates: row.route_geometry,
    distanceKm: Number(row.distance_km),
    source: 'openroute',
    createdAt: row.created_at,
    expiresAt: addDaysToIso(
      row.created_at,
      TTL_DAYS,
    ),
  };
}

class RouteCacheService {
  async get(
    originLat: number,
    originLng: number,
    destinationLat: number,
    destinationLng: number,
  ): Promise<RouteCacheEntry | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const originKey = buildOriginKey(
      originLat,
      originLng,
    );

    const destinationKey = buildDestinationKey(
      destinationLat,
      destinationLng,
    );

    const cacheKey = `${originKey}->${destinationKey}`;

    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('origin_key', originKey)
      .eq('destination_key', destinationKey)
      .limit(1)
      .maybeSingle();

    if (error) {
      logSupabaseError('lookup', {
        cacheKey,
        origin_key: originKey,
        destination_key: destinationKey,
      }, error);

      return null;
    }

    if (!data) {
      console.log('LOG_ROUTE_CACHE_MISS', {
        cacheKey,
        origin_key: originKey,
        destination_key: destinationKey,
      });

      return null;
    }

    const entry = mapRowToEntry(
      data as RouteCacheRow,
    );

    if (!entry) {
      logSupabaseError('parse', {
        cacheKey,
        origin_key: originKey,
        destination_key: destinationKey,
        message: 'invalid_route_geometry',
      }, {
        message: 'invalid_route_geometry',
      });

      console.log('LOG_ROUTE_CACHE_MISS', {
        cacheKey,
        origin_key: originKey,
        destination_key: destinationKey,
      });

      return null;
    }

    console.log('LOG_ROUTE_CACHE_HIT', {
      cacheKey,
      origin_key: originKey,
      destination_key: destinationKey,
      points: entry.coordinates.length,
      distance_km: Number(
        entry.distanceKm.toFixed(2),
      ),
      source: entry.source,
      createdAt: entry.createdAt,
      expiresAt: entry.expiresAt,
    });

    return entry;
  }

  async save(
    originLat: number,
    originLng: number,
    destinationLat: number,
    destinationLng: number,
    coordinates: RouteCoordinate[],
    distanceKm: number,
  ): Promise<void> {
    console.log('LOG_ROUTE_CACHE_BEFORE_SAVE', {
      called: true,
      awaited: true,
      supabaseConfigured: isSupabaseConfigured(),
      origin_key: buildOriginKey(
        originLat,
        originLng,
      ),
      destination_key: buildDestinationKey(
        destinationLat,
        destinationLng,
      ),
      distance_km: Number(distanceKm.toFixed(2)),
      source: 'openroute',
      geometryPoints: coordinates.length,
      geometrySample: coordinates.slice(0, 2),
    });

    if (!isSupabaseConfigured()) {
      console.log('LOG_ROUTE_CACHE_SUPABASE_ERROR', {
        action: 'save',
        message: 'supabase_not_configured',
        isRls: false,
        isConstraint: false,
        isJsonb: false,
      });

      return;
    }

    const originKey = buildOriginKey(
      originLat,
      originLng,
    );

    const destinationKey = buildDestinationKey(
      destinationLat,
      destinationLng,
    );

    const cacheKey = `${originKey}->${destinationKey}`;
    const source = 'openroute';

    const countBefore = await countRouteCacheRows();

    if (countBefore.error) {
      logSupabaseError('count_before', {
        cacheKey,
        origin_key: originKey,
        destination_key: destinationKey,
      }, countBefore.error);
    }

    const { data: existing, error: lookupError } =
      await supabase
        .from(TABLE)
        .select('id')
        .eq('origin_key', originKey)
        .eq('destination_key', destinationKey)
        .limit(1)
        .maybeSingle();

    if (lookupError) {
      logSupabaseError('save_lookup', {
        cacheKey,
        origin_key: originKey,
        destination_key: destinationKey,
        distance_km: Number(distanceKm.toFixed(2)),
        source,
      }, lookupError);

      return;
    }

    let saveMode: 'insert' | 'update' = 'insert';
    let savedId: string | null = null;
    let saveError: SupabaseErrorLike | null = null;

    if (existing?.id) {
      saveMode = 'update';

      const { data, error } = await supabase
        .from(TABLE)
        .update({
          distance_km: distanceKm,
          route_geometry: coordinates,
          source,
          created_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('id')
        .maybeSingle();

      savedId = data?.id ?? existing.id;
      saveError = error;
    } else {
      const { data, error } = await supabase
        .from(TABLE)
        .insert({
          origin_key: originKey,
          destination_key: destinationKey,
          distance_km: distanceKm,
          route_geometry: coordinates,
          source,
        })
        .select('id')
        .maybeSingle();

      savedId = data?.id ?? null;
      saveError = error;
    }

    const countAfter = await countRouteCacheRows();

    if (saveError) {
      logSupabaseError(saveMode, {
        cacheKey,
        origin_key: originKey,
        destination_key: destinationKey,
        distance_km: Number(distanceKm.toFixed(2)),
        source,
        geometryPoints: coordinates.length,
        rowCountBefore: countBefore.count,
        rowCountAfter: countAfter.count,
      }, saveError);

      return;
    }

    console.log('LOG_ROUTE_CACHE_AFTER_SAVE', {
      mode: saveMode,
      cacheKey,
      origin_key: originKey,
      destination_key: destinationKey,
      distance_km: Number(distanceKm.toFixed(2)),
      source,
      savedId,
      geometryPoints: coordinates.length,
      rowCountBefore: countBefore.count,
      rowCountAfter: countAfter.count,
    });

    console.log('LOG_ROUTE_CACHE_SAVE', {
      cacheKey,
      origin_key: originKey,
      destination_key: destinationKey,
      distance_km: Number(distanceKm.toFixed(2)),
      source,
      mode: saveMode,
      points: coordinates.length,
      rowCount: countAfter.count,
    });
  }
}

export const routeCacheService =
  new RouteCacheService();
