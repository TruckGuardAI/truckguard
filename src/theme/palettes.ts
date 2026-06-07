export type ThemeMode = 'light' | 'dark';

export type AppColorPalette = {
  background: string;
  surface: string;
  surfaceSecondary: string;
  primary: string;
  primaryMuted: string;
  danger: string;
  success: string;
  warning: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  card: string;
  overlay: string;
  shadow: string;
  radarPulse: {
    strong: string;
    mid: string;
    soft: string;
    core: string;
  };
  glass: {
    fill: string;
    fillStrong: string;
    stroke: string;
    strokeMuted: string;
    highlight: string;
  };
};

export const darkPalette: AppColorPalette = {
  background: '#070708',
  surface: '#0E1118',
  surfaceSecondary: '#131722',
  primary: '#B86B3A',
  primaryMuted: '#8F5230',
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
  radarPulse: {
    strong: 'rgba(184, 107, 58, 0.55)',
    mid: 'rgba(184, 107, 58, 0.28)',
    soft: 'rgba(184, 107, 58, 0.12)',
    core: 'rgba(184, 107, 58, 0.85)',
  },
  glass: {
    fill: 'rgba(19, 23, 34, 0.72)',
    fillStrong: 'rgba(14, 17, 24, 0.88)',
    stroke: 'rgba(236, 238, 241, 0.12)',
    strokeMuted: 'rgba(236, 238, 241, 0.06)',
    highlight: 'rgba(255, 255, 255, 0.04)',
  },
};

export const lightPalette: AppColorPalette = {
  background: '#F4F6FA',
  surface: '#FFFFFF',
  surfaceSecondary: '#EEF1F6',
  primary: '#B86B3A',
  primaryMuted: '#8F5230',
  danger: '#D32F36',
  success: '#3D7A5C',
  warning: '#9E7A3A',
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  border: 'rgba(17, 24, 39, 0.1)',
  card: '#FFFFFF',
  overlay: 'rgba(15, 23, 42, 0.45)',
  shadow: 'rgba(15, 23, 42, 0.12)',
  radarPulse: {
    strong: 'rgba(184, 107, 58, 0.45)',
    mid: 'rgba(184, 107, 58, 0.22)',
    soft: 'rgba(184, 107, 58, 0.1)',
    core: 'rgba(184, 107, 58, 0.75)',
  },
  glass: {
    fill: 'rgba(255, 255, 255, 0.82)',
    fillStrong: 'rgba(255, 255, 255, 0.94)',
    stroke: 'rgba(17, 24, 39, 0.1)',
    strokeMuted: 'rgba(17, 24, 39, 0.06)',
    highlight: 'rgba(255, 255, 255, 0.65)',
  },
};

export type AppThemeTokens = {
  colors: AppColorPalette;
  mode: ThemeMode;
  isDark: boolean;
  statusBarStyle: 'light' | 'dark';
  tabBar: {
    background: string;
    active: string;
    inactive: string;
    border: string;
  };
  navigation: {
    background: string;
    card: string;
    border: string;
    text: string;
    primary: string;
  };
  components: {
    inputBackground: string;
    inputBorder: string;
    inputText: string;
    buttonPrimaryBg: string;
    buttonPrimaryText: string;
    buttonSecondaryBg: string;
    buttonSecondaryText: string;
    modalBackground: string;
    modalOverlay: string;
  };
};

export function buildAppTheme(
  mode: ThemeMode,
): AppThemeTokens {
  const colors =
    mode === 'dark'
      ? darkPalette
      : lightPalette;

  const isDark = mode === 'dark';

  return {
    colors,
    mode,
    isDark,
    statusBarStyle: isDark
      ? 'light'
      : 'dark',
    tabBar: {
      background: colors.surface,
      active: colors.primary,
      inactive: colors.textMuted,
      border: colors.border,
    },
    navigation: {
      background: colors.background,
      card: colors.card,
      border: colors.border,
      text: colors.textPrimary,
      primary: colors.primary,
    },
    components: {
      inputBackground: colors.surfaceSecondary,
      inputBorder: colors.border,
      inputText: colors.textPrimary,
      buttonPrimaryBg: colors.primary,
      buttonPrimaryText: '#FFFFFF',
      buttonSecondaryBg: colors.surfaceSecondary,
      buttonSecondaryText: colors.textPrimary,
      modalBackground: colors.card,
      modalOverlay: colors.overlay,
    },
  };
}
