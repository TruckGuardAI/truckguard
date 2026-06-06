/**
 * TRUXAFE — design system barrel
 *
 * Use `theme` for composed access (`theme.colors`, `theme.typography`, …).
 * Import `@/theme/colors`, `@/theme/shadows`, etc. when you need leaf tokens
 * (`card` color vs `card` shadow share names across modules).
 */

import { truxafeColors, truxafeTheme } from './colors';
import { truxafeTypography } from './typography';
import { truxafeSpacing } from './spacing';
import { truxafeShadows } from './shadows';

export const theme = {
  colors: truxafeColors,
  typography: truxafeTypography,
  spacing: truxafeSpacing,
  shadows: truxafeShadows,
} as const;

export type Theme = typeof theme;

// ---------------------------------------------------------------------------
// Individual systems (same references as `theme.*`)
// ---------------------------------------------------------------------------

export {
  truxafeColors,
  truxafeTheme,
  truxafeTypography,
  truxafeSpacing,
  truxafeShadows,
};

// ---------------------------------------------------------------------------
// Types (explicit re-exports — no cross-module `export *` collisions)
// ---------------------------------------------------------------------------

export type {
  TruxafeColorKey,
  TruxafeColors,
  TruxafeTheme,
  RadarPulseLayer,
  GlassToken,
} from './colors';

export type { TruxafeTypography, TypographyRole } from './typography';

export type { TruxafeSpacing, TruxafeSpacingScaleKey } from './spacing';

export type { ShadowLayer, ShadowRole, TruxafeShadows } from './shadows';
