import * as Location from 'expo-location';

export const LOCATION_UNAVAILABLE =
  'Localização indisponível';

export const LOCATION_UNKNOWN =
  'Desconhecido';

export type NormalizedLocation = {
  location_text: string;
  city: string | null;
  region: string | null;
  country: string | null;
  description: string;
};

export type LocationReadableRow = {
  location_text?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  description?: string | null;
};

export type ResolvedLocation = {
  location_text: string;
  city: string;
  region: string | null;
  country: string;
  displayText: string;
  source: 'database' | 'description';
};

export function buildLocationDescription(
  street?: string,
  city?: string,
  region?: string,
  country?: string,
): string {
  return [street, city, region, country]
    .filter(Boolean)
    .join(', ');
}

function isCoordinateDescription(
  text: string,
): boolean {
  const parts = text
    .split(',')
    .map((part) => part.trim());

  if (parts.length !== 2) {
    return false;
  }

  return parts.every((part) =>
    Number.isFinite(Number(part)),
  );
}

export function parseLocationFromDescription(
  description: string | null,
): {
  location_text: string;
  city: string;
  region: string | null;
  country: string;
} {
  const text = (description ?? '').trim();

  if (!text) {
    return {
      location_text: LOCATION_UNAVAILABLE,
      city: LOCATION_UNKNOWN,
      region: null,
      country: LOCATION_UNKNOWN,
    };
  }

  if (isCoordinateDescription(text)) {
    return {
      location_text: text,
      city: text,
      region: null,
      country: LOCATION_UNKNOWN,
    };
  }

  const parts = text
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return {
      location_text: LOCATION_UNAVAILABLE,
      city: LOCATION_UNKNOWN,
      region: null,
      country: LOCATION_UNKNOWN,
    };
  }

  if (parts.length === 1) {
    return {
      location_text: parts[0],
      city: parts[0],
      region: null,
      country: LOCATION_UNKNOWN,
    };
  }

  if (parts.length === 2) {
    return {
      location_text: parts[0],
      city: parts[0],
      region: null,
      country: parts[1],
    };
  }

  if (parts.length === 3) {
    return {
      location_text: parts[0],
      city: parts[1],
      region: null,
      country: parts[2],
    };
  }

  return {
    location_text: parts[0],
    city: parts[1],
    region: parts[2],
    country: parts[parts.length - 1],
  };
}

export function resolveLocationFromRow(
  row: LocationReadableRow,
): ResolvedLocation {
  const dbCity = row.city?.trim();
  const dbCountry = row.country?.trim();
  const dbLocationText =
    row.location_text?.trim();
  const dbRegion = row.region?.trim();

  const hasDbCityCountry =
    Boolean(dbCity) &&
    Boolean(dbCountry);

  if (hasDbCityCountry) {
    const location_text =
      dbLocationText ||
      dbCity ||
      LOCATION_UNAVAILABLE;

    const displayText =
      buildLocationDescription(
        location_text !== dbCity
          ? location_text
          : undefined,
        dbCity,
        dbRegion ?? undefined,
        dbCountry,
      ) || location_text;

    return {
      location_text,
      city: dbCity!,
      region: dbRegion ?? null,
      country: dbCountry!,
      displayText,
      source: 'database',
    };
  }

  const parsed =
    parseLocationFromDescription(
      row.description ?? null,
    );

  const displayText =
    (row.description ?? '').trim() ||
    parsed.location_text;

  return {
    location_text: parsed.location_text,
    city: parsed.city,
    region: parsed.region,
    country: parsed.country,
    displayText,
    source: 'description',
  };
}

export function formatAlertLocationDisplay(
  description?: string | null,
  locationText?: string | null,
): string {
  const resolved =
    resolveLocationFromRow({
      location_text: locationText,
      description,
    });

  return resolved.displayText.length > 0
    ? resolved.displayText
    : LOCATION_UNAVAILABLE;
}

function buildNormalizedFromPlace(
  place: Location.LocationGeocodedAddress | undefined,
  latitude: number,
  longitude: number,
): NormalizedLocation {
  const location_text =
    place?.street ??
    place?.name ??
    null;

  const city =
    place?.city ??
    place?.subregion ??
    null;

  const region =
    place?.region ??
    place?.district ??
    null;

  const country = place?.country ?? null;

  const description =
    buildLocationDescription(
      location_text ?? undefined,
      city ?? undefined,
      region ?? undefined,
      country ?? undefined,
    ) ||
    `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

  const fallbackText = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

  return {
    location_text:
      location_text?.trim() ||
      city?.trim() ||
      fallbackText,
    city: city?.trim() || null,
    region: region?.trim() || null,
    country: country?.trim() || null,
    description,
  };
}

export async function resolveNormalizedLocation(
  latitude: number,
  longitude: number,
): Promise<NormalizedLocation> {
  try {
    const result =
      await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

    console.log(
      'ALERT_LOCATION_RAW',
      result,
    );

    const normalized =
      buildNormalizedFromPlace(
        result?.[0],
        latitude,
        longitude,
      );

    console.log(
      'ALERT_LOCATION_NORMALIZED',
      {
        location_text:
          normalized.location_text,
        city: normalized.city,
        region: normalized.region,
        country: normalized.country,
      },
    );

    if (normalized.city) {
      console.log(
        'ALERT_LOCATION_CITY',
        normalized.city,
      );
    }

    if (normalized.country) {
      console.log(
        'ALERT_LOCATION_COUNTRY',
        normalized.country,
      );
    }

    console.log(
      'ALERT_LOCATION_DESCRIPTION',
      normalized.description,
    );

    return normalized;
  } catch (error) {
    const fallback = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

    console.log(
      'ALERT_LOCATION_RAW',
      error,
    );

    const normalized: NormalizedLocation = {
      location_text: fallback,
      city: null,
      region: null,
      country: null,
      description: fallback,
    };

    console.log(
      'ALERT_LOCATION_NORMALIZED',
      normalized,
    );

    console.log(
      'ALERT_LOCATION_DESCRIPTION',
      fallback,
    );

    return normalized;
  }
}

export async function resolveLocationDescription(
  latitude: number,
  longitude: number,
): Promise<string> {
  const normalized =
    await resolveNormalizedLocation(
      latitude,
      longitude,
    );

  return normalized.description;
}
