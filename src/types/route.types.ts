export type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

export type RouteEndpoint = RouteCoordinate & {
  name: string;
};

export type CalculatedRoute = {
  coordinates: RouteCoordinate[];
  distanceKm: number;
  origin: RouteEndpoint;
  destination: RouteEndpoint;
};

export const DEFAULT_TRIP: {
  origin: RouteEndpoint;
  destination: RouteEndpoint;
} = {
  origin: {
    name: 'Porto',
    latitude: 41.1579,
    longitude: -8.6291,
  },
  destination: {
    name: 'Madrid',
    latitude: 40.4168,
    longitude: -3.7038,
  },
};
