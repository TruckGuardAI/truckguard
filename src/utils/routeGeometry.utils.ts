import { locationService } from '../services/location.service';

import type { RouteCoordinate } from '../types/route.types';

export type PointOnRoute = {
  distanceAlongRouteKm: number;
  distanceToRouteKm: number;
};

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function interpolate(
  start: RouteCoordinate,
  end: RouteCoordinate,
  fraction: number,
): RouteCoordinate {
  return {
    latitude:
      start.latitude +
      (end.latitude - start.latitude) * fraction,
    longitude:
      start.longitude +
      (end.longitude - start.longitude) * fraction,
  };
}

export function segmentLengthKm(
  start: RouteCoordinate,
  end: RouteCoordinate,
): number {
  return locationService.calculateDistanceKm(
    start.latitude,
    start.longitude,
    end.latitude,
    end.longitude,
  );
}

export function totalRouteLengthKm(
  coordinates: RouteCoordinate[],
): number {
  if (coordinates.length < 2) {
    return 0;
  }

  let total = 0;

  for (let i = 0; i < coordinates.length - 1; i += 1) {
    total += segmentLengthKm(
      coordinates[i],
      coordinates[i + 1],
    );
  }

  return total;
}

export function distancePointToSegmentKm(
  point: RouteCoordinate,
  segmentStart: RouteCoordinate,
  segmentEnd: RouteCoordinate,
): { distanceKm: number; fraction: number } {
  const segLen = segmentLengthKm(segmentStart, segmentEnd);

  if (segLen === 0) {
    return {
      distanceKm: locationService.calculateDistanceKm(
        point.latitude,
        point.longitude,
        segmentStart.latitude,
        segmentStart.longitude,
      ),
      fraction: 0,
    };
  }

  const latMid =
    (segmentStart.latitude + segmentEnd.latitude) / 2;
  const latRad = toRad(latMid);

  const x1 =
    toRad(segmentStart.longitude) *
    Math.cos(latRad);
  const y1 = toRad(segmentStart.latitude);
  const x2 =
    toRad(segmentEnd.longitude) * Math.cos(latRad);
  const y2 = toRad(segmentEnd.latitude);
  const xp =
    toRad(point.longitude) * Math.cos(latRad);
  const yp = toRad(point.latitude);

  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  let fraction =
    lenSq === 0
      ? 0
      : ((xp - x1) * dx + (yp - y1) * dy) / lenSq;

  fraction = Math.max(0, Math.min(1, fraction));

  const projected = interpolate(
    segmentStart,
    segmentEnd,
    fraction,
  );

  const distanceKm = locationService.calculateDistanceKm(
    point.latitude,
    point.longitude,
    projected.latitude,
    projected.longitude,
  );

  return { distanceKm, fraction };
}

export function locatePointOnRoute(
  point: RouteCoordinate,
  route: RouteCoordinate[],
): PointOnRoute {
  if (route.length === 0) {
    return {
      distanceAlongRouteKm: 0,
      distanceToRouteKm: Infinity,
    };
  }

  if (route.length === 1) {
    return {
      distanceAlongRouteKm: 0,
      distanceToRouteKm: locationService.calculateDistanceKm(
        point.latitude,
        point.longitude,
        route[0].latitude,
        route[0].longitude,
      ),
    };
  }

  let bestDistanceToRoute = Infinity;
  let bestAlong = 0;
  let cumulative = 0;

  for (let i = 0; i < route.length - 1; i += 1) {
    const start = route[i];
    const end = route[i + 1];
    const segLen = segmentLengthKm(start, end);
    const projection = distancePointToSegmentKm(
      point,
      start,
      end,
    );

    const along = cumulative + segLen * projection.fraction;

    if (projection.distanceKm < bestDistanceToRoute) {
      bestDistanceToRoute = projection.distanceKm;
      bestAlong = along;
    }

    cumulative += segLen;
  }

  return {
    distanceAlongRouteKm: bestAlong,
    distanceToRouteKm: bestDistanceToRoute,
  };
}

export function decodeGooglePolyline(
  encoded: string,
): RouteCoordinate[] {
  const coordinates: RouteCoordinate[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return coordinates;
}

export function buildStraightLineRoute(
  originLat: number,
  originLng: number,
  destinationLat: number,
  destinationLng: number,
  steps = 48,
): RouteCoordinate[] {
  const coordinates: RouteCoordinate[] = [];

  for (let i = 0; i <= steps; i += 1) {
    const fraction = i / steps;
    coordinates.push({
      latitude:
        originLat +
        (destinationLat - originLat) * fraction,
      longitude:
        originLng +
        (destinationLng - originLng) * fraction,
    });
  }

  return coordinates;
}
