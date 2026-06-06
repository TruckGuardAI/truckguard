/**
 * TRUXAFE — production color system
 * Tactical dark UI, matte blacks, deep blue-black surfaces,
 * muted industrial orange primary, SOS-only danger red.
 * React Native / Expo: use string tokens with StyleSheet or theme provider.
 *
 * Canonical values live on `truxafeColors`; top-level exports are thin aliases.
 */

// ---------------------------------------------------------------------------
// Theme — single source of truth (edit here)
// ---------------------------------------------------------------------------

export const truxafeColors = {
  background: '#070708',
  surface: '#0E1118',
  surfaceSecondary: '#131722',
  primary: '#B86B3A',
  primaryMuted: '#8F5230',
  /** SOS / life-safety only — do not use for generic errors */
  danger: '#D32F36',
  success: '#4F7D62',
  warning: '#9E7A3A',
  textPrimary: '#ECEEF1',
  textSecondary: '#9AA1AE',
  textMuted: '#6B7283',
  border: 'rgba(236, 238, 241, 0.08)',
  card: '#181D2A',
  overlay: 'rgba(4, 5, 8, 0.78)',
  shadow: 'rgba(0, 0, 0, 0.55)',
  /** Radar / pulse rings — use with Animated opacity */
  radarPulse: {
    strong: 'rgba(184, 107, 58, 0.55)',
    mid: 'rgba(184, 107, 58, 0.28)',
    soft: 'rgba(184, 107, 58, 0.12)',
    core: 'rgba(184, 107, 58, 0.85)',
  },
  /** Glassmorphism: pair with BlurView / expo-blur */
  glass: {
    fill: 'rgba(19, 23, 34, 0.72)',
    fillStrong: 'rgba(14, 17, 24, 0.88)',
    stroke: 'rgba(236, 238, 241, 0.12)',
    strokeMuted: 'rgba(236, 238, 241, 0.06)',
    highlight: 'rgba(255, 255, 255, 0.04)',
  },
} as const;

// ---------------------------------------------------------------------------
// Semantic exports (aliases into `truxafeColors`)
// ---------------------------------------------------------------------------

export const background = truxafeColors.background;
export const surface = truxafeColors.surface;
export const surfaceSecondary = truxafeColors.surfaceSecondary;
export const primary = truxafeColors.primary;
export const primaryMuted = truxafeColors.primaryMuted;
export const danger = truxafeColors.danger;
export const success = truxafeColors.success;
export const warning = truxafeColors.warning;
export const textPrimary = truxafeColors.textPrimary;
export const textSecondary = truxafeColors.textSecondary;
export const textMuted = truxafeColors.textMuted;
export const border = truxafeColors.border;
export const card = truxafeColors.card;
export const overlay = truxafeColors.overlay;
export const shadow = truxafeColors.shadow;
export const radarPulse = truxafeColors.radarPulse;
export const glass = truxafeColors.glass;

export const truxafeTheme = {
  colors: truxafeColors,
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TruxafeColorKey = keyof typeof truxafeColors;

export type TruxafeColors = typeof truxafeColors;

export type TruxafeTheme = typeof truxafeTheme;

export type RadarPulseLayer = keyof typeof truxafeColors.radarPulse;

export type GlassToken = keyof typeof truxafeColors.glass;
