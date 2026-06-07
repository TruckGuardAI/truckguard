export const OPENROUTE_DIRECTIONS_URL =
  'https://api.openrouteservice.org/v2/directions/driving-car/geojson';

export const OPENROUTE_ENV_VAR =
  'EXPO_PUBLIC_OPENROUTE_API_KEY';

export type OpenRouteConfig = {
  apiKey: string;
  hasApiKey: boolean;
  keyPrefix: string | null;
  runtimeLoaded: boolean;
  runtimeKeyLength: number;
};

export class OpenRoutePlannerError extends Error {
  readonly code: string;

  readonly status: number | null;

  readonly responseBody: string;

  constructor(
    code: string,
    message: string,
    options?: {
      status?: number;
      responseBody?: string;
    },
  ) {
    super(message);
    this.name = 'OpenRoutePlannerError';
    this.code = code;
    this.status = options?.status ?? null;
    this.responseBody =
      options?.responseBody ?? '';
  }
}

export function getOpenRouteConfig(): OpenRouteConfig {
  const runtimeValue =
    process.env.EXPO_PUBLIC_OPENROUTE_API_KEY;
  const apiKey = runtimeValue?.trim() ?? '';

  const hasApiKey = apiKey.length > 0;

  const keyPrefix = hasApiKey
    ? apiKey.slice(0, 8)
    : null;

  return {
    apiKey,
    hasApiKey,
    keyPrefix,
    runtimeLoaded:
      typeof runtimeValue === 'string',
    runtimeKeyLength: runtimeValue?.length ?? 0,
  };
}

export function logOpenRouteConfig(
  url: string = OPENROUTE_DIRECTIONS_URL,
): OpenRouteConfig {
  const config = getOpenRouteConfig();

  console.log('LOG_OPENROUTE_CONFIG', {
    url,
    envVar: OPENROUTE_ENV_VAR,
    hasApiKey: config.hasApiKey,
    keyPrefix: config.keyPrefix,
    runtimeLoaded: config.runtimeLoaded,
    runtimeKeyLength: config.runtimeKeyLength,
    runtimeKeyTrimmedLength:
      config.apiKey.length,
  });

  return config;
}

export function isOpenRoutePlannerError(
  error: unknown,
): error is OpenRoutePlannerError {
  return error instanceof OpenRoutePlannerError;
}
