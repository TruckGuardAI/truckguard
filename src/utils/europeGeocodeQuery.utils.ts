import { normalizeLocationKey } from './locationNormalize.utils';

/**
 * Códigos ISO 3166-1 alpha-2 → nome em inglês para Nominatim.
 * Não é lista de cidades — apenas expansão de códigos de país (PT, ES, …).
 */
const EUROPE_ISO_TO_COUNTRY: Record<
  string,
  string
> = {
  ad: 'Andorra',
  al: 'Albania',
  at: 'Austria',
  ba: 'Bosnia and Herzegovina',
  be: 'Belgium',
  bg: 'Bulgaria',
  by: 'Belarus',
  ch: 'Switzerland',
  cy: 'Cyprus',
  cz: 'Czech Republic',
  de: 'Germany',
  dk: 'Denmark',
  ee: 'Estonia',
  es: 'Spain',
  fi: 'Finland',
  fr: 'France',
  gb: 'United Kingdom',
  uk: 'United Kingdom',
  gr: 'Greece',
  hr: 'Croatia',
  hu: 'Hungary',
  ie: 'Ireland',
  is: 'Iceland',
  it: 'Italy',
  li: 'Liechtenstein',
  lt: 'Lithuania',
  lu: 'Luxembourg',
  lv: 'Latvia',
  mc: 'Monaco',
  md: 'Moldova',
  me: 'Montenegro',
  mk: 'North Macedonia',
  mt: 'Malta',
  nl: 'Netherlands',
  no: 'Norway',
  pl: 'Poland',
  pt: 'Portugal',
  ro: 'Romania',
  rs: 'Serbia',
  se: 'Sweden',
  si: 'Slovenia',
  sk: 'Slovakia',
  sm: 'San Marino',
  ua: 'Ukraine',
  va: 'Vatican City',
};

export const EUROPE_NOMINATIM_COUNTRY_CODES =
  Object.keys(EUROPE_ISO_TO_COUNTRY)
    .filter((code) => code !== 'uk')
    .join(',');

export type NominatimQueryBuild = {
  q: string;
  isoExpanded: boolean;
  isoCode: string | null;
};

export function buildNominatimQuery(
  rawInput: string,
): NominatimQueryBuild {
  const trimmed = rawInput.trim();
  const key = normalizeLocationKey(trimmed);

  if (
    key.length === 2 &&
    EUROPE_ISO_TO_COUNTRY[key]
  ) {
    return {
      q: EUROPE_ISO_TO_COUNTRY[key],
      isoExpanded: true,
      isoCode: key.toUpperCase(),
    };
  }

  return {
    q: trimmed,
    isoExpanded: false,
    isoCode: null,
  };
}
