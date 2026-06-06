import type { Alert, AlertAlongRoute } from '../types/alert.types';

import type {
  CalculatedRoute,
  RouteCoordinate,
  RouteEndpoint,
} from '../types/route.types';

import { DEFAULT_TRIP } from '../types/route.types';

import {
  buildStraightLineRoute,
  decodeGooglePolyline,
  locatePointOnRoute,
  totalRouteLengthKm,
} from '../utils/routeGeometry.utils';

import type { UserCoordinates } from './location.service';

const OPENROUTE_URL =
  'https://api.openrouteservice.org/v2/directions/driving-car/geojson';

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

  private async fetchOpenRoute(
    originLat: number,
    originLng: number,
    destinationLat: number,
    destinationLng: number,
  ): Promise<RouteCoordinate[] | null> {
    const apiKey =
      process.env.EXPO_PUBLIC_OPENROUTE_API_KEY ?? '';

    if (!apiKey) {
      return null;
    }

    const response = await fetch(OPENROUTE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify({
        coordinates: [
          [originLng, originLat],
          [destinationLng, destinationLat],
        ],
      }),
    });

    if (!response.ok) {
      console.log(
        'OpenRouteService erro:',
        response.status,
      );
      return null;
    }

    const data = (await response.json()) as {
      features?: {
        geometry?: {
          coordinates?: number[][];
        };
      }[];
    };

    const coordinates =
      data.features?.[0]?.geometry?.coordinates;

    if (!coordinates || coordinates.length < 2) {
      return null;
    }

    return mapGeoJsonCoordinates(coordinates);
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
