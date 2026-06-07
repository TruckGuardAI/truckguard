import type { RouteCoordinate } from '../types/route.types';

import {
  buildNominatimQuery,
  EUROPE_NOMINATIM_COUNTRY_CODES,
} from '../utils/europeGeocodeQuery.utils';

import { geocodeCacheService } from './geocodeCache.service';

const NOMINATIM_URL =
  'https://nominatim.openstreetmap.org/search';

const NOMINATIM_USER_AGENT =
  'TruckGuard/1.0 (route-planner; contact: support@truxafe.app)';

export type GeocodeResult = RouteCoordinate & {
  displayName: string;
};

export class GeocodeNotFoundError extends Error {
  readonly city: string;

  constructor(city: string) {
    super('GEOCODE_NOT_FOUND');
    this.name = 'GeocodeNotFoundError';
    this.city = city;
  }
}

function logGeocodeLookup(
  city: string,
  found: boolean,
  source: 'cache' | 'nominatim' | 'none',
  coordinates?: RouteCoordinate,
  displayName?: string,
): void {
  console.log('LOG_GEOCODE_LOOKUP', {
    city,
    found,
    source,
    displayName,
    latitude: coordinates?.latitude,
    longitude: coordinates?.longitude,
  });
}

async function cacheAndReturn(
  rawInput: string,
  result: GeocodeResult,
): Promise<GeocodeResult> {
  await geocodeCacheService.set(rawInput, {
    latitude: result.latitude,
    longitude: result.longitude,
    displayName: result.displayName,
    source: 'nominatim',
  });

  return result;
}

async function geocodeWithNominatim(
  placeName: string,
): Promise<GeocodeResult> {
  const { q, isoExpanded, isoCode } =
    buildNominatimQuery(placeName);

  const params = new URLSearchParams({
    q,
    format: 'json',
    limit: '1',
    addressdetails: '1',
    countrycodes: EUROPE_NOMINATIM_COUNTRY_CODES,
  });

  const url = `${NOMINATIM_URL}?${params.toString()}`;

  console.log('LOG_GEOCODE_NOMINATIM', {
    query: placeName,
    nominatimQuery: q,
    isoExpanded,
    isoCode,
    url,
  });

  const response = await fetch(url, {
    headers: {
      'User-Agent': NOMINATIM_USER_AGENT,
      Accept: 'application/json',
      'Accept-Language':
        'pt,en,de,fr,es,it,nl',
    },
  });

  const responseText = await response.text();

  console.log('LOG_GEOCODE_NOMINATIM', {
    query: placeName,
    status: response.status,
    ok: response.ok,
    bodyPreview: responseText.slice(0, 240),
  });

  if (!response.ok) {
    throw new GeocodeNotFoundError(placeName);
  }

  let data: {
    lat?: string;
    lon?: string;
    display_name?: string;
  }[];

  try {
    data = JSON.parse(responseText) as {
      lat?: string;
      lon?: string;
      display_name?: string;
    }[];
  } catch {
    throw new GeocodeNotFoundError(placeName);
  }

  const first = data[0];

  if (!first?.lat || !first?.lon) {
    throw new GeocodeNotFoundError(placeName);
  }

  const latitude = Number(first.lat);
  const longitude = Number(first.lon);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    throw new GeocodeNotFoundError(placeName);
  }

  return {
    latitude,
    longitude,
    displayName:
      first.display_name ?? q,
  };
}

export async function resolvePlaceCoordinates(
  placeName: string,
): Promise<RouteCoordinate> {
  const trimmed = placeName.trim();

  if (!trimmed) {
    logGeocodeLookup(
      trimmed,
      false,
      'none',
    );

    throw new Error('PLACE_NAME_EMPTY');
  }

  const cached =
    await geocodeCacheService.get(trimmed);

  if (cached) {
    geocodeCacheService.logCacheHit(
      trimmed,
      cached,
    );

    const coordinates: GeocodeResult = {
      latitude: cached.latitude,
      longitude: cached.longitude,
      displayName: cached.displayName,
    };

    logGeocodeLookup(
      trimmed,
      true,
      'cache',
      coordinates,
      coordinates.displayName,
    );

    return coordinates;
  }

  try {
    const result =
      await geocodeWithNominatim(trimmed);

    logGeocodeLookup(
      trimmed,
      true,
      'nominatim',
      result,
      result.displayName,
    );

    await cacheAndReturn(trimmed, result);

    return result;
  } catch (error) {
    if (error instanceof GeocodeNotFoundError) {
      logGeocodeLookup(
        trimmed,
        false,
        'none',
      );

      throw error;
    }

    logGeocodeLookup(
      trimmed,
      false,
      'none',
    );

    throw new GeocodeNotFoundError(trimmed);
  }
}

export async function resolvePlace(
  placeName: string,
): Promise<GeocodeResult> {
  const coordinates =
    await resolvePlaceCoordinates(placeName);

  const cached =
    geocodeCacheService.getSync(placeName);

  return {
    ...coordinates,
    displayName:
      cached?.displayName ?? placeName.trim(),
  };
}

export function isGeocodeNotFoundError(
  error: unknown,
): error is GeocodeNotFoundError {
  return (
    error instanceof GeocodeNotFoundError ||
    (
      error instanceof Error &&
      error.message === 'GEOCODE_NOT_FOUND'
    )
  );
}
