import type { UserTrustLevel } from '../types/reputation.types';

export type VisualReputationTier = {
  level: UserTrustLevel;
  minScore: number;
  maxScore: number | null;
  emoji: string;
};

/** Referência visual (UI) — não altera o cálculo em `user_reputation`. */
export const VISUAL_REPUTATION_TIERS: VisualReputationTier[] =
  [
    {
      level: 'novo',
      minScore: 0,
      maxScore: 99,
      emoji: '⚪',
    },
    {
      level: 'confiavel',
      minScore: 100,
      maxScore: 499,
      emoji: '🟢',
    },
    {
      level: 'experiente',
      minScore: 500,
      maxScore: 999,
      emoji: '🔵',
    },
    {
      level: 'elite',
      minScore: 1000,
      maxScore: null,
      emoji: '🟠',
    },
  ];

export type ReputationBadgeVisual = {
  emoji: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
};

export function resolveVisualLevelFromScore(
  score: number,
): UserTrustLevel {
  if (score >= 1000) {
    return 'elite';
  }

  if (score >= 500) {
    return 'experiente';
  }

  if (score >= 100) {
    return 'confiavel';
  }

  return 'novo';
}

export function getReputationBadgeVisual(
  trustLevel: UserTrustLevel,
): ReputationBadgeVisual {
  switch (trustLevel) {
    case 'elite':
      return {
        emoji: '🟠',
        backgroundColor:
          'rgba(184, 107, 58, 0.16)',
        borderColor: '#B86B3A',
        textColor: '#B86B3A',
      };
    case 'experiente':
      return {
        emoji: '🔵',
        backgroundColor:
          'rgba(59, 130, 246, 0.14)',
        borderColor: '#3B82F6',
        textColor: '#3B82F6',
      };
    case 'confiavel':
      return {
        emoji: '🟢',
        backgroundColor:
          'rgba(79, 125, 98, 0.16)',
        borderColor: '#4F7D62',
        textColor: '#4F7D62',
      };
    default:
      return {
        emoji: '⚪',
        backgroundColor:
          'rgba(154, 161, 174, 0.12)',
        borderColor: '#9AA1AE',
        textColor: '#9AA1AE',
      };
  }
}
