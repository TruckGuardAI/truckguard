export function normalizeLocationKey(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ');
}

export function getLocationCandidates(
  rawInput: string,
): string[] {
  const trimmed = rawInput.trim();

  if (!trimmed) {
    return [];
  }

  return [
    trimmed,
    trimmed.split(',')[0]?.trim() ?? '',
    trimmed.split('-')[0]?.trim() ?? '',
  ].filter(Boolean);
}
