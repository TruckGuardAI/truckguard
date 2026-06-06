/**
 * TRUXAFE — typography system
 * European industrial luxury × cybersecurity dashboard × tactical logistics.
 * Optimized for dark UI, glanceability, and in-cab readability (Expo / RN).
 */

import { Platform, TextStyle } from 'react-native';

/** Platform UI sans — SF Pro (iOS) / Roboto (Android) */
const sans: TextStyle = Platform.select({
  ios: {},
  android: { fontFamily: 'sans-serif' },
  default: {},
}) as TextStyle;

/** Telemetry / fleet codes — aligned figures across platforms */
const mono: TextStyle = Platform.select({
  ios: {
    fontFamily: 'Menlo',
    fontVariant: ['tabular-nums'],
  },
  android: { fontFamily: 'monospace' },
  default: { fontFamily: 'monospace' },
}) as TextStyle;

export type TypographyRole =
  | 'display'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'button'
  | 'status'
  | 'alert';

/**
 * Canonical text styles — pair with `colors.text*` for color.
 * Sizes tuned for dark matte backgrounds (slightly open line heights).
 */
export const truxafeTypography = {
  /** Hero / splash — confident, minimal */
  display: {
    ...sans,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '600',
    letterSpacing: -0.75,
  },

  /** Primary screen title */
  title: {
    ...sans,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '600',
    letterSpacing: -0.45,
  },

  /** Section leaders, module headers */
  heading: {
    ...sans,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: -0.25,
  },

  /** Card titles, list section labels */
  subheading: {
    ...sans,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '500',
    letterSpacing: 0.15,
  },

  /** Default reading — primary operational copy */
  body: {
    ...sans,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: 0.15,
  },

  /** Secondary dense UI, metadata blocks */
  bodySmall: {
    ...sans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0.12,
  },

  /** Timestamps, table footers, legal microcopy */
  caption: {
    ...sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.35,
  },

  /** Primary actions — legible at arm’s length */
  button: {
    ...sans,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0.55,
  },

  /** Fleet state, coordinates, counters — operational */
  status: {
    ...mono,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    letterSpacing: 0.4,
  },

  /** Banners, inline critical notices — high clarity, not display-sized */
  alert: {
    ...sans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
} as const satisfies Record<TypographyRole, TextStyle>;

export type TruxafeTypography = typeof truxafeTypography;

// ---------------------------------------------------------------------------
// Role aliases (optional ergonomic imports)
// ---------------------------------------------------------------------------

export const display = truxafeTypography.display;
export const title = truxafeTypography.title;
export const heading = truxafeTypography.heading;
export const subheading = truxafeTypography.subheading;
export const body = truxafeTypography.body;
export const bodySmall = truxafeTypography.bodySmall;
export const caption = truxafeTypography.caption;
export const button = truxafeTypography.button;
export const status = truxafeTypography.status;
export const alert = truxafeTypography.alert;
