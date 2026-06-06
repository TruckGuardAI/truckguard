/**
 * TRUXAFE — spacing scale
 * 4px base rhythm; mids align to 8 for layout consistency (Expo / RN).
 * Use numeric tokens with StyleSheet, padding/margin/gap, and flex gap props.
 */

// ---------------------------------------------------------------------------
// Scale — single source of truth (edit here)
// ---------------------------------------------------------------------------

export const truxafeSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  /** Vertical rhythm between major sections / modules */
  section: 56,
  /** Horizontal inset for screen edges (pair with SafeAreaView / insets) */
  screenPadding: 20,
  /** Inner padding for cards, sheets, list containers */
  cardPadding: 16,
  /** Primary control inner padding — supports ≥44pt touch targets with body text */
  buttonPadding: {
    horizontal: 20,
    vertical: 14,
  },
} as const;

// ---------------------------------------------------------------------------
// Token aliases
// ---------------------------------------------------------------------------

export const xs = truxafeSpacing.xs;
export const sm = truxafeSpacing.sm;
export const md = truxafeSpacing.md;
export const lg = truxafeSpacing.lg;
export const xl = truxafeSpacing.xl;
export const xxl = truxafeSpacing.xxl;
export const section = truxafeSpacing.section;
export const screenPadding = truxafeSpacing.screenPadding;
export const cardPadding = truxafeSpacing.cardPadding;
export const buttonPadding = truxafeSpacing.buttonPadding;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TruxafeSpacing = typeof truxafeSpacing;

/** Keys of the flat numeric scale (excludes nested `buttonPadding`) */
export type TruxafeSpacingScaleKey =
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | 'xxl'
  | 'section'
  | 'screenPadding'
  | 'cardPadding';
