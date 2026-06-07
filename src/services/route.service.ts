import type { Alert, AlertAlongRoute } from '../types/alert.types';

import type {
  CalculatedRoute,
  PlannerRouteResult,
  RouteCoordinate,
  RouteEndpoint,
} from '../types/route.types';

import {
  getOpenRouteConfig,
  logOpenRouteConfig,
  OPENROUTE_DIRECTIONS_URL,
  OpenRoutePlannerError,
} from './openRoute.config';

import {
  isTlsCertificateError,
  TLS_CERTIFICATE_ERROR_CODE,
} from '../utils/tlsError.utils';

import {
  buildRouteCacheKey,
  routeCacheService,
} from './routeCache.service';

import { DEFAULT_TRIP } from '../types/route.types';

import {
  buildStraightLineRoute,
  decodeGooglePolyline,
  locatePointOnRoute,
  totalRouteLengthKm,
} from '../utils/routeGeometry.utils';

import type { UserCoordinates } from './location.service';

const GOOGLE_DIRECTIONS_URL =
  'https://maps.googleapis.com/maps/api/directions/json';

const DEFAULT_CORRIDOR_KM = 2;

function mapGeoJsonCoordinates(
  coords: number[][],
): RouteCoordinate[] {
  return coords.map(([longitude, latitude]) => ({
    latitude,
    longitude,
  }));
}

class RouteService {
  private cachedRoute: CalculatedRoute | null = null;

  private cachedRouteKey: string | null = null;

  private buildRouteKey(
    originLat: number,
    originLng: number,
    destinationLat: number,
    destinationLng: number,
  ): string {
    return `${originLat},${originLng}->${destinationLat},${destinationLng}`;
  }

  async calculatePlannerRoute(
    originLat: number,
    originLng: number,
    destinationLat: number,
    destinationLng: number,
    originName: string,
    destinationName: string,
  ): Promise<PlannerRouteResult> {
    console.log('LOG_ROUTE_START', {
      origem: originName,
      destino: destinationName,
    });

    const config = logOpenRouteConfig(
      OPENROUTE_DIRECTIONS_URL,
    );

    if (!config.hasApiKey) {
      console.log('LOG_OPENROUTE_ERROR', {
        kind: 'directions',
        url: OPENROUTE_DIRECTIONS_URL,
        keyPrefix: null,
        status: null,
        body: null,
        reason: 'missing_api_key',
        envVar: 'EXPO_PUBLIC_OPENROUTE_API_KEY',
        runtimeLoaded: config.runtimeLoaded,
      });

      throw new OpenRoutePlannerError(
        'OPENROUTE_API_NOT_CONFIGURED',
        'OpenRoute API key não configurada no runtime Expo',
      );
    }

    const origin: RouteEndpoint = {
      name: originName,
      latitude: originLat,
      longitude: originLng,
    };

    const destination: RouteEndpoint = {
      name: destinationName,
      latitude: destinationLat,
      longitude: destinationLng,
    };

    const coordinates =
      await this.fetchOpenRouteDirections(
        originLat,
        originLng,
        destinationLat,
        destinationLng,
      );

    const route: CalculatedRoute = {
      coordinates,
      distanceKm: totalRouteLengthKm(
        coordinates,
      ),
      origin,
      destination,
      source: 'openroute',
    };

    const routeKey = this.buildRouteKey(
      originLat,
      originLng,
      destinationLat,
      destinationLng,
    );

    this.cachedRoute = route;
    this.cachedRouteKey = routeKey;

    console.log('LOG_ROUTE_SUCCESS', {
      origem: originName,
      destino: destinationName,
      distanciaKm: Number(
        route.distanceKm.toFixed(2),
      ),
      pontos: coordinates.length,
      source: 'openroute',
    });

    return {
      route,
      source: 'openroute',
    };
  }

  async calculateRoute(
    originLat: number,
    originLng: number,
    destinationLat: number,
    destinationLng: number,
    originName = 'Origem',
    destinationName = 'Destino',
  ): Promise<CalculatedRoute> {
    const routeKey = this.buildRouteKey(
      originLat,
      originLng,
      destinationLat,
      destinationLng,
    );

    if (
      this.cachedRoute &&
      this.cachedRouteKey === routeKey
    ) {
      return this.cachedRoute;
    }

    const origin: RouteEndpoint = {
      name: originName,
      latitude: originLat,
      longitude: originLng,
    };

    const destination: RouteEndpoint = {
      name: destinationName,
      latitude: destinationLat,
      longitude: destinationLng,
    };

    try {
      const fromOpenRoute =
        await this.fetchOpenRoute(
          originLat,
          originLng,
          destinationLat,
          destinationLng,
        );

      if (fromOpenRoute) {
        const route: CalculatedRoute = {
          coordinates: fromOpenRoute,
          distanceKm: totalRouteLengthKm(fromOpenRoute),
          origin,
          destination,
        };

        this.cachedRoute = route;
        this.cachedRouteKey = routeKey;
        return route;
      }

      const fromGoogle = await this.fetchGoogleDirections(
        originLat,
        originLng,
        destinationLat,
        destinationLng,
      );

      if (fromGoogle) {
        const route: CalculatedRoute = {
          coordinates: fromGoogle,
          distanceKm: totalRouteLengthKm(fromGoogle),
          origin,
          destination,
        };

        this.cachedRoute = route;
        this.cachedRouteKey = routeKey;
        return route;
      }
    } catch (error) {
      console.log('Erro calculateRoute:', error);
    }

    const fallbackCoordinates = buildStraightLineRoute(
      originLat,
      originLng,
      destinationLat,
      destinationLng,
    );

    const fallbackRoute: CalculatedRoute = {
      coordinates: fallbackCoordinates,
      distanceKm: totalRouteLengthKm(
        fallbackCoordinates,
      ),
      origin,
      destination,
    };

    this.cachedRoute = fallbackRoute;
    this.cachedRouteKey = routeKey;

    return fallbackRoute;
  }

  private async fetchOpenRouteDirections(
    originLat: number,
    originLng: number,
    destinationLat: number,
    destinationLng: number,
  ): Promise<RouteCoordinate[]> {
    const cacheKey = buildRouteCacheKey(
      originLat,
      originLng,
      destinationLat,
      destinationLng,
    );

    const cachedEntry =
      await routeCacheService.get(
        originLat,
        originLng,
        destinationLat,
        destinationLng,
      );

    if (cachedEntry) {
      console.log('LOG_ROUTE_CACHE_HIT', {
        cacheKey,
        points: cachedEntry.coordinates.length,
        distanceKm: Number(
          cachedEntry.distanceKm.toFixed(2),
        ),
        source: cachedEntry.source,
        createdAt: cachedEntry.createdAt,
        expiresAt: cachedEntry.expiresAt,
      });

      return cachedEntry.coordinates;
    }

    console.log('LOG_ROUTE_CACHE_MISS', {
      cacheKey,
      originLat,
      originLng,
      destinationLat,
      destinationLng,
    });

    const { apiKey, hasApiKey, keyPrefix } =
      getOpenRouteConfig();

    if (!hasApiKey) {
      throw new OpenRoutePlannerError(
        'OPENROUTE_API_NOT_CONFIGURED',
        'OpenRoute API key não configurada',
      );
    }

    const requestBody = {
      coordinates: [
        [originLng, originLat],
        [destinationLng, destinationLat],
      ],
    };

    console.log('LOG_OPENROUTE_REQUEST', {
      kind: 'directions',
      url: OPENROUTE_DIRECTIONS_URL,
      keyPrefix,
      method: 'POST',
      coordinates: requestBody.coordinates,
    });

    let response: Response;
    let responseText = '';

    try {
      response = await fetch(
        OPENROUTE_DIRECTIONS_URL,
        {
          method: 'POST',
          headers: {
            Accept:
              'application/json, application/geo+json;charset=utf-8',
            'Content-Type':
              'application/json; charset=utf-8',
            Authorization: apiKey,
          },
          body: JSON.stringify(requestBody),
        },
      );

      responseText = await response.text();
    } catch (error) {
      if (isTlsCertificateError(error)) {
        console.log('LOG_OPENROUTE_ERROR', {
          kind: 'directions',
          url: OPENROUTE_DIRECTIONS_URL,
          keyPrefix,
          status: null,
          body: null,
          reason: TLS_CERTIFICATE_ERROR_CODE,
          error:
            error instanceof Error
              ? error.message
              : String(error),
        });

        throw new OpenRoutePlannerError(
          TLS_CERTIFICATE_ERROR_CODE,
          TLS_CERTIFICATE_ERROR_CODE,
        );
      }

      console.log('LOG_OPENROUTE_ERROR', {
        kind: 'directions',
        url: OPENROUTE_DIRECTIONS_URL,
        keyPrefix,
        status: null,
        body: null,
        reason: 'network_error',
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });

      throw error;
    }

    console.log('LOG_OPENROUTE_RESPONSE', {
      kind: 'directions',
      url: OPENROUTE_DIRECTIONS_URL,
      keyPrefix,
      status: response.status,
      ok: response.ok,
      body: responseText,
    });

    if (!response.ok) {
      console.log('LOG_OPENROUTE_ERROR', {
        kind: 'directions',
        url: OPENROUTE_DIRECTIONS_URL,
        keyPrefix,
        status: response.status,
        body: responseText,
      });

      throw new OpenRoutePlannerError(
        'OPENROUTE_HTTP_ERROR',
        `OpenRouteService HTTP ${response.status}`,
        {
          status: response.status,
          responseBody: responseText,
        },
      );
    }

    let data: {
      features?: {
        geometry?: {
          coordinates?: number[][];
        };
      }[];
    };

    try {
      data = JSON.parse(responseText) as {
        features?: {
          geometry?: {
            coordinates?: number[][];
          };
        }[];
      };
    } catch {
      console.log('LOG_OPENROUTE_ERROR', {
        kind: 'directions',
        url: OPENROUTE_DIRECTIONS_URL,
        keyPrefix,
        status: response.status,
        body: responseText,
        reason: 'invalid_json',
      });

      throw new OpenRoutePlannerError(
        'OPENROUTE_INVALID_JSON',
        'OpenRouteService resposta inválida',
        {
          status: response.status,
          responseBody: responseText,
        },
      );
    }

    const coordinates =
      data.features?.[0]?.geometry?.coordinates;

    if (!coordinates || coordinates.length < 2) {
      console.log('LOG_OPENROUTE_ERROR', {
        kind: 'directions',
        url: OPENROUTE_DIRECTIONS_URL,
        keyPrefix,
        status: response.status,
        body: responseText,
        reason: 'empty_geometry',
      });

      throw new OpenRoutePlannerError(
        'OPENROUTE_EMPTY_GEOMETRY',
        'OpenRouteService devolveu rota inválida',
        {
          status: response.status,
          responseBody: responseText,
        },
      );
    }

    const mappedCoordinates =
      mapGeoJsonCoordinates(coordinates);

    const distanceKm = totalRouteLengthKm(
      mappedCoordinates,
    );

    await routeCacheService.save(
      originLat,
      originLng,
      destinationLat,
      destinationLng,
      mappedCoordinates,
      distanceKm,
    );

    console.log('LOG_ROUTE_CACHE_SAVED', {
      cacheKey,
      points: mappedCoordinates.length,
      distanceKm: Number(distanceKm.toFixed(2)),
      ttlDays: 60,
    });

    return mappedCoordinates;
  }

  private async fetchOpenRoute(
    originLat: number,
    originLng: number,
    destinationLat: number,
    destinationLng: number,
  ): Promise<RouteCoordinate[] | null> {
    try {
      return await this.fetchOpenRouteDirections(
        originLat,
        originLng,
        destinationLat,
        destinationLng,
      );
    } catch (error) {
      console.log(
        'OpenRouteService erro:',
        error,
      );

      return null;
    }
  }

  private async fetchGoogleDirections(
    originLat: number,
    originLng: number,
    destinationLat: number,
    destinationLng: number,
  ): Promise<RouteCoordinate[] | null> {
    const apiKey =
      process.env.EXPO_PUBLIC_GOOGLE_DIRECTIONS_API_KEY ??
      '';

    if (!apiKey) {
      return null;
    }

    const url =
      `${GOOGLE_DIRECTIONS_URL}?origin=${originLat},${originLng}` +
      `&destination=${destinationLat},${destinationLng}` +
      `&key=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      routes?: {
        overview_polyline?: {
          points?: string;
        };
      }[];
    };

    const encoded =
      data.routes?.[0]?.overview_polyline?.points;

    if (!encoded) {
      return null;
    }

    const decoded = decodeGooglePolyline(encoded);

    return decoded.length >= 2 ? decoded : null;
  }

  findAlertsAlongRoute(
    routeCoordinates: RouteCoordinate[],
    alerts: Alert[],
    radiusKm: number = DEFAULT_CORRIDOR_KM,
    userLocation?: UserCoordinates,
  ): AlertAlongRoute[] {
    if (routeCoordinates.length < 2) {
      return [];
    }

    const userOnRoute = userLocation
      ? locatePointOnRoute(userLocation, routeCoordinates)
      : {
          distanceAlongRouteKm: 0,
          distanceToRouteKm: 0,
        };

    const alongRoute: AlertAlongRoute[] = [];

    for (const alert of alerts) {
      const alertPoint: RouteCoordinate = {
        latitude: alert.latitude,
        longitude: alert.longitude,
      };

      const alertOnRoute = locatePointOnRoute(
        alertPoint,
        routeCoordinates,
      );

      if (alertOnRoute.distanceToRouteKm > radiusKm) {
        continue;
      }

      const distanceAheadKm = Math.max(
        0,
        Math.round(
          (alertOnRoute.distanceAlongRouteKm -
            userOnRoute.distanceAlongRouteKm) *
            10,
        ) / 10,
      );

      if (
        userLocation !== undefined &&
        distanceAheadKm <= 0
      ) {
        continue;
      }

      alongRoute.push({
        ...alert,
        distanceToRouteKm:
          Math.round(alertOnRoute.distanceToRouteKm * 10) /
          10,
        distanceAheadKm,
        distance: userLocation
          ? distanceAheadKm
          : alert.distance,
      });
    }

    return alongRoute.sort(
      (a, b) => a.distanceAheadKm - b.distanceAheadKm,
    );
  }

  async calculateDefaultTripRoute(): Promise<CalculatedRoute> {
    return this.calculateRoute(
      DEFAULT_TRIP.origin.latitude,
      DEFAULT_TRIP.origin.longitude,
      DEFAULT_TRIP.destination.latitude,
      DEFAULT_TRIP.destination.longitude,
      DEFAULT_TRIP.origin.name,
      DEFAULT_TRIP.destination.name,
    );
  }

  getCachedRoute(): CalculatedRoute | null {
    return this.cachedRoute;
  }

  clearCache(): void {
    this.cachedRoute = null;
    this.cachedRouteKey = null;
  }
}

export const routeService = new RouteService();
