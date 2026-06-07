import { Ionicons } from '@expo/vector-icons';

const CONTROL_CHARS =
  /[\u0000-\u001F\u007F-\u009F\uFEFF]/g;

const DEFAULT_IONICON =
  'alert-circle-outline' as keyof typeof Ionicons.glyphMap;

const DEFAULT_EMOJI_ICON = '🚨';

export function normalizeText(
  value: string | null | undefined,
): string {
  if (value == null) {
    return '';
  }

  return String(value)
    .replace(CONTROL_CHARS, '')
    .trim();
}

export function sanitizeEmojiIcon(
  icon: string,
  fallback = DEFAULT_EMOJI_ICON,
): string {
  const cleaned = icon
    .replace(CONTROL_CHARS, '')
    .trim();

  return cleaned.length > 0
    ? cleaned
    : fallback;
}

export function sanitizeIonicon(
  icon: keyof typeof Ionicons.glyphMap,
): keyof typeof Ionicons.glyphMap {
  const name = String(icon).replace(
    /[^a-z0-9-]/gi,
    '',
  );

  if (
    name.length > 0 &&
    name in Ionicons.glyphMap
  ) {
    return name as keyof typeof Ionicons.glyphMap;
  }

  return DEFAULT_IONICON;
}
