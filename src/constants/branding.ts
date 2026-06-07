export const TRUXAFE_LOGO = require(
  '../../assets/branding/truxafe-logo.png',
);

export const TRUXAFE_LOGO_SIZES = {
  header: 90,
  headerMd: 150,
  home: 180,
  login: 350,
  splash: 350,
} as const;

export const TRUXAFE_WORDMARK_SIZES = {
  splash: 48,
  header: 28,
} as const;

export const TRUXAFE_HEADER_HEIGHT = 100;

export type TruxafeLogoSize =
  keyof typeof TRUXAFE_LOGO_SIZES;
