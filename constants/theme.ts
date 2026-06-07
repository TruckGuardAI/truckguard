import { Platform } from 'react-native';

import {
  darkPalette,
  lightPalette,
} from '@/src/theme/palettes';

const tintColorLight = lightPalette.primary;
const tintColorDark = darkPalette.primary;

export const Colors = {
  light: {
    text: lightPalette.textPrimary,
    background: lightPalette.background,
    tint: tintColorLight,
    icon: lightPalette.textMuted,
    tabIconDefault: lightPalette.textMuted,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: darkPalette.textPrimary,
    background: darkPalette.background,
    tint: tintColorDark,
    icon: darkPalette.textMuted,
    tabIconDefault: darkPalette.textMuted,
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
