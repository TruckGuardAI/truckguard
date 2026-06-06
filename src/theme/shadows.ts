/**
 * TRUXAFE — elevation / shadow tokens
 * Soft depth for dark surfaces; no neon glow. iOS: shadow*; Android: elevation.
 */

import { ViewStyle } from 'react-native';

export type ShadowLayer = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

export type ShadowRole =
  | 'card'
  | 'button'
  | 'modal'
  | 'floating'
  | 'danger'
  | 'glass'
  | 'navigation';

/** Near-black — default cast on dark UI */
const cast = '#000000';

/** Cool lift — subtle blue-black separation */
const castCool = '#05060A';

/** Deep cast for sheets */
const castDeep = '#020203';

/** Restrained warm cast for danger-adjacent chrome only */
const castWarm = '#1E0A0C';

// ---------------------------------------------------------------------------
// Tokens — single source of truth
// ---------------------------------------------------------------------------

export const truxafeShadows = {
  /** Cards, list rows — low lift */
  card: {
    shadowColor: castCool,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 3,
  },

  /** Primary controls — tight, grounded */
  button: {
    shadowColor: cast,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 2,
  },

  /** Sheets, dialogs — clear stack order */
  modal: {
    shadowColor: castDeep,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.34,
    shadowRadius: 22,
    elevation: 14,
  },

  /** FABs, floating chips — noticeable but controlled */
  floating: {
    shadowColor: cast,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.26,
    shadowRadius: 14,
    elevation: 8,
  },

  /** SOS / critical surfaces only — slight warm separation, not red bloom */
  danger: {
    shadowColor: castWarm,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },

  /** Frosted panels — diffuse, low contrast */
  glass: {
    shadowColor: castCool,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 0,
  },

  /** Top app bar / bottom tab chrome */
  navigation: {
    shadowColor: cast,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
} as const satisfies Record<ShadowRole, ShadowLayer>;

export type TruxafeShadows = typeof truxafeShadows;

// ---------------------------------------------------------------------------
// Aliases
// ---------------------------------------------------------------------------

export const card = truxafeShadows.card;
export const button = truxafeShadows.button;
export const modal = truxafeShadows.modal;
export const floating = truxafeShadows.floating;
export const danger = truxafeShadows.danger;
export const glass = truxafeShadows.glass;
export const navigation = truxafeShadows.navigation;
